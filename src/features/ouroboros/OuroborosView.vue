<script setup lang="ts">
import { useTemplateRef } from "vue";
import {
  Heart,
  Layers,
  Pause,
  Play,
  ShieldAlert,
  Sparkles,
  Target,
} from "@lucide/vue";
import OuroborosStage from "./components/OuroborosStage.vue";
import PowerUpBar from "./components/PowerUpBar.vue";
import type { OuroborosStageExpose } from "./components/OuroborosStage.vue";
import { useOuroborosGame } from "./composables/useOuroborosGame";
import type { BossSnapshot } from "./engine/types";

const stage = useTemplateRef<OuroborosStageExpose>("stage");
const game = useOuroborosGame(() => stage.value?.getContainer() ?? null);

function bossStatus(boss: BossSnapshot | null): string {
  if (!boss) return "";
  if (boss.action === "appearing") return "正在吞噬敌人 · 准备迎战";
  if (boss.action === "telegraphing") return "危险：冲撞路线已锁定";
  if (boss.action === "charging") return "冲撞中 · 远离腐蚀路径";
  if (boss.action === "recovering" && boss.coreExposed) {
    return "破绽期 · 立即闭环核心";
  }
  return boss.coreExposed ? "核心已暴露 · 闭环捕获" : "核心重组中";
}
</script>

<template>
  <main class="ouroboros-app" :class="{ 'is-paused': game.paused.value }">
    <OuroborosStage
      ref="stage"
      :started="game.started.value"
      :paused="game.paused.value"
      :game-over="game.gameOver.value"
      :master-volume="game.masterVolume.value"
      :muted="game.muted.value"
      :hud="game.hud.value"
      @start="game.start"
      @pause="game.togglePause"
      @restart="game.start"
      @end="game.end"
      @volume-change="game.setMasterVolume"
      @toggle-mute="game.toggleMute"
    />

    <div
      v-if="game.started.value && !game.paused.value && !game.gameOver.value"
      class="game-topbar"
      aria-label="游戏状态"
    >
      <button
        type="button"
        class="menu-command"
        :title="game.paused.value ? '继续游戏' : '暂停游戏'"
        :aria-label="game.paused.value ? '继续游戏' : '暂停游戏'"
        @click="game.togglePause"
      >
        <Play v-if="game.paused.value" :size="19" fill="currentColor" />
        <Pause v-else :size="19" fill="currentColor" />
      </button>

      <div class="game-stats">
        <div class="stat-chip level-chip">
          <Layers :size="15" aria-hidden="true" />
          <span>关卡</span>
          <strong>{{ game.hud.value.level.toString().padStart(2, "0") }}</strong>
        </div>

        <div class="stat-chip score-chip">
          <Sparkles :size="15" aria-hidden="true" />
          <span>分数</span>
          <strong>{{ game.hud.value.kills.toString().padStart(2, "0") }}</strong>
        </div>

        <div class="stat-chip life-chip" :aria-label="`剩余 ${game.hud.value.lives} 点血量`">
          <span>血量</span>
          <div>
            <Heart
              v-for="heart in 3"
              :key="heart"
              :size="15"
              :class="{ alive: heart <= game.hud.value.lives }"
              :fill="heart <= game.hud.value.lives ? 'currentColor' : 'none'"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>

    <template
      v-if="
        game.started.value &&
        !game.gameOver.value &&
        game.hud.value.boss?.action === 'telegraphing'
      "
    >
      <div class="boss-danger-flash" aria-hidden="true" />
      <div class="boss-danger-callout" role="alert">
        <ShieldAlert :size="21" aria-hidden="true" />
        <strong>冲撞预警</strong>
        <span>立即离开红色路线！</span>
      </div>
    </template>

    <section
      v-if="game.started.value && !game.gameOver.value && game.hud.value.boss"
      class="boss-status"
      :class="[
        `phase-${game.hud.value.boss.phase}`,
        `action-${game.hud.value.boss.action}`,
      ]"
      :aria-label="`${game.hud.value.boss.name}剩余 ${game.hud.value.boss.armor} 层护甲。击败方法：绕住外侧发光核心，让蛇首尾相接形成闭环`"
    >
      <div class="boss-heading">
        <ShieldAlert :size="16" aria-hidden="true" />
        <strong>{{ game.hud.value.boss.name }}</strong>
        <span>阶段 {{ game.hud.value.boss.phase }}</span>
      </div>
      <div class="boss-armor" aria-hidden="true">
        <span
          v-for="armor in game.hud.value.boss.maxArmor"
          :key="armor"
          :class="{ broken: armor > game.hud.value.boss.armor }"
        />
      </div>
      <small>{{ bossStatus(game.hud.value.boss) }}</small>
      <div class="boss-objective">
        <Target :size="17" aria-hidden="true" />
        <span>
          <b>击败方法</b>
          绕住外侧发光核心，让蛇首尾相接形成闭环
        </span>
      </div>
    </section>

    <section
      v-if="game.started.value && game.hud.value.bossDefeat"
      class="boss-victory"
      role="status"
      aria-live="polite"
    >
      <div class="victory-burst" aria-hidden="true">
        <i v-for="ray in 12" :key="ray" :style="{ '--ray': ray }" />
      </div>
      <Sparkles :size="28" aria-hidden="true" />
      <div>
        <span>OUROBOROS PURIFIED</span>
        <strong>{{ game.hud.value.bossDefeat.name }} · 净化完成</strong>
        <small>战果奖励 +{{ game.hud.value.bossDefeat.reward }}</small>
      </div>
      <Sparkles :size="28" aria-hidden="true" />
    </section>

    <PowerUpBar
      v-if="game.started.value && game.hud.value.buffs.length"
      class="active-buffs"
      :class="{ 'with-boss': game.hud.value.boss }"
      :buffs="game.hud.value.buffs"
    />
  </main>
