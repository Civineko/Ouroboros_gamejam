import { describe, expect, it } from "vitest";
import { nativeCollisionSystem } from "../geometry";
import {
  createDevourerBoss,
  damageDevourerBoss,
  updateDevourerBoss,
} from "./bossSystem";

describe("devourer boss system", () => {
  it("spawns inside encounter range and absorbs existing enemies during entry", () => {
    const head = { x: 120, y: 120 };
    const boss = createDevourerBoss(head, [{ x: 300, y: 240 }]);

    expect(boss.name).toBe("噬环者");
    expect(boss.armor).toBe(6);
    expect(boss.phase).toBe(1);
    expect(boss.action).toBe("appearing");
    expect(boss.core.exposed).toBe(false);
    expect(Math.hypot(boss.x - head.x, boss.y - head.y)).toBeGreaterThan(150);
    expect(Math.hypot(boss.x - head.x, boss.y - head.y)).toBeLessThan(210);
    expect(boss.absorbedEnemies).toEqual([{ x: 300, y: 240 }]);
    expect(Math.hypot(boss.core.x - boss.x, boss.core.y - boss.y)).toBeCloseTo(
      155,
    );
  });

  it("telegraphs before charging and leaves hazards from phase two", () => {
    const head = { x: 720, y: 450 };
    const boss = createDevourerBoss(head);

    updateDevourerBoss(boss, head, 1.6, nativeCollisionSystem);
    expect(boss.action).toBe("stalking");
    expect(boss.core.exposed).toBe(true);

    updateDevourerBoss(boss, head, 3.2, nativeCollisionSystem);
    expect(boss.action).toBe("telegraphing");

    const chargeUpdate = updateDevourerBoss(
      boss,
      head,
      1,
      nativeCollisionSystem,
    );
    expect(boss.action).toBe("charging");
    expect(chargeUpdate.chargeStarted).toBe(true);

    const activeChargeUpdate = updateDevourerBoss(
      boss,
      head,
      0,
      nativeCollisionSystem,
    );
    expect(activeChargeUpdate.chargeStarted).toBe(false);

    boss.armor = 4;
    updateDevourerBoss(boss, head, 0.12, nativeCollisionSystem);
    expect(boss.phase).toBe(2);
    expect(boss.hazards).toHaveLength(1);
  });

  it("reports body contact and hides the core after taking damage", () => {
    const boss = createDevourerBoss({ x: 720, y: 450 });
    boss.action = "stalking";
    boss.core.exposed = true;
    boss.core.cooldown = 0;
    const result = updateDevourerBoss(
      boss,
      { x: boss.x, y: boss.y },
      0,
      nativeCollisionSystem,
    );

    expect(result.playerHit).toBe(true);
    expect(damageDevourerBoss(boss, 2)).toBe(2);
    expect(boss.armor).toBe(4);
    expect(boss.phase).toBe(2);
    expect(boss.core.exposed).toBe(false);
    expect(boss.core.cooldown).toBeGreaterThan(1.5);

    const recoveryContact = updateDevourerBoss(
      boss,
      { x: boss.x, y: boss.y },
      0,
      nativeCollisionSystem,
    );
    expect(recoveryContact.playerHit).toBe(false);
  });

  it("lets stasis slow actions without extending existing hazard lifetime", () => {
    const boss = createDevourerBoss({ x: 720, y: 450 });
    boss.action = "charging";
    boss.actionClock = 1;
    boss.armor = 4;
    boss.phase = 2;
    boss.velocityX = 0;
    boss.velocityY = 0;
    boss.hazards = [{ id: 99, x: 200, y: 200, radius: 22, ttl: 1 }];

    updateDevourerBoss(
      boss,
      { x: 720, y: 450 },
      0.5,
      nativeCollisionSystem,
      0.55,
    );

    expect(boss.hazards.find((hazard) => hazard.id === 99)?.ttl).toBe(0.5);
    expect(boss.actionClock).toBeCloseTo(0.725);
  });
});
