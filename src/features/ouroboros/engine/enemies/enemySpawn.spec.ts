import { describe, expect, it } from "vitest";
import {
  BODY_WIDTH,
  HEAD_RADIUS,
  INITIAL_BODY_LENGTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../config";
import type { Enemy, Point, RandomSource } from "../types";
import { planEnemySpawn } from "./enemySpawn";

const MAX_ENEMY_RADIUS = 17;
const SAFETY_GAP = 20;

const openTrail: Point[] = [
  { x: 180, y: WORLD_HEIGHT / 2 },
  { x: 460, y: WORLD_HEIGHT / 2 },
  { x: 740, y: WORLD_HEIGHT / 2 },
];

function enemyAt(id: number, x: number, y: number): Enemy {
  return {
    id,
    x,
    y,
    kind: "stationary",
    speed: 0,
    size: 15,
    color: "#ff624e",
    phase: 0,
    velocityX: 0,
    velocityY: 0,
    heading: 0,
    behaviorClock: 0,
    collisionRecovery: 0,
  };
}

function pointDistance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function distanceToSegment(
  point: Point,
  start: Point,
  end: Point,
): number {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const squaredLength = segmentX * segmentX + segmentY * segmentY;
  if (squaredLength === 0) return pointDistance(point, start);

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * segmentX +
        (point.y - start.y) * segmentY) /
        squaredLength,
    ),
  );

  return pointDistance(point, {
    x: start.x + segmentX * projection,
    y: start.y + segmentY * projection,
  });
}

function constantRandom(value: number): RandomSource {
  return () => value;
}

function expectSafePosition(
  position: Point,
  trail: readonly Point[],
  enemies: readonly Enemy[],
): void {
  const head = trail.at(-1);
  expect(head).toBeDefined();
  if (!head) return;

  expect(pointDistance(position, head)).toBeGreaterThanOrEqual(
    HEAD_RADIUS + MAX_ENEMY_RADIUS + SAFETY_GAP,
  );

  for (let index = 0; index < trail.length - 1; index += 1) {
    const start = trail[index];
    const end = trail[index + 1];
    expect(start).toBeDefined();
    expect(end).toBeDefined();
    if (!start || !end) continue;

    expect(distanceToSegment(position, start, end)).toBeGreaterThanOrEqual(
      BODY_WIDTH / 2 + MAX_ENEMY_RADIUS + SAFETY_GAP,
    );
  }

  for (const enemy of enemies) {
    expect(pointDistance(position, enemy)).toBeGreaterThanOrEqual(
      enemy.size + MAX_ENEMY_RADIUS + SAFETY_GAP,
    );
  }
}

describe("enemy spawn planning", () => {
  it("only plans stationary enemies during the tutorial", () => {
    const randomValues = [0, 0.2, 0.5, 0.8, 0.999];

    for (const randomValue of randomValues) {
      const plan = planEnemySpawn({
        id: 0,
        bodyLength: INITIAL_BODY_LENGTH,
        trail: openTrail,
        enemies: [],
        random: constantRandom(randomValue),
        tutorial: true,
      });

      expect(plan.kind).toBe("stationary");
    }
  });

  it("keeps tutorial enemies within the starting camera neighborhood", () => {
    const head = openTrail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    for (const randomValue of [0, 0.25, 0.5, 0.75, 0.999]) {
      const plan = planEnemySpawn({
        id: 0,
        bodyLength: INITIAL_BODY_LENGTH,
        trail: openTrail,
        enemies: [],
        random: constantRandom(randomValue),
        tutorial: true,
      });

      expect(Math.abs(plan.position.x - head.x)).toBeLessThanOrEqual(380);
      expect(Math.abs(plan.position.y - head.y)).toBeLessThanOrEqual(240);
    }
  });

  it("places the first tutorial enemy beside the snake", () => {
    const head = openTrail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    const plan = planEnemySpawn({
      id: 0,
      bodyLength: INITIAL_BODY_LENGTH,
      trail: openTrail,
      enemies: [],
      random: constantRandom(0.5),
      tutorial: true,
    });

    expect(plan.position).toEqual({
      x: head.x - 160,
      y: head.y - 145,
    });
    expectSafePosition(plan.position, openTrail, []);
  });

  it("uses tracker-heavy official spawn weights", () => {
    const cases = [
      [0, "stationary"],
      [0.099, "stationary"],
      [0.1, "wanderer"],
      [0.199, "wanderer"],
      [0.2, "tracker"],
      [0.999, "tracker"],
    ] as const;

    for (const [randomValue, expectedKind] of cases) {
      const plan = planEnemySpawn({
        id: 0,
        bodyLength: INITIAL_BODY_LENGTH,
        trail: openTrail,
        enemies: [],
        random: constantRandom(randomValue),
      });

      expect(plan.kind).toBe(expectedKind);
    }
  });

  it("keeps stationary spawn points inside the world rather than on an edge", () => {
    for (const randomValue of [0, 0.05, 0.099]) {
      const plan = planEnemySpawn({
        id: 0,
        bodyLength: INITIAL_BODY_LENGTH,
        trail: openTrail,
        enemies: [],
        random: constantRandom(randomValue),
      });

      expect(plan.kind).toBe("stationary");
      expect(plan.position.x).toBeGreaterThan(MAX_ENEMY_RADIUS);
      expect(plan.position.x).toBeLessThan(WORLD_WIDTH - MAX_ENEMY_RADIUS);
      expect(plan.position.y).toBeGreaterThan(MAX_ENEMY_RADIUS);
      expect(plan.position.y).toBeLessThan(WORLD_HEIGHT - MAX_ENEMY_RADIUS);
    }
  });

  it("keeps spawn points clear of the snake and existing enemies", () => {
    const enemies = [enemyAt(10, 140, 120), enemyAt(11, 790, 500)];

    for (const randomValue of [0.1, 0.35, 0.6, 0.85]) {
      const plan = planEnemySpawn({
        id: 12,
        bodyLength: INITIAL_BODY_LENGTH,
        trail: openTrail,
        enemies,
        random: constantRandom(randomValue),
      });

      expectSafePosition(plan.position, openTrail, enemies);
    }
  });

  it("falls back to a finite grid when random candidates keep repeating", () => {
    const enemies = [enemyAt(20, WORLD_WIDTH / 2, WORLD_HEIGHT / 2)];
    const plan = planEnemySpawn({
      id: 21,
      bodyLength: INITIAL_BODY_LENGTH,
      trail: openTrail,
      enemies,
      random: constantRandom(0.5),
    });

    expect(Number.isFinite(plan.position.x)).toBe(true);
    expect(Number.isFinite(plan.position.y)).toBe(true);
    expectSafePosition(plan.position, openTrail, enemies);
  });
});
