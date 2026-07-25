<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import { LogOut, Pause, Play, Volume2, VolumeX } from "@lucide/vue";

const { masterVolume, muted } = defineProps<{
  masterVolume: number;
  muted: boolean;
}>();

const emit = defineEmits<{
  resume: [];
  end: [];
  volumeChange: [volume: number];
  toggleMute: [];
}>();

const resumeButton = useTemplateRef<HTMLButtonElement>("resumeButton");
const audioMuted = computed(() => muted || masterVolume === 0);
const volumePercent = computed(() => Math.round(masterVolume * 100));

function handleVolumeInput(event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  emit("volumeChange", input.valueAsNumber);
}

function handleDialogKeydown(event: KeyboardEvent): void {
  if (!["Escape", "Esc", "p", "P"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  emit("resume");
}

onMounted(() => {
  resumeButton.value?.focus();
});
</script>

<template>
  <section
    class="pause-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pause-title"
    @keydown="handleDialogKeydown"
  >
    <header class="dialog-header">
      <span class="pause-mark" aria-hidden="true">
        <Pause :size="24" fill="currentColor" />
      </span>
      <div>
        <p>GAME PAUSED</p>
        <h2 id="pause-title">游戏已暂停</h2>
      </div>
    </header>

    <div class="volume-setting">
      <div class="setting-label">
        <label for="master-volume">总音量</label>
        <output for="master-volume">{{ volumePercent }}%</output>
      </div>
      <div class="volume-control">
        <button
          type="button"
          class="mute-command"
          :aria-label="audioMuted ? '取消静音' : '静音'"
          :title="audioMuted ? '取消静音' : '静音'"
          :aria-pressed="audioMuted"
          @click="emit('toggleMute')"
        >
          <VolumeX v-if="audioMuted" :size="21" aria-hidden="true" />
          <Volume2 v-else :size="21" aria-hidden="true" />
        </button>
        <input
          id="master-volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="masterVolume"
          aria-label="总音量"
          @input="handleVolumeInput"
          @keydown.stop="handleDialogKeydown"
        />
      </div>
    </div>

    <div class="dialog-actions">
      <button
        ref="resumeButton"
        type="button"
        class="dialog-command primary-command"
        @click="emit('resume')"
      >
        <Play :size="18" fill="currentColor" aria-hidden="true" />
        继续游戏
      </button>
      <button
        type="button"
        class="dialog-command end-command"
        @click="emit('end')"
      >
        <LogOut :size="18" aria-hidden="true" />
        结束游戏
      </button>
    </div>
  </section>
</template>

<style scoped>
.pause-dialog {
  width: min(380px, 100%);
  max-height: calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  padding: 22px;
  color: var(--ink);
  overflow-y: auto;
  text-align: left;
  background: rgba(255, 253, 247, 0.97);
  border: 1px solid rgba(255, 253, 247, 0.72);
  border-radius: 8px;
  box-shadow: 0 18px 46px rgba(25, 37, 49, 0.38);
}

.dialog-header {
  display: flex;
  gap: 13px;
  align-items: center;
}

.pause-mark {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  color: var(--ink);
  background: var(--amber);
  border-radius: 8px;
}

.dialog-header p {
  margin: 0 0 3px;
  color: var(--ink-soft);
  font-size: 9px;
  font-weight: 900;
}

.dialog-header h2 {
  margin: 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: 25px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0;
}

.volume-setting {
  margin: 20px 0;
  padding: 17px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.setting-label,
.volume-control {
  display: flex;
  align-items: center;
}

.setting-label {
  justify-content: space-between;
  margin-bottom: 10px;
}

.setting-label label {
  font-size: 12px;
  font-weight: 900;
}

.setting-label output {
  min-width: 38px;
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 800;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.volume-control {
  gap: 12px;
}

.mute-command {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  padding: 0;
  color: var(--ink);
  cursor: pointer;
  background: var(--paper-strong);
  border: 1px solid var(--line);
  border-radius: 8px;
  touch-action: manipulation;
}

.mute-command[aria-pressed="true"] {
  color: var(--surface);
  background: var(--coral);
}

input[type="range"] {
  width: 100%;
  min-width: 0;
  height: 46px;
  margin: 0;
  accent-color: var(--teal-deep);
  cursor: pointer;
  touch-action: pan-x;
}

.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.dialog-command {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 48px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  border-radius: 8px;
  touch-action: manipulation;
}

.dialog-command.primary-command {
  color: var(--ink);
  background: var(--amber);
  border: 1px solid color-mix(in srgb, var(--amber) 72%, var(--ink));
}

.end-command {
  color: var(--coral);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--coral) 48%, transparent);
}

@media (max-width: 430px), (max-height: 470px) {
  .pause-dialog {
    padding: 16px;
  }

  .volume-setting {
    margin: 14px 0;
    padding: 12px 0;
  }
}

@media (max-width: 340px) {
  .dialog-actions {
    grid-template-columns: 1fr;
  }
}
</style>
