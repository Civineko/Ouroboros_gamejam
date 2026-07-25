import { describe, expect, it } from "vitest";
import {
  DEVOURER_ACTION_FRAMES,
  devourerActionFrame,
} from "./bossArtFrames";

describe("devourer action frames", () => {
  it("maps every Boss action to the delivered pose", () => {
    expect(devourerActionFrame("appearing", 0, 0)).toBe(
      DEVOURER_ACTION_FRAMES.idle,
    );
    expect(devourerActionFrame("telegraphing", 0, 0)).toBe(
      DEVOURER_ACTION_FRAMES.telegraph,
    );
    expect(devourerActionFrame("charging", 0, 0)).toBe(
      DEVOURER_ACTION_FRAMES.charge,
    );
    expect(devourerActionFrame("recovering", 0, 0)).toBe(
      DEVOURER_ACTION_FRAMES.stagger,
    );
  });

  it("alternates the two stalking frames without owning animation state", () => {
    expect(devourerActionFrame("stalking", 0, 0)).toBe(
      DEVOURER_ACTION_FRAMES.huntA,
    );
    expect(devourerActionFrame("stalking", 1 / 6, 0)).toBe(
      DEVOURER_ACTION_FRAMES.huntB,
    );
  });

  it("shows the hit pose over the current action", () => {
    expect(devourerActionFrame("charging", 0, 0.2)).toBe(
      DEVOURER_ACTION_FRAMES.hit,
    );
  });
});
