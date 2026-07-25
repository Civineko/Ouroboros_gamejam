<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";
import {
  Home,
  Layers3,
  RotateCcw,
  Ruler,
  Sparkles,
} from "@lucide/vue";
import type { HudSnapshot } from "../engine/types";

defineProps<{
  hud: HudSnapshot;
}>();

const emit = defineEmits<{
  restart: [];
  exit: [];
}>();

const restartButton = useTemplateRef<HTMLButtonElement>("restartButton");

onMounted(() => {
  restartButton.value?.focus();
});
</script>

<template>
  <section
    class="game-over-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="game-over-title"
  >
    <div class="death-glow" aria-hidden="true" />
    <div class="loop-shards" aria-hidden="true">
      <i v-for="shard in 8" :key="shard" :style="{ '--shard': shard }" />
    </div>

    <div class="broken-loop" aria-hidden="true">
      <span class="loop-half loop-half-left" />
      <span class="loop-half loop-half-right" />
      <span class="loop-head" />
      <span class="loop-tail" />
    </div>

    <div class="game-over-copy">
      <p>THE LOOP IS BROKEN</p>
      <h2 id="game-over-title">GAME OVER</h2>
      <span>别让这次失败白费——下一次，把敌人全部圈进去。</span>
    </div>

    <dl class="final-stats" aria-label="本局成绩">
      <div>
        <dt><Sparkles :size="16" aria-hidden="true" />净化</dt>
        <dd>{{ hud.kills }}</dd>
      </div>
      <div>
        <dt><Layers3 :size="16" aria-hidden="true" />关卡</dt>
        <dd>{{ hud.level }}</dd>
      </div>
      <div>
        <dt><Ruler :size="16" aria-hidden="true" />长度</dt>
        <dd>{{ hud.length }}</dd>
      </div>
    </dl>

    <div class="game-over-actions">
      <button
        ref="restartButton"
        type="button"
        class="restart-command"
        @click="emit('restart')"
      >
        <RotateCcw :size="18" aria-hidden="true" />
        再来一次
      </button>
      <button type="button" class="exit-command" @click="emit('exit')">
        <Home :size="18" aria-hidden="true" />
        返回标题
      </button>
    </div>
  </section>
</template>

<style scoped>
.game-over-screen {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(520px, 100%);
  max-height: calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow-y: auto;
  color: #fffdf7;
}

.death-glow {
  position: absolute;
  top: 35px;
  left: 50%;
  width: 230px;
  height: 230px;
  pointer-events: none;
  background: radial-gradient(circle, rgba(239, 98, 79, 0.28), transparent 68%);
  transform: translateX(-50%);
  animation: death-pulse 2.2s ease-in-out infinite;
}

.broken-loop {
  position: relative;
  width: 112px;
  height: 112px;
  flex: 0 0 112px;
  margin-bottom: 16px;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.24));
  animation: broken-loop-arrival 680ms cubic-bezier(0.2, 0.78, 0.25, 1) both;
}

.loop-half {
  position: absolute;
  inset: 6px;
  border: 11px solid var(--coral);
  border-radius: 50%;
}

.loop-half-left {
  clip-path: polygon(0 0, 52% 0, 43% 42%, 52% 100%, 0 100%);
  transform: translate(-6px, 5px) rotate(-12deg);
}

.loop-half-right {
  clip-path: polygon(48% 0, 100% 0, 100% 100%, 48% 100%, 57% 58%, 48% 42%);
  transform: translate(7px, -5px) rotate(13deg);
}

.loop-head,
.loop-tail {
  position: absolute;
  width: 21px;
  height: 21px;
  background: #fffdf7;
  border: 5px solid var(--coral);
  border-radius: 50%;
}

.loop-head {
  top: 45px;
  left: 41px;
  transform: translate(-10px, -14px);
}

.loop-tail {
  top: 50px;
  right: 38px;
  width: 14px;
  height: 14px;
  border-width: 4px;
  transform: translate(12px, 11px);
}

.loop-shards {
  position: absolute;
  top: 74px;
  left: 50%;
  width: 120px;
  height: 120px;
  pointer-events: none;
  transform: translateX(-50%);
}

.loop-shards i {
  --angle: calc(var(--shard) * 45deg);
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 13px;
  background: var(--coral);
  border-radius: 3px;
  opacity: 0;
  transform: rotate(var(--angle)) translateY(-52px) scale(0.4);
  animation: shard-burst 900ms ease-out calc(var(--shard) * 35ms) both;
}

.game-over-copy {
  position: relative;
  text-align: center;
}

.game-over-copy p {
  margin: 0 0 7px;
  color: #f4b3a9;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.game-over-copy h2 {
  margin: 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: 35px;
  font-weight: 500;
  line-height: 1.12;
}

.game-over-copy > span {
  display: block;
  margin-top: 9px;
  color: rgba(255, 253, 247, 0.7);
  font-size: 12px;
  line-height: 1.55;
}

.final-stats {
  display: grid;
  width: min(390px, 100%);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 22px 0;
  border-top: 1px solid rgba(255, 253, 247, 0.18);
  border-bottom: 1px solid rgba(255, 253, 247, 0.18);
}

.final-stats > div {
  min-width: 0;
  padding: 13px 8px;
}

.final-stats > div + div {
  border-left: 1px solid rgba(255, 253, 247, 0.18);
}

.final-stats dt {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  color: rgba(255, 253, 247, 0.62);
  font-size: 10px;
  font-weight: 900;
}

.final-stats dd {
  margin: 6px 0 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 27px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.game-over-actions {
  display: grid;
  width: min(390px, 100%);
  grid-template-columns: 1.25fr 1fr;
  gap: 10px;
}

.game-over-actions button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 48px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  border-radius: 8px;
  touch-action: manipulation;
  transition: transform 150ms ease, background-color 150ms ease;
}

.game-over-actions button:active {
  transform: translateY(2px);
}

.restart-command {
  color: var(--ink);
  background: var(--amber);
  border: 1px solid color-mix(in srgb, var(--amber) 70%, #fffdf7);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);
}

.exit-command {
  color: #fffdf7;
  background: rgba(255, 253, 247, 0.06);
  border: 1px solid rgba(255, 253, 247, 0.28);
}

@keyframes broken-loop-arrival {
  from {
    opacity: 0;
    transform: scale(1.35) rotate(-12deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@keyframes shard-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(-30px) scale(0.4);
  }

  42% {
    opacity: 0.9;
  }

  100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(-72px) scale(1);
  }
}

@keyframes death-pulse {
  0%,
  100% {
    opacity: 0.64;
    transform: translateX(-50%) scale(0.9);
  }

  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.08);
  }
}

@media (max-height: 600px) {
  .game-over-screen {
    padding: 12px;
  }

  .broken-loop {
    margin-bottom: 8px;
  }

  .game-over-copy h2 {
    font-size: 26px;
  }

  .game-over-copy > span {
    margin-top: 5px;
  }

  .final-stats {
    margin: 12px 0;
  }
}

@media (max-width: 420px) {
  .game-over-screen {
    padding: 14px;
  }

  .game-over-copy h2 {
    font-size: 29px;
  }

  .game-over-actions {
    grid-template-columns: 1fr;
  }
}
</style>
