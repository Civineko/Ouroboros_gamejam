import { describe, expect, it } from "vitest";
import { actionForKey } from "./gameActions";

describe("keyboard actions", () => {
  it.each([
    ["ArrowUp", "up"],
    ["w", "up"],
    ["W", "up"],
    ["ArrowDown", "down"],
    ["s", "down"],
    ["S", "down"],
    ["ArrowLeft", "left"],
    ["a", "left"],
    ["A", "left"],
    ["ArrowRight", "right"],
    ["d", "right"],
    ["D", "right"],
  ] as const)("maps %s to steer %s", (key, direction) => {
    expect(actionForKey(key)).toEqual({ type: "steer", direction });
  });

  it.each([" ", "Escape", "Esc", "p", "P"])("maps %s to toggle pause", (key) => {
    expect(actionForKey(key)).toEqual({ type: "toggle-pause" });
  });

  it("ignores unrelated keys", () => {
    expect(actionForKey("R")).toBeNull();
    expect(actionForKey("Enter")).toBeNull();
  });
});
