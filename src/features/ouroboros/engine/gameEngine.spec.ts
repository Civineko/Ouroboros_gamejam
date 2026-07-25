import { describe, expect, it } from "vitest";
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
    expect(hud).toMatchObject({ kills: 0, lives: 3, level: 1, enemyLimit: 4 });
  });

  it("rejects a direct reverse but accepts a perpendicular turn", () => {
    const game = createGameState(fixedRandom);

    setCardinalDirection(game, "left");
    expect(game.angle).toBe(0);

    setCardinalDirection(game, "up");
    expect(game.angle).toBe(-Math.PI / 2);
  });

  it("preserves the original random call order when creating an enemy", () => {
    const values = [0, 0.25, 0.5, 0.75, 0.9];
    let calls = 0;
    const enemy = createEnemy(0, 0, () => values[calls++] ?? 0);

    expect(calls).toBe(5);
    expect(enemy).toMatchObject({
      x: 28,
      y: 169,
      speed: 41,
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

    game.enemies = [
      {
        ...createEnemy(10, 0, fixedRandom),
        x: head.x,
        y: head.y,
      },
    ];
    game.invulnerable = 0;

    const events = updateGame(game, 1 / 60, fixedRandom);

    expect(events).toContainEqual({ type: "hit", lives: 2 });
    expect(game.lives).toBe(2);
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
