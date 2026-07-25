export interface Point {
  x: number;
  y: number;
}

export type EnemyKind = "stationary" | "wanderer" | "tracker";

export interface Enemy extends Point {
  id: number;
  kind: EnemyKind;
  speed: number;
  size: number;
  color: string;
  phase: number;
  velocityX: number;
  velocityY: number;
  heading: number;
  behaviorClock: number;
  collisionRecovery: number;
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

export interface CollisionContact {
  normalX: number;
  normalY: number;
  penetration: number;
}

export interface CollisionSystem {
  circleToCircle: (
    first: Point,
    firstRadius: number,
    second: Point,
    secondRadius: number,
  ) => CollisionContact | null;
  circleToSegment: (
    circle: Point,
    circleRadius: number,
    segmentStart: Point,
    segmentEnd: Point,
    segmentRadius: number,
  ) => CollisionContact | null;
  containsPoint: (polygon: readonly Point[], point: Point) => boolean;
}

export type GameEvent =
  | { type: "hit"; lives: number }
  | { type: "capture"; count: number; totalKills: number }
  | { type: "empty-loop" }
  | { type: "game-over" };

export type CardinalDirection = "up" | "down" | "left" | "right";

export type RandomSource = () => number;
