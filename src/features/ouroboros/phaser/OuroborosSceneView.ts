import Phaser from "phaser";
import {
  BODY_WIDTH,
  BULLET_HIT_LENGTH_PENALTY,
  HEAD_RADIUS,
  levelColor,
  TAIL_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../engine/config";
import { DEVOURER_ENTRANCE_SECONDS } from "../engine/bosses/bossCatalog";
import type { Bullet, Enemy, GameState, Point, PowerUp } from "../engine/types";
import { OUROBOROS_ART_KEYS } from "./assets/assetCatalog";
import { paintEnemyIcon } from "./assets/placeholders/enemyIconPainters";
import { paintPowerUpIcon } from "./assets/placeholders/powerUpIconPainters";
import { devourerActionFrame } from "./bossArtFrames";

const COLORS = {
  stage: 0x48678f,
  stageLine: 0xfffdf7,
  stageBorder: 0xfffdf7,
  ink: 0x263b42,
  shadow: 0x192531,
  body: 0x5c9e94,
  bodyFlash: 0xf4d872,
  bodyHighlight: 0xffffff,
  tail: 0xfff9ec,
  tailCore: 0xef624f,
  head: 0xf2ba49,
  bossTelegraph: 0xf2ba49,
  bossHazard: 0xef624f,
  bossPhaseTwo: 0xf2ba49,
  bossPhaseThree: 0xb77cff,
} as const;

const BOSS_DEFEAT_COLORS = [
  0xfff5ca,
  0xf2ba49,
  0xef624f,
  0x58d5c9,
  0xb77cff,
  0xffffff,
] as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

interface EnemyView {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
}

interface BulletView {
  graphics: Phaser.GameObjects.Graphics;
}

interface PowerUpView {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
}

function traceTrail(
  graphics: Phaser.GameObjects.Graphics,
  trail: readonly Point[],
  offsetX = 0,
  offsetY = 0,
): void {
  const first = trail[0];
  if (!first) return;

  graphics.beginPath();
  graphics.moveTo(first.x + offsetX, first.y + offsetY);
  for (let index = 1; index < trail.length; index += 1) {
    const point = trail[index];
    if (point) graphics.lineTo(point.x + offsetX, point.y + offsetY);
  }
  graphics.strokePath();
}

export class OuroborosSceneView {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly bossHazards: Phaser.GameObjects.Graphics;
  private readonly bossTelegraph: Phaser.GameObjects.Graphics;
  private readonly boss: Phaser.GameObjects.Graphics;
  private readonly bossBodyArt: Phaser.GameObjects.Sprite;
  private readonly bossCoreArt: Phaser.GameObjects.Image;
  private readonly bossChargeArt: Phaser.GameObjects.Image;
  private readonly bossDefeat: Phaser.GameObjects.Graphics;
  private readonly bossIndicator: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly head: Phaser.GameObjects.Graphics;
  private readonly headFlash: Phaser.GameObjects.Graphics;
  private readonly enemies = new Map<number, EnemyView>();
  private readonly bullets = new Map<number, BulletView>();
  private readonly powerUps = new Map<number, PowerUpView>();
  private introRevealing = false;
  private currentLevel = 1;
  private bgColor: number = COLORS.stage;

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.graphics().setDepth(0);
    this.ring = scene.add.graphics().setDepth(1);
    this.bossHazards = scene.add.graphics().setDepth(1.5);
    this.bossTelegraph = scene.add.graphics().setDepth(2.4);
    this.bossChargeArt = scene.add
      .image(0, 0, OUROBOROS_ART_KEYS.bossChargeWarning)
      .setDepth(2.45)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.bossBodyArt = scene.add
      .sprite(0, 0, OUROBOROS_ART_KEYS.bossDevourerActions, 0)
      .setDepth(2.6)
      .setVisible(false);
    this.bossCoreArt = scene.add
      .image(0, 0, OUROBOROS_ART_KEYS.bossDevourerCore)
      .setDepth(2.7)
      .setVisible(false);
    this.boss = scene.add.graphics().setDepth(2.75);
    this.bossDefeat = scene.add.graphics().setDepth(5);
    this.bossIndicator = scene.add
      .graphics()
      .setDepth(20)
      .setScrollFactor(0);
    this.body = scene.add.graphics().setDepth(3);
    this.head = scene.add.graphics().setDepth(4);
    this.headFlash = scene.add.graphics().setDepth(5);

    this.drawBackground(COLORS.stage);
    this.drawHead();
  }

  render(game: GameState): void {
    // 关卡变化时切换背景色
    if (game.level !== this.currentLevel) {
      this.currentLevel = game.level;
      const hexColor = levelColor(game.level);
      this.bgColor = parseInt(hexColor.slice(1), 16);
      this.redrawBackground();
    }

    this.drawRing(game);
    this.drawBoss(game);
    this.drawBossDefeat(game);
    this.drawBossIndicator(game);
    this.syncEnemies(game);
    this.syncBullets(game);
    this.syncPowerUps(game);
    this.drawBody(game);

    const head = game.trail.at(-1);
    if (head) {
      this.head.setPosition(head.x, head.y);
      this.head.setRotation(game.angle);
      if (!this.introRevealing) {
        this.head.setAlpha(
          game.invulnerable > 0 && Math.floor(game.invulnerable * 12) % 2 === 0
            ? 0.45
            : 1,
        );
      }

      // 被子弹命中红色闪烁
      this.headFlash.clear();
      this.headFlash.setPosition(head.x, head.y);
      if (game.bulletHitFlash > 0) {
        const alpha = Math.floor(game.bulletHitFlash * 20) % 2 === 0 ? 0.7 : 0.3;
        this.headFlash.fillStyle(0xff3030, alpha);
        this.headFlash.fillCircle(0, 0, HEAD_RADIUS + 4);
      }
    }
  }

  playIntroReveal(): void {
    this.introRevealing = true;

    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;
    this.background
      .setAlpha(0)
      .setScale(1.06)
      .setPosition(centerX * -0.06, centerY * -0.06);
    this.body
      .setAlpha(0)
      .setScale(0.78)
      .setPosition(centerX * 0.22, centerY * 0.22);
    this.head.setAlpha(0).setScale(0.24);

    for (const view of this.enemies.values()) {
      view.container.setAlpha(0).setScale(0.18);
    }

    this.scene.tweens.add({
      targets: this.background,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      duration: 650,
      ease: "Cubic.Out",
    });
    this.scene.tweens.add({
      targets: this.body,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      delay: 430,
      duration: 620,
      ease: "Back.Out",
    });
    this.scene.tweens.add({
      targets: this.head,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      delay: 600,
      duration: 500,
      ease: "Back.Out",
    });

    const enemyTargets = [...this.enemies.values()].map(
      (view) => view.container,
    );
    this.scene.tweens.add({
      targets: enemyTargets,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      delay: 980,
      duration: 480,
      ease: "Back.Out",
      onComplete: () => {
        this.introRevealing = false;
      },
    });
  }

  completeIntroReveal(): void {
    this.introRevealing = false;
    this.scene.tweens.killTweensOf(this.background);
    this.scene.tweens.killTweensOf(this.body);
    this.scene.tweens.killTweensOf(this.head);

    this.background.setAlpha(1).setScale(1).setPosition(0, 0);
    this.body.setAlpha(1).setScale(1).setPosition(0, 0);
    this.head.setAlpha(1).setScale(1);

    for (const view of this.enemies.values()) {
      this.scene.tweens.killTweensOf(view.container);
      view.container.setAlpha(1).setScale(1);
    }
  }

  /** 清除并重绘背景（世界尺寸或关卡变化后调用） */
  redrawBackground(): void {
    this.background.clear();
    this.drawBackground(this.bgColor);
  }

  destroy(): void {
    for (const view of this.enemies.values()) view.container.destroy(true);
    this.enemies.clear();
    for (const view of this.bullets.values()) view.graphics.destroy(true);
    this.bullets.clear();
    for (const view of this.powerUps.values()) view.container.destroy(true);
    this.powerUps.clear();
    this.bossBodyArt.destroy();
    this.bossCoreArt.destroy();
    this.bossChargeArt.destroy();
  }

  private drawBackground(color: number = COLORS.stage): void {
    this.background.fillStyle(color, 1);
    this.background.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.background.lineStyle(1, COLORS.stageLine, 0.1);

    for (let x = 40; x < WORLD_WIDTH; x += 40) {
      this.background.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = 40; y < WORLD_HEIGHT; y += 40) {
      this.background.lineBetween(0, y, WORLD_WIDTH, y);
    }

    this.background.lineStyle(1, COLORS.stageBorder, 0.2);
    this.background.strokeRect(12, 12, WORLD_WIDTH - 24, WORLD_HEIGHT - 24);
  }

  private drawRing(game: GameState): void {
    this.ring.clear();
    if (!game.lastRing || game.closureFlash <= 0) return;

    const first = game.lastRing[0];
    if (!first) return;

    this.ring.fillStyle(COLORS.bodyFlash, game.closureFlash * 0.2);
    this.ring.lineStyle(7, 0xfff5ca, game.closureFlash);
    this.ring.beginPath();
    this.ring.moveTo(first.x, first.y);
    for (let index = 1; index < game.lastRing.length; index += 1) {
      const point = game.lastRing[index];
      if (point) this.ring.lineTo(point.x, point.y);
    }
    this.ring.closePath();
    this.ring.fillPath();
    this.ring.strokePath();
  }

  private drawBody(game: GameState): void {
    this.body.clear();
    if (game.trail.length < 2) return;

    this.body.lineStyle(BODY_WIDTH + 3, COLORS.shadow, 0.23);
    traceTrail(this.body, game.trail, 6, 7);

    this.body.lineStyle(
      BODY_WIDTH,
      game.closureFlash > 0 ? COLORS.bodyFlash : COLORS.body,
      1,
    );
    traceTrail(this.body, game.trail);

    this.body.lineStyle(5, COLORS.bodyHighlight, 0.22);
    traceTrail(this.body, game.trail, -1, -2);

    const tail = game.trail[0];
    if (!tail) return;

    this.body.fillStyle(COLORS.shadow, 0.18);
    this.body.fillCircle(tail.x + 5, tail.y + 6, TAIL_RADIUS + 1);
    this.body.fillStyle(COLORS.tail, 1);
    this.body.fillCircle(tail.x, tail.y, TAIL_RADIUS);
    this.body.fillStyle(COLORS.tailCore, 1);
    this.body.fillCircle(tail.x, tail.y, 6);

    // 被子弹命中时尾部红色闪烁
    if (game.tailShrinkFlash > 0) {
      const flashAlpha = Math.floor(game.tailShrinkFlash * 20) % 2 === 0 ? 0.8 : 0.2;
      this.body.lineStyle(BODY_WIDTH + 4, 0xff3030, flashAlpha);

      let accumulated = 0;
      for (let i = 1; i < game.trail.length && accumulated < BULLET_HIT_LENGTH_PENALTY; i++) {
        const prev = game.trail[i - 1];
        const curr = game.trail[i];
        if (!prev || !curr) continue;
        const segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        this.body.beginPath();
        this.body.moveTo(prev.x, prev.y);
        this.body.lineTo(curr.x, curr.y);
        this.body.strokePath();
        accumulated += segLen;
      }
    }
  }

  private drawBoss(game: GameState): void {
    this.bossHazards.clear();
    this.bossTelegraph.clear();
    this.boss.clear();
    this.bossBodyArt.setVisible(false);
    this.bossCoreArt.setVisible(false);
    this.bossChargeArt.setVisible(false);
    if (!game.boss) return;

    const accent =
      game.boss.phase === 1
        ? COLORS.bossHazard
        : game.boss.phase === 2
          ? COLORS.bossPhaseTwo
          : COLORS.bossPhaseThree;

    if (game.boss.action === "appearing") {
      const progress =
        1 -
        Math.max(0, game.boss.actionClock) / DEVOURER_ENTRANCE_SECONDS;
      const easedProgress = 1 - (1 - progress) ** 3;

      for (const enemy of game.boss.absorbedEnemies) {
        const x = enemy.x + (game.boss.x - enemy.x) * easedProgress;
        const y = enemy.y + (game.boss.y - enemy.y) * easedProgress;
        this.bossTelegraph.lineStyle(2, accent, (1 - progress) * 0.42);
        this.bossTelegraph.lineBetween(enemy.x, enemy.y, x, y);
        this.bossTelegraph.fillStyle(accent, Math.max(0.1, 1 - progress));
        this.bossTelegraph.fillCircle(x, y, 6 + (1 - progress) * 5);
      }

      this.bossTelegraph.lineStyle(5, accent, 0.72 - progress * 0.35);
      this.bossTelegraph.strokeCircle(
        game.boss.x,
        game.boss.y,
        145 - progress * 82,
      );
      this.bossTelegraph.lineStyle(2, 0xfff5ca, 0.5 - progress * 0.24);
      this.bossTelegraph.strokeCircle(
        game.boss.x,
        game.boss.y,
        205 - progress * 126,
      );
    }

    for (const hazard of game.boss.hazards) {
      const alpha =
        Math.min(0.5, hazard.ttl / 3.2) *
        (0.78 + Math.sin(game.elapsed * 8 + hazard.id) * 0.22);
      this.bossHazards.fillStyle(COLORS.bossHazard, alpha);
      this.bossHazards.fillCircle(hazard.x, hazard.y, hazard.radius);
      this.bossHazards.fillStyle(COLORS.shadow, alpha * 0.25);
      this.bossHazards.fillCircle(hazard.x, hazard.y, hazard.radius * 0.46);
      this.bossHazards.lineStyle(2, COLORS.bodyFlash, alpha * 0.8);
      this.bossHazards.strokeCircle(hazard.x, hazard.y, hazard.radius + 3);
    }

    if (game.boss.action === "telegraphing") {
      const pulse = 0.45 + Math.sin(game.elapsed * 14) * 0.18;
      const angle = Math.atan2(
        game.boss.target.y - game.boss.y,
        game.boss.target.x - game.boss.x,
      );
      const offsetX = Math.cos(angle + Math.PI / 2) * 16;
      const offsetY = Math.sin(angle + Math.PI / 2) * 16;
      this.bossTelegraph.lineStyle(3, accent, pulse);
      this.bossTelegraph.lineBetween(
        game.boss.x + offsetX,
        game.boss.y + offsetY,
        game.boss.target.x + offsetX,
        game.boss.target.y + offsetY,
      );
      this.bossTelegraph.lineBetween(
        game.boss.x - offsetX,
        game.boss.y - offsetY,
        game.boss.target.x - offsetX,
        game.boss.target.y - offsetY,
      );
      this.bossTelegraph.lineStyle(6, COLORS.bossTelegraph, pulse * 0.48);
      this.bossTelegraph.lineBetween(
        game.boss.x,
        game.boss.y,
        game.boss.target.x,
        game.boss.target.y,
      );
      this.bossTelegraph.fillStyle(COLORS.bossTelegraph, pulse);
      this.bossTelegraph.fillCircle(
        game.boss.target.x,
        game.boss.target.y,
        13,
      );
    }

    if (
      game.boss.action !== "appearing" &&
      game.boss.summonClock > 0 &&
      game.boss.summonClock <= 1
    ) {
      const progress = 1 - game.boss.summonClock;
      this.bossTelegraph.lineStyle(3, accent, 0.3 + progress * 0.5);
      this.bossTelegraph.strokeCircle(
        game.boss.x,
        game.boss.y,
        68 + progress * 54,
      );
      this.bossTelegraph.strokeCircle(
        game.boss.x,
        game.boss.y,
        92 + progress * 72,
      );
    }

    if (game.boss.phaseFlash > 0) {
      const progress = 1 - game.boss.phaseFlash / 1.2;
      this.bossTelegraph.lineStyle(8, accent, game.boss.phaseFlash / 1.2);
      this.bossTelegraph.strokeCircle(
        game.boss.x,
        game.boss.y,
        62 + progress * 150,
      );
    }

    this.drawBossArt(game, accent);
  }

  private drawBossArt(game: GameState, accent: number): void {
    const boss = game.boss;
    if (!boss) return;

    const pulse = Math.sin(game.elapsed * 5.5) * 2;
    const entranceProgress =
      boss.action === "appearing"
        ? 1 - Math.max(0, boss.actionClock) / DEVOURER_ENTRANCE_SECONDS
        : 1;
    const alpha = 0.18 + entranceProgress * 0.82;
    const artRotation = boss.action === "appearing" ? 0 : boss.heading;

    this.bossBodyArt
      .setVisible(true)
      .setFrame(devourerActionFrame(boss.action, game.elapsed, boss.hitFlash))
      .setPosition(boss.x, boss.y)
      .setRotation(artRotation)
      .setDisplaySize(150 + pulse, 150 + pulse)
      .setAlpha(alpha)
      .clearTint();

    if (boss.action === "telegraphing") {
      this.bossBodyArt.setTint(0xff8b82);
      const chargeProgress = clamp01(1 - boss.actionClock);
      const chargePulse = Math.sin(game.elapsed * 18) * 8;
      this.bossChargeArt
        .setVisible(true)
        .setPosition(boss.x, boss.y)
        .setRotation(-game.elapsed * 2.2)
        .setDisplaySize(
          104 + chargeProgress * 54 + chargePulse,
          104 + chargeProgress * 54 + chargePulse,
        )
        .setTint(COLORS.bossHazard)
        .setAlpha(0.42 + chargeProgress * 0.42);
    }

    if (boss.hitFlash > 0 && Math.floor(boss.hitFlash * 18) % 2 === 0) {
      this.bossBodyArt.setTint(0xffffff).setTintFill();
    }

    this.bossTelegraph.fillStyle(COLORS.shadow, 0.25 * alpha);
    this.bossTelegraph.fillEllipse(boss.x + 7, boss.y + 10, 116, 74);
    this.boss.lineStyle(2, accent, 0.4 * alpha);
    this.boss.strokeCircle(boss.x, boss.y, boss.radius + 15);

    for (let index = 0; index < boss.maxArmor; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / boss.maxArmor;
      const armorX = boss.x + Math.cos(angle) * (boss.radius + 22);
      const armorY = boss.y + Math.sin(angle) * (boss.radius + 22);
      this.boss.fillStyle(
        index < boss.armor ? accent : COLORS.shadow,
        (index < boss.armor ? 1 : 0.3) * alpha,
      );
      this.boss.fillCircle(armorX, armorY, 5);
    }

    this.boss.lineStyle(1, accent, boss.core.exposed ? 0.2 : 0.08);
    this.boss.strokeCircle(boss.x, boss.y, 155);
    this.boss.lineStyle(2, 0xfff5ca, boss.core.exposed ? 0.38 : 0.14);
    this.boss.lineBetween(boss.x, boss.y, boss.core.x, boss.core.y);

    const coreSize = boss.core.exposed ? 52 + pulse * 0.35 : 46;
    this.bossCoreArt
      .setVisible(true)
      .setPosition(boss.core.x, boss.core.y)
      .setRotation(game.elapsed * (boss.core.exposed ? 1.2 : 0.35))
      .setDisplaySize(coreSize, coreSize)
      .setAlpha(boss.core.exposed ? alpha : alpha * 0.56)
      .clearTint();

    if (!boss.core.exposed) {
      this.bossCoreArt.setTint(0x51545a);
      this.boss.lineStyle(4, accent, 0.72);
      this.boss.lineBetween(
        boss.core.x - 9,
        boss.core.y - 9,
        boss.core.x + 9,
        boss.core.y + 9,
      );
      this.boss.lineBetween(
        boss.core.x + 9,
        boss.core.y - 9,
        boss.core.x - 9,
        boss.core.y + 9,
      );
      return;
    }

    const captureHaloRadius = boss.core.radius + 19 + pulse * 0.45;
    this.boss.lineStyle(3, 0xfff5ca, 0.58);
    this.boss.strokeCircle(boss.core.x, boss.core.y, captureHaloRadius);
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4 + Math.PI / 4;
      this.boss.lineStyle(4, accent, 0.86);
      this.boss.lineBetween(
        boss.core.x + Math.cos(angle) * (captureHaloRadius + 10),
        boss.core.y + Math.sin(angle) * (captureHaloRadius + 10),
        boss.core.x + Math.cos(angle) * (captureHaloRadius - 2),
        boss.core.y + Math.sin(angle) * (captureHaloRadius - 2),
      );
    }
  }

  private drawBossDefeat(game: GameState): void {
    this.bossDefeat.clear();
    const effect = game.bossDefeatEffect;
    if (!effect) return;

    const progress = clamp01(1 - effect.remaining / effect.duration);
    const { x, y } = effect;

    const implosion = clamp01(progress / 0.18);
    if (implosion < 1) {
      const radius = 22 + (1 - implosion) * 112;
      this.bossDefeat.fillStyle(0xb77cff, (1 - implosion) * 0.18);
      this.bossDefeat.fillCircle(x, y, radius);
      this.bossDefeat.lineStyle(7, 0xfff5ca, 0.35 + implosion * 0.65);
      this.bossDefeat.strokeCircle(x, y, radius);
    }

    const flash = clamp01((progress - 0.07) / 0.24);
    if (flash > 0 && flash < 1) {
      this.bossDefeat.fillStyle(0xffffff, (1 - flash) ** 2 * 0.92);
      this.bossDefeat.fillCircle(x, y, 24 + flash * 142);
      this.bossDefeat.fillStyle(0xfff5ca, (1 - flash) * 0.84);
      this.bossDefeat.fillCircle(x, y, 13 + flash * 52);
    }

    const ringDelays = [0.1, 0.19, 0.3] as const;
    for (let index = 0; index < ringDelays.length; index += 1) {
      const ringProgress = clamp01((progress - ringDelays[index]!) / 0.58);
      if (ringProgress <= 0 || ringProgress >= 1) continue;
      const color =
        BOSS_DEFEAT_COLORS[(index + 1) % BOSS_DEFEAT_COLORS.length]!;
      this.bossDefeat.lineStyle(
        8 - index * 2,
        color,
        (1 - ringProgress) ** 1.35 * 0.88,
      );
      this.bossDefeat.strokeCircle(
        x,
        y,
        48 + ringProgress * (330 + index * 35),
      );
    }

    const beamProgress = clamp01((progress - 0.08) / 0.56);
    if (beamProgress > 0 && beamProgress < 1) {
      const beamAlpha = (1 - beamProgress) ** 1.45;
      for (let index = 0; index < 16; index += 1) {
        const angle = (Math.PI * 2 * index) / 16 + index * 0.037;
        const inner = 20 + beamProgress * 74;
        const outer = 76 + beamProgress * (210 + (index % 4) * 28);
        const color =
          BOSS_DEFEAT_COLORS[index % BOSS_DEFEAT_COLORS.length]!;
        this.bossDefeat.lineStyle(
          index % 3 === 0 ? 7 : 4,
          color,
          beamAlpha * 0.78,
        );
        this.bossDefeat.lineBetween(
          x + Math.cos(angle) * inner,
          y + Math.sin(angle) * inner,
          x + Math.cos(angle) * outer,
          y + Math.sin(angle) * outer,
        );
      }
    }

    for (let index = 0; index < 30; index += 1) {
      const delay = (index % 6) * 0.015;
      const particleProgress = clamp01((progress - 0.09 - delay) / 0.78);
      if (particleProgress <= 0 || particleProgress >= 1) continue;
      const angle = index * 2.39996 + Math.sin(index * 12.9898) * 0.42;
      const distance =
        24 +
        particleProgress * (150 + (index % 7) * 24) +
        particleProgress ** 2 * 74;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      const alpha = (1 - particleProgress) ** 1.25;
      const size = 2.5 + (index % 4) * 1.35;
      const color = BOSS_DEFEAT_COLORS[index % BOSS_DEFEAT_COLORS.length]!;

      this.bossDefeat.fillStyle(color, alpha);
      if (index % 3 === 0) {
        this.bossDefeat.fillTriangle(
          particleX + size * 1.8,
          particleY,
          particleX - size,
          particleY - size,
          particleX - size,
          particleY + size,
        );
      } else {
        this.bossDefeat.fillCircle(particleX, particleY, size);
      }
    }

    const coreFade = clamp01((progress - 0.18) / 0.46);
    if (coreFade < 1) {
      const pulse = 1 + Math.sin(progress * Math.PI * 28) * 0.16;
      this.bossDefeat.fillStyle(0xffffff, (1 - coreFade) * 0.96);
      this.bossDefeat.fillCircle(x, y, 18 * pulse);
      this.bossDefeat.lineStyle(4, 0x58d5c9, (1 - coreFade) * 0.9);
      this.bossDefeat.strokeCircle(x, y, 29 + coreFade * 38);
    }
  }

  private drawBossIndicator(game: GameState): void {
    this.bossIndicator.clear();
    if (!game.boss || game.boss.action === "appearing") return;

    const target = game.boss.core.exposed ? game.boss.core : game.boss;
    const camera = this.scene.cameras.main;
    const screenX = (target.x - camera.worldView.x) * camera.zoom;
    const screenY = (target.y - camera.worldView.y) * camera.zoom;
    const edgeMargin = 44;
    const onScreen =
      screenX >= edgeMargin &&
      screenX <= camera.width - edgeMargin &&
      screenY >= edgeMargin &&
      screenY <= camera.height - edgeMargin;
    if (onScreen) return;

    const centerX = camera.width / 2;
    const centerY = camera.height / 2;
    const angle = Math.atan2(screenY - centerY, screenX - centerX);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const horizontalScale =
      (camera.width / 2 - edgeMargin) / Math.max(0.001, Math.abs(cosine));
    const verticalScale =
      (camera.height / 2 - edgeMargin) / Math.max(0.001, Math.abs(sine));
    const scale = Math.min(horizontalScale, verticalScale);
    const x = centerX + cosine * scale;
    const y = centerY + sine * scale;
    const color = game.boss.core.exposed ? 0xfff5ca : COLORS.bossHazard;

    this.bossIndicator.fillStyle(COLORS.shadow, 0.72);
    this.bossIndicator.fillCircle(x + 3, y + 4, 18);
    this.bossIndicator.fillStyle(color, 0.96);
    this.bossIndicator.fillCircle(x, y, 16);
    this.bossIndicator.fillStyle(COLORS.ink, 0.9);
    this.bossIndicator.fillTriangle(
      x + cosine * 11,
      y + sine * 11,
      x + Math.cos(angle + 2.35) * 8,
      y + Math.sin(angle + 2.35) * 8,
      x + Math.cos(angle - 2.35) * 8,
      y + Math.sin(angle - 2.35) * 8,
    );
  }

  private drawHead(): void {
    this.head.fillStyle(COLORS.shadow, 0.22);
    this.head.fillCircle(5, 6, HEAD_RADIUS);
    this.head.fillStyle(COLORS.head, 1);
    this.head.fillCircle(0, 0, HEAD_RADIUS);
    this.head.fillStyle(COLORS.ink, 1);
    this.head.fillCircle(7, -6, 2.5);
    this.head.fillCircle(7, 6, 2.5);
    this.head.lineStyle(2, COLORS.ink, 1);
    this.head.lineBetween(13, 0, 22, -4);
    this.head.lineBetween(13, 0, 22, 4);
  }

  private syncEnemies(game: GameState): void {
    const liveIds = new Set(game.enemies.map((enemy) => enemy.id));
    for (const [id, view] of this.enemies) {
      if (!liveIds.has(id)) {
        view.container.destroy(true);
        this.enemies.delete(id);
      }
    }

    for (const enemy of game.enemies) {
      const view = this.enemies.get(enemy.id) ?? this.createEnemyView(enemy);
      const pulse = Math.sin(game.elapsed * 3.4 + enemy.phase) * 1.5;
      const size = enemy.size + pulse;
      const movementAngle = Math.atan2(enemy.velocityY, enemy.velocityX);

      view.container.setPosition(enemy.x, enemy.y);
      view.container.setRotation(
        enemy.kind === "shooter" ? enemy.heading :
        enemy.kind === "stationary" ? 0 :
        movementAngle,
      );
      view.graphics.clear();
      paintEnemyIcon({ graphics: view.graphics, enemy, size });
    }
  }

  private createEnemyView(enemy: Enemy): EnemyView {
    const container = this.scene.add.container(enemy.x, enemy.y).setDepth(2);
    const graphics = this.scene.add.graphics();
    container.add(graphics);

    const view = { container, graphics };
    this.enemies.set(enemy.id, view);
    return view;
  }

  private syncBullets(game: GameState): void {
    const liveIds = new Set(game.bullets.map((bullet) => bullet.id));
    for (const [id, view] of this.bullets) {
      if (!liveIds.has(id)) {
        view.graphics.destroy(true);
        this.bullets.delete(id);
      }
    }

    for (const bullet of game.bullets) {
      const view = this.bullets.get(bullet.id) ?? this.createBulletView(bullet);
      view.graphics.clear();
      // 绘制子弹：小圆形 + 拖尾
      view.graphics.fillStyle(0xf4d872, 0.9);
      view.graphics.fillCircle(bullet.x, bullet.y, bullet.radius);
      // 拖尾
      const tailX = bullet.x - bullet.velocityX * 0.03;
      const tailY = bullet.y - bullet.velocityY * 0.03;
      view.graphics.lineStyle(2, 0xff9e4a, 0.6);
      view.graphics.lineBetween(bullet.x, bullet.y, tailX, tailY);
    }
  }

  private createBulletView(bullet: Bullet): BulletView {
    const graphics = this.scene.add.graphics().setDepth(2);
    const view = { graphics };
    this.bullets.set(bullet.id, view);
    return view;
  }

  private syncPowerUps(game: GameState): void {
    const liveIds = new Set(game.powerUps.map((powerUp) => powerUp.id));
    for (const [id, view] of this.powerUps) {
      if (!liveIds.has(id)) {
        view.container.destroy(true);
        this.powerUps.delete(id);
      }
    }

    for (const powerUp of game.powerUps) {
      const view =
        this.powerUps.get(powerUp.id) ?? this.createPowerUpView(powerUp);
      const pulse = 1 + Math.sin(game.elapsed * 4.8 + powerUp.phase) * 0.08;
      const expiryAlpha =
        powerUp.ttl < 2 && Math.floor(powerUp.ttl * 8) % 2 === 0 ? 0.38 : 1;

      view.container
        .setPosition(powerUp.x, powerUp.y)
        .setScale(pulse)
        .setAlpha(expiryAlpha);
      view.graphics.clear();
      view.graphics.fillStyle(COLORS.shadow, 0.18);
      view.graphics.fillCircle(3, 4, powerUp.radius + 7);
      view.graphics.fillStyle(0xfff9ec, 0.94);
      view.graphics.fillCircle(0, 0, powerUp.radius + 6);
      view.graphics.lineStyle(2, COLORS.ink, 0.72);
      view.graphics.strokeCircle(0, 0, powerUp.radius + 6);
      paintPowerUpIcon({
        graphics: view.graphics,
        powerUp,
        size: powerUp.radius,
      });
    }
  }

  private createPowerUpView(powerUp: PowerUp): PowerUpView {
    const container = this.scene.add
      .container(powerUp.x, powerUp.y)
      .setDepth(2.5);
    const graphics = this.scene.add.graphics();
    container.add(graphics);

    const view = { container, graphics };
    this.powerUps.set(powerUp.id, view);
    return view;
  }
}
