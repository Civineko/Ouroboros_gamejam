import {
  BODY_WIDTH,
  HEAD_RADIUS,
  TAIL_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../engine/config";
import type { Enemy, GameState, Point } from "../engine/types";

const COLORS = {
  stage: "#48678f",
  stageLine: "rgba(255, 253, 247, 0.1)",
  stageBorder: "rgba(255, 253, 247, 0.2)",
  ink: "#263b42",
  body: "#5c9e94",
  bodyFlash: "#f4d872",
  bodyHighlight: "rgba(255, 255, 255, 0.22)",
  tail: "#fff9ec",
  tailCore: "#ef624f",
  head: "#f2ba49",
} as const;

function prepareContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext("2d");
  if (!context) return null;

  const bounds = canvas.getBoundingClientRect();
  const cssWidth = bounds.width || WORLD_WIDTH;
  const cssHeight = bounds.height || WORLD_HEIGHT;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(cssWidth * pixelRatio));
  const height = Math.max(1, Math.round(cssHeight * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.setTransform(width / WORLD_WIDTH, 0, 0, height / WORLD_HEIGHT, 0, 0);
  return context;
}

function traceTrail(
  context: CanvasRenderingContext2D,
  trail: readonly Point[],
  offsetX = 0,
  offsetY = 0,
): void {
  context.beginPath();
  for (let index = 0; index < trail.length; index += 1) {
    const point = trail[index];
    if (!point) continue;
    if (index === 0) context.moveTo(point.x + offsetX, point.y + offsetY);
    else context.lineTo(point.x + offsetX, point.y + offsetY);
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy, elapsed: number): void {
  const pulse = Math.sin(elapsed * 3.4 + enemy.phase) * 1.5;
  const size = enemy.size + pulse;

  context.save();
  context.translate(enemy.x, enemy.y);
  context.rotate(elapsed * 0.8 + enemy.phase);

  context.fillStyle = "rgba(25, 37, 49, 0.22)";
  roundedRect(context, -size + 6, -size + 8, size * 2, size * 2, 6);
  context.fill();

  context.fillStyle = enemy.color;
  roundedRect(context, -size, -size, size * 2, size * 2, 6);
  context.fill();

  context.fillStyle = "rgba(255, 236, 167, 0.74)";
  context.beginPath();
  context.moveTo(-5, 0);
  context.lineTo(0, -5);
  context.lineTo(5, 0);
  context.lineTo(0, 5);
  context.closePath();
  context.fill();
  context.restore();
}

function drawRingFlash(context: CanvasRenderingContext2D, game: GameState): void {
  if (!game.lastRing || game.closureFlash <= 0) return;

  context.save();
  traceTrail(context, game.lastRing);
  context.closePath();
  context.fillStyle = `rgba(244, 216, 114, ${game.closureFlash * 0.2})`;
  context.fill();
  context.strokeStyle = `rgba(255, 245, 202, ${game.closureFlash})`;
  context.lineWidth = 7;
  context.stroke();
  context.restore();
}

function drawBody(context: CanvasRenderingContext2D, game: GameState): void {
  if (game.trail.length < 2) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  traceTrail(context, game.trail, 6, 7);
  context.strokeStyle = "rgba(25, 37, 49, 0.23)";
  context.lineWidth = BODY_WIDTH + 3;
  context.stroke();

  traceTrail(context, game.trail);
  context.strokeStyle = game.closureFlash > 0 ? COLORS.bodyFlash : COLORS.body;
  context.lineWidth = BODY_WIDTH;
  context.stroke();

  traceTrail(context, game.trail, -1, -2);
  context.strokeStyle = COLORS.bodyHighlight;
  context.lineWidth = 5;
  context.stroke();
  context.restore();
}

function drawTail(context: CanvasRenderingContext2D, point: Point): void {
  context.save();
  context.translate(point.x, point.y);
  context.fillStyle = "rgba(25, 37, 49, 0.18)";
  context.beginPath();
  context.arc(5, 6, TAIL_RADIUS + 1, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = COLORS.tail;
  context.beginPath();
  context.arc(0, 0, TAIL_RADIUS, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = COLORS.tailCore;
  context.beginPath();
  context.arc(0, 0, 6, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawHead(context: CanvasRenderingContext2D, game: GameState, point: Point): void {
  context.save();
  context.translate(point.x, point.y);
  context.rotate(game.angle);
  context.globalAlpha =
    game.invulnerable > 0 && Math.floor(game.invulnerable * 12) % 2 === 0
      ? 0.45
      : 1;

  context.fillStyle = "rgba(25, 37, 49, 0.22)";
  context.beginPath();
  context.arc(5, 6, HEAD_RADIUS, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.head;
  context.beginPath();
  context.arc(0, 0, HEAD_RADIUS, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.ink;
  context.beginPath();
  context.arc(7, -6, 2.5, 0, Math.PI * 2);
  context.arc(7, 6, 2.5, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = COLORS.ink;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(13, 0);
  context.lineTo(22, -4);
  context.moveTo(13, 0);
  context.lineTo(22, 4);
  context.stroke();
  context.restore();
}

export function drawGame(canvas: HTMLCanvasElement, game: GameState): void {
  const context = prepareContext(canvas);
  if (!context) return;

  context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  context.fillStyle = COLORS.stage;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  context.save();
  context.strokeStyle = COLORS.stageLine;
  context.lineWidth = 1;
  for (let x = 40; x < WORLD_WIDTH; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, WORLD_HEIGHT);
    context.stroke();
  }
  for (let y = 40; y < WORLD_HEIGHT; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WORLD_WIDTH, y);
    context.stroke();
  }
  context.strokeStyle = COLORS.stageBorder;
  context.strokeRect(12, 12, WORLD_WIDTH - 24, WORLD_HEIGHT - 24);
  context.restore();

  drawRingFlash(context, game);
  for (const enemy of game.enemies) drawEnemy(context, enemy, game.elapsed);
  drawBody(context, game);

  const tail = game.trail[0];
  const head = game.trail.at(-1);
  if (tail) drawTail(context, tail);
  if (head) drawHead(context, game, head);
}
