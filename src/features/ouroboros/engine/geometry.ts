import type { Point } from "./types";

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function polygonArea(points: readonly Point[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (!current || !next) continue;
    area += current.x * next.y - next.x * current.y;
  }

  return Math.abs(area / 2);
}

export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;

  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current, current += 1
  ) {
    const a = polygon[current];
    const b = polygon[previous];
    if (!a || !b) continue;

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function angleDifference(target: number, current: number): number {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

export function trimTrailToLength(trail: Point[], targetLength: number): void {
  if (trail.length < 2) return;

  let accumulated = 0;
  for (let index = trail.length - 1; index > 0; index -= 1) {
    const newer = trail[index];
    const older = trail[index - 1];
    if (!newer || !older) continue;

    const segmentLength = distance(newer, older);
    if (accumulated + segmentLength >= targetLength) {
      const remaining = targetLength - accumulated;
      const ratio = segmentLength === 0 ? 0 : remaining / segmentLength;
      const exactTail = {
        x: newer.x + (older.x - newer.x) * ratio,
        y: newer.y + (older.y - newer.y) * ratio,
      };

      trail.splice(0, index, exactTail);
      return;
    }

    accumulated += segmentLength;
  }
}
