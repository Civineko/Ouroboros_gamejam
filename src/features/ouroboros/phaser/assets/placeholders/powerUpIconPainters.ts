import Phaser from "phaser";
import type { PowerUp } from "../../../engine/types";

const INK = 0x263b42;
const LIGHT = 0xfff1bf;
const SHIELD = 0x63c7b2;
const HEAL = 0xf06b66;
const STASIS = 0x78bce8;
const HASTE = 0xf3c74f;

export interface PowerUpIconContext {
  graphics: Phaser.GameObjects.Graphics;
  powerUp: PowerUp;
  size: number;
}

type PowerUpIconPainter = (context: PowerUpIconContext) => void;

function paintShield({ graphics, size }: PowerUpIconContext): void {
  const scale = size / 12;

  graphics.fillStyle(SHIELD, 1);
  graphics.lineStyle(1.8 * scale, INK, 1);
  graphics.beginPath();
  graphics.moveTo(0, -10 * scale);
  graphics.lineTo(8 * scale, -6.5 * scale);
  graphics.lineTo(7 * scale, 2 * scale);
  graphics.lineTo(4 * scale, 7 * scale);
  graphics.lineTo(0, 10 * scale);
  graphics.lineTo(-4 * scale, 7 * scale);
  graphics.lineTo(-7 * scale, 2 * scale);
  graphics.lineTo(-8 * scale, -6.5 * scale);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();

  graphics.lineStyle(1.5 * scale, LIGHT, 0.9);
  graphics.lineBetween(0, -6 * scale, 0, 6 * scale);
}

function paintHeal({ graphics, size }: PowerUpIconContext): void {
  const scale = size / 12;

  graphics.fillStyle(HEAL, 1);
  graphics.lineStyle(1.8 * scale, INK, 1);
  graphics.fillRoundedRect(
    -4 * scale,
    -10 * scale,
    8 * scale,
    20 * scale,
    1.5 * scale,
  );
  graphics.strokeRoundedRect(
    -4 * scale,
    -10 * scale,
    8 * scale,
    20 * scale,
    1.5 * scale,
  );
  graphics.fillRoundedRect(
    -10 * scale,
    -4 * scale,
    20 * scale,
    8 * scale,
    1.5 * scale,
  );
  graphics.strokeRoundedRect(
    -10 * scale,
    -4 * scale,
    20 * scale,
    8 * scale,
    1.5 * scale,
  );
  graphics.fillStyle(LIGHT, 0.9);
  graphics.fillRect(-1.5 * scale, -7 * scale, 3 * scale, 14 * scale);
}

function paintStasis({ graphics, size }: PowerUpIconContext): void {
  const scale = size / 12;
  const arm = 9.5 * scale;
  const branchStart = 5.5 * scale;
  const branchEnd = 8 * scale;
  const branchOffset = 2.2 * scale;

  graphics.lineStyle(3.2 * scale, STASIS, 1);
  for (let index = 0; index < 3; index += 1) {
    const angle = (Math.PI * index) / 3;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    graphics.lineBetween(-arm * cosine, -arm * sine, arm * cosine, arm * sine);

    for (const direction of [-1, 1]) {
      const centerX = direction * branchEnd * cosine;
      const centerY = direction * branchEnd * sine;
      const sideX = branchOffset * -sine;
      const sideY = branchOffset * cosine;
      const baseX = direction * branchStart * cosine;
      const baseY = direction * branchStart * sine;
      graphics.lineBetween(centerX, centerY, baseX + sideX, baseY + sideY);
      graphics.lineBetween(centerX, centerY, baseX - sideX, baseY - sideY);
    }
  }

  graphics.fillStyle(LIGHT, 1);
  graphics.fillCircle(0, 0, 2.2 * scale);
}

function paintHaste({ graphics, size }: PowerUpIconContext): void {
  const scale = size / 12;

  graphics.fillStyle(HASTE, 1);
  graphics.lineStyle(1.8 * scale, INK, 1);
  graphics.beginPath();
  graphics.moveTo(2 * scale, -11 * scale);
  graphics.lineTo(-7 * scale, 1 * scale);
  graphics.lineTo(-1.5 * scale, 1 * scale);
  graphics.lineTo(-4 * scale, 11 * scale);
  graphics.lineTo(8 * scale, -3 * scale);
  graphics.lineTo(2 * scale, -3 * scale);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();

  graphics.lineStyle(1.4 * scale, LIGHT, 0.82);
  graphics.lineBetween(1.5 * scale, -7 * scale, -2 * scale, -1 * scale);
}

const POWER_UP_ICON_PAINTERS: Readonly<
  Record<PowerUp["kind"], PowerUpIconPainter>
> = {
  shield: paintShield,
  heal: paintHeal,
  stasis: paintStasis,
  haste: paintHaste,
};

export function paintPowerUpIcon(context: PowerUpIconContext): void {
  POWER_UP_ICON_PAINTERS[context.powerUp.kind](context);
}
