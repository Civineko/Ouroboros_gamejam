import type { PowerUpKind } from "../../engine/types";

const AUDIO_ROOT = "assets/ouroboros/audio";

export const OUROBOROS_AUDIO_KEYS = {
  bossBattleMusic: "ouroboros.audio.music.boss-battle",
  bossCharge: "ouroboros.audio.sfx.boss-charge",
  bossSpawn: "ouroboros.audio.sfx.boss-spawn",
  bossCoreHit: "ouroboros.audio.sfx.boss-core-hit",
  bossDefeated: "ouroboros.audio.sfx.boss-defeated",
} as const;

export type OuroborosAudioKey =
  (typeof OUROBOROS_AUDIO_KEYS)[keyof typeof OUROBOROS_AUDIO_KEYS];

export interface OuroborosAudioAsset {
  key: OuroborosAudioKey;
  path: string;
  category: "music" | "sfx";
  status: "ready";
  volume: number;
  loop: boolean;
}

export const OUROBOROS_AUDIO_ASSETS: readonly OuroborosAudioAsset[] = [
  {
    key: OUROBOROS_AUDIO_KEYS.bossBattleMusic,
    path: `${AUDIO_ROOT}/music/bgm_boss_devourer.mp3`,
    category: "music",
    status: "ready",
    volume: 0.56,
    loop: true,
  },
  {
    key: OUROBOROS_AUDIO_KEYS.bossCharge,
    path: `${AUDIO_ROOT}/sfx/gameplay/sfx_boss_charge.mp3`,
    category: "sfx",
    status: "ready",
    volume: 0.3,
    loop: false,
  },
  {
    key: OUROBOROS_AUDIO_KEYS.bossSpawn,
    path: `${AUDIO_ROOT}/sfx/gameplay/sfx_boss_spawn.wav`,
    category: "sfx",
    status: "ready",
    volume: 0.68,
    loop: false,
  },
  {
    key: OUROBOROS_AUDIO_KEYS.bossCoreHit,
    path: `${AUDIO_ROOT}/sfx/gameplay/sfx_boss_core_hit.wav`,
    category: "sfx",
    status: "ready",
    volume: 0.76,
    loop: false,
  },
  {
    key: OUROBOROS_AUDIO_KEYS.bossDefeated,
    path: `${AUDIO_ROOT}/sfx/gameplay/stinger_boss_defeated.wav`,
    category: "sfx",
    status: "ready",
    volume: 0.72,
    loop: false,
  },
];

export function audioAssetFor(key: OuroborosAudioKey): OuroborosAudioAsset {
  const asset = OUROBOROS_AUDIO_ASSETS.find((candidate) => candidate.key === key);
  if (!asset) throw new Error(`Missing Ouroboros audio asset: ${key}`);
  return asset;
}

export type AudioCue =
  | "ui-click"
  | "round-start"
  | "round-restart"
  | "pause"
  | "resume"
  | "capture"
  | "hit"
  | "empty-loop"
  | "shield-blocked"
  | "powerup-shield"
  | "powerup-heal"
  | "powerup-stasis"
  | "powerup-haste"
  | "game-over";

export interface AudioCueDefinition {
  category: "effects";
  gain: number;
  status: "procedural";
}

export const AUDIO_CUE_CATALOG: Readonly<Record<AudioCue, AudioCueDefinition>> =
  Object.freeze({
    "ui-click": { category: "effects", gain: 0.28, status: "procedural" },
    "round-start": { category: "effects", gain: 0.4, status: "procedural" },
    "round-restart": { category: "effects", gain: 0.42, status: "procedural" },
    pause: { category: "effects", gain: 0.34, status: "procedural" },
    resume: { category: "effects", gain: 0.36, status: "procedural" },
    capture: { category: "effects", gain: 0.52, status: "procedural" },
    hit: { category: "effects", gain: 0.5, status: "procedural" },
    "empty-loop": { category: "effects", gain: 0.28, status: "procedural" },
    "shield-blocked": { category: "effects", gain: 0.46, status: "procedural" },
    "powerup-shield": { category: "effects", gain: 0.4, status: "procedural" },
    "powerup-heal": { category: "effects", gain: 0.4, status: "procedural" },
    "powerup-stasis": { category: "effects", gain: 0.4, status: "procedural" },
    "powerup-haste": { category: "effects", gain: 0.4, status: "procedural" },
    "game-over": { category: "effects", gain: 0.48, status: "procedural" },
  });

export const PROCEDURAL_MUSIC_GAIN = 0.17;

export function cueForPowerUp(kind: PowerUpKind): AudioCue {
  return `powerup-${kind}`;
}
