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

const dialog = useTemplateRef<HTMLElement>("dialog");
const restartButton = useTemplateRef<HTMLButtonElement>("restartButton");

function handleDialogKeydown(event: KeyboardEvent): void {
  if (event.key !== "Tab") return;

  const focusable = Array.from(
    dialog.value?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [tabindex]:not([tabindex='-1'])",
    ) ?? [],
  );
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(() => {
  restartButton.value?.focus();
});
</script>

<template>
  <section
    ref="dialog"
    class="game-over-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="game-over-title"
    @keydown="handleDialogKeydown"
  >
    <div class="game-over-content">
      <div class="loop-mark" aria-hidden="true">
        <span class="loop-arc loop-arc-left" />
        <span class="loop-arc loop-arc-right" />
        <span class="loop-head" />
        <span class="loop-tail" />
        <i v-for="shard in 6" :key="shard" :style="{ '--shard': shard }" />
      </div>

      <header class="game-over-heading">
        <span>THE LOOP IS BROKEN</span>
        <h2 id="game-over-title">GAME OVER</h2>
        <p>别让这次失败白费——下一次，把敌人全部圈进去。</p>
      </header>

      <dl class="final-stats" aria-label="本局成绩">
        <div>
          <dt><Sparkles :size="18" aria-hidden="true" />净化</dt>
          <dd>{{ hud.kills }}</dd>
        </div>
        <div>
          <dt><Layers3 :size="18" aria-hidden="true" />关卡</dt>
          <dd>{{ hud.level }}</dd>
        </div>
        <div>
          <dt><Ruler :size="18" aria-hidden="true" />长度</dt>
          <dd>{{ hud.length }}</dd>
        </div>
      </dl>

      <div class="game-over-actions">
        <button
          ref="restartButton"
          type="button"
          class="dialog-command restart-command"
          @click="emit('restart')"
        >
          <RotateCcw :size="22" aria-hidden="true" />
          再来一次
        </button>
        <button
          type="button"
          class="dialog-command exit-command"
          @click="emit('exit')"
        >
          <Home :size="22" aria-hidden="true" />
          返回标题
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.game-over-screen {
  position: relative;
  width: min(
    620px,
    calc(100vw - max(20px, env(safe-area-inset-left)) - max(20px, env(safe-area-inset-right)))
  );
  max-height: calc(
    100dvh - max(20px, env(safe-area-inset-top)) - max(20px, env(safe-area-inset-bottom))
  );
  padding: 7px;
  overflow: hidden auto;
  overscroll-behavior: contain;
  isolation: isolate;
  color: #f7f6ff;
  background: linear-gradient(145deg, #aaa6ef, #4d459d 52%, #8580dc);
  clip-path: polygon(7% 0, 93% 0, 100% 10%, 100% 90%, 93% 100%, 7% 100%, 0 90%, 0 10%);
  filter: drop-shadow(0 20px 30px rgba(3, 8, 32, 0.5));
  scrollbar-color: #4d459d transparent;
  scrollbar-width: thin;
}

.game-over-content {
  position: relative;
  display: grid;
  gap: 20px;
  justify-items: center;
  padding: 28px 36px 34px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 8%, rgba(30, 214, 223, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(77, 69, 157, 0.97), rgba(23, 23, 82, 0.99));
  clip-path: polygon(6.5% 0, 93.5% 0, 100% 9%, 100% 91%, 93.5% 100%, 6.5% 100%, 0 91%, 0 9%);
}

.game-over-content::before,
.game-over-content::after {
  position: absolute;
  top: 23px;
  width: 42px;
  height: 3px;
  content: "";
  background: #1ed6df;
  box-shadow: 0 0 12px rgba(30, 214, 223, 0.9);
}

.game-over-content::before {
  left: 22px;
  transform: rotate(-18deg);
}

.game-over-content::after {
  right: 22px;
  transform: rotate(18deg);
}

.loop-mark {
  position: relative;
  width: 104px;
  height: 82px;
  filter: drop-shadow(0 0 13px rgba(30, 214, 223, 0.36));
  animation: loop-arrival 560ms cubic-bezier(0.2, 0.78, 0.25, 1) both;
}

.loop-arc {
  position: absolute;
  inset: 0 11px;
  border: 9px solid #1ed6df;
  border-radius: 50%;
}

.loop-arc-left {
  clip-path: polygon(0 0, 52% 0, 43% 42%, 52% 100%, 0 100%);
  transform: translate(-5px, 3px) rotate(-10deg);
}

.loop-arc-right {
  clip-path: polygon(48% 0, 100% 0, 100% 100%, 48% 100%, 57% 58%, 48% 42%);
  transform: translate(6px, -3px) rotate(11deg);
}

.loop-head,
.loop-tail {
  position: absolute;
  z-index: 1;
  background: #ffd66b;
  border: 4px solid #f7f6ff;
  border-radius: 50%;
  box-shadow: 0 0 9px rgba(255, 214, 107, 0.7);
}

.loop-head {
  top: 26px;
  left: 31px;
  width: 20px;
  height: 20px;
}

.loop-tail {
  right: 29px;
  bottom: 20px;
  width: 13px;
  height: 13px;
  border-width: 3px;
}

.loop-mark i {
  --angle: calc(var(--shard) * 60deg);
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 10px;
  background: #aaa6ef;
  border-radius: 3px;
  opacity: 0;
  transform: rotate(var(--angle)) translateY(-38px) scale(0.5);
  animation: shard-burst 760ms ease-out calc(var(--shard) * 34ms) both;
}

.game-over-heading {
  width: 100%;
  text-align: center;
}

.game-over-heading::after {
  display: block;
  width: min(300px, 68%);
  height: 3px;
  margin: 15px auto 0;
  content: "";
  background: linear-gradient(90deg, transparent, #1ed6df 24% 76%, transparent);
  box-shadow: 0 0 12px rgba(30, 214, 223, 0.55);
}

.game-over-heading > span {
  display: block;
  margin-bottom: 4px;
  color: #aaa6ef;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0;
}

.game-over-heading h2 {
  margin: 0;
  color: #ffd66b;
  font-family: "Dymon ShouXieTi", "Kaiti SC", "PingFang SC", sans-serif;
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    0 3px 0 #4d459d,
    0 0 16px rgba(255, 214, 107, 0.26);
}

.game-over-heading p {
  margin: 10px 0 0;
  color: #c9c7f8;
  font-size: 12px;
  line-height: 1.55;
}

.final-stats {
  display: grid;
  width: min(480px, 100%);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.final-stats > div {
  min-width: 0;
  padding: 14px 8px 13px;
  text-align: center;
  background: #29275f;
  border: 3px solid #aaa6ef;
  clip-path: polygon(8% 0, 92% 0, 100% 15%, 100% 85%, 92% 100%, 8% 100%, 0 85%, 0 15%);
  box-shadow: inset 0 0 0 2px rgba(23, 23, 82, 0.5);
}

.final-stats dt {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  color: #aaa6ef;
  font-size: 11px;
  font-weight: 900;
}

.final-stats dd {
  margin: 7px 0 0;
  color: #ffd66b;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(255, 214, 107, 0.22);
}

.game-over-actions {
  display: grid;
  width: min(480px, 100%);
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.dialog-command {
  position: relative;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 66px;
  padding: 0 20px;
  color: #f7f6ff;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  touch-action: manipulation;
  background: #4d459d;
  border: 4px solid #aaa6ef;
  clip-path: polygon(8% 0, 92% 0, 100% 18%, 100% 82%, 92% 100%, 8% 100%, 0 82%, 0 18%);
  box-shadow: inset 0 0 0 3px rgba(23, 23, 82, 0.5);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.restart-command {
  color: #ffd66b;
  border-color: #1ed6df;
}

.dialog-command:hover {
  color: #ffd66b;
  background: #5c53b1;
  border-color: #1ed6df;
}

.dialog-command:active {
  transform: translateY(2px) scale(0.985);
}

.dialog-command:focus-visible {
  outline: 4px solid #ffd66b;
  outline-offset: 3px;
}

@keyframes loop-arrival {
  from {
    opacity: 0;
    transform: scale(1.24) rotate(-10deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@keyframes shard-burst {
  0% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(-26px) scale(0.5);
  }

  42% {
    opacity: 0.9;
  }

  100% {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(-54px) scale(1);
  }
}

@media (max-width: 520px) {
  .game-over-screen {
    clip-path: polygon(5% 0, 95% 0, 100% 6%, 100% 94%, 95% 100%, 5% 100%, 0 94%, 0 6%);
  }

  .game-over-content {
    gap: 16px;
    padding: 24px 16px 26px;
    clip-path: polygon(4% 0, 96% 0, 100% 5%, 100% 95%, 96% 100%, 4% 100%, 0 95%, 0 5%);
  }

  .game-over-heading h2 {
    font-size: 34px;
  }

  .final-stats {
    gap: 5px;
  }

  .final-stats > div {
    padding-inline: 4px;
  }

  .final-stats dt {
    gap: 3px;
    font-size: 10px;
  }

  .final-stats dd {
    font-size: 24px;
  }

  .game-over-actions {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .dialog-command {
    min-height: 58px;
    font-size: 16px;
  }
}

@media (max-height: 600px) {
  .game-over-screen {
    width: min(650px, calc(100vw - 24px));
  }

  .game-over-content {
    gap: 10px;
    padding: 14px 24px 16px;
  }

  .loop-mark {
    width: 78px;
    height: 56px;
  }

  .loop-head {
    top: 16px;
    left: 23px;
  }

  .loop-tail {
    right: 20px;
    bottom: 11px;
  }

  .game-over-heading h2 {
    font-size: 30px;
  }

  .game-over-heading p,
  .game-over-heading::after {
    display: none;
  }

  .final-stats > div {
    padding-block: 9px;
  }

  .final-stats dd {
    margin-top: 4px;
    font-size: 22px;
  }

  .dialog-command {
    min-height: 50px;
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loop-mark,
  .loop-mark i {
    animation: none;
  }

  .dialog-command {
    transition: none;
  }
}
</style>
