import { describe, expect, it } from "vitest";
import { createEnemy } from "../gameEngine";
import { distance } from "../geometry";
import {
  ENEMY_SEPARATION_PADDING,
  updateEnemyMotion,
} from "./enemyMotion";

const fixedRandom = () => 0.25;

describe("enemy motion", () => {
  it("keeps stationary enemies fixed", () => {
    const enemy = { ...createEnemy(0, 0, fixedRandom), x: 400, y: 300 };

    updateEnemyMotion([enemy], { x: 700, y: 300 }, 1, fixedRandom);

    expect(enemy.kind).toBe("stationary");
    expect(enemy).toMatchObject({ x: 400, y: 300, velocityX: 0, velocityY: 0 });
  });

  it("moves wanderers and trackers with different steering goals", () => {
    const wanderer = { ...createEnemy(1, 0, fixedRandom), x: 300, y: 260 };
    const tracker = { ...createEnemy(2, 0, fixedRandom), x: 500, y: 340 };
    const initialWanderer = { x: wanderer.x, y: wanderer.y };
    const initialTracker = { x: tracker.x, y: tracker.y };

    updateEnemyMotion(
      [wanderer, tracker],
      { x: 700, y: 300 },
      0.5,
      fixedRandom,
    );

    expect(wanderer.kind).toBe("wanderer");
    expect(tracker.kind).toBe("tracker");
    expect(distance(wanderer, initialWanderer)).toBeGreaterThan(0);
    expect(distance(tracker, initialTracker)).toBeGreaterThan(0);
  });

  it("keeps a tracker moving away while collision recovery is active", () => {
    const tracker = {
      ...createEnemy(2, 0, fixedRandom),
      x: 500,
      y: 300,
      velocityX: -40,
      velocityY: 0,
      heading: Math.PI,
      collisionRecovery: 0.14,
    };

    updateEnemyMotion([tracker], { x: 700, y: 300 }, 0.1, fixedRandom);

    expect(tracker.x).toBe(496);
    expect(tracker.velocityX).toBe(-40);
    expect(tracker.collisionRecovery).toBeCloseTo(0.04);
  });

  it("applies an external speed multiplier without mutating base speed", () => {
    const tracker = {
      ...createEnemy(2, 0, fixedRandom),
      x: 500,
      y: 300,
      velocityX: 40,
      velocityY: 0,
      heading: 0,
    };
    const baseSpeed = tracker.speed;

    updateEnemyMotion(
      [tracker],
      { x: 700, y: 300 },
      1,
      fixedRandom,
      0.5,
    );

    expect(tracker.speed).toBe(baseSpeed);
    expect(tracker.x - 500).toBeLessThan(baseSpeed);
  });

  it("separates moving enemies after a flock update", () => {
    const wanderer = { ...createEnemy(1, 0, fixedRandom), x: 400, y: 300 };
    const tracker = { ...createEnemy(2, 0, fixedRandom), x: 400, y: 300 };

    updateEnemyMotion(
      [wanderer, tracker],
      { x: 700, y: 300 },
      0,
      fixedRandom,
    );

    expect(distance(wanderer, tracker)).toBeGreaterThanOrEqual(
      wanderer.size + tracker.size + ENEMY_SEPARATION_PADDING,
    );
  });

  it("keeps a moving flock separated over time", () => {
    const enemies = [1, 2, 5, 6, 9, 10].map((id, index) => ({
      ...createEnemy(id, 0, fixedRandom),
      x: 360 + (index % 3) * 18,
      y: 270 + Math.floor(index / 3) * 18,
    }));

    for (let frame = 0; frame < 180; frame += 1) {
      updateEnemyMotion(enemies, { x: 700, y: 300 }, 1 / 60, fixedRandom);
    }

    for (let firstIndex = 0; firstIndex < enemies.length; firstIndex += 1) {
      const first = enemies[firstIndex];
      if (!first) continue;

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < enemies.length;
        secondIndex += 1
      ) {
        const second = enemies[secondIndex];
        if (!second) continue;

        expect(distance(first, second)).toBeGreaterThanOrEqual(
          first.size + second.size + ENEMY_SEPARATION_PADDING,
        );
      }
    }
  });
});
