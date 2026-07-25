import type { Point } from "../../engine/types";

interface Size {
  width: number;
  height: number;
}

export function minimumCameraZoom(viewport: Size, world: Size): number {
  return Math.max(
    1,
    viewport.width / world.width,
    viewport.height / world.height,
  );
}

export function cameraScrollTarget(
  focus: Point,
  viewport: Size,
  world: Size,
  zoom = 1,
): Point {
  const safeZoom = Math.max(Number.EPSILON, zoom);
  const visibleWidth = viewport.width / safeZoom;
  const visibleHeight = viewport.height / safeZoom;
  const maximumX = Math.max(0, world.width - visibleWidth);
  const maximumY = Math.max(0, world.height - visibleHeight);

  return {
    x: Math.max(0, Math.min(maximumX, focus.x - visibleWidth / 2)),
    y: Math.max(0, Math.min(maximumY, focus.y - visibleHeight / 2)),
  };
}

export function smoothCameraScroll(
  current: Point,
  target: Point,
  response: number,
  delta: number,
): Point {
  const amount = 1 - Math.exp(-response * Math.max(0, delta));
  return {
    x: current.x + (target.x - current.x) * amount,
    y: current.y + (target.y - current.y) * amount,
  };
}
