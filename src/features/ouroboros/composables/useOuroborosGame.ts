import { onMounted, onUnmounted, readonly, ref, shallowRef } from "vue";
import {
  clampMasterVolume,
  DEFAULT_AUDIO_PREFERENCES,
  loadAudioPreferences,
  saveAudioPreferences,
} from "../audio/audioPreferences";
import { DEVOURER_DEFEAT_EFFECT_SECONDS } from "../engine/bosses/bossCatalog";
import { createDevourerBoss } from "../engine/bosses/bossSystem";
import {
  BOSS_SCORE_THRESHOLD,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../engine/config";
import { createGameState, snapshotHud } from "../engine/gameEngine";
import type { CardinalDirection } from "../engine/types";
import {
  createOuroborosRuntime,
  type OuroborosRuntime,
} from "../phaser/createOuroborosRuntime";

export function useOuroborosGame(
  getContainer: () => HTMLElement | null,
) {
  const started = ref(false);
  const paused = ref(false);
  const gameOver = ref(false);
  const savedAudio = loadAudioPreferences();
  const masterVolume = ref(savedAudio.masterVolume);
  const muted = ref(savedAudio.muted);
  let lastAudibleVolume =
    savedAudio.masterVolume > 0
      ? savedAudio.masterVolume
      : DEFAULT_AUDIO_PREFERENCES.masterVolume;

  const initialState = createGameState();
  const bossPreview = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("boss-preview")
    : null;
  if (bossPreview) {
    initialState.tutorialComplete = true;
    if (bossPreview === "defeat") {
      const defeatPreviewTarget = initialState.trail.at(-1) ?? {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
      };
      initialState.kills = BOSS_SCORE_THRESHOLD + 5;
      initialState.bossDefeated = true;
      initialState.bossDefeatEffect = {
        x: defeatPreviewTarget.x,
        y: defeatPreviewTarget.y,
        name: "噬环者",
        reward: 5,
        remaining: DEVOURER_DEFEAT_EFFECT_SECONDS,
        duration: DEVOURER_DEFEAT_EFFECT_SECONDS,
      };
      initialState.message = "Boss 击杀演出预览已就绪";
    } else if (bossPreview === "telegraph") {
      const previewHead = initialState.trail.at(-1) ?? {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
      };
      const previewBoss = createDevourerBoss(previewHead);
      previewBoss.action = "telegraphing";
      previewBoss.actionClock = 1;
      previewBoss.target = { ...previewHead };
      previewBoss.core.exposed = true;
      previewBoss.core.cooldown = 0;
      previewBoss.absorbedEnemies = [];
      initialState.kills = BOSS_SCORE_THRESHOLD;
      initialState.boss = previewBoss;
      initialState.enemies = [];
      initialState.message = "Boss 冲撞预警预览已就绪";
    } else {
      initialState.kills = BOSS_SCORE_THRESHOLD;
      initialState.message = "Boss 预览已就绪";
    }
  }
  const hud = shallowRef(snapshotHud(initialState));
  let runtime: OuroborosRuntime | null = null;

  function start(): void {
    runtime?.scene.startRound();
  }

  function togglePause(): void {
    runtime?.scene.togglePause();
  }

  function end(): void {
    runtime?.scene.endRound();
  }

  function applyAudioPreferences(): void {
    runtime?.scene.setMasterVolume(muted.value ? 0 : masterVolume.value);
  }

  function persistAudioPreferences(): void {
    saveAudioPreferences({
      masterVolume: masterVolume.value,
      muted: muted.value,
    });
  }

  function setMasterVolume(volume: number): void {
    const nextVolume = clampMasterVolume(volume);
    masterVolume.value = nextVolume;

    if (nextVolume > 0) {
      lastAudibleVolume = nextVolume;
      muted.value = false;
    } else {
      muted.value = true;
    }

    applyAudioPreferences();
    persistAudioPreferences();
  }

  function toggleMute(): void {
    if (muted.value && masterVolume.value === 0) {
      masterVolume.value = lastAudibleVolume;
    }
    muted.value = !muted.value;
    applyAudioPreferences();
    persistAudioPreferences();
  }

  function steer(direction: CardinalDirection): void {
    runtime?.scene.steer(direction);
  }

  onMounted(() => {
    const container = getContainer();
    if (!container) return;

    runtime = createOuroborosRuntime(
      container,
      {
        onHudChange(nextHud) {
          hud.value = nextHud;
        },
        onStatusChange(status) {
          started.value = status.started;
          paused.value = status.paused;
          gameOver.value = status.gameOver;
        },
      },
      initialState,
    );
    applyAudioPreferences();
  });

  onUnmounted(() => {
    runtime?.game.destroy(true);
    runtime = null;
  });

  return {
    started: readonly(started),
    paused: readonly(paused),
    gameOver: readonly(gameOver),
    masterVolume: readonly(masterVolume),
    muted: readonly(muted),
    hud: readonly(hud),
    start,
    togglePause,
    end,
    setMasterVolume,
    toggleMute,
    steer,
  };
}
