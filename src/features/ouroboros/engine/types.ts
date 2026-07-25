export interface Point {
  x: number;
  y: number;
}

export type EnemyKind = "stationary" | "wanderer" | "tracker" | "shooter";
export type PowerUpKind =
  | "shield"
  | "heal"
  | "stasis"
  | "haste"
  | "resonance";
export type TimedPowerUpKind = Extract<
  PowerUpKind,
  "stasis" | "haste" | "resonance"
>;

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

export interface PowerUp extends Point {
  id: number;
  kind: PowerUpKind;
  radius: number;
  ttl: number;
  phase: number;
}

export interface ActiveEffect {
  kind: TimedPowerUpKind;
  remaining: number;
}

export interface Bullet extends Point {
  id: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  shooterId: number;
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
  tutorialComplete: boolean;
  powerUps: PowerUp[];
  activeEffects: ActiveEffect[];
  shieldCharges: number;
  powerUpSpawnClock: number;
  nextPowerUpId: number;
  /** 当前关卡（基于时间推进） */
  level: number;
  /** 全局速度倍率，影响一切速度 */
  globalSpeed: number;
  /** 关卡计时器（秒） */
  levelClock: number;
  /** 子弹列表 */
  bullets: Bullet[];
  /** 下一个子弹 ID */
  nextBulletId: number;
  /** 被子弹命中的红色闪烁计时器 */
  bulletHitFlash: number;
  /** 尾部缩减红色闪烁计时器 */
  tailShrinkFlash: number;
}

export interface BuffSnapshot {
  kind: PowerUpKind;
  label: string;
  remaining: number | null;
}

export interface HudSnapshot {
  kills: number;
  lives: number;
  length: number;
  level: number;
  enemyLimit: number;
  nextGrowth: number;
  message: string;
  buffs: readonly BuffSnapshot[];
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
  | { type: "game-over" }
  | { type: "power-up-collected"; kind: PowerUpKind }
  | { type: "shield-blocked" }
  | { type: "level-up"; level: number }
  | { type: "bullet-hit" };

export type CardinalDirection = "up" | "down" | "left" | "right";

export type RandomSource = () => number;
