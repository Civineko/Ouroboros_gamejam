import { BODY_WIDTH, HEAD_RADIUS } from "../config";
import type {
  CollisionContact,
  CollisionSystem,
  Enemy,
  Point,
} from "../types";

const CONTACT_SKIN = 1.5;
const HEAD_HITBOX_RADIUS = HEAD_RADIUS - 3;
const HEAD_NECK_EXCLUSION = 40;
const MAX_RESOLUTION_PASSES = 2;

export const COLLISION_RECOVERY_SECONDS = 0.14;

function separateEnemy(enemy: Enemy, contact: CollisionContact): void {
  enemy.x += contact.normalX * (contact.penetration + CONTACT_SKIN);
  enemy.y += contact.normalY * (contact.penetration + CONTACT_SKIN);
}

function reboundEnemy(enemy: Enemy, contact: CollisionContact): void {
  separateEnemy(enemy, contact);
  enemy.velocityX = enemy.velocityX === 0 ? 0 : -enemy.velocityX;
  enemy.velocityY = enemy.velocityY === 0 ? 0 : -enemy.velocityY;

  if (enemy.velocityX !== 0 || enemy.velocityY !== 0) {
    enemy.heading = Math.atan2(enemy.velocityY, enemy.velocityX);
    enemy.collisionRecovery = COLLISION_RECOVERY_SECONDS;
  }
}

function bodyEndIndex(trail: readonly Point[], exclusionLength: number): number {
  let distanceFromHead = 0;

  for (let index = trail.length - 1; index > 0; index -= 1) {
    const newer = trail[index];
    const older = trail[index - 1];
    if (!newer || !older) continue;

    distanceFromHead += Math.hypot(newer.x - older.x, newer.y - older.y);
    if (distanceFromHead >= exclusionLength) return index - 1;
  }

  return 0;
}

function deepestBodyContact(
  enemy: Enemy,
  trail: readonly Point[],
  collisions: CollisionSystem,
): CollisionContact | null {
  let deepest: CollisionContact | null = null;
  const exclusionLength =
    HEAD_NECK_EXCLUSION + enemy.size + BODY_WIDTH / 2;
  const lastBodyPoint = bodyEndIndex(trail, exclusionLength);

  for (let index = 0; index < lastBodyPoint; index += 1) {
    const segmentStart = trail[index];
    const segmentEnd = trail[index + 1];
    if (!segmentStart || !segmentEnd) continue;

    const contact = collisions.circleToSegment(
      enemy,
      enemy.size,
      segmentStart,
      segmentEnd,
      BODY_WIDTH / 2,
    );
    if (contact && (!deepest || contact.penetration > deepest.penetration)) {
      deepest = contact;
    }
  }

  return deepest;
}

export function resolveEnemySnakeCollisions(
  enemies: Enemy[],
  trail: readonly Point[],
  collisions: CollisionSystem,
): Enemy[] {
  const head = trail.at(-1);
  if (!head) return [];

  const headHits: Enemy[] = [];
  const headHitIds = new Set<number>();

  for (const enemy of enemies) {
    const contact = collisions.circleToCircle(
      enemy,
      enemy.size,
      head,
      HEAD_HITBOX_RADIUS,
    );
    if (!contact) continue;

    headHits.push(enemy);
    headHitIds.add(enemy.id);
  }

  for (const enemy of enemies) {
    if (headHitIds.has(enemy.id)) continue;

    const firstContact = deepestBodyContact(enemy, trail, collisions);
    if (!firstContact) continue;

    reboundEnemy(enemy, firstContact);
    for (let pass = 1; pass < MAX_RESOLUTION_PASSES; pass += 1) {
      const contact = deepestBodyContact(enemy, trail, collisions);
      if (!contact) break;
      separateEnemy(enemy, contact);
    }
  }

  return headHits;
}
