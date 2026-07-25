import { onMounted, onUnmounted, readonly, ref, shallowRef } from "vue";
import { bindNativeAppLifecycle } from "../../../platform/nativeAppLifecycle";
import {
  clampVolume,
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
  const musicVolume = ref(savedAudio.musicVolume);
  const effectsVolume = ref(savedAudio.effectsVolume);
  let lastMusicVolume =
    savedAudio.musicVolume > 0
      ? savedAudio.musicVolume
      : DEFAULT_AUDIO_PREFERENCES.musicVolume;
  let lastEffectsVolume =
    savedAudio.effectsVolume > 0
      ? savedAudio.effectsVolume
      : DEFAULT_AUDIO_PREFERENCES.effectsVolume;

  const initialState = createGameState();
  const hud = shallowRef(snapshotHud(initialState));
  let runtime: OuroborosRuntime | null = null;
  let stopNativeAppLifecycle: () => void = () => undefined;

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
    runtime?.scene.setAudioVolumes(
      musicVolume.value,
      effectsVolume.value,
    );
  }

  function persistAudioPreferences(): void {
    saveAudioPreferences({
      musicVolume: musicVolume.value,
      effectsVolume: effectsVolume.value,
    });
  }

  function setMusicVolume(volume: number): void {
    musicVolume.value = clampVolume(
      volume,
      DEFAULT_AUDIO_PREFERENCES.musicVolume,
    );
    if (musicVolume.value > 0) lastMusicVolume = musicVolume.value;
    applyAudioPreferences();
    persistAudioPreferences();
  }

  function setEffectsVolume(volume: number): void {
    effectsVolume.value = clampVolume(
      volume,
      DEFAULT_AUDIO_PREFERENCES.effectsVolume,
    );
    if (effectsVolume.value > 0) lastEffectsVolume = effectsVolume.value;
    applyAudioPreferences();
    persistAudioPreferences();
  }

  function toggleMusicMute(): void {
    setMusicVolume(musicVolume.value === 0 ? lastMusicVolume : 0);
  }

  function toggleEffectsMute(): void {
    setEffectsVolume(effectsVolume.value === 0 ? lastEffectsVolume : 0);
  }

  function playUiClick(): void {
    runtime?.scene.playUiClick();
  }

  function unlockAudio(): void {
    runtime?.scene.unlockAudio();
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
    stopNativeAppLifecycle = bindNativeAppLifecycle({
      onPause() {
        runtime?.scene.pauseRound();
      },
      onBack() {
        if (gameOver.value) {
          end();
          return true;
        }
        if (started.value) {
          togglePause();
          return true;
        }
        return false;
      },
    });
    applyAudioPreferences();
  });

  onUnmounted(() => {
    stopNativeAppLifecycle();
    runtime?.game.destroy(true);
    runtime = null;
  });

  return {
    started: readonly(started),
    paused: readonly(paused),
    gameOver: readonly(gameOver),
    musicVolume: readonly(musicVolume),
    effectsVolume: readonly(effectsVolume),
    hud: readonly(hud),
    start,
    togglePause,
    end,
    setMusicVolume,
    setEffectsVolume,
    toggleMusicMute,
    toggleEffectsMute,
    playUiClick,
    unlockAudio,
    steer,
  };
}
