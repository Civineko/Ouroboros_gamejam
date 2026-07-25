export interface AudioPreferences {
  masterVolume: number;
  muted: boolean;
}

interface AudioPreferencesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const AUDIO_PREFERENCES_STORAGE_KEY =
  "ouroboros.audio-preferences.v1";

export const DEFAULT_AUDIO_PREFERENCES: Readonly<AudioPreferences> =
  Object.freeze({
    masterVolume: 0.8,
    muted: false,
  });

export function clampMasterVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_AUDIO_PREFERENCES.masterVolume;
  }

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

  return {
    masterVolume:
      typeof candidate.masterVolume === "number"
        ? clampMasterVolume(candidate.masterVolume)
        : DEFAULT_AUDIO_PREFERENCES.masterVolume,
    muted:
      typeof candidate.muted === "boolean"
        ? candidate.muted
        : DEFAULT_AUDIO_PREFERENCES.muted,
  };
}

function resolveStorage(
  storage?: AudioPreferencesStorage,
): AudioPreferencesStorage | undefined {
  if (storage !== undefined) {
    return storage;
  }

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
