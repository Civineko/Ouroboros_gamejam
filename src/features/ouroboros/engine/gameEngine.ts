import {
  GLOBAL_SPEED_INCREMENT,
  INITIAL_BODY_LENGTH,
  INITIAL_BODY_POINTS,
  INITIAL_GLOBAL_SPEED,
  INITIAL_LIVES,
  LEVEL_INTERVAL,
  MAX_ENEMIES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config";
import {
  angleDifference,
  distance,
  nativeCollisionSystem,
  polygonArea,
  trimTrailToLength,
} from "./geometry";
import {
  ENEMY_DEFINITIONS,
  enemyKindForId,
} from "./enemies/enemyCatalog";
import { resolveEnemySnakeCollisions } from "./enemies/enemyCollision";
import { updateEnemyMotion } from "./enemies/enemyMotion";
import {
  planEnemySpawn,
  type EnemySpawnPlan,
} from "./enemies/enemySpawn";
import {
  powerUpModifiers,
  snapshotBuffs,
  tickPowerUpEffects,
} from "./powerups/powerUpEffects";
import { nextPowerUpInterval } from "./powerups/powerUpSpawn";
import { updatePowerUps } from "./powerups/powerUpSystem";
import type {
  CardinalDirection,
  CollisionSystem,
  Enemy,
  GameEvent,
  GameState,
  HudSnapshot,
  Point,
  RandomSource,
} from "./types";

const TUTORIAL_MESSAGE = "首尾相接，圈住敌人";
const FIRST_WAVE_MESSAGE = "正式开始，三角敌人会追踪蛇头！";
const INITIAL_RING_RADIUS = 112 * (2 / 3);
const INITIAL_RING_GAP_ANGLE = 0.48;
const TUTORIAL_AUTO_SPEED = 32;

export function enemyLimitFor(kills: number): number {
  return Math.min(MAX_ENEMIES, 4 + Math.floor(kills / 3));
}

export function levelFor(kills: number): number {
  return 1 + Math.floor(kills / 5);
}

export function createEnemy(
  id: number,
  kills: number,
  random: RandomSource = Math.random,
  spawn?: EnemySpawnPlan,
): Enemy {
  const position = spawn?.position ?? createEdgeSpawnPosition(random);
  const kind = spawn?.kind ?? enemyKindForId(id);
  const definition = ENEMY_DEFINITIONS[kind];

  const baseSpeed = 34 + random() * 14 + Math.min(38, kills * 1.6);
  const size = 12 + random() * 5;
  const phase = random() * Math.PI * 2;
  const speed = baseSpeed * definition.speedMultiplier;

  return {
    ...position,
    id,
    kind,
    speed,
    size,
    color: definition.color,
    phase,
    velocityX: Math.cos(phase) * speed,
    velocityY: Math.sin(phase) * speed,
    heading: phase,
    behaviorClock: 0.4 + (phase / (Math.PI * 2)) * 0.8,
    collisionRecovery: 0,
  };
}

function createEdgeSpawnPosition(random: RandomSource): Point {
  const edge = Math.floor(random() * 4);
  const padding = 28;

  return edge === 0
    ? {
        x: padding,
        y: padding + random() * (WORLD_HEIGHT - padding * 2),
      }
    : edge === 1
      ? {
          x: WORLD_WIDTH - padding,
          y: padding + random() * (WORLD_HEIGHT - padding * 2),
        }
      : edge === 2
        ? {
            x: padding + random() * (WORLD_WIDTH - padding * 2),
            y: padding,
          }
        : {
            x: padding + random() * (WORLD_WIDTH - padding * 2),
            y: WORLD_HEIGHT - padding,
          };
}

function appendEnemy(
  game: GameState,
  random: RandomSource,
  spawnOverride?: EnemySpawnPlan,
): void {
  const spawn =
    spawnOverride ??
    planEnemySpawn({
      id: game.nextEnemyId,
      bodyLength: game.bodyLength,
      trail: game.trail,
      enemies: game.enemies,
      random,
      tutorial: !game.tutorialComplete,
    });
  game.enemies.push(
    createEnemy(game.nextEnemyId, game.kills, random, spawn),
  );
  game.nextEnemyId += 1;
}

function createInitialTrail(): Point[] {
  const center = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
  const sweep = Math.PI * 2 - INITIAL_RING_GAP_ANGLE;
  const startAngle = INITIAL_RING_GAP_ANGLE / 2;

  return Array.from({ length: INITIAL_BODY_POINTS }, (_, index) => {
    const progress = index / (INITIAL_BODY_POINTS - 1);
    const angle = startAngle + sweep * progress;
    return {
      x: center.x + Math.cos(angle) * INITIAL_RING_RADIUS,
      y: center.y + Math.sin(angle) * INITIAL_RING_RADIUS,
    };
  });
}

export function createGameState(random: RandomSource = Math.random): GameState {
  const trail = createInitialTrail();
  const initialHead = trail.at(-1) ?? {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
  };
  const initialTail = trail[0] ?? initialHead;
  const previousHead = trail.at(-2) ?? initialHead;
  const initialAngle = Math.atan2(
    initialHead.y - previousHead.y,
    initialHead.x - previousHead.x,
  );

  const game: GameState = {
    trail,
    angle: initialAngle,
    target: { ...initialTail },
    steering: true,
    tutorialAutoSteer: true,
    bodyLength: INITIAL_BODY_LENGTH,
    enemies: [],
    spawnClock: 0,
    kills: 0,
    lives: INITIAL_LIVES,
    elapsed: 0,
    closureCooldown: 0.6,
    closureFlash: 0,
    lastRing: null,
    invulnerable: 0,
    nextEnemyId: 0,
    message: TUTORIAL_MESSAGE,
    tutorialComplete: false,
    powerUps: [],
    activeEffects: [],
    shieldCharges: 0,
    powerUpSpawnClock: 0,
    nextPowerUpId: 0,
    level: 1,
    globalSpeed: INITIAL_GLOBAL_SPEED,
    levelClock: 0,
  };

  appendEnemy(game, random, {
    kind: "stationary",
    position: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
  });
  game.powerUpSpawnClock = nextPowerUpInterval(random);
  return game;
}

export function snapshotHud(game: GameState): HudSnapshot {
  return {
    kills: game.kills,
    lives: game.lives,
    length: Math.round(game.bodyLength),
    level: game.level,
    enemyLimit: enemyLimitFor(game.kills),
    nextGrowth: Math.max(1, 5 - (game.kills % 5)),
    message: game.message,
    buffs: snapshotBuffs(game),
  };
}

export function steerToward(game: GameState, target: Point): void {
  game.tutorialAutoSteer = false;
  game.target = target;
  game.steering = true;
}

export function setCardinalDirection(
  game: GameState,
  direction: CardinalDirection,
): void {
  const nextAngle =
    direction === "up"
      ? -Math.PI / 2
      : direction === "down"
        ? Math.PI / 2
        : direction === "left"
          ? Math.PI
          : 0;

  const wouldReverse = Math.cos(nextAngle - game.angle) < -0.72;
  if (wouldReverse) return;

  const head = game.trail.at(-1);
  if (!head) return;

  game.tutorialAutoSteer = false;
  game.angle = nextAngle;
  game.steering = false;
  game.target = {
    x: head.x + Math.cos(nextAngle) * 1000,
    y: head.y + Math.sin(nextAngle) * 1000,
  };
}

export function updateGame(
  game: GameState,
  delta: number,
  random: RandomSource = Math.random,
  collisions: CollisionSystem = nativeCollisionSystem,
): GameEvent[] {
  const events: GameEvent[] = [];

  // 全局速度倍率影响一切时间推进
  const effectiveDelta = delta * game.globalSpeed;
  game.elapsed += effectiveDelta;
  game.closureCooldown = Math.max(0, game.closureCooldown - effectiveDelta);
  game.closureFlash = Math.max(0, game.closureFlash - effectiveDelta * 1.4);
  game.invulnerable = Math.max(0, game.invulnerable - effectiveDelta);
  tickPowerUpEffects(game, effectiveDelta);

  // 关卡推进
  game.levelClock += delta;
  if (game.levelClock >= LEVEL_INTERVAL) {
    game.levelClock -= LEVEL_INTERVAL;
    game.level += 1;
    game.globalSpeed = INITIAL_GLOBAL_SPEED + GLOBAL_SPEED_INCREMENT * (game.level - 1);
    game.message = `第 ${game.level} 关！全局速度 x${game.globalSpeed.toFixed(1)}`;
    events.push({ type: "level-up", level: game.level });
  }

  const frameModifiers = powerUpModifiers(game);

  const head = game.trail.at(-1);
  if (!head) return events;

  const tutorialTail = game.trail[0];
  if (
    game.tutorialAutoSteer &&
    !game.tutorialComplete &&
    tutorialTail
  ) {
    game.target = { ...tutorialTail };
    game.steering = true;
  }

  if (game.steering) {
    const targetAngle = Math.atan2(
      game.target.y - head.y,
      game.target.x - head.x,
    );
    const turnLimit =
      effectiveDelta *
      (3.3 - Math.min(0.65, game.kills * 0.012)) *
      frameModifiers.snakeTurn;
    const turn = Math.max(
      -turnLimit,
      Math.min(turnLimit, angleDifference(targetAngle, game.angle)),
    );
    game.angle += turn;
  }

  const baseSpeed =
    game.tutorialAutoSteer && !game.tutorialComplete
      ? TUTORIAL_AUTO_SPEED
      : 150 + Math.min(42, game.kills * 1.25);
  const speed = baseSpeed * frameModifiers.snakeSpeed;
  const nextHead = {
    x: head.x + Math.cos(game.angle) * speed * effectiveDelta,
    y: head.y + Math.sin(game.angle) * speed * effectiveDelta,
  };

  if (nextHead.x < 14 || nextHead.x > WORLD_WIDTH - 14) {
    game.angle = Math.PI - game.angle;
    game.steering = false;
    nextHead.x = Math.max(15, Math.min(WORLD_WIDTH - 15, nextHead.x));
  }

  if (nextHead.y < 14 || nextHead.y > WORLD_HEIGHT - 14) {
    game.angle = -game.angle;
    game.steering = false;
    nextHead.y = Math.max(15, Math.min(WORLD_HEIGHT - 15, nextHead.y));
  }

  game.trail.push(nextHead);
  trimTrailToLength(game.trail, game.bodyLength);

  game.spawnClock = game.tutorialComplete ? game.spawnClock + effectiveDelta : 0;
  const spawnInterval = Math.max(0.48, 1.35 - game.kills * 0.025);
  if (
    game.tutorialComplete &&
    game.spawnClock >= spawnInterval &&
    game.enemies.length < enemyLimitFor(game.kills)
  ) {
    game.spawnClock = 0;
    appendEnemy(game, random);
  }

  const liveHead = game.trail.at(-1);
  if (!liveHead) return events;

  if (game.tutorialComplete) {
    events.push(
      ...updatePowerUps(game, liveHead, effectiveDelta, random, collisions),
    );
  }
  const activeModifiers = powerUpModifiers(game);
  updateEnemyMotion(
    game.enemies,
    liveHead,
    effectiveDelta,
    random,
    activeModifiers.enemySpeed,
  );

  const headHits = resolveEnemySnakeCollisions(
    game.enemies,
    game.trail,
    collisions,
  );

  if (headHits.length > 0) {
    const hitEnemy = headHits[0];
    if (hitEnemy) {
      const hitIndex = game.enemies.findIndex(
        (enemy) => enemy.id === hitEnemy.id,
      );
      if (hitIndex >= 0) game.enemies.splice(hitIndex, 1);
    }

    if (game.invulnerable <= 0) {
      if (game.shieldCharges > 0) {
        game.shieldCharges -= 1;
        game.invulnerable = 0.45;
        game.message = "护环抵消了这次伤害";
        events.push({ type: "shield-blocked" });
      } else {
        game.lives -= 1;
        game.invulnerable = 1.4;
        game.message =
          game.lives > 0 ? "敌人撞到了蛇头，保持移动！" : "衔尾之环断开了";
        events.push({ type: "hit", lives: game.lives });

        if (game.lives <= 0) {
          events.push({ type: "game-over" });
        }
      }
    }
  }

  const liveTail = game.trail[0];
  if (
    liveTail &&
    game.closureCooldown <= 0 &&
    game.trail.length > 34 &&
    distance(liveHead, liveTail) < activeModifiers.closureDistance &&
    polygonArea(game.trail) > 2200
  ) {
    const ring = game.trail.map((point) => ({ ...point }));
    const trappedIds = new Set(
      game.enemies
        .filter((enemy) => collisions.containsPoint(ring, enemy))
        .map((enemy) => enemy.id),
    );
    const captured = trappedIds.size;

    game.enemies = game.enemies.filter((enemy) => !trappedIds.has(enemy.id));
    game.lastRing = ring;
    game.closureFlash = 1;
    game.closureCooldown = 1.8;

    if (captured > 0) {
      game.kills += captured;
      game.bodyLength += captured * 31;
      if (game.tutorialComplete) {
        game.message = `闭环成功，净化了 ${captured} 个敌人！`;
      } else {
        game.tutorialComplete = true;
        game.tutorialAutoSteer = false;
        game.spawnClock = 0;
        game.message = FIRST_WAVE_MESSAGE;
      }
      events.push({ type: "capture", count: captured, totalKills: game.kills });
    } else {
      game.message = "形成了空环，没有敌人被圈住";
      events.push({ type: "empty-loop" });
    }

    const pointsToRelease = Math.min(9, Math.max(0, game.trail.length - 25));
    game.trail.splice(0, pointsToRelease);
  }

  if (!game.tutorialComplete && game.lives > 0 && game.enemies.length === 0) {
    appendEnemy(game, random);
    game.message = TUTORIAL_MESSAGE;
  }

  return events;
}
