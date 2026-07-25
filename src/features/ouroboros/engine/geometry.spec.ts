import { describe, expect, it } from "vitest";
import {
  distance,
  nativeCollisionSystem,
  pointInPolygon,
  polygonArea,
  trimTrailToLength,
} from "./geometry";

describe("geometry", () => {
  it("calculates distance and polygon area", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(
      polygonArea([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]),
    ).toBe(100);
  });

  it("detects whether a point is inside a ring", () => {
    const ring = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ];

    expect(pointInPolygon({ x: 10, y: 10 }, ring)).toBe(true);
    expect(pointInPolygon({ x: 30, y: 10 }, ring)).toBe(false);
  });

  it("trims a trail without losing the exact tail position", () => {
    const trail = Array.from({ length: 11 }, (_, x) => ({ x, y: 0 }));
    trimTrailToLength(trail, 5);

    expect(trail[0]).toEqual({ x: 5, y: 0 });
    expect(trail.at(-1)).toEqual({ x: 10, y: 0 });
  });
});

describe("collision geometry", () => {
  it("returns circle contact depth and outward normal", () => {
    const contact = nativeCollisionSystem.circleToCircle(
      { x: 8, y: 0 },
      5,
      { x: 0, y: 0 },
      5,
    );

    expect(contact).toEqual({ normalX: 1, normalY: 0, penetration: 2 });
  });

  it("treats a thick segment as a capsule", () => {
    const contact = nativeCollisionSystem.circleToSegment(
      { x: 5, y: 7 },
      4,
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      5,
    );

    expect(contact).toEqual({ normalX: 0, normalY: 1, penetration: 2 });
  });

  it("does not report a circle outside the segment end cap", () => {
    const contact = nativeCollisionSystem.circleToSegment(
      { x: 17, y: 0 },
      3,
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      4,
    );

    expect(contact).toBeNull();
  });
});
