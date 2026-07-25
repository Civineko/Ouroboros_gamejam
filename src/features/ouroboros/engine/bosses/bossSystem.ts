import { HEAD_RADIUS, WORLD_HEIGHT, WORLD_WIDTH } from "../config";
import type {
  BossState,
  CollisionSystem,
  Point,
} from "../types";
import {
  DEVOURER_CORE_ORBIT_RADIUS,
  DEVOURER_CORE_RADIUS,
  DEVOURER_CORE_RECOVERY,
  DEVOURER_ENTRANCE_SECONDS,
  DEVOURER_MAX_ARMOR,
  DEVOURER_NAME,
  DEVOURER_RADIUS,
  devourerChargeSpeed,
  devourerPhaseForArmor,
  devourerStalkDuration,
  devourerSummonInterval,
} from "./bossCatalog";

const WORLD_MARGIN = 190;
const SPAWN_DISTANCE = 180;
const TELEGRAPH_SECONDS = 1;
const CHARGE_SECONDS = 0.72;
const RECOVERY_SECONDS = 0.9;
const HAZARD_INTERVAL = 0.11;
const HAZARD_TTL = 3.2;
const HAZARD_RADIUS = 22;

export interface BossUpdateResult {
  playerHit: boolean;
  summonCount: number;
  chargeStarted: boolean;
}

function clampSpawnPoint(point: Point): Point {
  return {
    x: Math.max(WORLD_MARGIN, Math.min(WORLD_WIDTH - WORLD_MARGIN, point.x)),
    y: Math.max(WORLD_MARGIN, Math.min(WORLD_HEIGHT - WORLD_MARGIN, point.y)),
  };
}

function worldClearance(point: Point): number {
  return Math.min(
    point.x,
    WORLD_WIDTH - point.x,
    point.y,
    WORLD_HEIGHT - point.y,
  );
}

function spawnPositionNearHead(head: Point, heading: number): Point {
  const sideAngle = heading + Math.PI / 2;
  const offsetX = Math.cos(sideAngle) * SPAWN_DISTANCE;
  const offsetY = Math.sin(sideAngle) * SPAWN_DISTANCE;
  const firstSide = clampSpawnPoint({
    x: head.x + offsetX,
    y: head.y + offsetY,
  });
  const secondSide = clampSpawnPoint({
    x: head.x - offsetX,
    y: head.y - offsetY,
  });

  return worldClearance(firstSide) >= worldClearance(secondSide)
    ? firstSide
    : secondSide;
}

function syncCorePosition(boss: BossState): void {
  boss.core.x =
    boss.x + Math.cos(boss.core.orbitAngle) * DEVOURER_CORE_ORBIT_RADIUS;
  boss.core.y =
    boss.y + Math.sin(boss.core.orbitAngle) * DEVOURER_CORE_ORBIT_RADIUS;
}

export function createDevourerBoss(
  head: Point,
  absorbedEnemies: readonly Point[] = [],
  playerHeading = 0,
): BossState {
  const position = spawnPositionNearHead(head, playerHeading);
  const boss: BossState = {
    ...position,
    kind: "devourer",
    name: DEVOURER_NAME,
    radius: DEVOURER_RADIUS,
    armor: DEVOURER_MAX_ARMOR,
    maxArmor: DEVOURER_MAX_ARMOR,
    phase: 1,
    action: "appearing",
    actionClock: DEVOURER_ENTRANCE_SECONDS,
    heading: 0,
    target: { ...head },
    velocityX: 0,
    velocityY: 0,
    core: {
      x: position.x,
      y: position.y,
      radius: DEVOURER_CORE_RADIUS,
      exposed: false,
      cooldown: DEVOURER_ENTRANCE_SECONDS,
      orbitAngle: 0,
    },
    hazards: [],
    nextHazardId: 0,
    hazardClock: 0,
    summonClock: 4,
    absorbedEnemies: absorbedEnemies.map((enemy) => ({ ...enemy })),
    phaseFlash: 0,
    hitFlash: 0,
  };
  syncCorePosition(boss);
  return boss;
}

function beginTelegraph(boss: BossState, head: Point): void {
  boss.action = "telegraphing";
  boss.actionClock = TELEGRAPH_SECONDS;
  boss.target = { ...head };
  boss.heading = Math.atan2(head.y - boss.y, head.x - boss.x);
  boss.velocityX = 0;
  boss.velocityY = 0;
}

function beginCharge(boss: BossState): void {
  const speed = devourerChargeSpeed(boss.phase);
  boss.action = "charging";
  boss.actionClock = CHARGE_SECONDS;
  boss.heading = Math.atan2(boss.target.y - boss.y, boss.target.x - boss.x);
  boss.velocityX = Math.cos(boss.heading) * speed;
  boss.velocityY = Math.sin(boss.heading) * speed;
  boss.hazardClock = 0;
}

function beginRecovery(boss: BossState): void {
  boss.action = "recovering";
  boss.actionClock = RECOVERY_SECONDS;
  boss.velocityX = 0;
  boss.velocityY = 0;
}

function beginStalking(boss: BossState): void {
  boss.action = "stalking";
  boss.actionClock = devourerStalkDuration(boss.phase);
}

