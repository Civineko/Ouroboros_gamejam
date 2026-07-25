import type { Point } from "../../engine/types";

interface Size {
  width: number;
  height: number;
}

export function cameraScrollTarget(
  focus: Point,
  viewport: Size,
  world: Size,
): Point {
  const maximumX = Math.max(0, world.width - viewport.width);
  const maximumY = Math.max(0, world.height - viewport.height);

  return {
    x: Math.max(0, Math.min(maximumX, focus.x - viewport.width / 2)),
    y: Math.max(0, Math.min(maximumY, focus.y - viewport.height / 2)),
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
