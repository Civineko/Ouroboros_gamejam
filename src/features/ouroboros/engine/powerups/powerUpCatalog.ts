import type { PowerUpKind } from "../types";

export interface PowerUpDefinition {
  kind: PowerUpKind;
  label: string;
  color: string;
  weight: number;
  duration: number | null;
  radius: number;
}

export const POWER_UP_KINDS = [
  "shield",
  "heal",
  "stasis",
  "haste",
] as const satisfies readonly PowerUpKind[];

export const POWER_UP_DEFINITIONS: Readonly<
  Record<PowerUpKind, PowerUpDefinition>
> = {
  shield: {
    kind: "shield",
    label: "护环",
    color: "#66c7ff",
    weight: 20,
    duration: null,
    radius: 12,
  },
  heal: {
    kind: "heal",
    label: "回生",
    color: "#ff6f91",
    weight: 16,
    duration: null,
    radius: 12,
  },
  stasis: {
    kind: "stasis",
    label: "凝滞",
    color: "#8e86ff",
    weight: 20,
    duration: 5,
    radius: 12,
  },
  haste: {
    kind: "haste",
    label: "疾行",
    color: "#f6c94c",
    weight: 24,
    duration: 5,
    radius: 12,
  },
};

export function powerUpDefinition(kind: PowerUpKind): PowerUpDefinition {
  return POWER_UP_DEFINITIONS[kind];
}
