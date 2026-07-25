import { describe, expect, it } from "vitest";
import { BODY_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "../config";
import type { Enemy, Point, RandomSource } from "../types";
import {
  POWER_UP_DEFINITIONS,
  POWER_UP_KINDS,
} from "./powerUpCatalog";
import {
  POWER_UP_TTL,
  nextPowerUpInterval,
  planPowerUpSpawn,
  type PowerUpSpawnContext,
} from "./powerUpSpawn";

const POWER_UP_RADIUS = 12;
const SAFETY_GAP = 20;
const WORLD_EDGE_GAP = 20;

const openTrail: Point[] = [
  { x: 460, y: WORLD_HEIGHT / 2 },
  { x: 590, y: WORLD_HEIGHT / 2 },
  { x: 720, y: WORLD_HEIGHT / 2 },
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

function constantRandom(value: number): RandomSource {
  return () => value;
}

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0.5;
}

function spawnContext(
  overrides: Partial<PowerUpSpawnContext> = {},
): PowerUpSpawnContext {
  return {
    id: 7,
    trail: openTrail,
    enemies: [],
    lives: 2,
    maxLives: 3,
    shieldCharges: 0,
    random: sequenceRandom([0, 0.9, 0.5, 0.25]),
    ...overrides,
  };
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const lengthSquared = segmentX * segmentX + segmentY * segmentY;
  if (lengthSquared <= Number.EPSILON) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * segmentX +
        (point.y - start.y) * segmentY) /
        lengthSquared,
    ),
  );
  return Math.hypot(
    point.x - (start.x + segmentX * projection),
    point.y - (start.y + segmentY * projection),
  );
}

describe("power-up catalog", () => {
  it("defines all four weighted power-ups and their durations", () => {
    expect(POWER_UP_KINDS).toEqual([
      "shield",
      "heal",
      "stasis",
      "haste",
    ]);

    for (const kind of POWER_UP_KINDS) {
      const definition = POWER_UP_DEFINITIONS[kind];
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(definition.weight).toBeGreaterThan(0);
      expect(definition.radius).toBe(POWER_UP_RADIUS);
    }

    expect(POWER_UP_DEFINITIONS.shield.duration).toBeNull();
    expect(POWER_UP_DEFINITIONS.heal.duration).toBeNull();
    expect(POWER_UP_DEFINITIONS.stasis.duration).toBe(5);
    expect(POWER_UP_DEFINITIONS.haste.duration).toBe(5);
  });
});

describe("power-up spawn planning", () => {
  it("removes ineligible heal and shield entries before weighted selection", () => {
    const allEligible = planPowerUpSpawn(spawnContext());
    const shieldExcluded = planPowerUpSpawn(
      spawnContext({ shieldCharges: 1 }),
    );
    const bothExcluded = planPowerUpSpawn(
      spawnContext({ lives: 3, maxLives: 3, shieldCharges: 1 }),
    );

    expect(allEligible?.kind).toBe("shield");
    expect(shieldExcluded?.kind).toBe("heal");
    expect(bothExcluded?.kind).toBe("stasis");
  });

  it("uses the configured weights across the eligible definition list", () => {
    const nearEnd = planPowerUpSpawn(
      spawnContext({
        random: sequenceRandom([0.999, 0.9, 0.5, 0]),
      }),
    );

    expect(nearEnd?.kind).toBe("haste");
  });

  it("stays near the head while respecting snake, enemy, and world clearance", () => {
    const enemies = [enemyAt(3, 900, 300), enemyAt(4, 500, 650)];
    const powerUp = planPowerUpSpawn(
      spawnContext({
        id: 9,
        enemies,
        random: constantRandom(0.5),
      }),
    );
    const head = openTrail.at(-1);

    expect(powerUp).not.toBeNull();
    expect(head).toBeDefined();
    if (!powerUp || !head) return;

    expect(powerUp.ttl).toBe(POWER_UP_TTL);
    expect(Math.abs(powerUp.x - head.x)).toBeLessThanOrEqual(380);
    expect(Math.abs(powerUp.y - head.y)).toBeLessThanOrEqual(240);
    expect(Math.hypot(powerUp.x - head.x, powerUp.y - head.y)).toBeGreaterThanOrEqual(
      160,
    );
    expect(powerUp.x).toBeGreaterThanOrEqual(
      POWER_UP_RADIUS + WORLD_EDGE_GAP,
    );
    expect(powerUp.x).toBeLessThanOrEqual(
      WORLD_WIDTH - POWER_UP_RADIUS - WORLD_EDGE_GAP,
    );
    expect(powerUp.y).toBeGreaterThanOrEqual(
      POWER_UP_RADIUS + WORLD_EDGE_GAP,
    );
    expect(powerUp.y).toBeLessThanOrEqual(
      WORLD_HEIGHT - POWER_UP_RADIUS - WORLD_EDGE_GAP,
    );

    for (let index = 1; index < openTrail.length; index += 1) {
      const start = openTrail[index - 1];
      const end = openTrail[index];
      if (!start || !end) continue;
      expect(distanceToSegment(powerUp, start, end)).toBeGreaterThanOrEqual(
        BODY_WIDTH / 2 + POWER_UP_RADIUS + SAFETY_GAP,
      );
    }

    for (const enemy of enemies) {
      expect(Math.hypot(powerUp.x - enemy.x, powerUp.y - enemy.y)).toBeGreaterThanOrEqual(
        POWER_UP_RADIUS + enemy.size + SAFETY_GAP,
      );
    }
  });

  it("falls back deterministically when a constant source repeats an unsafe point", () => {
    const first = planPowerUpSpawn(
      spawnContext({ id: 12, random: constantRandom(0.5) }),
    );
    const second = planPowerUpSpawn(
      spawnContext({ id: 12, random: constantRandom(0.5) }),
    );

    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(first && Math.hypot(first.x - 720, first.y - WORLD_HEIGHT / 2)).toBeGreaterThanOrEqual(
      160,
    );
  });

  it("returns no plan when there is no snake head", () => {
    expect(planPowerUpSpawn(spawnContext({ trail: [] }))).toBeNull();
  });
});

describe("power-up interval", () => {
  it("maps random boundaries to 12 through 18 seconds", () => {
    expect(nextPowerUpInterval(constantRandom(0))).toBe(12);
    expect(nextPowerUpInterval(constantRandom(0.5))).toBe(15);
    expect(nextPowerUpInterval(constantRandom(1))).toBe(18);
  });
});
