<script setup lang="ts">
import { useTemplateRef } from "vue";
import { Heart, Layers, Pause, Play, Sparkles } from "@lucide/vue";
import OuroborosStage from "./components/OuroborosStage.vue";
import PowerUpBar from "./components/PowerUpBar.vue";
import type { OuroborosStageExpose } from "./components/OuroborosStage.vue";
import { useOuroborosGame } from "./composables/useOuroborosGame";

const stage = useTemplateRef<OuroborosStageExpose>("stage");
const game = useOuroborosGame(() => stage.value?.getContainer() ?? null);

function handleUiClick(event: MouseEvent): void {
  const target = event.target;
  if (target instanceof Element && target.closest("button")) {
    game.playUiClick();
  }
}
</script>

<template>
  <main
    class="ouroboros-app"
    @pointerdown.capture="game.unlockAudio"
    @click.capture="handleUiClick"
  >
    <OuroborosStage
      ref="stage"
      :started="game.started.value"
      :paused="game.paused.value"
      :game-over="game.gameOver.value"
      :music-volume="game.musicVolume.value"
      :effects-volume="game.effectsVolume.value"
      :hud="game.hud.value"
      @start="game.start"
      @pause="game.togglePause"
      @restart="game.start"
      @end="game.end"
      @music-volume-change="game.setMusicVolume"
      @effects-volume-change="game.setEffectsVolume"
      @toggle-music-mute="game.toggleMusicMute"
      @toggle-effects-mute="game.toggleEffectsMute"
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
        <div
          class="stat-chip level-chip"
          :aria-label="`关卡 ${game.hud.value.level}`"
        >
          <Layers :size="15" aria-hidden="true" />
          <span>关卡</span>
          <strong>{{ game.hud.value.level.toString().padStart(2, "0") }}</strong>
        </div>

        <div
          class="stat-chip score-chip"
          :aria-label="`分数 ${game.hud.value.kills}`"
        >
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
  color: var(--surface);
  background: rgba(32, 59, 66, 0.92);
  border: 2px solid var(--ink);
  border-radius: 6px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 250, 240, 0.18),
    3px 4px 0 rgba(13, 29, 32, 0.68);
}

.menu-command {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
  transition:
    color 140ms ease,
    background-color 140ms ease,
    transform 140ms ease,
    box-shadow 140ms ease;
}

.menu-command:hover {
  color: var(--ink);
  background: var(--amber);
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 250, 240, 0.24),
    3px 5px 0 rgba(13, 29, 32, 0.68);
}

.menu-command:active {
  transform: translate(2px, 3px);
  box-shadow: inset 0 0 0 1px rgba(255, 250, 240, 0.18);
}

.game-stats {
  display: flex;
  gap: 9px;
  margin-left: auto;
}

.stat-chip {
  display: flex;
  flex: 0 1 auto;
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 8px 12px;
  white-space: nowrap;
}

.stat-chip > svg {
  color: var(--teal);
}

.stat-chip span {
  color: rgba(255, 250, 240, 0.72);
  font-size: 10px;
  font-weight: 900;
}

.stat-chip strong {
  min-width: 28px;
  font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.life-chip > div {
  display: flex;
  gap: 3px;
  color: rgba(255, 250, 240, 0.3);
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
    gap: 6px;
  }

  .menu-command {
    width: 44px;
    height: 44px;
    flex: 0 0 44px;
  }

  .game-stats {
    gap: 6px;
  }

  .stat-chip {
    min-height: 44px;
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

@media (max-width: 380px) {
  .stat-chip {
    gap: 5px;
    padding-inline: 6px;
  }

  .stat-chip > span {
    display: none;
  }
}
</style>