function updateStalking(boss: BossState, head: Point, delta: number): void {
  const heading = Math.atan2(head.y - boss.y, head.x - boss.x);
  const speed = boss.phase === 1 ? 34 : boss.phase === 2 ? 44 : 54;
  boss.heading = heading;
  boss.velocityX = Math.cos(heading) * speed;
  boss.velocityY = Math.sin(heading) * speed;
  boss.x += boss.velocityX * delta;
  boss.y += boss.velocityY * delta;
}

function addChargeHazard(boss: BossState): void {
  boss.hazards.push({
    id: boss.nextHazardId,
    x: boss.x,
    y: boss.y,
    radius: HAZARD_RADIUS,
    ttl: HAZARD_TTL,
  });
  boss.nextHazardId += 1;
}

function updateCharge(boss: BossState, delta: number): void {
  boss.x += boss.velocityX * delta;
  boss.y += boss.velocityY * delta;

  if (boss.phase >= 2) {
    boss.hazardClock -= delta;
    if (boss.hazardClock <= 0) {
      addChargeHazard(boss);
      boss.hazardClock += HAZARD_INTERVAL;
    }
  }
}

function clampBossToWorld(boss: BossState): boolean {
  const clampedX = Math.max(
    WORLD_MARGIN,
    Math.min(WORLD_WIDTH - WORLD_MARGIN, boss.x),
  );
  const clampedY = Math.max(
    WORLD_MARGIN,
    Math.min(WORLD_HEIGHT - WORLD_MARGIN, boss.y),
  );
  const touchedBoundary = clampedX !== boss.x || clampedY !== boss.y;
  boss.x = clampedX;
  boss.y = clampedY;
  return touchedBoundary;
}

function tickHazards(boss: BossState, delta: number): void {
  for (const hazard of boss.hazards) hazard.ttl -= delta;
  boss.hazards = boss.hazards.filter((hazard) => hazard.ttl > 0);
}

function touchesPlayer(
  boss: BossState,
  head: Point,
  collisions: CollisionSystem,
): boolean {
  if (boss.action === "appearing" || boss.action === "recovering") {
    return false;
  }

  if (collisions.circleToCircle(boss, boss.radius, head, HEAD_RADIUS - 3)) {
    return true;
  }

  return boss.hazards.some((hazard) =>
    Boolean(
      collisions.circleToCircle(hazard, hazard.radius, head, HEAD_RADIUS - 3),
    ),
  );
}

export function updateDevourerBoss(
  boss: BossState,
  head: Point,
  delta: number,
  collisions: CollisionSystem,
  speedModifier = 1,
): BossUpdateResult {
  const actionDelta = delta * speedModifier;
  boss.phase = devourerPhaseForArmor(boss.armor);
  tickHazards(boss, delta);
  boss.phaseFlash = Math.max(0, boss.phaseFlash - delta);
  boss.hitFlash = Math.max(0, boss.hitFlash - delta);

  boss.core.cooldown = Math.max(0, boss.core.cooldown - delta);
  if (boss.core.cooldown === 0 && boss.action !== "appearing") {
    boss.core.exposed = true;
  }

  const orbitSpeed =
    boss.action === "telegraphing"
      ? 0.22
      : boss.action === "recovering"
        ? 0.38
        : 0.75 + boss.phase * 0.12;
  boss.core.orbitAngle += actionDelta * orbitSpeed;

  if (boss.action === "appearing") {
    boss.actionClock -= delta;
    if (boss.actionClock <= 0) {
      boss.absorbedEnemies = [];
      boss.core.exposed = true;
      boss.core.cooldown = 0;
      beginStalking(boss);
    }
    syncCorePosition(boss);
    return { playerHit: false, summonCount: 0, chargeStarted: false };
  }

  boss.actionClock -= actionDelta;
  let chargeStarted = false;
  if (boss.action === "stalking") {
    updateStalking(boss, head, actionDelta);
    if (boss.actionClock <= 0) beginTelegraph(boss, head);
  } else if (boss.action === "telegraphing") {
    if (boss.actionClock <= 0) {
      beginCharge(boss);
      chargeStarted = true;
    }
  } else if (boss.action === "charging") {
    updateCharge(boss, actionDelta);
    if (boss.actionClock <= 0 || clampBossToWorld(boss)) beginRecovery(boss);
  } else if (boss.actionClock <= 0) {
    beginStalking(boss);
  }

  clampBossToWorld(boss);
  syncCorePosition(boss);

  boss.summonClock -= actionDelta;
  let summonCount = 0;
  if (boss.summonClock <= 0) {
    summonCount = boss.phase === 1 ? 1 : 2;
    boss.summonClock = devourerSummonInterval(boss.phase);
  }

  return {
    playerHit: touchesPlayer(boss, head, collisions),
    summonCount,
    chargeStarted,
  };
}

export function isDevourerCoreCaptured(
  boss: BossState,
  ring: readonly Point[],
  collisions: CollisionSystem,
): boolean {
  return boss.core.exposed && collisions.containsPoint(ring, boss.core);
}

export function damageDevourerBoss(boss: BossState, damage: number): number {
  const previousPhase = boss.phase;
  const appliedDamage = Math.min(boss.armor, Math.max(0, Math.floor(damage)));
  boss.armor -= appliedDamage;
  boss.phase = devourerPhaseForArmor(boss.armor);
  if (boss.phase !== previousPhase) boss.phaseFlash = 1.2;
  boss.hitFlash = 0.65;
  boss.core.exposed = false;
  boss.core.cooldown = DEVOURER_CORE_RECOVERY;
  beginRecovery(boss);
  return appliedDamage;
}
