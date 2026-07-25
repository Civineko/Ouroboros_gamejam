import { describe, expect, it } from "vitest";
import {
  buildClosedStrokeRegion,
  circleIntersectsPolygon,
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

  it("consistently includes points on polygon edges and vertices", () => {
    const ring = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ];

    expect(pointInPolygon({ x: 10, y: 0 }, ring)).toBe(true);
    expect(pointInPolygon({ x: 20, y: 20 }, ring)).toBe(true);
    expect(nativeCollisionSystem.containsPoint(ring, { x: 0, y: 10 })).toBe(
      true,
    );
  });

  it("detects circles whose radius touches a polygon edge", () => {
    const ring = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 20 },
      { x: 0, y: 20 },
    ];

    expect(circleIntersectsPolygon({ x: 21, y: 10 }, 1, ring)).toBe(true);
    expect(circleIntersectsPolygon({ x: 21.01, y: 10 }, 1, ring)).toBe(false);
  });

  it("does not treat a degenerate path as a filled polygon", () => {
    expect(
      circleIntersectsPolygon(
        { x: 5, y: 0 },
        2,
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      ),
    ).toBe(false);
  });

  it("builds the enclosed interior of an ordinary closed stroke", () => {
    const region = buildClosedStrokeRegion(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      6,
    );

    expect(region.enclosedArea).toBeGreaterThan(6_000);
    expect(region.containsCircle({ x: 50, y: 50 }, 0)).toBe(true);
    expect(region.containsCircle({ x: 140, y: 50 }, 0)).toBe(false);
  });

  it("encloses both figure-eight leaves while leaving the middle exterior open", () => {
    const figureEight = [
      { x: 0, y: 0 },
      { x: -100, y: -100 },
      { x: -100, y: 100 },
      { x: 0, y: 0 },
      { x: 100, y: -100 },
      { x: 100, y: 100 },
    ];
    const region = buildClosedStrokeRegion(figureEight, 6);

    expect(region.enclosedArea).toBeGreaterThan(12_000);
    expect(region.containsCircle({ x: -70, y: 0 }, 0)).toBe(true);
    expect(region.containsCircle({ x: 70, y: 0 }, 0)).toBe(true);
    expect(region.containsCircle({ x: 0, y: -70 }, 5)).toBe(false);
  });

  it("keeps the innermost area enclosed when a nested loop reverses direction", () => {
    const region = buildClosedStrokeRegion(
      [
        { x: -120, y: -120 },
        { x: 120, y: -120 },
        { x: 120, y: 120 },
        { x: -120, y: 120 },
        { x: -120, y: -120 },
        { x: -50, y: -50 },
        { x: -50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: -50 },
        { x: -50, y: -50 },
      ],
      6,
    );

    expect(region.containsCircle({ x: 0, y: 0 }, 0)).toBe(true);
    expect(region.containsCircle({ x: 80, y: 0 }, 0)).toBe(true);
  });

  it("does not fill a U-shaped notch that remains connected to the exterior", () => {
    const region = buildClosedStrokeRegion(
      [
        { x: 0, y: 0 },
        { x: 120, y: 0 },
        { x: 120, y: 120 },
        { x: 80, y: 120 },
        { x: 80, y: 40 },
        { x: 40, y: 40 },
        { x: 40, y: 120 },
        { x: 0, y: 120 },
      ],
      5,
    );

    expect(region.containsCircle({ x: 20, y: 60 }, 0)).toBe(true);
    expect(region.containsCircle({ x: 60, y: 80 }, 0)).toBe(false);
  });

  it("captures exact circle contact with the thick stroke but not 0.01 beyond it", () => {
    const ring = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const region = buildClosedStrokeRegion(ring, 11);

    expect(region.containsCircle({ x: 116, y: 50 }, 5)).toBe(true);
    expect(region.containsCircle({ x: 116.01, y: 50 }, 5)).toBe(false);
  });

  it.each([25, 40])(
    "seals a %ipx head-tail gap with the virtual closing capsule",
    (gap) => {
      const region = buildClosedStrokeRegion(
        [
          { x: 0, y: 0 },
          { x: 120, y: 0 },
          { x: 120, y: 120 },
          { x: 0, y: 120 },
          { x: 0, y: gap },
        ],
        11,
      );

      expect(region.enclosedArea).toBeGreaterThan(8_000);
      expect(region.containsCircle({ x: 60, y: 60 }, 0)).toBe(true);
    },
  );

  it("does not invent an enclosed cavity for a retraced trail", () => {
    const region = buildClosedStrokeRegion(
      [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 0 },
        { x: 0, y: 0 },
      ],
      6,
    );

    expect(region.enclosedArea).toBe(0);
    expect(region.containsCircle({ x: 50, y: 30 }, 0)).toBe(false);
  });

  it("is stable when the same trail is translated by one or two pixels", () => {
    const base = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const regions = [0, 1, 2].map((offset) =>
      buildClosedStrokeRegion(
        base.map((point) => ({ x: point.x + offset, y: point.y + offset })),
        6,
      ),
    );

    expect(regions.map((region) => region.enclosedArea)).toEqual([
      regions[0]?.enclosedArea,
      regions[0]?.enclosedArea,
      regions[0]?.enclosedArea,
    ]);
    regions.forEach((region, offset) => {
      expect(region.containsCircle({ x: 50 + offset, y: 50 + offset }, 0)).toBe(
        true,
      );
      expect(region.containsCircle({ x: 140 + offset, y: 50 + offset }, 0)).toBe(
        false,
      );
    });
  });

  it("builds and queries a 4,000-point trail at game scale", () => {
    const pointCount = 4_000;
    const figureEight = Array.from({ length: pointCount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / (pointCount - 1);
      return {
        x: Math.sin(angle) * 180,
        y: Math.sin(angle) * Math.cos(angle) * 140,
      };
    });
    const region = buildClosedStrokeRegion(figureEight, 11);

    expect(region.enclosedArea).toBeGreaterThan(20_000);
    expect(region.containsCircle({ x: -100, y: 0 }, 0)).toBe(true);
    expect(region.containsCircle({ x: 100, y: 0 }, 0)).toBe(true);
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
