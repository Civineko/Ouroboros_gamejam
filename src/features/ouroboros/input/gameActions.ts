import type { CardinalDirection } from "../engine/types";

export type GameAction =
  | { type: "steer"; direction: CardinalDirection }
  | { type: "toggle-pause" };

const DIRECTION_KEYS: Readonly<Record<string, CardinalDirection>> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

export function actionForKey(key: string): GameAction | null {
  const direction = DIRECTION_KEYS[key];
  if (direction) return { type: "steer", direction };
  if (key === " ") return { type: "toggle-pause" };
  return null;
}
