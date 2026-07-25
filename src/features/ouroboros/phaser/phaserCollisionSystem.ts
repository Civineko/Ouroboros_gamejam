import Phaser from "phaser";
import { contactFromNearestPoint } from "../engine/geometry";
import type { CollisionSystem } from "../engine/types";

const firstCircle = new Phaser.Geom.Circle();
const secondCircle = new Phaser.Geom.Circle();
const expandedCircle = new Phaser.Geom.Circle();
const segment = new Phaser.Geom.Line();
const circleCenter = new Phaser.Math.Vector2();
const nearestPoint = new Phaser.Math.Vector2();
const polygon = new Phaser.Geom.Polygon();

export const phaserCollisionSystem: CollisionSystem = {
  circleToCircle(first, firstRadius, second, secondRadius) {
    firstCircle.setTo(first.x, first.y, firstRadius);
    secondCircle.setTo(second.x, second.y, secondRadius);
    if (!Phaser.Geom.Intersects.CircleToCircle(firstCircle, secondCircle)) {
      return null;
    }

    return contactFromNearestPoint(first, second, firstRadius + secondRadius);
  },
  circleToSegment(
    circle,
    circleRadius,
    segmentStart,
    segmentEnd,
    segmentRadius,
  ) {
    segment.setTo(segmentStart.x, segmentStart.y, segmentEnd.x, segmentEnd.y);
    expandedCircle.setTo(
      circle.x,
      circle.y,
      circleRadius + segmentRadius,
    );
    if (
      !Phaser.Geom.Intersects.LineToCircle(
        segment,
        expandedCircle,
        nearestPoint,
      )
    ) {
      return null;
    }

    circleCenter.set(circle.x, circle.y);
    const segmentX = segmentEnd.x - segmentStart.x;
    const segmentY = segmentEnd.y - segmentStart.y;
    const lengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (lengthSquared <= Number.EPSILON) {
      nearestPoint.set(segmentStart.x, segmentStart.y);
    } else {
      Phaser.Geom.Line.GetNearestPoint(segment, circleCenter, nearestPoint);
      const projection =
        ((circle.x - segmentStart.x) * segmentX +
          (circle.y - segmentStart.y) * segmentY) /
        lengthSquared;

      if (projection <= 0) {
        nearestPoint.set(segmentStart.x, segmentStart.y);
      } else if (projection >= 1) {
        nearestPoint.set(segmentEnd.x, segmentEnd.y);
      }
    }

    return contactFromNearestPoint(
      circle,
      nearestPoint,
      circleRadius + segmentRadius,
      {
        x: segmentStart.y - segmentEnd.y,
        y: segmentEnd.x - segmentStart.x,
      },
    );
  },
  containsPoint(points, point) {
    polygon.setTo([...points]);
    return Phaser.Geom.Polygon.Contains(polygon, point.x, point.y);
  },
};
