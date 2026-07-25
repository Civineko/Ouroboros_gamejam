import { onMounted, onUnmounted, readonly, ref, shallowRef } from "vue";
import {
  clampMasterVolume,
  DEFAULT_AUDIO_PREFERENCES,
  loadAudioPreferences,
  saveAudioPreferences,
} from "../audio/audioPreferences";
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
