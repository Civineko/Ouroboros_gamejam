import { describe, expect, it } from "vitest";
import {
  distance,
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
