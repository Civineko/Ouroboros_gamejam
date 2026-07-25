import Phaser from "phaser";
import {
  MAX_FRAME_DELTA,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../engine/config";
import {
  createGameState,
  setCardinalDirection,
  snapshotHud,
  steerToward,
  updateGame,
} from "../engine/gameEngine";
import type {
  CardinalDirection,
  GameEvent,
  GameState,
  HudSnapshot,
  Point,
} from "../engine/types";
import { actionForKey } from "../input/gameActions";
import { preloadOuroborosArt } from "./assets/preloadOuroborosArt";
import {
  OuroborosAudioController,
} from "./audio/OuroborosAudioController";
import { cueForPowerUp } from "./audio/audioCatalog";
import { OuroborosCameraController } from "./camera/OuroborosCameraController";
import { OuroborosSceneView } from "./OuroborosSceneView";
import { phaserCollisionSystem } from "./phaserCollisionSystem";

const HUD_PUBLISH_INTERVAL = 0.2;

export interface SceneStatus {
  started: boolean;
  paused: boolean;
  gameOver: boolean;
}

export interface OuroborosSceneCallbacks {
  onHudChange: (hud: HudSnapshot) => void;
  onStatusChange: (status: SceneStatus) => void;
}

export class OuroborosScene extends Phaser.Scene {
  private state: GameState;
  private sceneView: OuroborosSceneView | null = null;
  private cameraController: OuroborosCameraController | null = null;
  private running = false;
  private started = false;
  private paused = false;
  private gameOver = false;
  private skipNextUpdate = true;
  private hudPublishClock = 0;
  private readonly audio = new OuroborosAudioController();

  constructor(
    private readonly callbacks: OuroborosSceneCallbacks,
    initialState: GameState,
  ) {
    super({ key: "ouroboros" });
    this.state = initialState;
  }

  preload(): void {
    preloadOuroborosArt(this);
  }

  create(): void {
    if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
      this.audio.attachContext(this.sound.context, this.sound.destination);
    }

    this.cameraController = new OuroborosCameraController(this.cameras.main);
    this.cameraController.snapTo({
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
    });
    this.sceneView = new OuroborosSceneView(this);
    this.sceneView.render(this.state);
    this.sceneView.playIntroReveal();

    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.keyboard?.clearCaptures();
    this.input.keyboard?.on("keydown", this.handleKeyDown, this);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("blur", this.handleWindowBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_time: number, deltaMilliseconds: number): void {
    const delta = this.skipNextUpdate
      ? 0
      : Math.min(MAX_FRAME_DELTA, deltaMilliseconds / 1000);
    this.skipNextUpdate = false;

    if (this.running && !this.paused) {
      const events = updateGame(
        this.state,
        delta,
        Math.random,
        phaserCollisionSystem,
      );
      this.hudPublishClock += delta;
      this.processEvents(events);
      if (this.hudPublishClock >= HUD_PUBLISH_INTERVAL) this.publishHud();
    }

    this.sceneView?.render(this.state);
    if (this.running) this.followHead(delta);
  }

  startRound(): void {
    if (this.running && !this.gameOver) return;

    const restarting = this.started;
    if (restarting) this.state = createGameState();

    this.audio.unlock();
    this.audio.play(restarting ? "round-restart" : "round-start");
    this.audio.startMusic();
    this.sceneView?.completeIntroReveal();
    this.running = true;
    this.started = true;
    this.paused = false;
    this.gameOver = false;
    this.skipNextUpdate = true;
    this.hudPublishClock = 0;
    if (restarting) this.snapCameraToHead();
    this.publishStatus();
    this.publishHud();
    this.sceneView?.render(this.state);
  }

  togglePause(): void {
    if (!this.started || this.gameOver) return;
    this.setPaused(!this.paused, true);
  }

  pauseRound(): void {
    if (!this.started || this.gameOver) return;
    this.setPaused(true, false);
  }

  endRound(): void {
    this.audio.stopMusic();
    this.state = createGameState();
    this.running = false;
    this.started = false;
    this.paused = false;
    this.gameOver = false;
    this.skipNextUpdate = true;
    this.hudPublishClock = 0;
    this.cameraController?.snapTo({
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
    });
    this.publishStatus();
    this.publishHud();
    this.sceneView?.render(this.state);
    this.sceneView?.playIntroReveal();
  }

  setAudioVolumes(musicVolume: number, effectsVolume: number): void {
    this.audio.setMusicVolume(musicVolume);
    this.audio.setEffectsVolume(effectsVolume);
  }

  playUiClick(): void {
    this.audio.play("ui-click");
  }

  unlockAudio(): void {
    this.audio.unlock();
  }

  steer(direction: CardinalDirection): void {
    if (!this.running || this.paused) return;
    setCardinalDirection(this.state, direction);
  }

  private aimAt(point: Point): void {
    if (!this.running || this.paused) return;
    steerToward(this.state, point);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.aimAt({ x: pointer.worldX, y: pointer.worldY });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.isDown) this.aimAt({ x: pointer.worldX, y: pointer.worldY });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isFormControl(event.target)) return;

    const action = actionForKey(event.key);
    if (!action) return;

    event.preventDefault();
    if (action.type === "steer") this.steer(action.direction);
    if (action.type === "toggle-pause") this.togglePause();
  }

  private isFormControl(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      Boolean(
        target.closest(
          "button, input, select, textarea, a, [contenteditable='true']",
        ),
      )
    );
  }

  private setPaused(paused: boolean, playFeedback: boolean): void {
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      if (playFeedback) this.audio.play("pause");
      this.audio.pauseMusic();
    } else {
      this.skipNextUpdate = true;
      this.audio.resumeMusic();
      if (playFeedback) this.audio.play("resume");
    }
    this.publishStatus();
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) this.pauseRound();
  };

  private handleWindowBlur = (): void => {
    this.pauseRound();
  };

  private processEvents(events: readonly GameEvent[]): void {
    if (events.length === 0) return;

    const roundEnded = events.some((event) => event.type === "game-over");
    for (const event of events) {
      if (event.type === "capture") this.audio.play("capture");
      if (event.type === "hit" && !roundEnded) this.audio.play("hit");
      if (event.type === "empty-loop") this.audio.play("empty-loop");
      if (event.type === "shield-blocked") this.audio.play("shield-blocked");
      if (event.type === "power-up-collected") {
        this.audio.play(cueForPowerUp(event.kind));
      }
      if (event.type === "game-over") {
        this.audio.stopMusic();
        this.audio.play("game-over");
        this.running = false;
        this.gameOver = true;
        this.publishStatus();
      }
    }

    this.publishHud();
  }

  private publishHud(): void {
    this.hudPublishClock = 0;
    this.callbacks.onHudChange(snapshotHud(this.state));
  }

  private publishStatus(): void {
    this.callbacks.onStatusChange({
      started: this.started,
      paused: this.paused,
      gameOver: this.gameOver,
    });
  }

  private snapCameraToHead(): void {
    const head = this.state.trail.at(-1);
    if (head) this.cameraController?.snapTo(head);
  }

  private followHead(delta: number): void {
    const head = this.state.trail.at(-1);
    if (head) this.cameraController?.follow(head, delta);
  }

  private handleShutdown(): void {
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.off("pointermove", this.handlePointerMove, this);
    this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    window.removeEventListener("blur", this.handleWindowBlur);
    this.audio.destroy();
    this.sceneView?.destroy();
    this.sceneView = null;
    this.cameraController = null;
  }
}
