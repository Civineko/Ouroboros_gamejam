<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import { OUROBOROS_UI_ART } from "../ui/uiArtCatalog";

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
    <h2 id="pause-title" class="visually-hidden">游戏已暂停</h2>
    <img
      class="pause-art"
      :src="OUROBOROS_UI_ART.pauseControls"
      alt=""
      aria-hidden="true"
      draggable="false"
    />

    <button
      type="button"
      class="mute-command music-mute"
      :aria-label="musicMuted ? '开启音乐' : '关闭音乐'"
      :title="musicMuted ? '开启音乐' : '关闭音乐'"
      :aria-pressed="musicMuted"
      @click="emit('toggleMusicMute')"
    >
      <span class="visually-hidden">{{ musicMuted ? "开启音乐" : "关闭音乐" }}</span>
    </button>
    <output class="visually-hidden" for="music-volume">{{ musicPercent }}%</output>
    <input
      id="music-volume"
      class="volume-range music-range"
      type="range"
      min="0"
      max="1"
      step="0.05"
      :value="musicVolume"
      :style="{ '--volume': `${musicPercent}%` }"
      aria-label="音乐音量"
      @input="emit('musicVolumeChange', inputVolume($event))"
      @keydown.stop="handleDialogKeydown"
    />

    <button
      type="button"
      class="mute-command effects-mute"
      :aria-label="effectsMuted ? '开启音效' : '关闭音效'"
      :title="effectsMuted ? '开启音效' : '关闭音效'"
      :aria-pressed="effectsMuted"
      @click="emit('toggleEffectsMute')"
    >
      <span class="visually-hidden">{{ effectsMuted ? "开启音效" : "关闭音效" }}</span>
    </button>
    <output class="visually-hidden" for="effects-volume">{{ effectsPercent }}%</output>
    <input
      id="effects-volume"
      class="volume-range effects-range"
      type="range"
      min="0"
      max="1"
      step="0.05"
      :value="effectsVolume"
      :style="{ '--volume': `${effectsPercent}%` }"
      aria-label="音效音量"
      @input="emit('effectsVolumeChange', inputVolume($event))"
      @keydown.stop="handleDialogKeydown"
    />

    <button
      ref="resumeButton"
      type="button"
      class="dialog-command resume-command"
      @click="emit('resume')"
    >
      <span class="visually-hidden">继续游戏</span>
    </button>
    <button
      type="button"
      class="dialog-command end-command"
      @click="emit('end')"
    >
      <span class="visually-hidden">结束游戏</span>
    </button>
  </section>
</template>

<style scoped>
.pause-dialog {
  position: relative;
  width: min(
    740px,
    calc(100vw - max(16px, env(safe-area-inset-left)) - max(16px, env(safe-area-inset-right))),
    calc((100dvh - max(16px, env(safe-area-inset-top)) - max(16px, env(safe-area-inset-bottom))) * 1.9577)
  );
  aspect-ratio: 740 / 378;
  overflow: visible;
  isolation: isolate;
  background: transparent;
  border: 0;
}

.pause-art {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  object-fit: contain;
}

.mute-command,
.dialog-command,
.volume-range {
  position: absolute;
  z-index: 1;
}

.mute-command,
.dialog-command {
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 12px;
  touch-action: manipulation;
  transition:
    background-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.mute-command:hover,
.dialog-command:hover {
  background: rgba(255, 248, 190, 0.1);
  box-shadow: inset 0 0 0 3px rgba(245, 218, 112, 0.56);
}

.mute-command:focus-visible,
.dialog-command:focus-visible,
.volume-range:focus-visible {
  outline: 4px solid #f5da70;
  outline-offset: 3px;
}

.music-mute {
  top: 3%;
  left: 2%;
  width: 41%;
  height: 26%;
}

.effects-mute {
  top: 37%;
  left: 2%;
  width: 41%;
  height: 26%;
}

.mute-command[aria-pressed="true"]::after {
  position: absolute;
  top: 50%;
  left: 22%;
  width: 56%;
  height: 5px;
  content: "";
  background: #f5da70;
  border: 2px solid #343184;
  border-radius: 3px;
  box-shadow: 0 0 7px rgba(245, 218, 112, 0.68);
  transform: translateY(-50%) rotate(-12deg);
}

.volume-range {
  left: 57%;
  width: 27%;
  min-width: 0;
  height: 14%;
  min-height: 44px;
  padding: 0;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  touch-action: pan-x;
}

.music-range {
  top: 10%;
}

.effects-range {
  top: 43.5%;
}

.volume-range::-webkit-slider-runnable-track {
  height: 6px;
  background: linear-gradient(
    to right,
    rgba(34, 214, 220, 0.78) 0 var(--volume),
    transparent var(--volume) 100%
  );
  border: 0;
  border-radius: 3px;
}

.volume-range::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
  margin-top: -9px;
  appearance: none;
  background: #f5da70;
  border: 3px solid #343184;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(34, 214, 220, 0.7);
}

.volume-range::-moz-range-track {
  height: 6px;
  background: transparent;
  border: 0;
  border-radius: 3px;
}

.volume-range::-moz-range-progress {
  height: 6px;
  background: rgba(34, 214, 220, 0.78);
  border-radius: 3px;
}

.volume-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #f5da70;
  border: 3px solid #343184;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(34, 214, 220, 0.7);
}

.dialog-command {
  top: 75%;
  height: 21%;
  min-height: 44px;
}

.resume-command {
  left: 3%;
  width: 39%;
}

.end-command {
  left: 51%;
  width: 45%;
}

.dialog-command:active,
.mute-command:active {
  background: rgba(34, 214, 220, 0.14);
  box-shadow: inset 0 0 0 3px rgba(34, 214, 220, 0.72);
  transform: scale(0.97);
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

@media (max-width: 500px) {
  .mute-command,
  .dialog-command {
    border-radius: 7px;
  }

  .volume-range::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
    margin-top: -9px;
  }

  .volume-range::-moz-range-thumb {
    width: 22px;
    height: 22px;
  }
}
</style>
