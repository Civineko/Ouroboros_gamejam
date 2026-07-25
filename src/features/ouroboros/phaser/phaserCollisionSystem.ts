import Phaser from "phaser";
import type { CollisionSystem } from "../engine/types";

const firstCircle = new Phaser.Geom.Circle();
const secondCircle = new Phaser.Geom.Circle();
const polygon = new Phaser.Geom.Polygon();

export const phaserCollisionSystem: CollisionSystem = {
  circlesOverlap(first, firstRadius, second, secondRadius) {
    firstCircle.setTo(first.x, first.y, firstRadius);
    secondCircle.setTo(second.x, second.y, secondRadius);
    return Phaser.Geom.Intersects.CircleToCircle(firstCircle, secondCircle);
  },
  containsPoint(points, point) {
    polygon.setTo([...points]);
    return Phaser.Geom.Polygon.Contains(polygon, point.x, point.y);
  },
};
