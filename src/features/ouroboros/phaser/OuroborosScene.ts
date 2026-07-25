import Phaser from "phaser";
import { MAX_FRAME_DELTA } from "../engine/config";
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
import { OuroborosSceneView } from "./OuroborosSceneView";
import { phaserCollisionSystem } from "./phaserCollisionSystem";

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
  private running = false;
  private started = false;
  private paused = false;
  private gameOver = false;
  private skipNextUpdate = true;

  constructor(
    private readonly callbacks: OuroborosSceneCallbacks,
    initialState: GameState,
  ) {
    super({ key: "ouroboros" });
    this.state = initialState;
  }

  create(): void {
    this.sceneView = new OuroborosSceneView(this);
    this.sceneView.render(this.state);

    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.keyboard?.on("keydown", this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }

  update(_time: number, deltaMilliseconds: number): void {
    const delta = this.skipNextUpdate
      ? 0
      : Math.min(MAX_FRAME_DELTA, deltaMilliseconds / 1000);
    this.skipNextUpdate = false;

    if (this.running && !this.paused) {
      this.processEvents(
        updateGame(this.state, delta, Math.random, phaserCollisionSystem),
      );
    }

    this.sceneView?.render(this.state);
  }

  startRound(): void {
    this.state = createGameState();
    this.running = true;
    this.started = true;
    this.paused = false;
    this.gameOver = false;
    this.skipNextUpdate = true;
    this.publishStatus();
    this.publishHud();
    this.sceneView?.render(this.state);
  }

  togglePause(): void {
    if (!this.started || this.gameOver) return;
    this.paused = !this.paused;
    this.publishStatus();
  }

  steer(direction: CardinalDirection): void {
    setCardinalDirection(this.state, direction);
  }

  private aimAt(point: Point): void {
    steerToward(this.state, point);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.aimAt({ x: pointer.worldX, y: pointer.worldY });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.isDown) this.aimAt({ x: pointer.worldX, y: pointer.worldY });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const action = actionForKey(event.key);
    if (!action) return;

    event.preventDefault();
    if (action.type === "steer") this.steer(action.direction);
    if (action.type === "toggle-pause") this.togglePause();
  }

  private processEvents(events: readonly GameEvent[]): void {
    if (events.length === 0) return;

    for (const event of events) {
      if (event.type === "game-over") {
        this.running = false;
        this.gameOver = true;
        this.publishStatus();
      }
    }

    this.publishHud();
  }

  private publishHud(): void {
    this.callbacks.onHudChange(snapshotHud(this.state));
  }

  private publishStatus(): void {
    this.callbacks.onStatusChange({
      started: this.started,
      paused: this.paused,
      gameOver: this.gameOver,
    });
  }

  private handleShutdown(): void {
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.off("pointermove", this.handlePointerMove, this);
    this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.sceneView?.destroy();
    this.sceneView = null;
  }
}
