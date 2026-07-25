import { describe, expect, it } from "vitest";
import {
  audioAssetFor,
  OUROBOROS_AUDIO_ASSETS,
  OUROBOROS_AUDIO_KEYS,
} from "./audioCatalog";

describe("ouroboros audio catalog", () => {
  it("registers every Boss cue once with safe runtime settings", () => {
    const keys = OUROBOROS_AUDIO_ASSETS.map((asset) => asset.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(expect.arrayContaining(Object.values(OUROBOROS_AUDIO_KEYS)));

    for (const asset of OUROBOROS_AUDIO_ASSETS) {
      expect(asset.path).toMatch(/^assets\/ouroboros\/audio\//);
      expect(asset.volume).toBeGreaterThan(0);
      expect(asset.volume).toBeLessThanOrEqual(1);
    }
  });

  it("loops only the Boss battle track", () => {
    expect(audioAssetFor(OUROBOROS_AUDIO_KEYS.bossBattleMusic).loop).toBe(
      true,
    );
    expect(
      OUROBOROS_AUDIO_ASSETS.filter((asset) => asset.loop).map(
        (asset) => asset.key,
      ),
    ).toEqual([OUROBOROS_AUDIO_KEYS.bossBattleMusic]);
  });

  it("keeps the charge voice below the battle music mix", () => {
    const music = audioAssetFor(OUROBOROS_AUDIO_KEYS.bossBattleMusic);
    const charge = audioAssetFor(OUROBOROS_AUDIO_KEYS.bossCharge);

    expect(charge.volume).toBeLessThan(music.volume);
    expect(charge.volume).toBeLessThanOrEqual(0.3);
  });
});
