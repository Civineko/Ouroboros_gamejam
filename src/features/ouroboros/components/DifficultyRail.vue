<script setup lang="ts">
import { computed } from "vue";
import { CircleDotDashed, Gauge, TrendingUp } from "@lucide/vue";
import type { HudSnapshot } from "../engine/types";

const { hud } = defineProps<{
  hud: HudSnapshot;
}>();

const difficultyBars = computed(() => Math.min(5, hud.level));
</script>

<template>
  <aside class="status-rail" aria-label="难度状态">
    <div class="status-tile coral">
      <CircleDotDashed :size="21" />
      <span>ENEMIES</span>
      <strong>{{ hud.enemyLimit }}</strong>
    </div>
    <div class="status-tile amber">
      <TrendingUp :size="21" />
      <span>NEXT GROWTH</span>
      <strong>{{ hud.nextGrowth }}</strong>
    </div>
    <div class="difficulty-meter">
      <div>
        <Gauge :size="17" />
        <span>难度会动态增长</span>
      </div>
      <div class="meter-bars" aria-hidden="true">
        <i
          v-for="bar in 5"
          :key="bar"
          :class="{ active: bar <= difficultyBars }"
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.status-rail {
  display: grid;
  gap: 12px;
}

.status-tile {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 9px;
  align-items: center;
  min-height: 68px;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 7px 8px 0 var(--shadow);
}

.status-tile.coral {
  color: #fff5e6;
  background: var(--coral);
}

.status-tile.amber {
  color: #5b4824;
  background: var(--amber);
}

.status-tile span {
  font-size: 9px;
  font-weight: 900;
}

.status-tile strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 25px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.difficulty-meter {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.difficulty-meter > div:first-child {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 10px;
  font-weight: 850;
}

.meter-bars {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin-top: 11px;
}

.meter-bars i {
  height: 5px;
  background: #d9d4c8;
  border-radius: 2px;
}

.meter-bars i.active {
  background: var(--teal-deep);
}

@media (max-width: 1180px) {
  .status-rail {
    grid-column: 1 / -1;
    grid-template-columns: 1fr 1fr 1.2fr;
    align-items: stretch;
  }

  .difficulty-meter {
    margin-top: 0;
    padding: 15px;
    border: 1px solid var(--line);
    border-radius: 8px;
  }
}

@media (max-width: 820px) {
  .status-rail {
    grid-column: 1;
  }
}

@media (max-width: 560px) {
  .status-rail {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .difficulty-meter {
    grid-column: 1 / -1;
  }
}
</style>
