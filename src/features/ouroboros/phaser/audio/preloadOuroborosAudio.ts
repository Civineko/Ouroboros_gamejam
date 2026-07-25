import type Phaser from "phaser";
import { OUROBOROS_AUDIO_ASSETS } from "./audioCatalog";

export function preloadOuroborosAudio(scene: Phaser.Scene): void {
  for (const asset of OUROBOROS_AUDIO_ASSETS) {
    scene.load.audio(asset.key, asset.path);
  }
}
