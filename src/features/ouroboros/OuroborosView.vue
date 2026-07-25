<script setup lang="ts">
import { useTemplateRef } from "vue";
import OuroborosHeader from "./components/OuroborosHeader.vue";
import OuroborosIntro from "./components/OuroborosIntro.vue";
import GameHud from "./components/GameHud.vue";
import OuroborosStage from "./components/OuroborosStage.vue";
import DifficultyRail from "./components/DifficultyRail.vue";
import PowerUpBar from "./components/PowerUpBar.vue";
import type { OuroborosStageExpose } from "./components/OuroborosStage.vue";
import { useOuroborosGame } from "./composables/useOuroborosGame";

const stage = useTemplateRef<OuroborosStageExpose>("stage");
const game = useOuroborosGame(() => stage.value?.getContainer() ?? null);
</script>

<template>
  <main class="ouroboros-app">
    <OuroborosHeader
      :started="game.started.value"
      :paused="game.paused.value"
      :game-over="game.gameOver.value"
      @pause="game.togglePause"
    />

    <section class="game-layout">
      <OuroborosIntro />

      <section class="play-column" aria-label="衔尾蛇游戏">
        <GameHud :hud="game.hud.value" />
        <PowerUpBar :buffs="game.hud.value.buffs" />
        <OuroborosStage
          ref="stage"
          :started="game.started.value"
          :paused="game.paused.value"
          :game-over="game.gameOver.value"
          :hud="game.hud.value"
          @start="game.start"
          @pause="game.togglePause"
          @restart="game.start"
          @direction="game.steer"
        />
        <div class="game-message" aria-live="polite">
          <span aria-hidden="true" />
          {{ game.hud.value.message }}
        </div>
      </section>

      <DifficultyRail :hud="game.hud.value" />
    </section>

    <footer>
      <span>圆环之外，没有攻击</span>
      <span>Demo 02 · 2026</span>
    </footer>
  </main>
</template>

<style scoped>
.ouroboros-app {
  min-height: 100vh;
  padding: 0 34px;
  overflow: hidden;
}

.game-layout {
  display: grid;
  grid-template-columns:
    minmax(160px, 210px) minmax(560px, 900px) minmax(150px, 205px);
  gap: 36px;
  align-items: center;
  justify-content: center;
  width: min(1460px, 100%);
  min-height: calc(100vh - 132px);
  margin: 0 auto;
  padding: 28px 0 22px;
}

.play-column {
  min-width: 0;
}

.game-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  margin-top: 12px;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 750;
}

.game-message span {
  width: 6px;
  height: 6px;
  margin-right: 9px;
  background: var(--teal);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(92, 158, 148, 0.16);
}

footer {
  display: flex;
  justify-content: space-between;
  width: min(1460px, 100%);
  min-height: 54px;
  margin: 0 auto;
  padding: 16px 0;
  color: var(--ink-soft);
  border-top: 1px solid var(--line);
  font-size: 8px;
  font-weight: 800;
}

@media (max-width: 1180px) {
  .game-layout {
    grid-template-columns: 180px minmax(520px, 1fr);
    gap: 28px;
  }
}

@media (max-width: 820px) {
  .ouroboros-app {
    padding: 0 18px;
    overflow: visible;
  }

  .game-layout {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 22px;
  }
}

@media (max-width: 560px) {
  .ouroboros-app {
    padding: 0 12px;
  }

  .game-layout {
    gap: 18px;
    padding-top: 16px;
  }

  footer {
    min-height: 46px;
  }
}
</style>
