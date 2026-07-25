import {
  HEAD_RADIUS,
  INITIAL_BODY_LENGTH,
  INITIAL_BODY_POINTS,
  INITIAL_LIVES,
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

const ENEMY_PALETTE = ["#ff624e", "#f3b849", "#ee765f"] as const;

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
): Enemy {
  const edge = Math.floor(random() * 4);
  const padding = 28;

  const position =
    edge === 0
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

  return {
    ...position,
    id,
    speed: 34 + random() * 14 + Math.min(38, kills * 1.6),
    size: 12 + random() * 5,
    color: ENEMY_PALETTE[id % ENEMY_PALETTE.length] ?? ENEMY_PALETTE[0],
    phase: random() * Math.PI * 2,
  };
}

export function createGameState(random: RandomSource = Math.random): GameState {
  const initialSpacing = INITIAL_BODY_LENGTH / (INITIAL_BODY_POINTS - 1);
  const trail = Array.from({ length: INITIAL_BODY_POINTS }, (_, index) => ({
    x: 190 + index * initialSpacing,
    y: WORLD_HEIGHT / 2,
  }));

  return {
    trail,
    angle: 0,
    target: { x: 760, y: WORLD_HEIGHT / 2 },
    steering: false,
    bodyLength: INITIAL_BODY_LENGTH,
    enemies: [
      createEnemy(0, 0, random),
      createEnemy(1, 0, random),
      createEnemy(2, 0, random),
    ],
    spawnClock: 0,
    kills: 0,
    lives: INITIAL_LIVES,
    elapsed: 0,
    closureCooldown: 1.2,
    closureFlash: 0,
    lastRing: null,
    invulnerable: 0,
    nextEnemyId: 3,
    message: "引导蛇身围住敌人，让蛇头触碰蛇尾",
  };
}

export function snapshotHud(game: GameState): HudSnapshot {
  return {
    kills: game.kills,
    lives: game.lives,
    length: Math.round(game.bodyLength),
    level: levelFor(game.kills),
    enemyLimit: enemyLimitFor(game.kills),
    nextGrowth: Math.max(1, 5 - (game.kills % 5)),
    message: game.message,
  };
}

export function steerToward(game: GameState, target: Point): void {
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
  game.elapsed += delta;
  game.closureCooldown = Math.max(0, game.closureCooldown - delta);
  game.closureFlash = Math.max(0, game.closureFlash - delta * 1.4);
  game.invulnerable = Math.max(0, game.invulnerable - delta);

  const head = game.trail.at(-1);
  if (!head) return events;

  if (game.steering) {
    const targetAngle = Math.atan2(
      game.target.y - head.y,
      game.target.x - head.x,
    );
    const turnLimit = delta * (3.3 - Math.min(0.65, game.kills * 0.012));
    const turn = Math.max(
      -turnLimit,
      Math.min(turnLimit, angleDifference(targetAngle, game.angle)),
    );
    game.angle += turn;
  }

  const speed = 150 + Math.min(42, game.kills * 1.25);
  const nextHead = {
    x: head.x + Math.cos(game.angle) * speed * delta,
    y: head.y + Math.sin(game.angle) * speed * delta,
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

  game.spawnClock += delta;
  const spawnInterval = Math.max(0.48, 1.35 - game.kills * 0.025);
  if (
    game.spawnClock >= spawnInterval &&
    game.enemies.length < enemyLimitFor(game.kills)
  ) {
    game.spawnClock = 0;
    game.enemies.push(createEnemy(game.nextEnemyId, game.kills, random));
    game.nextEnemyId += 1;
  }

  const liveHead = game.trail.at(-1);
  if (!liveHead) return events;

  for (const enemy of game.enemies) {
    const direction = Math.atan2(liveHead.y - enemy.y, liveHead.x - enemy.x);
    enemy.x += Math.cos(direction) * enemy.speed * delta;
    enemy.y += Math.sin(direction) * enemy.speed * delta;
  }

  if (game.invulnerable <= 0) {
    const collision = game.enemies.findIndex(
      (enemy) =>
        collisions.circlesOverlap(
          enemy,
          enemy.size,
          liveHead,
          HEAD_RADIUS - 3,
        ),
    );

    if (collision >= 0) {
      game.enemies.splice(collision, 1);
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

  const liveTail = game.trail[0];
  if (
    liveTail &&
    game.closureCooldown <= 0 &&
    game.trail.length > 34 &&
    distance(liveHead, liveTail) < 25 &&
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
      game.message = `闭环成功，净化了 ${captured} 个敌人！`;
      events.push({ type: "capture", count: captured, totalKills: game.kills });
    } else {
      game.message = "形成了空环，没有敌人被圈住";
      events.push({ type: "empty-loop" });
    }

    const pointsToRelease = Math.min(9, Math.max(0, game.trail.length - 25));
    game.trail.splice(0, pointsToRelease);
  }

  return events;
}
