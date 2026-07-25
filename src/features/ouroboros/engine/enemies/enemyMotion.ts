import { WORLD_HEIGHT, WORLD_WIDTH } from "../config";
import { distance } from "../geometry";
import type { Enemy, Point, RandomSource } from "../types";
import { enemyMoves } from "./enemyCatalog";

const WORLD_PADDING = 18;
const FLOCK_RADIUS = 96;
const SEPARATION_RADIUS = 58;
const SEPARATION_WEIGHT = 3.2;
const ALIGNMENT_WEIGHT = 0.18;
const COHESION_WEIGHT = 0.08;
const VELOCITY_RESPONSE = 5.5;

export const ENEMY_SEPARATION_PADDING = 9;

interface SteeringVector {
  x: number;
  y: number;
}

function normalize(x: number, y: number): SteeringVector {
  const length = Math.hypot(x, y);
  if (length <= Number.EPSILON) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

function coincidentDirection(firstId: number, secondId: number): SteeringVector {
  const angle = (firstId * 2.399963229728653 + secondId) % (Math.PI * 2);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function flockSteering(enemy: Enemy, flock: readonly Enemy[]): SteeringVector {
  let separationX = 0;
  let separationY = 0;
  let alignmentX = 0;
  let alignmentY = 0;
  let cohesionX = 0;
  let cohesionY = 0;
  let movingNeighbors = 0;

  for (const neighbor of flock) {
    if (neighbor.id === enemy.id) continue;

    const offsetX = enemy.x - neighbor.x;
    const offsetY = enemy.y - neighbor.y;
    const neighborDistance = Math.hypot(offsetX, offsetY);
    const personalSpace =
      enemy.size + neighbor.size + ENEMY_SEPARATION_PADDING;
    const separationRange = Math.max(SEPARATION_RADIUS, personalSpace * 1.6);

    if (neighborDistance < separationRange) {
      const away =
        neighborDistance <= Number.EPSILON
          ? coincidentDirection(enemy.id, neighbor.id)
          : { x: offsetX / neighborDistance, y: offsetY / neighborDistance };
      const strength = (separationRange - neighborDistance) / separationRange;
      separationX += away.x * strength;
      separationY += away.y * strength;
    }

    if (neighborDistance < FLOCK_RADIUS && enemyMoves(neighbor.kind)) {
      const velocity = normalize(neighbor.velocityX, neighbor.velocityY);
      alignmentX += velocity.x;
      alignmentY += velocity.y;
      cohesionX += neighbor.x;
      cohesionY += neighbor.y;
      movingNeighbors += 1;
    }
  }

  if (movingNeighbors > 0) {
    alignmentX /= movingNeighbors;
    alignmentY /= movingNeighbors;
    cohesionX = cohesionX / movingNeighbors - enemy.x;
    cohesionY = cohesionY / movingNeighbors - enemy.y;
  }

  const cohesion = normalize(cohesionX, cohesionY);
  return {
    x:
      separationX * SEPARATION_WEIGHT +
      alignmentX * ALIGNMENT_WEIGHT +
      cohesion.x * COHESION_WEIGHT,
    y:
      separationY * SEPARATION_WEIGHT +
      alignmentY * ALIGNMENT_WEIGHT +
      cohesion.y * COHESION_WEIGHT,
  };
}

function baseSteering(
  enemy: Enemy,
  target: Point,
  delta: number,
  random: RandomSource,
): SteeringVector {
  if (enemy.kind === "tracker") {
    return normalize(target.x - enemy.x, target.y - enemy.y);
  }

  enemy.behaviorClock -= delta;
  if (enemy.behaviorClock <= 0) {
    enemy.heading += (random() - 0.5) * Math.PI * 1.35;
    enemy.behaviorClock = 0.5 + random() * 0.9;
  }

  return { x: Math.cos(enemy.heading), y: Math.sin(enemy.heading) };
}

function keepInsideWorld(enemy: Enemy): void {
  const minimumX = WORLD_PADDING + enemy.size;
  const maximumX = WORLD_WIDTH - WORLD_PADDING - enemy.size;
  const minimumY = WORLD_PADDING + enemy.size;
  const maximumY = WORLD_HEIGHT - WORLD_PADDING - enemy.size;

  if (enemy.x < minimumX || enemy.x > maximumX) {
    enemy.x = Math.max(minimumX, Math.min(maximumX, enemy.x));
    enemy.velocityX *= -1;
  }
  if (enemy.y < minimumY || enemy.y > maximumY) {
    enemy.y = Math.max(minimumY, Math.min(maximumY, enemy.y));
    enemy.velocityY *= -1;
  }

  if (enemy.velocityX !== 0 || enemy.velocityY !== 0) {
    enemy.heading = Math.atan2(enemy.velocityY, enemy.velocityX);
  }
}

function separatePair(first: Enemy, second: Enemy): void {
  const minimumDistance =
    first.size + second.size + ENEMY_SEPARATION_PADDING;
  const currentDistance = distance(first, second);
  if (currentDistance >= minimumDistance) return;

  const direction =
    currentDistance <= Number.EPSILON
      ? coincidentDirection(first.id, second.id)
      : {
          x: (first.x - second.x) / currentDistance,
          y: (first.y - second.y) / currentDistance,
        };
  const overlap = minimumDistance - currentDistance + 0.01;
  const firstMoves = enemyMoves(first.kind);
  const secondMoves = enemyMoves(second.kind);

  if (firstMoves && secondMoves) {
    first.x += direction.x * overlap * 0.5;
    first.y += direction.y * overlap * 0.5;
    second.x -= direction.x * overlap * 0.5;
    second.y -= direction.y * overlap * 0.5;
  } else if (firstMoves) {
    first.x += direction.x * overlap;
    first.y += direction.y * overlap;
  } else if (secondMoves) {
    second.x -= direction.x * overlap;
    second.y -= direction.y * overlap;
  }

  keepInsideWorld(first);
  keepInsideWorld(second);
}

export function resolveEnemyOverlaps(enemies: Enemy[]): void {
  for (let pass = 0; pass < 3; pass += 1) {
    for (let firstIndex = 0; firstIndex < enemies.length; firstIndex += 1) {
      const first = enemies[firstIndex];
      if (!first) continue;

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < enemies.length;
        secondIndex += 1
      ) {
        const second = enemies[secondIndex];
        if (second) separatePair(first, second);
      }
    }
  }
}

export function updateEnemyMotion(
  enemies: Enemy[],
  target: Point,
  delta: number,
  random: RandomSource = Math.random,
): void {
  const flock = enemies.map((enemy) => ({ ...enemy }));
  const response = 1 - Math.exp(-VELOCITY_RESPONSE * delta);

  for (const enemy of enemies) {
    if (!enemyMoves(enemy.kind)) {
      enemy.velocityX = 0;
      enemy.velocityY = 0;
      enemy.collisionRecovery = 0;
      continue;
    }

    enemy.collisionRecovery = Math.max(0, enemy.collisionRecovery - delta);
    if (enemy.collisionRecovery > 0) {
      enemy.x += enemy.velocityX * delta;
      enemy.y += enemy.velocityY * delta;
      keepInsideWorld(enemy);
      continue;
    }

    const base = baseSteering(enemy, target, delta, random);
    const flocking = flockSteering(enemy, flock);
    const desired = normalize(base.x + flocking.x, base.y + flocking.y);
    const desiredVelocityX = desired.x * enemy.speed;
    const desiredVelocityY = desired.y * enemy.speed;

    enemy.velocityX += (desiredVelocityX - enemy.velocityX) * response;
    enemy.velocityY += (desiredVelocityY - enemy.velocityY) * response;
    enemy.x += enemy.velocityX * delta;
    enemy.y += enemy.velocityY * delta;
    keepInsideWorld(enemy);
  }

  resolveEnemyOverlaps(enemies);
}
