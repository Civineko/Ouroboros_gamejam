export interface Point {
  x: number;
  y: number;
}

export interface Enemy extends Point {
  id: number;
  speed: number;
  size: number;
  color: string;
  phase: number;
}

export interface GameState {
  trail: Point[];
  angle: number;
  target: Point;
  steering: boolean;
  bodyLength: number;
  enemies: Enemy[];
  spawnClock: number;
  kills: number;
  lives: number;
  elapsed: number;
  closureCooldown: number;
  closureFlash: number;
  lastRing: Point[] | null;
  invulnerable: number;
  nextEnemyId: number;
  message: string;
}

export interface HudSnapshot {
  kills: number;
  lives: number;
  length: number;
  level: number;
  enemyLimit: number;
  nextGrowth: number;
  message: string;
}

export interface CollisionSystem {
  circlesOverlap: (
    first: Point,
    firstRadius: number,
    second: Point,
    secondRadius: number,
  ) => boolean;
  containsPoint: (polygon: readonly Point[], point: Point) => boolean;
}

export type GameEvent =
  | { type: "hit"; lives: number }
  | { type: "capture"; count: number; totalKills: number }
  | { type: "empty-loop" }
  | { type: "game-over" };

export type CardinalDirection = "up" | "down" | "left" | "right";

export type RandomSource = () => number;
