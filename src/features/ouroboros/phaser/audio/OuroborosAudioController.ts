import { clampVolume } from "../../audio/audioPreferences";
import {
  AUDIO_CUE_CATALOG,
  PROCEDURAL_MUSIC_GAIN,
  type AudioCue,
} from "./audioCatalog";

interface AudioContextGlobal {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

type AudioContextFactory = () => AudioContext | null;

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  duration: number;
  delay?: number;
  type?: OscillatorType;
  gain: number;
}

const MINIMUM_GAIN = 0.0001;

function createBrowserAudioContext(): AudioContext | null {
  const audioGlobal = globalThis as typeof globalThis & AudioContextGlobal;
  const AudioContextConstructor =
    audioGlobal.AudioContext ?? audioGlobal.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    return new AudioContextConstructor();
  } catch {
    return null;
  }
}

export class OuroborosAudioController {
  private context: AudioContext | null = null;
  private musicOutput: GainNode | null = null;
  private effectsOutput: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicGraphNodes: AudioNode[] = [];
  private musicVolume = 0.45;
  private effectsVolume = 0.8;
  private musicRequested = false;
  private musicPaused = true;
  private resumePromise: Promise<void> | null = null;
  private pendingCues: AudioCue[] = [];

  constructor(
    private readonly contextFactory: AudioContextFactory =
      createBrowserAudioContext,
  ) {}

  setMusicVolume(volume: number): void {
    this.musicVolume = clampVolume(volume, this.musicVolume);
    this.applyMusicGain(0.04);
  }

  setEffectsVolume(volume: number): void {
    this.effectsVolume = clampVolume(volume, this.effectsVolume);
    if (!this.effectsOutput || !this.context) return;

    const now = this.context.currentTime;
    this.effectsOutput.gain.cancelScheduledValues(now);
    this.effectsOutput.gain.setTargetAtTime(
      this.effectsVolume,
      now,
      0.015,
    );
  }

