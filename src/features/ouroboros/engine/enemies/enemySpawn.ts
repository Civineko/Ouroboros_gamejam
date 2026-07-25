import {
  INITIAL_BODY_LENGTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../config";
import type {
  Enemy,
  EnemyKind,
  Point,
  RandomSource,
} from "../types";

export const WANDERER_UNLOCK_LENGTH = INITIAL_BODY_LENGTH + 3 * 31;
export const TRACKER_UNLOCK_LENGTH = INITIAL_BODY_LENGTH + 7 * 31;

export interface EnemySpawnContext {
  id: number;
  bodyLength: number;
  trail: readonly Point[];
  enemies: readonly Enemy[];
  random: RandomSource;
}

export interface EnemySpawnPlan {
  kind: EnemyKind;
  position: Point;
}

const STATIONARY_WORLD_MARGIN = 64;
const MOVING_WORLD_MARGIN = 28;
const HEAD_CLEARANCE = 150;
const BODY_CLEARANCE = 48;
const MAX_SPAWN_ENEMY_RADIUS = 17;
const ENEMY_EXTRA_CLEARANCE = 20;
const RANDOM_ATTEMPTS = 24;
const FALLBACK_GRID_SPACING = 48;
const TUTORIAL_RADIUS_X = 380;
const TUTORIAL_RADIUS_Y = 240;

interface SpawnBounds {
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
}

function sampleUnit(random: RandomSource): number {
  const value = random();
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1 - Number.EPSILON, value));
}

function chooseKind(bodyLength: number, random: RandomSource): EnemyKind {
  if (bodyLength < WANDERER_UNLOCK_LENGTH) return "stationary";

  const roll = sampleUnit(random);
  if (bodyLength < TRACKER_UNLOCK_LENGTH) {
    return roll < 0.65 ? "stationary" : "wanderer";
  }

  if (roll < 0.45) return "stationary";
  if (roll < 0.8) return "wanderer";
  return "tracker";
}

function squaredDistance(first: Point, second: Point): number {
  const deltaX = first.x - second.x;
  const deltaY = first.y - second.y;
  return deltaX * deltaX + deltaY * deltaY;
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    return Math.sqrt(squaredDistance(point, start));
  }

  const projection =
    ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) /
    segmentLengthSquared;
  const amount = Math.max(0, Math.min(1, projection));
  const nearest = {
    x: start.x + segmentX * amount,
    y: start.y + segmentY * amount,
  };

  return Math.sqrt(squaredDistance(point, nearest));
}

function distanceToTrail(point: Point, trail: readonly Point[]): number {
  if (trail.length === 0) return Number.POSITIVE_INFINITY;
  if (trail.length === 1) {
    const onlyPoint = trail[0];
    return onlyPoint
      ? Math.sqrt(squaredDistance(point, onlyPoint))
      : Number.POSITIVE_INFINITY;
  }

  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < trail.length; index += 1) {
    const start = trail[index - 1];
    const end = trail[index];
    if (!start || !end) continue;

    nearest = Math.min(
      nearest,
      distanceToSegment(point, start, end),
    );
  }
  return nearest;
}

function enemyClearance(point: Point, enemies: readonly Enemy[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const enemy of enemies) {
    const centerDistance = Math.sqrt(squaredDistance(point, enemy));
    nearest = Math.min(
      nearest,
      centerDistance -
        enemy.size -
        MAX_SPAWN_ENEMY_RADIUS -
        ENEMY_EXTRA_CLEARANCE,
    );
  }
  return nearest;
}

function clearanceScore(
  point: Point,
  margin: number,
  trail: readonly Point[],
  enemies: readonly Enemy[],
): number {
  const head = trail.at(-1);
  const worldClearance =
    Math.min(point.x, WORLD_WIDTH - point.x, point.y, WORLD_HEIGHT - point.y) -
    margin;
  const headClearance = head
    ? Math.sqrt(squaredDistance(point, head)) - HEAD_CLEARANCE
    : Number.POSITIVE_INFINITY;
  const bodyClearance = distanceToTrail(point, trail) - BODY_CLEARANCE;

  return Math.min(
    worldClearance,
    headClearance,
    bodyClearance,
    enemyClearance(point, enemies),
  );
}

function worldBounds(margin: number): SpawnBounds {
  return {
    minimumX: margin,
    maximumX: WORLD_WIDTH - margin,
    minimumY: margin,
    maximumY: WORLD_HEIGHT - margin,
  };
}

function tutorialBounds(margin: number, head: Point): SpawnBounds {
  const world = worldBounds(margin);
  return {
    minimumX: Math.max(world.minimumX, head.x - TUTORIAL_RADIUS_X),
    maximumX: Math.min(world.maximumX, head.x + TUTORIAL_RADIUS_X),
    minimumY: Math.max(world.minimumY, head.y - TUTORIAL_RADIUS_Y),
    maximumY: Math.min(world.maximumY, head.y + TUTORIAL_RADIUS_Y),
  };
}

function randomPosition(bounds: SpawnBounds, random: RandomSource): Point {
  return {
    x:
      bounds.minimumX +
      sampleUnit(random) * (bounds.maximumX - bounds.minimumX),
    y:
      bounds.minimumY +
      sampleUnit(random) * (bounds.maximumY - bounds.minimumY),
  };
}

function gridAxis(minimum: number, maximum: number): number[] {
  const span = maximum - minimum;
  const intervals = Math.max(1, Math.ceil(span / FALLBACK_GRID_SPACING));
  return Array.from(
    { length: intervals + 1 },
    (_, index) => minimum + (span * index) / intervals,
  );
}

function fallbackPosition(
  id: number,
  margin: number,
  bounds: SpawnBounds,
  trail: readonly Point[],
  enemies: readonly Enemy[],
): Point {
  const xPositions = gridAxis(bounds.minimumX, bounds.maximumX);
  const yPositions = gridAxis(bounds.minimumY, bounds.maximumY);
  const candidates = yPositions.flatMap((y) =>
    xPositions.map((x) => ({ x, y })),
  );
  const stableId = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
  const startIndex = stableId % candidates.length;
  let best: Point = { x: margin, y: margin };
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let offset = 0; offset < candidates.length; offset += 1) {
    const candidate = candidates[(startIndex + offset) % candidates.length];
    if (!candidate) continue;

    const score = clearanceScore(candidate, margin, trail, enemies);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

export function planEnemySpawn(context: EnemySpawnContext): EnemySpawnPlan {
  const kind = chooseKind(context.bodyLength, context.random);
  const margin =
    kind === "stationary" ? STATIONARY_WORLD_MARGIN : MOVING_WORLD_MARGIN;
  const head = context.trail.at(-1);
  const bounds =
    context.bodyLength < WANDERER_UNLOCK_LENGTH && head
      ? tutorialBounds(margin, head)
      : worldBounds(margin);

  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt += 1) {
    const candidate = randomPosition(bounds, context.random);
    if (
      clearanceScore(candidate, margin, context.trail, context.enemies) >= 0
    ) {
      return { kind, position: candidate };
    }
  }

  return {
    kind,
    position: fallbackPosition(
      context.id,
      margin,
      bounds,
      context.trail,
      context.enemies,
    ),
  };
}
