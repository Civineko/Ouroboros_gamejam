import Phaser from "phaser";
import type { GameState } from "../engine/types";
import {
  OuroborosScene,
  type OuroborosSceneCallbacks,
} from "./OuroborosScene";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "./config";

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
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    backgroundColor: "#48678f",
    transparent: false,
    scene,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
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
