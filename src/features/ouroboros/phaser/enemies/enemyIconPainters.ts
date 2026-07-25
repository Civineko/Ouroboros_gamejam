import Phaser from "phaser";
import type { Enemy, EnemyKind } from "../../engine/types";

const SHADOW = 0x192531;
const INK = 0x263b42;
const LIGHT = 0xfff1bf;

export interface EnemyIconContext {
  graphics: Phaser.GameObjects.Graphics;
  enemy: Enemy;
  size: number;
}

type EnemyIconPainter = (context: EnemyIconContext) => void;

function colorFromHex(value: string): number {
  return Number.parseInt(value.slice(1), 16);
}

function paintStationary({ graphics, enemy, size }: EnemyIconContext): void {
  const color = colorFromHex(enemy.color);
  graphics.fillStyle(SHADOW, 0.24);
  graphics.fillRoundedRect(-size + 6, -size + 8, size * 2, size * 2, 5);
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(-size, -size, size * 2, size * 2, 5);
  graphics.lineStyle(2, LIGHT, 0.68);
  graphics.strokeRoundedRect(-size + 4, -size + 4, size * 2 - 8, size * 2 - 8, 3);
  graphics.fillStyle(INK, 0.82);
  graphics.fillCircle(0, 0, 5);
  graphics.lineStyle(2, LIGHT, 0.9);
  graphics.lineBetween(-8, 0, 8, 0);
  graphics.lineBetween(0, -8, 0, 8);
}

function paintWanderer({ graphics, enemy, size }: EnemyIconContext): void {
  const color = colorFromHex(enemy.color);
  graphics.fillStyle(SHADOW, 0.22);
  graphics.fillTriangle(-size + 5, 7, 5, -size + 7, size + 5, 7);
  graphics.fillTriangle(-size + 5, 7, 5, size + 7, size + 5, 7);
  graphics.fillStyle(color, 1);
  graphics.fillTriangle(-size, 0, 0, -size, size, 0);
  graphics.fillTriangle(-size, 0, 0, size, size, 0);
  graphics.fillStyle(LIGHT, 0.9);
  graphics.fillCircle(2, 0, 4.5);
  graphics.fillStyle(INK, 0.68);
  graphics.fillCircle(3.5, 0, 1.7);
  graphics.fillStyle(LIGHT, 0.76);
  graphics.fillCircle(-size * 0.58, 0, 2.2);
}

function paintTracker({ graphics, enemy, size }: EnemyIconContext): void {
  const color = colorFromHex(enemy.color);
  graphics.fillStyle(SHADOW, 0.24);
  graphics.fillTriangle(size + 6, 7, -size + 6, -size * 0.78 + 7, -size + 6, size * 0.78 + 7);
  graphics.fillStyle(color, 1);
  graphics.fillTriangle(size, 0, -size, -size * 0.78, -size, size * 0.78);
  graphics.fillStyle(INK, 0.88);
  graphics.fillCircle(-size * 0.12, 0, 6);
  graphics.fillStyle(LIGHT, 1);
  graphics.fillCircle(0, 0, 2.6);
  graphics.lineStyle(2, LIGHT, 0.8);
  graphics.lineBetween(-size * 0.78, -size * 0.48, -size * 0.78, size * 0.48);
}

const ENEMY_ICON_PAINTERS: Readonly<Record<EnemyKind, EnemyIconPainter>> = {
  stationary: paintStationary,
  wanderer: paintWanderer,
  tracker: paintTracker,
};

export function paintEnemyIcon(context: EnemyIconContext): void {
  ENEMY_ICON_PAINTERS[context.enemy.kind](context);
}
