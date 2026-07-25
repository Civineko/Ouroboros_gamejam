import { describe, expect, it } from "vitest";
import {
  BODY_WIDTH,
  INITIAL_BODY_LENGTH,
  INITIAL_BODY_POINTS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./config";
import {
  createEnemy,
  createGameState,
  setCardinalDirection,
  snapshotHud,
  steerToward,
  updateGame,
} from "./gameEngine";

const fixedRandom = () => 0.25;

describe("game engine", () => {
  it("creates a complete, deterministic initial state", () => {
    const game = createGameState(fixedRandom);
    const hud = snapshotHud(game);

    expect(game.trail).toHaveLength(INITIAL_BODY_POINTS);
    expect(game.bodyLength).toBe(INITIAL_BODY_LENGTH);
    expect(game.enemies).toHaveLength(1);
    expect(game.enemies[0]?.kind).toBe("stationary");
    expect(game.enemies[0]).toMatchObject({
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
    });
    expect(game.tutorialComplete).toBe(false);
    expect(game.tutorialAutoSteer).toBe(true);
    expect(hud).toMatchObject({
      kills: 0,
      lives: 3,
      level: 1,
      enemyLimit: 4,
      message: "首尾相接，圈住敌人",
    });

    const center = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    const xCoordinates = game.trail.map((point) => point.x);
    const yCoordinates = game.trail.map((point) => point.y);
    expect(Math.min(...xCoordinates)).toBeLessThan(center.x - 73);
    expect(Math.max(...xCoordinates)).toBeGreaterThan(center.x + 72);
    expect(Math.min(...yCoordinates)).toBeLessThan(center.y - 73);
    expect(Math.max(...yCoordinates)).toBeGreaterThan(center.y + 73);

    const centerCrossings = game.trail.filter(
      (point) => Math.hypot(point.x - center.x, point.y - center.y) < 10,
    );
    expect(centerCrossings).toHaveLength(0);

    const tail = game.trail[0];
    const head = game.trail.at(-1);
    expect(tail).toBeDefined();
    expect(head).toBeDefined();
    if (tail && head) {
      const opening = Math.hypot(head.x - tail.x, head.y - tail.y);
      expect(opening).toBeGreaterThan(34);
      expect(opening).toBeLessThan(37);
    }
  });

  it("automatically closes the tutorial ring when the player does nothing", () => {
    const game = createGameState(fixedRandom);
    const events = [];

    for (let frame = 0; frame < 180 && !game.tutorialComplete; frame += 1) {
      events.push(...updateGame(game, 1 / 60, fixedRandom));
    }

    expect(events).toContainEqual({ type: "capture", count: 1, totalKills: 1 });
    expect(game.tutorialComplete).toBe(true);
    expect(game.tutorialAutoSteer).toBe(false);
  });

  it("hands tutorial steering to the player after direct input", () => {
    const game = createGameState(fixedRandom);

    steerToward(game, { x: 300, y: 200 });

    expect(game.tutorialAutoSteer).toBe(false);
    expect(game.target).toEqual({ x: 300, y: 200 });
  });

  it("does not spawn extra enemies during the tutorial", () => {
    const game = createGameState(fixedRandom);

    game.spawnClock = 99;
    game.powerUpSpawnClock = 0;
    updateGame(game, 0, fixedRandom);

    expect(game.enemies).toHaveLength(1);
    expect(game.enemies[0]?.kind).toBe("stationary");
    expect(game.spawnClock).toBe(0);
    expect(game.powerUps).toEqual([]);
    expect(game.powerUpSpawnClock).toBe(0);
  });

  it("rejects a direct reverse but accepts a perpendicular turn", () => {
    const game = createGameState(fixedRandom);
    const initialAngle = game.angle;

    setCardinalDirection(game, "up");
    expect(game.angle).toBe(initialAngle);

    setCardinalDirection(game, "right");
    expect(game.angle).toBe(0);
    expect(game.tutorialAutoSteer).toBe(false);
  });

  it("creates a deterministic stationary enemy without extra random calls", () => {
    const values = [0, 0.25, 0.5, 0.75, 0.9];
    let calls = 0;
    const enemy = createEnemy(0, 0, () => values[calls++] ?? 0);

    expect(calls).toBe(5);
    expect(enemy).toMatchObject({
      x: 28,
      y: 28 + 0.25 * (WORLD_HEIGHT - 56),
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

  it("consumes a shield before losing life on a head collision", () => {
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
    game.shieldCharges = 1;
    game.invulnerable = 0;

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toContainEqual({ type: "shield-blocked" });
    expect(game.shieldCharges).toBe(0);
    expect(game.lives).toBe(3);
    expect(game.enemies).not.toContain(enemy);
  });

  it("collects a power-up before resolving enemy movement and collisions", () => {
    const game = createGameState(fixedRandom);
    const head = game.trail.at(-1);
    expect(head).toBeDefined();
    if (!head) return;

    game.enemies = [];
    game.tutorialComplete = true;
    game.powerUps = [
      {
        id: 0,
        kind: "stasis",
        x: head.x,
        y: head.y,
        radius: 12,
        ttl: 10,
        phase: 0,
      },
    ];

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toContainEqual({
      type: "power-up-collected",
      kind: "stasis",
    });
    expect(game.powerUps).toEqual([]);
    expect(game.activeEffects).toEqual([{ kind: "stasis", remaining: 5 }]);
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
    expect(
      Math.hypot(enemy.x - bodyPoint.x, enemy.y - bodyPoint.y),
    ).toBeGreaterThanOrEqual(enemy.size + BODY_WIDTH / 2);
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
    expect(
      Math.hypot(enemy.x - bodyPoint.x, enemy.y - bodyPoint.y),
    ).toBeGreaterThan(20);
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

  it("finishes the tutorial after the first captured enemy", () => {
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
        ...createEnemy(0, 0, fixedRandom),
        x: 400,
        y: 300,
      },
    ];

    const events = updateGame(game, 0, fixedRandom);

    expect(events).toContainEqual({ type: "capture", count: 1, totalKills: 1 });
    expect(game.tutorialComplete).toBe(true);
    expect(game.message).toBe("正式开始，三角敌人会追踪蛇头！");

    game.spawnClock = 99;
    updateGame(game, 0, fixedRandom);

    expect(game.enemies).toHaveLength(1);
    expect(game.enemies[0]?.kind).toBe("tracker");
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
