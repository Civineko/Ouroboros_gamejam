import { describe, expect, it } from "vitest";
import { BODY_WIDTH } from "./config";
import {
  createEnemy,
  createGameState,
  setCardinalDirection,
  snapshotHud,
  updateGame,
} from "./gameEngine";

const fixedRandom = () => 0.25;

describe("game engine", () => {
  it("creates a complete, deterministic initial state", () => {
    const game = createGameState(fixedRandom);
    const hud = snapshotHud(game);

    expect(game.trail).toHaveLength(54);
    expect(game.enemies).toHaveLength(3);
    expect(game.enemies.map((enemy) => enemy.kind)).toEqual([
      "stationary",
      "stationary",
      "stationary",
    ]);
    expect(hud).toMatchObject({ kills: 0, lives: 3, level: 1, enemyLimit: 4 });
  });

  it("rejects a direct reverse but accepts a perpendicular turn", () => {
    const game = createGameState(fixedRandom);

    setCardinalDirection(game, "left");
    expect(game.angle).toBe(0);

    setCardinalDirection(game, "up");
    expect(game.angle).toBe(-Math.PI / 2);
  });

  it("creates a deterministic stationary enemy without extra random calls", () => {
    const values = [0, 0.25, 0.5, 0.75, 0.9];
    let calls = 0;
    const enemy = createEnemy(0, 0, () => values[calls++] ?? 0);

    expect(calls).toBe(5);
    expect(enemy).toMatchObject({
      x: 28,
      y: 169,
      kind: "stationary",
      speed: 0,
      size: 15.75,
      color: "#ff624e",
      phase: 0.9 * Math.PI * 2,
    });
  });

  it("emits a hit event and decrements lives on collision", () => {
    const game = createGameState(fixedRandom);
    const head = game.trail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    const enemy = {
      ...createEnemy(10, 0, fixedRandom),
      x: head.x,
      y: head.y,
      velocityX: 40,
      velocityY: 12,
    };
    game.enemies = [enemy];
    game.invulnerable = 0;

    const events = updateGame(game, 1 / 60, fixedRandom);

    expect(events).toContainEqual({ type: "hit", lives: 2 });
    expect(game.lives).toBe(2);
    expect(game.enemies).not.toContain(enemy);
  });

  it("removes a head collision during invulnerability without losing life", () => {
    const game = createGameState(fixedRandom);
    const head = game.trail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    const enemy = {
      ...createEnemy(10, 0, fixedRandom),
      x: head.x,
      y: head.y,
    };
    game.enemies = [enemy];
    game.invulnerable = 1;

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toEqual([]);
    expect(game.lives).toBe(3);
    expect(game.enemies).not.toContain(enemy);
  });

  it("reverses and separates an enemy that touches the snake body", () => {
    const game = createGameState(fixedRandom);
    const bodyPoint = game.trail[12];
    expect(bodyPoint).toBeDefined();
    if (!bodyPoint) return;

    const enemy = {
      ...createEnemy(1, 0, fixedRandom),
      x: bodyPoint.x,
      y: bodyPoint.y + 5,
      velocityX: 30,
      velocityY: 12,
      heading: Math.atan2(12, 30),
    };
    game.enemies = [enemy];

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toEqual([]);
    expect(enemy.velocityX).toBe(-30);
    expect(enemy.velocityY).toBe(-12);
    expect(enemy.y).toBeGreaterThanOrEqual(
      bodyPoint.y + enemy.size + BODY_WIDTH / 2,
    );
  });

  it("does not let the neck collision block an enemy approaching the head", () => {
    const game = createGameState(fixedRandom);
    const head = game.trail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    const enemy = {
      ...createEnemy(1, 0, fixedRandom),
      x: head.x - 32,
      y: head.y,
      velocityX: 30,
      velocityY: 0,
      heading: 0,
    };
    game.enemies = [enemy];

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toEqual([]);
    expect(game.enemies).toContain(enemy);
    expect(enemy.velocityX).toBe(30);
    expect(enemy.collisionRecovery).toBe(0);
  });

  it("pushes a stationary enemy out without giving it velocity", () => {
    const game = createGameState(fixedRandom);
    const bodyPoint = game.trail[12];
    expect(bodyPoint).toBeDefined();
    if (!bodyPoint) return;

    const enemy = {
      ...createEnemy(0, 0, fixedRandom),
      x: bodyPoint.x,
      y: bodyPoint.y,
    };
    game.enemies = [enemy];

    updateGame(game, 0, fixedRandom);

    expect(enemy.velocityX).toBe(0);
    expect(enemy.velocityY).toBe(0);
    expect(enemy.y).toBeGreaterThan(bodyPoint.y);
  });

  it("captures enemies inside a valid closed ring", () => {
    const game = createGameState(fixedRandom);
    game.trail = Array.from({ length: 36 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 35;
      return {
        x: 400 + Math.cos(angle) * 100,
        y: 300 + Math.sin(angle) * 100,
      };
    });
    game.bodyLength = 1000;
    game.closureCooldown = 0;
    game.enemies = [
      {
        ...createEnemy(20, 0, fixedRandom),
        x: 400,
        y: 300,
      },
    ];

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toContainEqual({ type: "capture", count: 1, totalKills: 1 });
    expect(game.enemies).toHaveLength(0);
    expect(game.bodyLength).toBe(1031);
  });

  it("still resolves a closed ring during the fatal update", () => {
    const game = createGameState(fixedRandom);
    game.trail = Array.from({ length: 36 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 35;
      return {
        x: 400 + Math.cos(angle) * 100,
        y: 300 + Math.sin(angle) * 100,
      };
    });
    game.bodyLength = 1000;
    game.closureCooldown = 0;
    game.lives = 1;
    game.invulnerable = 0;

    const head = game.trail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    game.enemies = [
      {
        ...createEnemy(20, 0, fixedRandom),
        x: head.x,
        y: head.y,
      },
    ];

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toEqual([
      { type: "hit", lives: 0 },
      { type: "game-over" },
      { type: "empty-loop" },
    ]);
    expect(game.message).toBe("形成了空环，没有敌人被圈住");
  });
});
