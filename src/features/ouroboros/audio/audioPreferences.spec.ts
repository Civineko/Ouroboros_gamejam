import { describe, expect, it, vi } from "vitest";
import {
  AUDIO_PREFERENCES_STORAGE_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  clampMasterVolume,
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
  it("uses sensible defaults when no preferences are stored", () => {
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
    [Number.NaN, DEFAULT_AUDIO_PREFERENCES.masterVolume],
    [Number.POSITIVE_INFINITY, DEFAULT_AUDIO_PREFERENCES.masterVolume],
  ])("clamps master volume %s to %s", (value, expected) => {
    expect(clampMasterVolume(value)).toBe(expected);
  });

  it("loads valid preferences and clamps a finite volume", () => {
    const storage = createStorage(
      JSON.stringify({ masterVolume: 1.4, muted: true }),
    );

    expect(loadAudioPreferences(storage)).toEqual({
      masterVolume: 1,
      muted: true,
    });
    expect(storage.getItem).toHaveBeenCalledWith(
      AUDIO_PREFERENCES_STORAGE_KEY,
    );
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
      JSON.stringify({ masterVolume: "0.4", muted: "yes" }),
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

    saveAudioPreferences({ masterVolume: -2, muted: true }, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      AUDIO_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ masterVolume: 0, muted: true }),
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
      saveAudioPreferences({ masterVolume: Number.NaN, muted: false }, storage),
    ).not.toThrow();
  });
});
