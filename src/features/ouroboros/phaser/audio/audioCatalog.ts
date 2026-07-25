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
