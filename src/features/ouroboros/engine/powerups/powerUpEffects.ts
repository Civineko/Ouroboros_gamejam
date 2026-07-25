import type {
  ActiveEffect,
  BuffSnapshot,
  GameState,
  PowerUpKind,
  TimedPowerUpKind,
} from "../types";
import { HEAD_RADIUS, MAX_LIVES, TAIL_RADIUS } from "../config";
import { POWER_UP_DEFINITIONS } from "./powerUpCatalog";

export const BASE_CLOSURE_DISTANCE = HEAD_RADIUS + TAIL_RADIUS + 4;
export const RESONANCE_CLOSURE_DISTANCE = BASE_CLOSURE_DISTANCE + 14;

export interface PowerUpModifiers {
  snakeSpeed: number;
  snakeTurn: number;
  enemySpeed: number;
  closureDistance: number;
}

function isTimedKind(kind: PowerUpKind): kind is TimedPowerUpKind {
  return kind === "stasis" || kind === "haste" || kind === "resonance";
}

function activateEffect(
  activeEffects: ActiveEffect[],
  kind: TimedPowerUpKind,
  duration: number,
): void {
  const active = activeEffects.find((effect) => effect.kind === kind);
  if (active) {
    active.remaining = duration;
  } else {
    activeEffects.push({ kind, remaining: duration });
  }
}

export function tickPowerUpEffects(game: GameState, delta: number): void {
  for (const effect of game.activeEffects) {
    effect.remaining = Math.max(0, effect.remaining - delta);
  }
  game.activeEffects = game.activeEffects.filter(
    (effect) => effect.remaining > 0,
  );
}

export function applyPowerUp(game: GameState, kind: PowerUpKind): void {
  const definition = POWER_UP_DEFINITIONS[kind];

  if (kind === "heal") {
    game.lives = Math.min(MAX_LIVES, game.lives + 1);
    game.message = "回生生效，恢复了 1 点生命";
    return;
  }

  if (kind === "shield") {
    game.shieldCharges = 1;
    game.message = "护环已就绪，可抵消下一次伤害";
    return;
  }

  if (isTimedKind(kind) && definition.duration !== null) {
    activateEffect(game.activeEffects, kind, definition.duration);
    game.message = `${definition.label}生效`;
  }
}

export function powerUpModifiers(game: GameState): PowerUpModifiers {
  const activeKinds = new Set(
    game.activeEffects.map((effect) => effect.kind),
  );
  return {
    snakeSpeed: activeKinds.has("haste") ? 1.18 : 1,
    snakeTurn: activeKinds.has("haste") ? 1.12 : 1,
    enemySpeed: activeKinds.has("stasis") ? 0.55 : 1,
    closureDistance: activeKinds.has("resonance")
      ? RESONANCE_CLOSURE_DISTANCE
      : BASE_CLOSURE_DISTANCE,
  };
}

export function snapshotBuffs(game: GameState): BuffSnapshot[] {
  const buffs: BuffSnapshot[] = game.activeEffects.map((effect) => ({
    kind: effect.kind,
    label: POWER_UP_DEFINITIONS[effect.kind].label,
    remaining: effect.remaining,
  }));

  if (game.shieldCharges > 0) {
    buffs.unshift({
      kind: "shield",
      label: POWER_UP_DEFINITIONS.shield.label,
      remaining: null,
    });
  }

  return buffs;
}
