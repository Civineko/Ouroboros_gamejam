<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from "vue";
import { LogOut, Music, Play, Volume2, VolumeX } from "@lucide/vue";

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
  return (event.currentTarget as HTMLInputElement).valueAsNumber;
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
    <div class="pause-content">
      <header class="pause-heading">
        <span>PAUSED</span>
        <h2 id="pause-title">游戏暂停</h2>
      </header>

      <div class="volume-list">
        <div class="volume-control">
          <button
            type="button"
            class="volume-label"
            :aria-label="musicMuted ? '开启音乐' : '关闭音乐'"
            :title="musicMuted ? '开启音乐' : '关闭音乐'"
            :aria-pressed="musicMuted"
            @click="emit('toggleMusicMute')"
          >
            <VolumeX v-if="musicMuted" :size="30" aria-hidden="true" />
            <Music v-else :size="30" aria-hidden="true" />
            <span>音乐</span>
          </button>
          <div class="range-shell">
            <input
              id="music-volume"
              class="volume-range"
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
            <output for="music-volume">{{ musicPercent }}%</output>
          </div>
        </div>

        <div class="volume-control">
          <button
            type="button"
            class="volume-label"
            :aria-label="effectsMuted ? '开启音效' : '关闭音效'"
            :title="effectsMuted ? '开启音效' : '关闭音效'"
            :aria-pressed="effectsMuted"
            @click="emit('toggleEffectsMute')"
          >
            <VolumeX v-if="effectsMuted" :size="30" aria-hidden="true" />
            <Volume2 v-else :size="30" aria-hidden="true" />
            <span>音效</span>
          </button>
          <div class="range-shell">
            <input
              id="effects-volume"
              class="volume-range"
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
            <output for="effects-volume">{{ effectsPercent }}%</output>
          </div>
        </div>
      </div>

      <div class="pause-actions">
        <button
          ref="resumeButton"
          type="button"
          class="dialog-command resume-command"
          @click="emit('resume')"
        >
          <Play :size="22" fill="currentColor" aria-hidden="true" />
          继续游戏
        </button>
        <button
          type="button"
          class="dialog-command end-command"
          @click="emit('end')"
        >
          <LogOut :size="22" aria-hidden="true" />
          退出游戏
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pause-dialog {
  position: relative;
  width: min(
    680px,
    calc(100vw - max(20px, env(safe-area-inset-left)) - max(20px, env(safe-area-inset-right)))
  );
  max-height: calc(
    100dvh - max(20px, env(safe-area-inset-top)) - max(20px, env(safe-area-inset-bottom))
  );
  padding: 7px;
  overflow: hidden auto;
  isolation: isolate;
  color: #f7f6ff;
  background: linear-gradient(145deg, #aaa6ef, #4d459d 52%, #8580dc);
  clip-path: polygon(7% 0, 93% 0, 100% 10%, 100% 90%, 93% 100%, 7% 100%, 0 90%, 0 10%);
  filter: drop-shadow(0 20px 30px rgba(3, 8, 32, 0.5));
}

.pause-content {
  position: relative;
  display: grid;
  gap: 22px;
  padding: 30px 36px 34px;
  background:
    radial-gradient(circle at 50% 0, rgba(30, 214, 223, 0.14), transparent 38%),
    linear-gradient(180deg, rgba(77, 69, 157, 0.96), rgba(23, 23, 82, 0.98));
  clip-path: polygon(6.5% 0, 93.5% 0, 100% 9%, 100% 91%, 93.5% 100%, 6.5% 100%, 0 91%, 0 9%);
}

.pause-content::before,
.pause-content::after {
  position: absolute;
  top: 23px;
  width: 42px;
  height: 3px;
  content: "";
  background: #1ed6df;
  box-shadow: 0 0 12px rgba(30, 214, 223, 0.9);
}

.pause-content::before {
  left: 22px;
  transform: rotate(-18deg);
}

.pause-content::after {
  right: 22px;
  transform: rotate(18deg);
}

.pause-heading {
  position: relative;
  text-align: center;
}

.pause-heading::after {
  display: block;
  width: min(300px, 68%);
  height: 3px;
  margin: 15px auto 0;
  content: "";
  background: linear-gradient(90deg, transparent, #1ed6df 24% 76%, transparent);
  box-shadow: 0 0 12px rgba(30, 214, 223, 0.55);
}

.pause-heading span {
  display: block;
  margin-bottom: 4px;
  color: #aaa6ef;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0;
}

.pause-heading h2 {
  margin: 0;
  color: #ffd66b;
  font-family: "Dymon ShouXieTi", "Kaiti SC", "PingFang SC", sans-serif;
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-shadow:
    0 3px 0 #4d459d,
    0 0 16px rgba(255, 214, 107, 0.26);
}

.volume-list {
  display: grid;
  gap: 14px;
}

.volume-control {
  display: grid;
  min-height: 92px;
  grid-template-columns: minmax(150px, 0.7fr) minmax(240px, 1.4fr);
  gap: 8px;
}

.volume-label,
.range-shell,
.dialog-command {
  position: relative;
  color: #f7f6ff;
  background: #4d459d;
  border: 4px solid #aaa6ef;
  clip-path: polygon(8% 0, 92% 0, 100% 18%, 100% 82%, 92% 100%, 8% 100%, 0 82%, 0 18%);
  box-shadow: inset 0 0 0 3px rgba(23, 23, 82, 0.5);
}

.volume-label {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 18px;
  color: #ffd66b;
  font-size: 23px;
  font-weight: 900;
  cursor: pointer;
  touch-action: manipulation;
}

.volume-label[aria-pressed="true"] {
  color: rgba(247, 246, 255, 0.55);
  background: #29275f;
}

.range-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  background: #29275f;
}

.range-shell output {
  color: #c9c7f8;
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.volume-range {
  width: 100%;
  min-width: 0;
  height: 44px;
  padding: 0;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  touch-action: pan-x;
}

.volume-range::-webkit-slider-runnable-track {
  height: 8px;
  background: linear-gradient(
    to right,
    #1ed6df 0 var(--volume),
    rgba(170, 166, 239, 0.25) var(--volume) 100%
  );
  border: 2px solid #aaa6ef;
  border-radius: 5px;
  box-shadow: 0 0 9px rgba(30, 214, 223, 0.42);
}

.volume-range::-webkit-slider-thumb {
  width: 28px;
  height: 28px;
  margin-top: -12px;
  appearance: none;
  background: #f7f6ff;
  border: 7px solid #1ed6df;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(30, 214, 223, 0.72);
}

.volume-range::-moz-range-track {
  height: 6px;
  background: rgba(170, 166, 239, 0.25);
  border: 2px solid #aaa6ef;
  border-radius: 5px;
}

.volume-range::-moz-range-progress {
  height: 6px;
  background: #1ed6df;
  border-radius: 5px;
}

.volume-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #f7f6ff;
  border: 7px solid #1ed6df;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(30, 214, 223, 0.72);
}

.pause-actions {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

.dialog-command {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 66px;
  padding: 0 20px;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.resume-command {
  color: #ffd66b;
  border-color: #1ed6df;
}

.volume-label:hover,
.dialog-command:hover {
  color: #ffd66b;
  background: #5c53b1;
  border-color: #1ed6df;
}

.volume-label:active,
.dialog-command:active {
  transform: translateY(2px) scale(0.985);
}

.volume-label:focus-visible,
.dialog-command:focus-visible,
.volume-range:focus-visible {
  outline: 4px solid #ffd66b;
  outline-offset: 3px;
}

@media (max-width: 620px) {
  .pause-content {
    gap: 16px;
    padding: 24px 22px 26px;
  }

  .volume-control {
    grid-template-columns: minmax(118px, 0.65fr) minmax(190px, 1.35fr);
  }

  .volume-label {
    gap: 7px;
    padding-inline: 10px;
    font-size: 19px;
  }

  .range-shell {
    grid-template-columns: minmax(0, 1fr) 42px;
    gap: 7px;
    padding-inline: 16px;
  }
}

@media (max-height: 520px) {
  .pause-dialog {
    width: min(650px, calc(100vw - 24px));
  }

  .pause-content {
    gap: 10px;
    padding: 14px 22px 16px;
  }

  .pause-heading span {
    display: none;
  }

  .pause-heading h2 {
    font-size: 30px;
  }

  .pause-heading::after {
    margin-top: 8px;
  }

  .volume-list {
    gap: 8px;
  }

  .volume-control {
    min-height: 64px;
  }

  .volume-label {
    font-size: 18px;
  }

  .dialog-command {
    min-height: 50px;
    font-size: 16px;
  }
}

@media (max-width: 430px) {
  .pause-dialog {
    clip-path: polygon(5% 0, 95% 0, 100% 6%, 100% 94%, 95% 100%, 5% 100%, 0 94%, 0 6%);
  }

  .pause-content {
    padding-inline: 16px;
    clip-path: polygon(4% 0, 96% 0, 100% 5%, 100% 95%, 96% 100%, 4% 100%, 0 95%, 0 5%);
  }

  .pause-heading h2 {
    font-size: 32px;
  }

  .volume-control {
    min-height: 72px;
    grid-template-columns: 105px minmax(0, 1fr);
  }

  .volume-label {
    font-size: 17px;
  }

  .volume-label svg {
    width: 24px;
    height: 24px;
  }

  .range-shell {
    grid-template-columns: minmax(0, 1fr) 36px;
    padding-inline: 12px;
  }

  .range-shell output {
    font-size: 11px;
  }

  .pause-actions {
    grid-template-columns: 1fr;
    gap: 9px;
  }
}
</style>
