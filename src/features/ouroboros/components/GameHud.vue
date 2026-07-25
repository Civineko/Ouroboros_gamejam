<script setup lang="ts">
import { Heart, ShieldCheck, Sparkles, UnfoldHorizontal } from "@lucide/vue";
import type { HudSnapshot } from "../engine/types";

defineProps<{
  hud: HudSnapshot;
}>();
</script>

<template>
  <div class="hud" aria-label="本局状态">
    <div class="hud-item">
      <Sparkles :size="15" aria-hidden="true" />
      <span>净化</span>
      <strong>{{ hud.kills.toString().padStart(2, "0") }}</strong>
    </div>
    <div class="hud-item">
      <UnfoldHorizontal :size="15" aria-hidden="true" />
      <span>蛇身</span>
      <strong>{{ hud.length }}</strong>
    </div>
    <div class="hud-item">
      <ShieldCheck :size="15" aria-hidden="true" />
      <span>难度</span>
      <strong>{{ hud.level }}</strong>
    </div>
    <div class="hud-item hud-lives" :aria-label="`剩余 ${hud.lives} 点生命`">
      <span>生命</span>
      <div>
        <Heart
          v-for="heart in 3"
          :key="heart"
          :size="14"
          :class="{ alive: heart <= hud.lives }"
          :fill="heart <= hud.lives ? 'currentColor' : 'none'"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hud {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.hud-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
  min-height: 48px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface) 74%, transparent);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.hud-item > svg {
  color: var(--teal-deep);
}

.hud-item span {
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hud-item strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 20px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.hud-lives {
  grid-template-columns: 1fr auto;
}

.hud-lives > div {
  display: flex;
  gap: 3px;
  color: rgba(239, 98, 79, 0.22);
}

.hud-lives .alive {
  color: var(--coral);
}

@media (max-width: 820px), (hover: none), (max-height: 560px) and (max-width: 960px) {
  .hud {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .hud-item {
    min-height: 44px;
    padding: 7px 8px;
    color: var(--surface);
    background: rgba(25, 37, 49, 0.46);
    border-color: rgba(255, 253, 247, 0.18);
    backdrop-filter: blur(8px);
  }

  .hud-item > svg {
    color: var(--amber);
  }

  .hud-item span {
    color: rgba(255, 253, 247, 0.78);
    font-size: 9px;
  }

  .hud-item strong {
    font-size: 18px;
  }

  .hud-lives > div {
    color: rgba(255, 253, 247, 0.3);
  }
}

@media (max-width: 560px) {
  .hud {
    gap: 5px;
  }

  .hud-item {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3px;
    min-height: 43px;
    padding: 6px;
  }

  .hud-item > svg {
    display: none;
  }

  .hud-item strong,
  .hud-lives > div {
    display: flex;
    margin-top: 0;
  }

  .hud-item strong {
    font-size: 16px;
  }
}
</style>
