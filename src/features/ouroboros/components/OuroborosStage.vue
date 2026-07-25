<script lang="ts">
export interface OuroborosStageExpose {
  getContainer: () => HTMLElement | null;
}
</script>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { Play } from "@lucide/vue";
import type { HudSnapshot } from "../engine/types";
import GameOverScreen from "./GameOverScreen.vue";
import PauseMenu from "./PauseMenu.vue";

defineProps<{
  started: boolean;
  paused: boolean;
  gameOver: boolean;
  musicVolume: number;
  effectsVolume: number;
  hud: HudSnapshot;
}>();

const emit = defineEmits<{
  start: [];
  pause: [];
  restart: [];
  end: [];
  musicVolumeChange: [volume: number];
  effectsVolumeChange: [volume: number];
  toggleMusicMute: [];
  toggleEffectsMute: [];
}>();

const container = useTemplateRef<HTMLElement>("container");

defineExpose<OuroborosStageExpose>({
  getContainer: () => container.value,
});
</script>

<template>
  <div class="stage-shell">
    <div class="canvas-frame">
      <div ref="container" class="phaser-host" aria-label="圈一圈游戏区域" />

      <Transition name="intro-cover">
        <div v-if="!started" class="stage-cover stage-cover-intro">
          <div class="intro-brand">
            <h1>圈一圈</h1>
            <button type="button" class="primary-command" @click="emit('start')">
              <Play :size="17" fill="currentColor" />
              开始游戏
            </button>
          </div>
        </div>
      </Transition>

      <div
        v-if="started && paused && !gameOver"
        class="stage-cover stage-cover-dark stage-cover-dialog"
      >
        <PauseMenu
          :music-volume="musicVolume"
          :effects-volume="effectsVolume"
          @resume="emit('pause')"
          @end="emit('end')"
          @music-volume-change="emit('musicVolumeChange', $event)"
          @effects-volume-change="emit('effectsVolumeChange', $event)"
          @toggle-music-mute="emit('toggleMusicMute')"
          @toggle-effects-mute="emit('toggleEffectsMute')"
        />
      </div>

      <Transition name="game-over-cover">
        <div v-if="gameOver" class="stage-cover stage-cover-game-over">
          <GameOverScreen
            :hud="hud"
            @restart="emit('restart')"
            @exit="emit('end')"
          />
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
.stage-shell {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.canvas-frame {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--stage);
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.phaser-host {
  display: block;
  width: 100%;
  height: 100%;
  cursor: default;
  touch-action: none;
}

.phaser-host :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-width: none;
  max-height: none;
}

.stage-cover {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--ink);
  text-align: center;
  background: rgba(247, 244, 235, 0.94);
  backdrop-filter: blur(4px);
}

.stage-cover-intro {
  color: #20373e;
  background: rgba(244, 244, 236, 0.24);
  -webkit-backdrop-filter: blur(3px) saturate(0.84) brightness(1.04);
  backdrop-filter: blur(3px) saturate(0.84) brightness(1.04);
}

.stage-cover-intro::after {
  position: absolute;
  inset: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  pointer-events: none;
  content: "";
  border: 1px solid rgba(255, 253, 247, 0.28);
}

.intro-brand {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding:
    max(68px, calc(env(safe-area-inset-top) + 9dvh))
    24px
    max(68px, calc(env(safe-area-inset-bottom) + 11dvh));
  pointer-events: none;
  animation: brand-arrival 650ms cubic-bezier(0.2, 0.75, 0.25, 1) 780ms both;
}

.stage-cover h1 {
  margin: 0;
  color: #fffdf7;
  font-family: "Dymon ShouXieTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 64px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    0 4px 0 rgba(25, 37, 49, 0.2),
    0 10px 24px rgba(25, 37, 49, 0.2);
}

.stage-cover-dark {
  color: var(--surface);
  background: rgba(38, 59, 66, 0.82);
}

.stage-cover-dialog {
  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
  overflow-y: auto;
}

.stage-cover-game-over {
  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 34%, rgba(239, 98, 79, 0.2), transparent 35%),
    linear-gradient(165deg, rgba(36, 52, 61, 0.95), rgba(20, 27, 35, 0.98));
  backdrop-filter: blur(8px) saturate(0.72);
}

.stage-cover-game-over::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  background-image:
    linear-gradient(rgba(255, 253, 247, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 253, 247, 0.035) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent);
}

.primary-command {
  display: inline-flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  min-width: 146px;
  min-height: 42px;
  padding: 0 18px;
  color: var(--surface);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  background: var(--ink);
  border: 0;
  border-radius: 8px;
  box-shadow: 5px 6px 0 rgba(38, 59, 66, 0.18);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.intro-brand .primary-command {
  min-width: 172px;
  min-height: 50px;
  pointer-events: auto;
}

.primary-command:hover {
  background: #304a53;
  transform: translateY(-1px);
  box-shadow: 5px 8px 0 rgba(38, 59, 66, 0.16);
}

.primary-command:active {
  transform: translate(3px, 4px);
  box-shadow: 2px 2px 0 rgba(38, 59, 66, 0.18);
}

.primary-command.amber {
  color: var(--ink);
  background: var(--amber);
}

.intro-cover-leave-active {
  transition:
    opacity 380ms ease,
    backdrop-filter 380ms ease;
}

.intro-cover-leave-to {
  opacity: 0;
  -webkit-backdrop-filter: blur(0);
  backdrop-filter: blur(0);
}

.game-over-cover-enter-active {
  transition:
    opacity 420ms ease,
    backdrop-filter 420ms ease;
}

.game-over-cover-enter-from {
  opacity: 0;
  -webkit-backdrop-filter: blur(0) saturate(1);
  backdrop-filter: blur(0) saturate(1);
}

@keyframes brand-arrival {
  from {
    opacity: 0;
    transform: scale(0.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-height: 560px) {
  .intro-brand {
    padding:
      max(38px, calc(env(safe-area-inset-top) + 6dvh))
      20px
      max(34px, calc(env(safe-area-inset-bottom) + 7dvh));
  }

  .stage-cover h1 {
    font-size: 42px;
  }
}

@media (max-width: 560px) {
  .stage-cover {
    padding: 14px;
  }

  .stage-cover h1 {
    font-size: 50px;
  }

  .primary-command {
    min-width: 154px;
    min-height: 44px;
  }
}
</style>
