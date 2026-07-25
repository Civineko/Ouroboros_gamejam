import { describe, expect, it } from "vitest";
import { actionForKey } from "./gameActions";

describe("keyboard actions", () => {
  it("maps keyboard variants to semantic actions", () => {
    expect(actionForKey("ArrowUp")).toEqual({ type: "steer", direction: "up" });
    expect(actionForKey("d")).toEqual({ type: "steer", direction: "right" });
    expect(actionForKey(" ")).toEqual({ type: "toggle-pause" });
  });

  it("ignores unrelated keys", () => {
    expect(actionForKey("R")).toBeNull();
    expect(actionForKey("Escape")).toBeNull();
  });
});
