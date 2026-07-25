<script setup lang="ts">
import {
  CircleDotDashed,
  Pause,
  Play,
} from "@lucide/vue";
import IconButton from "@/shared/components/IconButton.vue";

const {
  started,
  paused,
  gameOver,
} = defineProps<{
  started: boolean;
  paused: boolean;
  gameOver: boolean;
}>();

const emit = defineEmits<{
  pause: [];
}>();
</script>

<template>
  <header class="app-header">
    <div class="brand" aria-label="衔尾蛇 Ouroboros">
      <span class="brand-mark" aria-hidden="true">
        <CircleDotDashed :size="24" :stroke-width="1.8" />
      </span>
      <span class="brand-copy">
        <strong>衔尾蛇</strong>
        <small>OUROBOROS</small>
      </span>
    </div>

    <div class="header-actions">
      <IconButton
        :label="paused ? '继续游戏' : '暂停游戏'"
        :disabled="!started || gameOver"
        :active="paused"
        @click="emit('pause')"
      >
        <Play v-if="paused" :size="18" fill="currentColor" />
        <Pause v-else :size="18" fill="currentColor" />
      </IconButton>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(1460px, 100%);
  height: 78px;
  margin: 0 auto;
  border-bottom: 1px solid var(--line);
}

.brand {
  display: inline-flex;
  gap: 11px;
  align-items: center;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: #fff8df;
  background: var(--teal-deep);
  border-radius: 8px;
  box-shadow: 5px 5px 0 var(--shadow);
}

.brand-copy strong,
.brand-copy small {
  display: block;
  letter-spacing: 0;
}

.brand-copy strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  font-weight: 600;
}

.brand-copy small {
  margin-top: 2px;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 560px) {
  .app-header {
    height: 68px;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
  }

  .brand-copy strong {
    font-size: 15px;
  }

  .header-actions {
    gap: 5px;
  }
}
</style>