</template>

<style scoped>
.ouroboros-app {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  color: var(--surface);
  background: var(--stage);
}

.game-topbar {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  right: max(14px, env(safe-area-inset-right));
  left: max(14px, env(safe-area-inset-left));
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  pointer-events: none;
}

.menu-command,
.stat-chip {
  color: #fffdf7;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.14), rgba(255, 253, 247, 0.04)),
    rgba(25, 37, 49, 0.62);
  border: 1px solid rgba(255, 253, 247, 0.24);
  border-radius: 8px;
  box-shadow: 0 5px 14px rgba(25, 37, 49, 0.22);
  backdrop-filter: blur(8px);
}

.menu-command {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
}

.game-stats {
  display: flex;
  gap: 9px;
  margin-left: auto;
}

.stat-chip {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 8px 12px;
}

.stat-chip > svg {
  color: var(--amber);
}

.stat-chip span {
  color: rgba(255, 253, 247, 0.76);
  font-size: 10px;
  font-weight: 900;
}

.stat-chip strong {
  min-width: 28px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.life-chip > div {
  display: flex;
  gap: 3px;
  color: rgba(255, 253, 247, 0.34);
}

.life-chip .alive {
  color: var(--coral);
}

.active-buffs {
  position: absolute;
  top: calc(max(14px, env(safe-area-inset-top)) + 58px);
  right: max(14px, env(safe-area-inset-right));
  left: max(14px, env(safe-area-inset-left));
  z-index: 30;
  pointer-events: none;
}

.boss-danger-flash {
  position: absolute;
  inset: 0;
  z-index: 24;
  pointer-events: none;
  background:
    radial-gradient(circle at center, transparent 36%, rgba(239, 98, 79, 0.18) 78%, rgba(150, 26, 31, 0.42)),
    rgba(239, 98, 79, 0.08);
  box-shadow:
    inset 0 0 0 5px rgba(255, 109, 91, 0.72),
    inset 0 0 72px rgba(185, 24, 34, 0.68);
  animation: danger-screen-pulse 280ms ease-in-out infinite alternate;
}

.boss-danger-callout {
  position: absolute;
  right: max(14px, env(safe-area-inset-right));
  bottom: max(72px, calc(env(safe-area-inset-bottom) + 22px));
  left: max(14px, env(safe-area-inset-left));
  z-index: 34;
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  width: fit-content;
  max-width: calc(100vw - 28px);
  min-height: 48px;
  margin: auto;
  padding: 10px 18px;
  color: #fffdf7;
  pointer-events: none;
  background: rgba(126, 22, 30, 0.9);
  border: 2px solid rgba(255, 181, 161, 0.96);
  border-radius: 9px;
  box-shadow:
    0 8px 26px rgba(74, 9, 17, 0.42),
    0 0 24px rgba(239, 98, 79, 0.66);
  animation: danger-callout-pulse 280ms ease-in-out infinite alternate;
  backdrop-filter: blur(8px);
}

.boss-danger-callout > svg {
  flex: 0 0 auto;
  color: #fff5ca;
}

.boss-danger-callout strong {
  font-size: 13px;
  letter-spacing: 0.08em;
}

.boss-danger-callout span {
  font-size: 11px;
  font-weight: 800;
}

.is-paused .boss-danger-flash,
.is-paused .boss-danger-callout {
  animation-play-state: paused;
}

@keyframes danger-screen-pulse {
  from {
    opacity: 0.46;
  }

  to {
    opacity: 1;
  }
}

@keyframes danger-callout-pulse {
  from {
    transform: scale(0.96);
  }

  to {
    transform: scale(1.04);
  }
}

.boss-status {
  --boss-accent: var(--coral);

  position: absolute;
  top: calc(max(14px, env(safe-area-inset-top)) + 60px);
  left: 50%;
  z-index: 30;
  display: grid;
  grid-template-columns: auto minmax(150px, 280px) auto;
  gap: 9px 13px;
  align-items: center;
  width: min(620px, calc(100vw - 32px));
  padding: 9px 13px;
  color: #fffdf7;
  pointer-events: none;
  background: rgba(25, 37, 49, 0.72);
  border: 1px solid color-mix(in srgb, var(--boss-accent) 72%, transparent);
  border-radius: 9px;
  box-shadow: 0 7px 18px rgba(25, 37, 49, 0.26);
  transform: translateX(-50%);
  backdrop-filter: blur(9px);
}

.boss-status.phase-2 {
  --boss-accent: var(--amber);
}

.boss-status.phase-3 {
  --boss-accent: #b77cff;
}

.boss-status.action-telegraphing {
  animation: boss-warning 520ms ease-in-out infinite alternate;
}

.boss-status.action-recovering {
  background: rgba(38, 75, 78, 0.76);
}

.boss-heading {
  display: flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

.boss-heading > svg {
  color: var(--boss-accent);
}

.boss-heading strong {
  font-size: 12px;
}

.boss-heading span,
.boss-status small {
  color: rgba(255, 253, 247, 0.72);
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

.boss-objective {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 7px 11px;
  color: #fffdf7;
  font-size: 11px;
  font-weight: 750;
  line-height: 1.35;
  text-align: center;
  background: color-mix(in srgb, var(--boss-accent) 16%, rgba(25, 37, 49, 0.42));
  border: 1px solid color-mix(in srgb, var(--boss-accent) 45%, transparent);
  border-radius: 7px;
}

.boss-objective > svg {
  flex: 0 0 auto;
  color: #fff5ca;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--boss-accent) 70%, transparent));
  animation: objective-pulse 720ms ease-in-out infinite alternate;
}

.boss-objective b {
  margin-right: 6px;
  color: #fff5ca;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.boss-armor {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.boss-armor span {
  height: 8px;
  background: var(--boss-accent);
  border-radius: 3px;
  box-shadow: 0 0 9px rgba(239, 98, 79, 0.42);
}

@keyframes boss-warning {
  from {
    box-shadow: 0 7px 18px rgba(25, 37, 49, 0.26);
  }

  to {
    box-shadow:
      0 7px 18px rgba(25, 37, 49, 0.26),
      0 0 18px color-mix(in srgb, var(--boss-accent) 62%, transparent);
  }
}

.boss-armor span.broken {
  background: rgba(255, 253, 247, 0.18);
  box-shadow: none;
}

.active-buffs.with-boss {
  top: calc(max(14px, env(safe-area-inset-top)) + 158px);
}

@keyframes objective-pulse {
  from {
    opacity: 0.68;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1.08);
  }
}

.boss-victory {
  position: absolute;
  top: clamp(112px, 18vh, 190px);
  left: 50%;
  z-index: 35;
  display: flex;
  gap: 17px;
  align-items: center;
  justify-content: center;
  width: min(620px, calc(100vw - 32px));
  min-height: 112px;
  padding: 18px 34px;
  overflow: hidden;
  color: #fffdf7;
  text-align: center;
  pointer-events: none;
  background:
    linear-gradient(110deg, rgba(88, 213, 201, 0.18), rgba(183, 124, 255, 0.25)),
    rgba(25, 37, 49, 0.83);
  border: 2px solid rgba(255, 245, 202, 0.86);
  border-radius: 12px;
  box-shadow:
    0 14px 38px rgba(25, 37, 49, 0.38),
    0 0 36px rgba(242, 186, 73, 0.36),
    inset 0 0 24px rgba(255, 245, 202, 0.12);
  transform: translateX(-50%);
  animation: boss-victory 2.2s cubic-bezier(0.2, 0.82, 0.24, 1) both;
  backdrop-filter: blur(10px);
}

.is-paused .boss-victory,
.is-paused .boss-victory * {
  animation-play-state: paused;
}

.boss-victory > svg {
  flex: 0 0 auto;
  color: #fff5ca;
  filter: drop-shadow(0 0 9px rgba(242, 186, 73, 0.8));
  animation: victory-spark 540ms ease-in-out infinite alternate;
}

.boss-victory > div:not(.victory-burst) {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 5px;
}

.boss-victory span,
.boss-victory small {
  color: rgba(255, 245, 202, 0.82);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.boss-victory strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 500;
  line-height: 1.05;
  text-shadow: 0 2px 12px rgba(25, 37, 49, 0.7);
}

.victory-burst {
  position: absolute;
  inset: 50%;
}

.victory-burst i {
  --ray: 1;

  position: absolute;
  top: -1px;
  left: -110px;
  width: 220px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 245, 202, 0.44), transparent);
  transform: rotate(calc(var(--ray) * 30deg));
  animation: victory-ray 780ms ease-out both;
  animation-delay: calc(var(--ray) * 18ms);
}

