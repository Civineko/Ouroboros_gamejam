import type { BossPhase } from "../types";

export const DEVOURER_NAME = "噬环者";
export const DEVOURER_MAX_ARMOR = 6;
export const DEVOURER_RADIUS = 46;
export const DEVOURER_CORE_RADIUS = 15;
export const DEVOURER_CORE_ORBIT_RADIUS = 155;
export const DEVOURER_CORE_RECOVERY = 1.8;
export const DEVOURER_MAX_MINIONS = 6;
export const DEVOURER_ENTRANCE_SECONDS = 1.6;
export const DEVOURER_SCORE_REWARD = 5;
export const DEVOURER_BODY_REWARD = 120;
export const DEVOURER_DEFEAT_EFFECT_SECONDS = 2.2;

export function devourerPhaseForArmor(armor: number): BossPhase {
  if (armor >= 5) return 1;
  if (armor >= 3) return 2;
  return 3;
}

export function devourerStalkDuration(phase: BossPhase): number {
  return phase === 1 ? 3.2 : phase === 2 ? 2.6 : 2;
}

export function devourerSummonInterval(phase: BossPhase): number {
  return phase === 1 ? 8 : phase === 2 ? 6.5 : 5;
}

export function devourerChargeSpeed(phase: BossPhase): number {
  return phase === 1 ? 300 : phase === 2 ? 360 : 420;
}