  unlock(): void {
    const context = this.ensureContext();
    if (!context || context.state === "closed") return;
    if (context.state === "running") {
      this.handleContextRunning(context);
      return;
    }
    if (this.resumePromise) return;

    this.resumePromise = context
      .resume()
      .then(() => {
        if (this.context === context && context.state === "running") {
          this.handleContextRunning(context);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        this.resumePromise = null;
      });
  }

  startMusic(): void {
    this.musicRequested = true;
    this.musicPaused = false;
    const context = this.ensureContext();
    if (!context) return;

    if (context.state !== "running") {
      this.unlock();
      return;
    }

    this.ensureMusicVoices(context);
    this.applyMusicGain(0.18);
  }

  pauseMusic(): void {
    this.musicPaused = true;
    this.applyMusicGain(0.08);
  }

  resumeMusic(): void {
    if (!this.musicRequested) return;
    this.musicPaused = false;
    const context = this.ensureContext();
    if (!context) return;
    if (context.state !== "running") {
      this.unlock();
      return;
    }

    this.ensureMusicVoices(context);
    this.applyMusicGain(0.12);
  }

  stopMusic(): void {
    this.musicRequested = false;
    this.musicPaused = true;
    this.applyMusicGain(0.08);

    const nodes = this.musicNodes;
    const graphNodes = this.musicGraphNodes;
    this.musicNodes = [];
    this.musicGraphNodes = [];
    globalThis.setTimeout(() => {
      for (const node of nodes) {
        try {
          node.stop();
        } catch {
          // A stopped oscillator cannot be stopped twice.
        }
        node.disconnect();
      }
      for (const node of graphNodes) node.disconnect();
    }, 120);
  }

  play(cue: AudioCue): void {
    if (this.effectsVolume <= 0) return;
    const context = this.ensureContext();
    if (!context) return;

    if (context.state !== "running") {
      this.pendingCues.push(cue);
      this.unlock();
      return;
    }

    this.playRunningCue(cue);
  }

  private playRunningCue(cue: AudioCue): void {
    const cueGain = AUDIO_CUE_CATALOG[cue].gain;

    switch (cue) {
      case "ui-click":
        this.tone({ frequency: 720, endFrequency: 540, duration: 0.055, type: "square", gain: cueGain });
        break;
      case "round-start":
        this.chime([330, 495, 660], 0.055, 0.18, cueGain);
        break;
      case "round-restart":
        this.chime([420, 560, 760], 0.05, 0.2, cueGain);
        break;
      case "pause":
        this.tone({ frequency: 280, endFrequency: 165, duration: 0.16, type: "triangle", gain: cueGain });
        break;
      case "resume":
        this.chime([260, 390], 0.06, 0.17, cueGain);
        break;
      case "capture":
        this.chime([440, 660, 880], 0.07, 0.32, cueGain);
        break;
      case "hit":
        this.tone({ frequency: 190, endFrequency: 68, duration: 0.3, type: "sawtooth", gain: cueGain });
        this.noise(0.2, cueGain * 0.55, 620);
        break;
      case "empty-loop":
        this.tone({ frequency: 240, endFrequency: 185, duration: 0.2, type: "sine", gain: cueGain });
        break;
      case "shield-blocked":
        this.chime([520, 780], 0.035, 0.24, cueGain);
        this.noise(0.12, cueGain * 0.25, 1800);
        break;
      case "powerup-shield":
        this.chime([390, 585], 0.055, 0.24, cueGain);
        break;
      case "powerup-heal":
        this.chime([440, 554, 659], 0.045, 0.25, cueGain);
        break;
      case "powerup-stasis":
        this.chime([620, 465], 0.065, 0.28, cueGain);
        break;
      case "powerup-haste":
        this.chime([520, 780, 1040], 0.03, 0.2, cueGain);
        break;
      case "powerup-resonance":
        this.chime([330, 495, 742], 0.055, 0.32, cueGain);
        break;
      case "game-over":
        this.chime([330, 247, 165], 0.13, 0.48, cueGain);
        break;
    }
  }

  destroy(): void {
    this.stopMusic();
    this.pendingCues = [];
    this.resumePromise = null;
    const context = this.context;
    this.context = null;
    this.musicOutput = null;
    this.effectsOutput = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;

    try {
      const context = this.contextFactory();
      if (!context) return null;
      const musicOutput = context.createGain();
      const effectsOutput = context.createGain();
      musicOutput.gain.value = MINIMUM_GAIN;
      effectsOutput.gain.value = this.effectsVolume;
      musicOutput.connect(context.destination);
      effectsOutput.connect(context.destination);
      this.context = context;
      this.musicOutput = musicOutput;
      this.effectsOutput = effectsOutput;
      return context;
    } catch {
      return null;
    }
  }

  private handleContextRunning(context: AudioContext): void {
    if (this.musicRequested && !this.musicPaused) {
      this.ensureMusicVoices(context);
      this.applyMusicGain(0.18);
    }

    const queuedCues = this.pendingCues;
    this.pendingCues = [];
    for (const cue of queuedCues) this.playRunningCue(cue);
  }

  private ensureMusicVoices(context: AudioContext): void {
    if (this.musicNodes.length === 0) this.createMusicVoices(context);
  }

  private createMusicVoices(context: AudioContext): void {
    if (!this.musicOutput) return;

    const mix = context.createGain();
    mix.gain.value = PROCEDURAL_MUSIC_GAIN;
    mix.connect(this.musicOutput);
    this.musicGraphNodes.push(mix);

    for (const [frequency, type, gainValue] of [
      [110, "sine", 0.7],
      [164.81, "triangle", 0.26],
    ] as const) {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      voiceGain.gain.value = gainValue;
      oscillator.connect(voiceGain);
      voiceGain.connect(mix);
      oscillator.start();
      this.musicNodes.push(oscillator);
      this.musicGraphNodes.push(voiceGain);
    }

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.11;
    lfoGain.gain.value = 0.028;
    lfo.connect(lfoGain);
    lfoGain.connect(mix.gain);
    lfo.start();
    this.musicNodes.push(lfo);
    this.musicGraphNodes.push(lfoGain);
  }

  private applyMusicGain(rampDuration: number): void {
    if (!this.context || !this.musicOutput) return;

    const target =
      this.musicRequested && !this.musicPaused
        ? Math.max(MINIMUM_GAIN, this.musicVolume)
        : MINIMUM_GAIN;
    const now = this.context.currentTime;
    const gain = this.musicOutput.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(MINIMUM_GAIN, gain.value), now);
    gain.exponentialRampToValueAtTime(
      target,
      now + Math.max(0.01, rampDuration),
    );
  }

  private chime(
    frequencies: readonly number[],
    spacing: number,
    duration: number,
    gain: number,
  ): void {
    frequencies.forEach((frequency, index) => {
      this.tone({
        frequency,
        endFrequency: frequency * 1.015,
        duration,
        delay: index * spacing,
        type: "triangle",
        gain: gain / Math.sqrt(frequencies.length),
      });
    });
  }

  private tone(options: ToneOptions): void {
    if (!this.context || !this.effectsOutput) return;

    const start = this.context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = options.type ?? "sine";
    oscillator.frequency.setValueAtTime(options.frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, options.endFrequency ?? options.frequency),
      end,
    );
    envelope.gain.setValueAtTime(MINIMUM_GAIN, start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(MINIMUM_GAIN, options.gain),
      start + Math.min(0.012, options.duration * 0.25),
    );
    envelope.gain.exponentialRampToValueAtTime(MINIMUM_GAIN, end);
    oscillator.connect(envelope);
    envelope.connect(this.effectsOutput);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      envelope.disconnect();
    }, { once: true });
  }

  private noise(duration: number, gainValue: number, cutoff: number): void {
    if (!this.context || !this.effectsOutput) return;

    const frameCount = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(
      1,
      frameCount,
      this.context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    const now = this.context.currentTime;
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(Math.max(MINIMUM_GAIN, gainValue), now);
    envelope.gain.exponentialRampToValueAtTime(
      MINIMUM_GAIN,
      now + duration,
    );
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.effectsOutput);
    source.start(now);
    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    }, { once: true });
  }
}
