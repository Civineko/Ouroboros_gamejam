<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import { LogOut, Pause, Play, Volume2, VolumeX } from "@lucide/vue";

const { musicVolume, effectsVolume } = defineProps<{
  musicVolume: number;
  effectsVolume: number;
}>();

const emit = defineEmits<{
  resume: [];
  end: [];
  musicVolumeChange: [volume: number];
  effectsVolumeChange: [volume: number];
  toggleMusicMute: [];
  toggleEffectsMute: [];
}>();

const dialog = useTemplateRef<HTMLElement>("dialog");
const resumeButton = useTemplateRef<HTMLButtonElement>("resumeButton");
const musicMuted = computed(() => musicVolume === 0);
const effectsMuted = computed(() => effectsVolume === 0);
const musicPercent = computed(() => Math.round(musicVolume * 100));
const effectsPercent = computed(() => Math.round(effectsVolume * 100));

function inputVolume(event: Event): number {
  const input = event.currentTarget as HTMLInputElement;
  return input.valueAsNumber;
}

function handleDialogKeydown(event: KeyboardEvent): void {
  if (["Escape", "Esc", "p", "P"].includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    emit("resume");
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = Array.from(
    dialog.value?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
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
  resumeButton.value?.focus();
});
</script>

<template>
  <section
    ref="dialog"
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

    <div class="audio-settings">
      <div class="volume-setting">
        <div class="setting-label">
          <label for="music-volume">音乐音量</label>
          <output for="music-volume">{{ musicPercent }}%</output>
        </div>
        <div class="volume-control">
          <button
            type="button"
            class="mute-command"
            :aria-label="musicMuted ? '开启音乐' : '关闭音乐'"
            :title="musicMuted ? '开启音乐' : '关闭音乐'"
            :aria-pressed="musicMuted"
            @click="emit('toggleMusicMute')"
          >
            <VolumeX v-if="musicMuted" :size="21" aria-hidden="true" />
            <Volume2 v-else :size="21" aria-hidden="true" />
          </button>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="musicVolume"
            aria-label="音乐音量"
            @input="emit('musicVolumeChange', inputVolume($event))"
            @keydown.stop="handleDialogKeydown"
          />
        </div>
      </div>

      <div class="volume-setting">
        <div class="setting-label">
          <label for="effects-volume">音效音量</label>
          <output for="effects-volume">{{ effectsPercent }}%</output>
        </div>
        <div class="volume-control">
          <button
            type="button"
            class="mute-command"
            :aria-label="effectsMuted ? '开启音效' : '关闭音效'"
            :title="effectsMuted ? '开启音效' : '关闭音效'"
            :aria-pressed="effectsMuted"
            @click="emit('toggleEffectsMute')"
          >
            <VolumeX v-if="effectsMuted" :size="21" aria-hidden="true" />
            <Volume2 v-else :size="21" aria-hidden="true" />
          </button>
          <input
            id="effects-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="effectsVolume"
            aria-label="音效音量"
            @input="emit('effectsVolumeChange', inputVolume($event))"
            @keydown.stop="handleDialogKeydown"
          />
        </div>
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
  position: relative;
  width: min(380px, 100%);
  max-height: calc(100dvh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  padding: 22px;
  color: var(--ink);
  overflow-y: auto;
  text-align: left;
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: 6px;
  box-shadow: 7px 8px 0 rgba(13, 29, 32, 0.78);
}

.pause-dialog::after {
  position: absolute;
  inset: 4px;
  pointer-events: none;
  content: "";
  border: 1px solid rgba(23, 44, 47, 0.28);
  border-radius: 2px;
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
  border: 2px solid var(--ink);
  border-radius: 5px;
  box-shadow: 2px 3px 0 rgba(23, 44, 47, 0.24);
}

.dialog-header p {
  margin: 0 0 3px;
  color: var(--coral);
  font-size: 9px;
  font-weight: 900;
}

.dialog-header h2 {
  margin: 0;
  font-family: "STKaiti", "KaiTi", "FangSong", serif;
  font-size: 25px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0;
}

.audio-settings {
  margin: 20px 0;
  border-top: 2px solid var(--line);
  border-bottom: 2px solid var(--line);
}

.volume-setting {
  padding: 14px 0;
}

.volume-setting + .volume-setting {
  border-top: 1px solid var(--line);
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
  border: 2px solid var(--ink);
  border-radius: 5px;
  box-shadow: 2px 3px 0 rgba(23, 44, 47, 0.2);
  touch-action: manipulation;
}

.mute-command[aria-pressed="true"] {
  color: var(--surface);
  background: var(--coral);
}

input[type="range"] {
  appearance: none;
  width: 100%;
  min-width: 0;
  height: 46px;
  margin: 0;
  color: var(--teal-deep);
  background: transparent;
  cursor: pointer;
  touch-action: pan-x;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 8px;
  background: var(--paper-strong);
  border: 2px solid var(--ink);
  border-radius: 4px;
}

input[type="range"]::-webkit-slider-thumb {
  width: 22px;
  height: 22px;
  margin-top: -9px;
  appearance: none;
  background: var(--teal);
  border: 2px solid var(--ink);
  border-radius: 50%;
}

input[type="range"]::-moz-range-track {
  height: 5px;
  background: var(--paper-strong);
  border: 2px solid var(--ink);
  border-radius: 4px;
}

input[type="range"]::-moz-range-progress {
  height: 5px;
  background: var(--teal);
  border-radius: 4px;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--teal);
  border: 2px solid var(--ink);
  border-radius: 50%;
}

input[type="range"]:focus-visible {
  outline: 3px solid var(--amber);
  outline-offset: 2px;
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
  border-radius: 5px;
  box-shadow: 2px 3px 0 rgba(23, 44, 47, 0.24);
  touch-action: manipulation;
}

.dialog-command.primary-command {
  color: var(--ink);
  background: var(--teal);
  border: 2px solid var(--ink);
}

.end-command {
  color: var(--coral);
  background: var(--surface);
  border: 2px solid var(--coral);
}

.dialog-command:active,
.mute-command:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

@media (max-width: 430px), (max-height: 470px) {
  .pause-dialog {
    padding: 16px;
  }

  .audio-settings {
    margin: 14px 0;
  }

  .volume-setting {
    padding: 10px 0;
  }
}

@media (max-width: 340px) {
  .dialog-actions {
    grid-template-columns: 1fr;
  }
}
</style>
