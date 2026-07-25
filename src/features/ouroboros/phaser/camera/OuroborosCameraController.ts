import type Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../engine/config";
import type { Point } from "../../engine/types";
import { CAMERA_FOLLOW_RESPONSE } from "../config";
import {
  cameraScrollTarget,
  minimumCameraZoom,
  smoothCameraScroll,
} from "./cameraMath";

export class OuroborosCameraController {
  constructor(private readonly camera: Phaser.Cameras.Scene2D.Camera) {
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.resize();
  }

  resize(): void {
    this.camera.setZoom(
      minimumCameraZoom(
        { width: this.camera.width, height: this.camera.height },
        { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      ),
    );
  }

  snapTo(focus: Point): void {
    const target = this.targetFor(focus);
    this.camera.setScroll(target.x, target.y);
  }

  follow(focus: Point, delta: number): void {
    const next = smoothCameraScroll(
      { x: this.camera.scrollX, y: this.camera.scrollY },
      this.targetFor(focus),
      CAMERA_FOLLOW_RESPONSE,
      delta,
    );
    this.camera.setScroll(next.x, next.y);
  }

  private targetFor(focus: Point): Point {
    return cameraScrollTarget(
      focus,
      { width: this.camera.width, height: this.camera.height },
      { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      this.camera.zoom,
    );
  }
}
