import Phaser from "phaser";
import {
  BODY_WIDTH,
  levelColor,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../engine/config";
import type { Enemy, GameState, Point, PowerUp } from "../engine/types";
import { OUROBOROS_ART_KEYS } from "./assets/assetCatalog";

const COLORS = {
  body: 0x58c9a7,
  bodyOutline: 0x101b1d,
  bodyFlash: 0xf4d872,
} as const;

const TAIL_END_INDEX = 12;
const BODY_TAIL_OVERLAP = 2;

interface EnemyView {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
}

interface PowerUpView {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image;
}

function enemyTexture(enemy: Enemy): string {
  if (enemy.kind === "wanderer") return OUROBOROS_ART_KEYS.enemyWanderer;
  if (enemy.kind === "tracker") return OUROBOROS_ART_KEYS.enemyTracker;
  return OUROBOROS_ART_KEYS.enemyStationary;
}

function powerUpTexture(powerUp: PowerUp): string {
  if (powerUp.kind === "heal") return OUROBOROS_ART_KEYS.powerUpHeal;
  if (powerUp.kind === "stasis") return OUROBOROS_ART_KEYS.powerUpStasis;
  if (powerUp.kind === "haste") return OUROBOROS_ART_KEYS.powerUpHaste;
  if (powerUp.kind === "resonance") {
    return OUROBOROS_ART_KEYS.powerUpResonance;
  }
  return OUROBOROS_ART_KEYS.powerUpShield;
}

function traceTrail(
  graphics: Phaser.GameObjects.Graphics,
  trail: readonly Point[],
): void {
  const first = trail[0];
  if (!first) return;

  graphics.beginPath();
  graphics.moveTo(first.x, first.y);
  for (let index = 1; index < trail.length; index += 1) {
    const point = trail[index];
    if (point) graphics.lineTo(point.x, point.y);
  }
  graphics.strokePath();
}

export class OuroborosSceneView {
  private readonly background: Phaser.GameObjects.TileSprite;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly body: Phaser.GameObjects.Container;
  private readonly tailRope: Phaser.GameObjects.Rope;
  private readonly bodyRope: Phaser.GameObjects.Rope;
  private readonly bodyFallback: Phaser.GameObjects.Graphics;
  private readonly head: Phaser.GameObjects.Image;
  private readonly headScaleX: number;
  private readonly headScaleY: number;
  private readonly supportsRope: boolean;
  private readonly enemies = new Map<number, EnemyView>();
  private readonly powerUps = new Map<number, PowerUpView>();
  private introRevealing = false;
  private currentLevel = 1;
  private bgColor = parseInt(levelColor(1).slice(1), 16);

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add
      .tileSprite(
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        OUROBOROS_ART_KEYS.stageBackground,
      )
      .setOrigin(0)
      .setTileScale(0.75)
      .setDepth(0);
    this.redrawBackground();
    this.ring = scene.add.graphics().setDepth(1);
    this.body = scene.add.container(0, 0).setDepth(3);

    const initialRopePoints = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ];
    this.tailRope = scene.add.rope(
      0,
      0,
      OUROBOROS_ART_KEYS.snakeTail,
      undefined,
      initialRopePoints,
      true,
    );
    this.bodyRope = scene.add.rope(
      0,
      0,
      OUROBOROS_ART_KEYS.snakeBody,
      undefined,
      initialRopePoints,
      true,
    );
    this.bodyFallback = scene.add.graphics();
    this.body.add([this.tailRope, this.bodyRope, this.bodyFallback]);

    this.supportsRope = scene.game.renderer.type === Phaser.WEBGL;
    this.tailRope.setVisible(this.supportsRope);
    this.bodyRope.setVisible(this.supportsRope);
    this.bodyFallback.setVisible(!this.supportsRope);

    this.head = scene.add
      .image(0, 0, OUROBOROS_ART_KEYS.snakeHead)
      .setDisplaySize(58, 38)
      .setOrigin(0.42, 0.5)
      .setDepth(4);
    this.headScaleX = this.head.scaleX;
    this.headScaleY = this.head.scaleY;
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
    this.syncEnemies(game);
    this.syncPowerUps(game);
    this.drawBody(game);

    const head = game.trail.at(-1);
    if (head) {
      this.head.setPosition(head.x, head.y).setRotation(game.angle);
      if (!this.introRevealing) {
        this.head.setAlpha(
          game.invulnerable > 0 && Math.floor(game.invulnerable * 12) % 2 === 0
            ? 0.45
            : 1,
        );
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
    this.head
      .setAlpha(0)
      .setScale(this.headScaleX * 0.24, this.headScaleY * 0.24);

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
      scaleX: this.headScaleX,
      scaleY: this.headScaleY,
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
    this.head.setAlpha(1).setScale(this.headScaleX, this.headScaleY);

    for (const view of this.enemies.values()) {
      this.scene.tweens.killTweensOf(view.container);
      view.container.setAlpha(1).setScale(1);
    }
  }

  /** Reapply the current level tint after a level or renderer refresh. */
  redrawBackground(): void {
    this.background.setTint(this.bgColor);
  }

  destroy(): void {
    for (const view of this.enemies.values()) view.container.destroy(true);
    this.enemies.clear();
    for (const view of this.powerUps.values()) view.container.destroy(true);
    this.powerUps.clear();
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
    if (game.trail.length < 2) return;

    const tailEnd = Math.min(TAIL_END_INDEX, game.trail.length - 1);
    const bodyStart = Math.max(0, tailEnd - BODY_TAIL_OVERLAP);

    if (this.supportsRope) {
      this.tailRope.setPoints(game.trail.slice(0, tailEnd + 1));
      this.bodyRope.setPoints(game.trail.slice(bodyStart));
      return;
    }

    this.bodyFallback.clear();
    this.bodyFallback.lineStyle(BODY_WIDTH + 5, COLORS.bodyOutline, 1);
    traceTrail(this.bodyFallback, game.trail);
    this.bodyFallback.lineStyle(BODY_WIDTH, COLORS.body, 1);
    traceTrail(this.bodyFallback, game.trail);
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
      const size = (enemy.size + pulse) * 4.2;
      const movementAngle = Math.atan2(enemy.velocityY, enemy.velocityX);

      view.container
        .setPosition(enemy.x, enemy.y)
        .setRotation(enemy.kind === "stationary" ? 0 : movementAngle);
      if (enemy.kind === "stationary") {
        view.image.setDisplaySize(size, size);
      } else if (enemy.kind === "wanderer") {
        view.image.setDisplaySize(size * 1.2, size * 0.86);
      } else {
        view.image.setDisplaySize(size * 1.25, size * 0.78);
      }
    }
  }

  private createEnemyView(enemy: Enemy): EnemyView {
    const container = this.scene.add.container(enemy.x, enemy.y).setDepth(2);
    const image = this.scene.add.image(0, 0, enemyTexture(enemy));
    container.add(image);

    const view = { container, image };
    this.enemies.set(enemy.id, view);
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
      view.image.setDisplaySize(powerUp.radius * 4.5, powerUp.radius * 4.5);
    }
  }

  private createPowerUpView(powerUp: PowerUp): PowerUpView {
    const container = this.scene.add
      .container(powerUp.x, powerUp.y)
      .setDepth(2.5);
    const image = this.scene.add.image(0, 0, powerUpTexture(powerUp));
    container.add(image);

    const view = { container, image };
    this.powerUps.set(powerUp.id, view);
    return view;
  }
}