@keyframes boss-victory {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(0.58);
    filter: brightness(2.2);
  }

  12% {
    opacity: 1;
    transform: translateX(-50%) scale(1.08);
  }

  20%,
  78% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
    filter: brightness(1);
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-24px) scale(0.96);
  }
}

@keyframes victory-spark {
  from {
    opacity: 0.62;
    transform: rotate(-8deg) scale(0.88);
  }

  to {
    opacity: 1;
    transform: rotate(8deg) scale(1.12);
  }
}

@keyframes victory-ray {
  from {
    opacity: 0;
    transform: rotate(calc(var(--ray) * 30deg)) scaleX(0.16);
  }

  to {
    opacity: 0.52;
    transform: rotate(calc(var(--ray) * 30deg)) scaleX(1);
  }
}

@media (max-width: 520px) {
  .game-topbar {
    gap: 8px;
  }

  .menu-command {
    width: 43px;
    height: 43px;
  }

  .game-stats {
    gap: 6px;
  }

  .stat-chip {
    min-height: 43px;
    padding: 7px 8px;
  }

  .stat-chip strong {
    min-width: 24px;
    font-size: 19px;
  }

  .active-buffs {
    top: calc(max(14px, env(safe-area-inset-top)) + 51px);
  }

  .boss-danger-flash {
    box-shadow:
      inset 0 0 0 4px rgba(255, 109, 91, 0.76),
      inset 0 0 48px rgba(185, 24, 34, 0.72);
  }

  .boss-danger-callout {
    bottom: max(78px, calc(env(safe-area-inset-bottom) + 20px));
    min-height: 44px;
    padding: 8px 13px;
  }

  .boss-danger-callout strong {
    font-size: 12px;
  }

  .boss-danger-callout span {
    font-size: 10px;
  }

  .boss-status {
    top: calc(max(14px, env(safe-area-inset-top)) + 53px);
    grid-template-columns: auto minmax(90px, 1fr);
    gap: 6px 9px;
    width: min(430px, calc(100vw - 28px));
    padding: 7px 9px;
  }

  .boss-heading span {
    display: none;
  }

  .boss-status small {
    grid-column: 1 / -1;
    text-align: center;
  }

  .boss-objective {
    gap: 6px;
    min-height: 38px;
    padding: 6px 8px;
    font-size: 10px;
  }

  .boss-objective b {
    display: block;
    margin: 0 0 1px;
    font-size: 9px;
  }

  .active-buffs.with-boss {
    top: calc(max(14px, env(safe-area-inset-top)) + 158px);
  }

  .boss-victory {
    top: clamp(118px, 20vh, 170px);
    gap: 9px;
    min-height: 96px;
    padding: 14px 16px;
  }

  .boss-victory > svg {
    width: 21px;
    height: 21px;
  }

  .boss-victory span,
  .boss-victory small {
    font-size: 8px;
  }

  .boss-victory strong {
    font-size: clamp(18px, 6vw, 25px);
  }
}
</style>
