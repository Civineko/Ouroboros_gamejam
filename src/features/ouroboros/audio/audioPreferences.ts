export interface AudioPreferences {
  musicVolume: number;
  effectsVolume: number;
}

interface AudioPreferencesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const AUDIO_PREFERENCES_STORAGE_KEY =
  "ouroboros.audio-preferences.v1";

export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> =
  Object.freeze({
    musicVolume: 0.05,
    effectsVolume: 0.8,
  });

export function clampVolume(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function defaultPreferences(): AudioPreferences {
  return { ...DEFAULT_AUDIO_PREFERENCES };
}

function normalizePreferences(value: unknown): AudioPreferences {
  if (typeof value !== "object" || value === null) {
    return defaultPreferences();
  }

  const candidate = value as Record<string, unknown>;
  const legacyVolume =
    typeof candidate.masterVolume === "number"
      ? clampVolume(
          candidate.masterVolume,
          DEFAULT_AUDIO_PREFERENCES.effectsVolume,
        )
      : undefined;
  const legacyMuted = candidate.muted === true;
  const musicVolume =
    typeof candidate.musicVolume === "number"
      ? clampVolume(
          candidate.musicVolume,
          DEFAULT_AUDIO_PREFERENCES.musicVolume,
        )
      : (legacyVolume ?? DEFAULT_AUDIO_PREFERENCES.musicVolume);
  const effectsVolume =
    typeof candidate.effectsVolume === "number"
      ? clampVolume(
          candidate.effectsVolume,
          DEFAULT_AUDIO_PREFERENCES.effectsVolume,
        )
      : (legacyVolume ?? DEFAULT_AUDIO_PREFERENCES.effectsVolume);

  return legacyMuted
    ? { musicVolume: 0, effectsVolume: 0 }
    : { musicVolume, effectsVolume };
}

function resolveStorage(
  storage?: AudioPreferencesStorage,
): AudioPreferencesStorage | undefined {
  if (storage !== undefined) return storage;

  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function loadAudioPreferences(
  storage?: AudioPreferencesStorage,
): AudioPreferences {
  try {
    const value = resolveStorage(storage)?.getItem(
      AUDIO_PREFERENCES_STORAGE_KEY,
    );

    return value === null || value === undefined
      ? defaultPreferences()
      : normalizePreferences(JSON.parse(value));
  } catch {
    return defaultPreferences();
  }
}

export function saveAudioPreferences(
  preferences: AudioPreferences,
  storage?: AudioPreferencesStorage,
): void {
  try {
    resolveStorage(storage)?.setItem(
      AUDIO_PREFERENCES_STORAGE_KEY,
      JSON.stringify(normalizePreferences(preferences)),
    );
  } catch {
    // Persistence must never prevent the game from starting or continuing.
  }
}
