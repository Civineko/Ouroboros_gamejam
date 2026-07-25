import type Phaser from "phaser";
import { OUROBOROS_ART_ASSETS } from "./assetCatalog";

export function preloadOuroborosArt(scene: Phaser.Scene): void {
  for (const asset of OUROBOROS_ART_ASSETS) {
    if (asset.status !== "ready") continue;

    if (asset.type === "image") {
      scene.load.image(asset.key, asset.path);
      continue;
    }

    scene.load.spritesheet(asset.key, asset.path, {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  }
}
