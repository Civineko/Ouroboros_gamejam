import Phaser from "phaser";
import {
  BODY_WIDTH,
  HEAD_RADIUS,
  TAIL_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../engine/config";
import type { Enemy, GameState, Point, PowerUp } from "../engine/types";
import { paintEnemyIcon } from "./assets/placeholders/enemyIconPainters";
import { paintPowerUpIcon } from "./assets/placeholders/powerUpIconPainters";

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
} as const;

interface EnemyView {
  container: Phaser.GameObjects.Container;
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
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly head: Phaser.GameObjects.Graphics;
  private readonly enemies = new Map<number, EnemyView>();
  private readonly powerUps = new Map<number, PowerUpView>();
  private introRevealing = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.graphics().setDepth(0);
    this.ring = scene.add.graphics().setDepth(1);
    this.body = scene.add.graphics().setDepth(3);
    this.head = scene.add.graphics().setDepth(4);

    this.drawBackground();
    this.drawHead();
  }

  render(game: GameState): void {
    this.drawRing(game);
    this.syncEnemies(game);
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

  destroy(): void {
    for (const view of this.enemies.values()) view.container.destroy(true);
    this.enemies.clear();
    for (const view of this.powerUps.values()) view.container.destroy(true);
    this.powerUps.clear();
  }

  private drawBackground(): void {
    this.background.fillStyle(COLORS.stage, 1);
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
        enemy.kind === "stationary" ? 0 : movementAngle,
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
