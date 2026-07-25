<script lang="ts">
export interface OuroborosStageExpose {
  getCanvas: () => HTMLCanvasElement | null;
}
</script>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CircleDotDashed,
  Pause,
  Play,
  RotateCcw,
} from "@lucide/vue";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../engine/config";
import type { CardinalDirection, HudSnapshot, Point } from "../engine/types";

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
  aim: [point: Point];
  direction: [direction: CardinalDirection];
}>();

const canvas = useTemplateRef<HTMLCanvasElement>("canvas");

function aimFromPointer(event: PointerEvent): void {
  const element = event.currentTarget as HTMLCanvasElement;
  const bounds = element.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;

  emit("aim", {
    x: ((event.clientX - bounds.left) / bounds.width) * WORLD_WIDTH,
    y: ((event.clientY - bounds.top) / bounds.height) * WORLD_HEIGHT,
  });
}

function handlePointerDown(event: PointerEvent): void {
  const element = event.currentTarget as HTMLCanvasElement;
  element.focus();
  aimFromPointer(event);
}

function handlePointerMove(event: PointerEvent): void {
  if (event.buttons > 0 || event.pointerType === "touch") aimFromPointer(event);
}

defineExpose<OuroborosStageExpose>({
  getCanvas: () => canvas.value,
});
</script>

<template>
  <div class="stage-shell">
    <div class="canvas-frame">
      <canvas
        ref="canvas"
        tabindex="0"
        aria-label="衔尾蛇游戏区域"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
      />

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

    <div class="touch-controls" aria-label="方向控制">
      <button type="button" title="向左" aria-label="向左" @click="emit('direction', 'left')">
        <ArrowLeft :size="20" />
      </button>
      <button type="button" title="向上" aria-label="向上" @click="emit('direction', 'up')">
        <ArrowUp :size="20" />
      </button>
      <button type="button" title="向下" aria-label="向下" @click="emit('direction', 'down')">
        <ArrowDown :size="20" />
      </button>
      <button type="button" title="向右" aria-label="向右" @click="emit('direction', 'right')">
        <ArrowRight :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.stage-shell {
  min-width: 0;
}

.canvas-frame {
  position: relative;
  overflow: hidden;
  background: var(--stage);
  border: 9px solid var(--paper-strong);
  border-radius: 8px;
  box-shadow: 10px 12px 0 var(--shadow);
}

canvas {
  display: block;
  width: 100%;
  aspect-ratio: 920 / 620;
  cursor: crosshair;
  touch-action: none;
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

.touch-controls {
  display: none;
  grid-template-columns: repeat(4, 42px);
  gap: 7px;
  justify-content: center;
  margin-top: 12px;
}

.touch-controls button {
  display: grid;
  width: 42px;
  height: 40px;
  place-items: center;
  padding: 0;
  cursor: pointer;
  background: rgba(255, 253, 247, 0.72);
  border: 1px solid var(--line);
  border-radius: 8px;
}

@media (max-width: 820px), (hover: none) {
  .touch-controls {
    display: grid;
  }
}

@media (max-width: 560px) {
  .canvas-frame {
    border-width: 6px;
    box-shadow: 6px 7px 0 var(--shadow);
  }

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
