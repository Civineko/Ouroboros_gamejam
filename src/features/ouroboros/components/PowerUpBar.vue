<script setup lang="ts">
import type { Component } from "vue";
import { CircleDot, HeartPulse, Shield, Snowflake, Zap } from "@lucide/vue";
import type { BuffSnapshot } from "../engine/types";

defineProps<{
  buffs: readonly BuffSnapshot[];
}>();

const buffIcons: Readonly<Record<BuffSnapshot["kind"], Component>> = {
  shield: Shield,
  heal: HeartPulse,
  stasis: Snowflake,
  haste: Zap,
  resonance: CircleDot,
};

function iconFor(kind: BuffSnapshot["kind"]): Component {
  return buffIcons[kind];
}

function durationLabel(buff: BuffSnapshot): string {
  if (buff.kind === "shield") {
    return "1层";
  }

  return buff.remaining === null ? "" : `${Math.max(0, Math.ceil(buff.remaining))}秒`;
}
</script>

<template>
  <div class="power-up-bar" aria-live="polite" aria-label="当前增益效果">
    <ul v-if="buffs.length" class="buff-list">
      <li v-for="buff in buffs" :key="buff.kind" class="buff-item">
        <component :is="iconFor(buff.kind)" :size="13" :stroke-width="2.2" aria-hidden="true" />
        <span class="buff-name">{{ buff.label }}</span>
        <strong v-if="durationLabel(buff)" class="buff-duration">{{ durationLabel(buff) }}</strong>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.power-up-bar {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 28px;
  overflow: hidden;
}

.buff-list {
  display: flex;
  gap: 5px;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.buff-item {
  display: grid;
  grid-template-columns: auto minmax(0, auto) auto;
  gap: 4px;
  align-items: center;
  min-width: 0;
  height: 24px;
  padding: 0 7px;
  color: var(--ink);
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  border: 1px solid var(--line);
  border-radius: 6px;
}

.buff-item > svg {
  flex: none;
  color: var(--teal-deep);
}

.buff-name {
  min-width: 0;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buff-duration {
  flex: none;
  font-size: 10px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .buff-list {
    width: 100%;
  }

  .buff-item {
    flex: 0 1 auto;
    max-width: min(132px, 40vw);
    padding-inline: 5px;
  }

  .buff-name {
    max-width: 52px;
  }
}
</style>
