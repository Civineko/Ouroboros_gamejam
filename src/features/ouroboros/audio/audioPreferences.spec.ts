import { describe, expect, it, vi } from "vitest";
import {
  AUDIO_PREFERENCES_STORAGE_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  clampVolume,
  loadAudioPreferences,
  saveAudioPreferences,
} from "./audioPreferences";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}

describe("audio preferences", () => {
  it("uses separate defaults when no preferences are stored", () => {
    expect(loadAudioPreferences(createStorage())).toEqual(
      DEFAULT_AUDIO_PREFERENCES,
    );
  });

  it.each([
    [-0.5, 0],
    [0, 0],
    [0.35, 0.35],
    [1, 1],
    [1.5, 1],
    [Number.NaN, 0.6],
    [Number.POSITIVE_INFINITY, 0.6],
  ])("clamps volume %s to %s", (value, expected) => {
    expect(clampVolume(value, 0.6)).toBe(expected);
  });

  it("loads and clamps separate music and effects volumes", () => {
    const storage = createStorage(
      JSON.stringify({ musicVolume: 1.4, effectsVolume: -0.2 }),
    );

    expect(loadAudioPreferences(storage)).toEqual({
      musicVolume: 1,
      effectsVolume: 0,
    });
    expect(storage.getItem).toHaveBeenCalledWith(
      AUDIO_PREFERENCES_STORAGE_KEY,
    );
  });

  it("migrates the legacy master volume and mute fields", () => {
    expect(
      loadAudioPreferences(
        createStorage(JSON.stringify({ masterVolume: 0.35, muted: false })),
      ),
    ).toEqual({ musicVolume: 0.35, effectsVolume: 0.35 });
    expect(
      loadAudioPreferences(
        createStorage(JSON.stringify({ masterVolume: 0.7, muted: true })),
      ),
    ).toEqual({ musicVolume: 0, effectsVolume: 0 });
  });

  it.each(["{broken", "null", "[]"])(
    "falls back for malformed stored data: %s",
    (storedValue) => {
      expect(loadAudioPreferences(createStorage(storedValue))).toEqual(
        DEFAULT_AUDIO_PREFERENCES,
      );
    },
  );

  it("falls back field by field when stored fields have invalid types", () => {
    const storage = createStorage(
      JSON.stringify({ musicVolume: "0.4", effectsVolume: "yes" }),
    );

    expect(loadAudioPreferences(storage)).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("does not propagate storage read errors", () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("storage unavailable");
      }),
      setItem: vi.fn(),
    };

    expect(loadAudioPreferences(storage)).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("normalizes preferences before saving", () => {
    const storage = createStorage();

    saveAudioPreferences(
      { musicVolume: -2, effectsVolume: 4 },
      storage,
    );

    expect(storage.setItem).toHaveBeenCalledWith(
      AUDIO_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ musicVolume: 0, effectsVolume: 1 }),
    );
  });

  it("does not propagate storage write errors", () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("storage unavailable");
      }),
    };

    expect(() =>
      saveAudioPreferences(
        { musicVolume: Number.NaN, effectsVolume: 0.5 },
        storage,
      ),
    ).not.toThrow();
  });
});
