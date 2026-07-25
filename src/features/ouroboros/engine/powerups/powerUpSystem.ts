import { HEAD_RADIUS, MAX_LIVES } from "../config";
import type {
  CollisionSystem,
  GameEvent,
  GameState,
  Point,
  RandomSource,
} from "../types";
import { applyPowerUp } from "./powerUpEffects";
import {
  nextPowerUpInterval,
  planPowerUpSpawn,
} from "./powerUpSpawn";

export function updatePowerUps(
  game: GameState,
  head: Point,
  delta: number,
  random: RandomSource,
  collisions: CollisionSystem,
): GameEvent[] {
  const events: GameEvent[] = [];

  for (const powerUp of game.powerUps) powerUp.ttl -= delta;
  game.powerUps = game.powerUps.filter((powerUp) => powerUp.ttl > 0);
  game.powerUpSpawnClock -= delta;

  if (game.powerUps.length === 0 && game.powerUpSpawnClock <= 0) {
    const powerUp = planPowerUpSpawn({
      id: game.nextPowerUpId,
      trail: game.trail,
      enemies: game.enemies,
      lives: game.lives,
      maxLives: MAX_LIVES,
      shieldCharges: game.shieldCharges,
      random,
    });
    if (powerUp) {
      game.powerUps.push(powerUp);
      game.nextPowerUpId += 1;
    }
    game.powerUpSpawnClock = nextPowerUpInterval(random);
  }

  const collectedIndex = game.powerUps.findIndex((powerUp) =>
    Boolean(
      collisions.circleToCircle(
        powerUp,
        powerUp.radius,
        head,
        HEAD_RADIUS,
      ),
    ),
  );
  if (collectedIndex < 0) return events;

  const [collected] = game.powerUps.splice(collectedIndex, 1);
  if (!collected) return events;

  applyPowerUp(game, collected.kind);
  events.push({ type: "power-up-collected", kind: collected.kind });
  return events;
}
