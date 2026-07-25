import { onMounted, onUnmounted, readonly, ref, shallowRef } from "vue";
import { createGameState, snapshotHud } from "../engine/gameEngine";
import type { CardinalDirection } from "../engine/types";
import {
  createOuroborosRuntime,
  type OuroborosRuntime,
} from "../phaser/createOuroborosRuntime";

export function useOuroborosGame(
  getContainer: () => HTMLElement | null,
) {
  const started = ref(false);
  const paused = ref(false);
  const gameOver = ref(false);

  const initialState = createGameState();
  const hud = shallowRef(snapshotHud(initialState));
  let runtime: OuroborosRuntime | null = null;

  function start(): void {
    runtime?.scene.startRound();
  }

  function togglePause(): void {
    runtime?.scene.togglePause();
  }

  function steer(direction: CardinalDirection): void {
    runtime?.scene.steer(direction);
  }

  onMounted(() => {
    const container = getContainer();
    if (!container) return;

    runtime = createOuroborosRuntime(
      container,
      {
        onHudChange(nextHud) {
          hud.value = nextHud;
        },
        onStatusChange(status) {
          started.value = status.started;
          paused.value = status.paused;
          gameOver.value = status.gameOver;
        },
      },
      initialState,
    );
  });

  onUnmounted(() => {
    runtime?.game.destroy(true);
    runtime = null;
  });

  return {
    started: readonly(started),
    paused: readonly(paused),
    gameOver: readonly(gameOver),
    hud: readonly(hud),
    start,
    togglePause,
    steer,
  };
}
