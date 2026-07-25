import { onMounted, onUnmounted, readonly, ref, shallowRef } from "vue";
import { MAX_FRAME_DELTA } from "../engine/config";
import {
  createGameState,
  setCardinalDirection,
  snapshotHud,
  steerToward,
  updateGame,
} from "../engine/gameEngine";
import type {
  CardinalDirection,
  GameEvent,
  GameState,
  Point,
} from "../engine/types";
import { actionForKey } from "../input/gameActions";
import { drawGame } from "../rendering/canvasRenderer";

export function useOuroborosGame(
  getCanvas: () => HTMLCanvasElement | null,
) {
  const started = ref(false);
  const paused = ref(false);
  const gameOver = ref(false);

  let game: GameState = createGameState();
  const hud = shallowRef(snapshotHud(game));
  let running = false;
  let animationFrame: number | null = null;
  let previousTime: number | null = null;

  function syncHud(): void {
    hud.value = snapshotHud(game);
  }

  function processEvents(events: readonly GameEvent[]): void {
    if (events.length === 0) return;

    for (const event of events) {
      if (event.type === "game-over") {
        running = false;
        gameOver.value = true;
      }
    }

    syncHud();
  }

  function frame(time: number): void {
    if (previousTime === null) previousTime = time;
    const delta = Math.min(MAX_FRAME_DELTA, (time - previousTime) / 1000);
    previousTime = time;

    if (running && !paused.value) {
      processEvents(updateGame(game, delta));
    }

    const canvas = getCanvas();
    if (canvas) drawGame(canvas, game);
    animationFrame = window.requestAnimationFrame(frame);
  }

  function start(): void {
    game = createGameState();
    running = true;
    previousTime = null;
    started.value = true;
    paused.value = false;
    gameOver.value = false;
    syncHud();
  }

  function togglePause(): void {
    if (!started.value || gameOver.value) return;
    paused.value = !paused.value;
  }

  function aimAt(point: Point): void {
    steerToward(game, point);
  }

  function steer(direction: CardinalDirection): void {
    setCardinalDirection(game, direction);
  }

  function handleKeydown(event: KeyboardEvent): void {
    const action = actionForKey(event.key);
    if (!action) return;

    event.preventDefault();
    if (action.type === "steer") steer(action.direction);
    if (action.type === "toggle-pause") togglePause();
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeydown);
    animationFrame = window.requestAnimationFrame(frame);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
  });

  return {
    started: readonly(started),
    paused: readonly(paused),
    gameOver: readonly(gameOver),
    hud: readonly(hud),
    start,
    togglePause,
    aimAt,
    steer,
  };
}
