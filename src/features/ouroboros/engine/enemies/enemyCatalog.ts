import type { EnemyKind } from "../types";

export interface EnemyDefinition {
  kind: EnemyKind;
  color: string;
  speedMultiplier: number;
  moves: boolean;
}

export const ENEMY_KINDS = ["stationary", "wanderer", "tracker", "shooter"] as const;

export const ENEMY_DEFINITIONS: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  stationary: {
    kind: "stationary",
    color: "#ff624e",
    speedMultiplier: 0,
    moves: false,
  },
  wanderer: {
    kind: "wanderer",
    color: "#f3b849",
    speedMultiplier: 0.82,
    moves: true,
  },
  tracker: {
    kind: "tracker",
    color: "#8fd0c1",
    speedMultiplier: 1,
    moves: true,
  },
  shooter: {
    kind: "shooter",
    color: "#d4a0e7",
    speedMultiplier: 0,
    moves: false,
  },
};

export function enemyKindForId(id: number): EnemyKind {
  return ENEMY_KINDS[id % ENEMY_KINDS.length] ?? "tracker";
}

export function enemyMoves(kind: EnemyKind): boolean {
  return ENEMY_DEFINITIONS[kind].moves;
}
