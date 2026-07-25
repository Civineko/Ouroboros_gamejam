import type { BossAction } from "../engine/types";

export const DEVOURER_ACTION_FRAMES = {
  idle: 0,
  huntA: 1,
  huntB: 2,
  telegraph: 3,
  charge: 4,
  stagger: 5,
  hit: 6,
} as const;

const HUNT_FRAMES_PER_SECOND = 6;

export function devourerActionFrame(
  action: BossAction,
  elapsed: number,
  hitFlash: number,
): number {
  if (hitFlash > 0) return DEVOURER_ACTION_FRAMES.hit;

  if (action === "stalking") {
    return Math.floor(elapsed * HUNT_FRAMES_PER_SECOND) % 2 === 0
      ? DEVOURER_ACTION_FRAMES.huntA
      : DEVOURER_ACTION_FRAMES.huntB;
  }

  if (action === "telegraphing") return DEVOURER_ACTION_FRAMES.telegraph;
  if (action === "charging") return DEVOURER_ACTION_FRAMES.charge;
  if (action === "recovering") return DEVOURER_ACTION_FRAMES.stagger;
  return DEVOURER_ACTION_FRAMES.idle;
}
