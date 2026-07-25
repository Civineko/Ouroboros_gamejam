export const WORLD_WIDTH = 1440;
export const WORLD_HEIGHT = 900;
export const MAX_FRAME_DELTA = 0.034;
export const INITIAL_BODY_LENGTH = 245 * 2;
export const INITIAL_BODY_POINTS = 108;
export const MAX_LIVES = 3;
export const INITIAL_LIVES = MAX_LIVES;
export const MAX_ENEMIES = 14;

/** 首次 Boss 战的净化积分门槛。 */
export const BOSS_SCORE_THRESHOLD = 15;

export const BODY_WIDTH = 22;
export const HEAD_RADIUS = 17;
export const TAIL_RADIUS = 13;

/** 每关持续时间（秒） */
export const LEVEL_INTERVAL = 30;

/** 初始全局速度倍率 */
export const INITIAL_GLOBAL_SPEED = 1.0;

/** 每关全局速度增幅 */
export const GLOBAL_SPEED_INCREMENT = 0.1;

/** 10 种关卡背景色，每 10 关循环 */
export const LEVEL_COLORS: readonly string[] = [
  "#48678f",
  "#2d6a4f",
  "#6b3a5b",
  "#1e6091",
  "#9c6644",
  "#4a4e69",
  "#52796f",
  "#8b5a2b",
  "#5c4a7a",
  "#2c3e50",
];

/** 根据关卡编号获取对应的背景色 */
export function levelColor(level: number): string {
  return LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length]!;
}

/** 射手敌人射击间隔最小值（秒） */
export const SHOOTER_FIRE_INTERVAL_MIN = 2.0;

/** 射手敌人射击间隔最大值（秒） */
export const SHOOTER_FIRE_INTERVAL_MAX = 3.5;

/** 子弹速度（像素/秒） */
export const BULLET_SPEED = 180;

/** 子弹半径 */
export const BULLET_RADIUS = 8;

/** 被子弹命中减少的蛇身长度（圈住一个敌人收益的两倍） */
export const BULLET_HIT_LENGTH_PENALTY = 62;
