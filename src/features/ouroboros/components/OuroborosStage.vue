<script lang="ts">
export interface OuroborosStageExpose {
  getContainer: () => HTMLElement | null;
}
</script>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import {
  CircleDotDashed,
  Pause,
  Play,
  RotateCcw,
} from "@lucide/vue";
import type { HudSnapshot } from "../engine/types";

defineProps<{
  started: boolean;
  paused: boolean;
  gameOver: boolean;
  hud: HudSnapshot;
}>();

const emit = defineEmits<{
  start: [];
  pause: [];
  restart: [];
}>();

const container = useTemplateRef<HTMLElement>("container");

defineExpose<OuroborosStageExpose>({
  getContainer: () => container.value,
});
</script>

<template>
  <div class="stage-shell">
    <div class="canvas-frame">
      <div ref="container" class="phaser-host" aria-label="衔尾蛇游戏区域" />

      <div v-if="!started" class="stage-cover">
        <CircleDotDashed :size="48" :stroke-width="1.5" aria-hidden="true" />
        <p>DEMO 02</p>
        <h2>让首尾再次相遇</h2>
        <button type="button" class="primary-command" @click="emit('start')">
          <Play :size="17" fill="currentColor" />
          开始游戏
        </button>
      </div>

      <div v-else-if="paused && !gameOver" class="stage-cover stage-cover-dark">
        <Pause :size="38" fill="currentColor" aria-hidden="true" />
        <h2>PAUSED</h2>
        <button type="button" class="primary-command amber" @click="emit('pause')">
          <Play :size="17" fill="currentColor" />
          继续游戏
        </button>
      </div>

      <div v-else-if="gameOver" class="stage-cover">
        <CircleDotDashed class="coral" :size="48" :stroke-width="1.5" />
        <p>THE LOOP IS BROKEN</p>
        <h2>衔尾之环断开了</h2>
        <span class="final-score">本局净化 {{ hud.kills }} 个敌人，蛇身成长至 {{ hud.length }}</span>
        <button type="button" class="primary-command" @click="emit('restart')">
          <RotateCcw :size="17" />
          重新开始
        </button>
      </div>

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

.stage-cover > svg {
  margin-bottom: 14px;
  color: var(--teal-deep);
}

.stage-cover > svg.coral {
  color: var(--coral);
}

.stage-cover p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 9px;
  font-weight: 900;
}

.stage-cover h2 {
  margin: 8px 0 22px;
  font-family: Georgia, "Songti SC", serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: 0;
}

.stage-cover-dark {
  color: var(--surface);
  background: rgba(38, 59, 66, 0.82);
}

.stage-cover-dark > svg {
  color: var(--amber);
}

.final-score {
  margin: -11px 0 20px;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 700;
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
}

.primary-command.amber {
  color: var(--ink);
  background: var(--amber);
}

@media (max-width: 560px) {
  .stage-cover {
    padding: 14px;
  }

  .stage-cover > svg {
    width: 36px;
    height: 36px;
    margin-bottom: 8px;
  }

  .stage-cover h2 {
    margin: 5px 0 13px;
    font-size: 24px;
  }

  .primary-command {
    min-height: 38px;
  }
}
</style>
