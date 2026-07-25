<script setup lang="ts">
import { useTemplateRef } from "vue";
import { Heart, Layers, Pause, Play, Sparkles } from "@lucide/vue";
import OuroborosStage from "./components/OuroborosStage.vue";
import PowerUpBar from "./components/PowerUpBar.vue";
import type { OuroborosStageExpose } from "./components/OuroborosStage.vue";
import { useOuroborosGame } from "./composables/useOuroborosGame";

const stage = useTemplateRef<OuroborosStageExpose>("stage");
const game = useOuroborosGame(() => stage.value?.getContainer() ?? null);
</script>

<template>
  <main class="ouroboros-app">
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

    <PowerUpBar
      v-if="game.started.value && game.hud.value.buffs.length"
      class="active-buffs"
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
}
</style>
