import { describe, expect, it } from "vitest";
import {
  cameraScrollTarget,
  minimumCameraZoom,
  smoothCameraScroll,
} from "./cameraMath";

const viewport = { width: 920, height: 620 };
const world = { width: 1440, height: 900 };

describe("camera math", () => {
  it("centers the viewport on an interior focus point", () => {
    expect(cameraScrollTarget({ x: 720, y: 450 }, viewport, world)).toEqual({
      x: 260,
      y: 140,
    });
  });

  it("clamps the camera to each world edge", () => {
    expect(cameraScrollTarget({ x: 0, y: 0 }, viewport, world)).toEqual({
      x: 0,
      y: 0,
    });
    expect(cameraScrollTarget({ x: 1440, y: 900 }, viewport, world)).toEqual({
      x: 520,
      y: 280,
    });
  });

  it("uses the zoom-adjusted visible world size", () => {
    expect(
      cameraScrollTarget({ x: 720, y: 450 }, viewport, world, 2),
    ).toEqual({
      x: 490,
      y: 295,
    });
  });

  it("zooms in enough to keep oversized viewports inside the world", () => {
    expect(minimumCameraZoom({ width: 1920, height: 1080 }, world)).toBe(
      4 / 3,
    );
    expect(minimumCameraZoom({ width: 600, height: 1200 }, world)).toBe(
      4 / 3,
    );
    expect(minimumCameraZoom({ width: 390, height: 844 }, world)).toBe(1);
  });

  it("smoothly approaches the target without overshooting", () => {
    const next = smoothCameraScroll(
      { x: 0, y: 0 },
      { x: 200, y: 100 },
      7.5,
      1 / 60,
    );

    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(200);
    expect(next.y).toBeGreaterThan(0);
    expect(next.y).toBeLessThan(100);
  });
});
