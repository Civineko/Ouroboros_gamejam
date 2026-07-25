import { describe, expect, it } from "vitest";
import { createGameState } from "../gameEngine";
import {
  applyPowerUp,
  powerUpModifiers,
  snapshotBuffs,
  tickPowerUpEffects,
} from "./powerUpEffects";

const fixedRandom = () => 0.25;

describe("power-up effects", () => {
  it("applies instant heal and shield effects", () => {
    const game = createGameState(fixedRandom);
    game.lives = 2;

    applyPowerUp(game, "heal");
    applyPowerUp(game, "shield");

    expect(game.lives).toBe(3);
    expect(game.shieldCharges).toBe(1);
  });

  it("refreshes timed effects instead of stacking them", () => {
    const game = createGameState(fixedRandom);

    applyPowerUp(game, "stasis");
    tickPowerUpEffects(game, 2);
    applyPowerUp(game, "stasis");

    expect(game.activeEffects).toEqual([{ kind: "stasis", remaining: 5 }]);
    expect(powerUpModifiers(game).enemySpeed).toBe(0.55);
  });

  it("derives haste modifiers without changing base state", () => {
    const game = createGameState(fixedRandom);
    applyPowerUp(game, "haste");

    expect(powerUpModifiers(game)).toMatchObject({
      snakeSpeed: 1.18,
      snakeTurn: 1.12,
      closureDistance: 25,
    });
  });

  it("exposes shield charges and timed effects as a read-only HUD snapshot", () => {
    const game = createGameState(fixedRandom);
    applyPowerUp(game, "shield");
    applyPowerUp(game, "haste");
    tickPowerUpEffects(game, 1.25);

    expect(snapshotBuffs(game)).toEqual([
      { kind: "shield", label: "护环", remaining: null },
      { kind: "haste", label: "疾行", remaining: 3.75 },
    ]);
  });
});
