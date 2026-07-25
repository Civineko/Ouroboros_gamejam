import type { PowerUpKind } from "../../engine/types";

export type AudioCue =
  | "ui-click"
  | "round-start"
  | "round-restart"
  | "pause"
  | "resume"
  | "capture"
  | "hit"
  | "empty-loop"
  | "shield-blocked"
  | "powerup-shield"
  | "powerup-heal"
  | "powerup-stasis"
  | "powerup-haste"
  | "game-over";

export interface AudioCueDefinition {
  category: "effects";
  gain: number;
  status: "procedural";
}

export const AUDIO_CUE_CATALOG: Readonly<Record<AudioCue, AudioCueDefinition>> =
  Object.freeze({
    "ui-click": { category: "effects", gain: 0.28, status: "procedural" },
    "round-start": { category: "effects", gain: 0.4, status: "procedural" },
    "round-restart": { category: "effects", gain: 0.42, status: "procedural" },
    pause: { category: "effects", gain: 0.34, status: "procedural" },
    resume: { category: "effects", gain: 0.36, status: "procedural" },
    capture: { category: "effects", gain: 0.52, status: "procedural" },
    hit: { category: "effects", gain: 0.5, status: "procedural" },
    "empty-loop": { category: "effects", gain: 0.28, status: "procedural" },
    "shield-blocked": { category: "effects", gain: 0.46, status: "procedural" },
    "powerup-shield": { category: "effects", gain: 0.4, status: "procedural" },
    "powerup-heal": { category: "effects", gain: 0.4, status: "procedural" },
    "powerup-stasis": { category: "effects", gain: 0.4, status: "procedural" },
    "powerup-haste": { category: "effects", gain: 0.4, status: "procedural" },
    "game-over": { category: "effects", gain: 0.48, status: "procedural" },
  });

export const PROCEDURAL_MUSIC_GAIN = 0.17;

export function cueForPowerUp(kind: PowerUpKind): AudioCue {
  return `powerup-${kind}`;
}
