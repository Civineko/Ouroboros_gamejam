import { BODY_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "../config";
import type {
  Enemy,
  Point,
  PowerUp,
  PowerUpKind,
  RandomSource,
} from "../types";
import {
  POWER_UP_DEFINITIONS,
  POWER_UP_KINDS,
  type PowerUpDefinition,
} from "./powerUpCatalog";

export const POWER_UP_TTL = 10;

const MIN_SPAWN_INTERVAL = 12;
const MAX_SPAWN_INTERVAL = 18;
const VISIBLE_RADIUS_X = 380;
const VISIBLE_RADIUS_Y = 240;
const HEAD_CLEARANCE = 160;
const SAFETY_GAP = 20;
const WORLD_EDGE_GAP = 20;
const RANDOM_ATTEMPTS = 24;
const FALLBACK_GRID_SPACING = 40;

export interface PowerUpSpawnContext {
  id: number;
  trail: readonly Point[];
  enemies: readonly Enemy[];
  lives: number;
  maxLives: number;
  shieldCharges: number;
  random: RandomSource;
}

interface SpawnBounds {
  minimumX: number;
  maximumX: number;
  minimumY: number;
  maximumY: number;
}

function sampleUnit(random: RandomSource): number {
  const value = random();
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

export function nextPowerUpInterval(random: RandomSource): number {
  return (
    MIN_SPAWN_INTERVAL +
    sampleUnit(random) * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL)
  );
}

function eligibleDefinitions(
  context: PowerUpSpawnContext,
): readonly PowerUpDefinition[] {
  return POWER_UP_KINDS.filter((kind) => {
    if (kind === "heal" && context.lives >= context.maxLives) return false;
    if (kind === "shield" && context.shieldCharges >= 1) return false;
    return true;
  }).map((kind) => POWER_UP_DEFINITIONS[kind]);
}

function chooseKind(context: PowerUpSpawnContext): PowerUpKind {
  const definitions = eligibleDefinitions(context);
  const totalWeight = definitions.reduce(
    (total, definition) => total + definition.weight,
    0,
  );
  let roll = sampleUnit(context.random) * totalWeight;

  for (const definition of definitions) {
    if (roll < definition.weight) return definition.kind;
    roll -= definition.weight;
  }

  return definitions.at(-1)?.kind ?? "stasis";
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

  if (segmentLengthSquared <= Number.EPSILON) {
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
  const first = trail[0];
  if (!first) return Number.POSITIVE_INFINITY;
  if (trail.length === 1) return Math.sqrt(squaredDistance(point, first));

  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < trail.length; index += 1) {
    const start = trail[index - 1];
    const end = trail[index];
    if (!start || !end) continue;
    nearest = Math.min(nearest, distanceToSegment(point, start, end));
  }
  return nearest;
}

function boundsAroundHead(head: Point, radius: number): SpawnBounds | null {
  const worldMargin = radius + WORLD_EDGE_GAP;
  const bounds = {
    minimumX: Math.max(worldMargin, head.x - VISIBLE_RADIUS_X),
    maximumX: Math.min(WORLD_WIDTH - worldMargin, head.x + VISIBLE_RADIUS_X),
    minimumY: Math.max(worldMargin, head.y - VISIBLE_RADIUS_Y),
    maximumY: Math.min(WORLD_HEIGHT - worldMargin, head.y + VISIBLE_RADIUS_Y),
  };

  if (
    bounds.minimumX > bounds.maximumX ||
    bounds.minimumY > bounds.maximumY
  ) {
    return null;
  }
  return bounds;
}

function clearanceScore(
  point: Point,
  radius: number,
  head: Point,
  trail: readonly Point[],
  enemies: readonly Enemy[],
): number {
  const worldClearance =
    Math.min(point.x, WORLD_WIDTH - point.x, point.y, WORLD_HEIGHT - point.y) -
    radius -
    WORLD_EDGE_GAP;
  const headClearance =
    Math.sqrt(squaredDistance(point, head)) - HEAD_CLEARANCE;
  const bodyClearance =
    distanceToTrail(point, trail) - BODY_WIDTH / 2 - radius - SAFETY_GAP;
  let enemyClearance = Number.POSITIVE_INFINITY;

  for (const enemy of enemies) {
    enemyClearance = Math.min(
      enemyClearance,
      Math.sqrt(squaredDistance(point, enemy)) -
        enemy.size -
        radius -
        SAFETY_GAP,
    );
  }

  return Math.min(
    worldClearance,
    headClearance,
    bodyClearance,
    enemyClearance,
  );
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
  if (span <= Number.EPSILON) return [minimum];
  const intervals = Math.max(1, Math.ceil(span / FALLBACK_GRID_SPACING));
  return Array.from(
    { length: intervals + 1 },
    (_, index) => minimum + (span * index) / intervals,
  );
}

function fallbackPosition(
  id: number,
  bounds: SpawnBounds,
  radius: number,
  head: Point,
  trail: readonly Point[],
  enemies: readonly Enemy[],
): Point | null {
  const xPositions = gridAxis(bounds.minimumX, bounds.maximumX);
  const yPositions = gridAxis(bounds.minimumY, bounds.maximumY);
  const candidates = yPositions.flatMap((y) =>
    xPositions.map((x) => ({ x, y })),
  );
  const stableId = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
  const startIndex = stableId % candidates.length;
  let best: Point | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let offset = 0; offset < candidates.length; offset += 1) {
    const candidate = candidates[(startIndex + offset) % candidates.length];
    if (!candidate) continue;
    const score = clearanceScore(candidate, radius, head, trail, enemies);
    if (score >= 0 && score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function createPowerUp(
  context: PowerUpSpawnContext,
  kind: PowerUpKind,
  position: Point,
): PowerUp {
  const definition = POWER_UP_DEFINITIONS[kind];
  return {
    id: context.id,
    kind,
    x: position.x,
    y: position.y,
    radius: definition.radius,
    ttl: POWER_UP_TTL,
    phase: sampleUnit(context.random) * Math.PI * 2,
  };
}

export function planPowerUpSpawn(
  context: PowerUpSpawnContext,
): PowerUp | null {
  const head = context.trail.at(-1);
  if (!head) return null;

  const kind = chooseKind(context);
  const radius = POWER_UP_DEFINITIONS[kind].radius;
  const bounds = boundsAroundHead(head, radius);
  if (!bounds) return null;

  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt += 1) {
    const candidate = randomPosition(bounds, context.random);
    if (
      clearanceScore(
        candidate,
        radius,
        head,
        context.trail,
        context.enemies,
      ) >= 0
    ) {
      return createPowerUp(context, kind, candidate);
    }
  }

  const position = fallbackPosition(
    context.id,
    bounds,
    radius,
    head,
    context.trail,
    context.enemies,
  );
  return position ? createPowerUp(context, kind, position) : null;
}
