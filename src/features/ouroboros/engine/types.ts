export interface Point {
  x: number;
  y: number;
}

export type EnemyKind = "stationary" | "wanderer" | "tracker";
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

export type BossPhase = 1 | 2 | 3;
export type BossAction =
  | "appearing"
  | "stalking"
  | "telegraphing"
  | "charging"
  | "recovering";

export interface BossCore extends Point {
  radius: number;
  exposed: boolean;
  cooldown: number;
  orbitAngle: number;
}

export interface BossHazard extends Point {
  id: number;
  radius: number;
  ttl: number;
}

export interface BossState extends Point {
  kind: "devourer";
  name: string;
  radius: number;
  armor: number;
  maxArmor: number;
  phase: BossPhase;
  action: BossAction;
  actionClock: number;
  heading: number;
  target: Point;
  velocityX: number;
  velocityY: number;
  core: BossCore;
  hazards: BossHazard[];
  nextHazardId: number;
  hazardClock: number;
  summonClock: number;
  absorbedEnemies: Point[];
  phaseFlash: number;
  hitFlash: number;
}

export interface BossDefeatEffect extends Point {
  name: string;
  reward: number;
  remaining: number;
  duration: number;
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
  boss: BossState | null;
  bossDefeated: boolean;
  bossDefeatEffect: BossDefeatEffect | null;
  /** 当前关卡（基于时间推进） */
  level: number;
  /** 全局速度倍率，影响一切速度 */
  globalSpeed: number;
  /** 关卡计时器（秒） */
  levelClock: number;
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
  boss: BossSnapshot | null;
  bossDefeat: BossDefeatSnapshot | null;
}

export interface BossSnapshot {
  name: string;
  armor: number;
  maxArmor: number;
  phase: BossPhase;
  coreExposed: boolean;
  action: BossAction;
}

export interface BossDefeatSnapshot {
  name: string;
  reward: number;
  remaining: number;
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
  | { type: "boss-spawned"; name: string; armor: number }
  | { type: "boss-charge" }
  | { type: "boss-hit"; damage: number; armor: number }
  | { type: "boss-defeated"; name: string; reward: number };

export type CardinalDirection = "up" | "down" | "left" | "right";

export type RandomSource = () => number;
