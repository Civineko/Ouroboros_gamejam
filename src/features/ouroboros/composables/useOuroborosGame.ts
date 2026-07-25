import { onMounted, onUnmounted, readonly, ref, shallowRef } from "vue";
import { bindNativeAppLifecycle } from "../../../platform/nativeAppLifecycle";
import {
  clampVolume,
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
