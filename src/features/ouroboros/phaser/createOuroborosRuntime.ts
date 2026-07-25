import Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../engine/config";
import type { GameState } from "../engine/types";
import {
  OuroborosScene,
  type OuroborosSceneCallbacks,
} from "./OuroborosScene";

export interface OuroborosRuntime {
  game: Phaser.Game;
  scene: OuroborosScene;
}

export function createOuroborosRuntime(
  parent: HTMLElement,
  callbacks: OuroborosSceneCallbacks,
  initialState: GameState,
): OuroborosRuntime {
  const scene = new OuroborosScene(callbacks, initialState);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    backgroundColor: "#48678f",
    transparent: false,
    scene,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
  });

  return { game, scene };
}
