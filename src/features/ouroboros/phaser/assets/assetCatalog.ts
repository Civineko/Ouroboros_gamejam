const ART_ROOT = "assets/ouroboros";

export const OUROBOROS_ART_KEYS = {
  stageBackground: "ouroboros.stage.background",
  snakeHead: "ouroboros.snake.head",
  snakeBody: "ouroboros.snake.body",
  snakeTail: "ouroboros.snake.tail",
  enemyStationary: "ouroboros.enemy.stationary",
  enemyWanderer: "ouroboros.enemy.wanderer",
  enemyTracker: "ouroboros.enemy.tracker",
  powerUpShield: "ouroboros.power-up.shield",
  powerUpHeal: "ouroboros.power-up.heal",
  powerUpStasis: "ouroboros.power-up.stasis",
  powerUpHaste: "ouroboros.power-up.haste",
  powerUpResonance: "ouroboros.power-up.resonance",
  captureParticle: "ouroboros.effect.capture-particle",
  hitBurst: "ouroboros.effect.hit-burst",
} as const;

export type ArtAssetStatus = "todo" | "ready";

interface ImageArtAsset {
  type: "image";
  key: string;
  path: string;
  status: ArtAssetStatus;
}

interface SpriteSheetArtAsset {
  type: "spritesheet";
  key: string;
  path: string;
  status: ArtAssetStatus;
  frameWidth: number;
  frameHeight: number;
}

export type OuroborosArtAsset = ImageArtAsset | SpriteSheetArtAsset;

export const OUROBOROS_ART_ASSETS: readonly OuroborosArtAsset[] = [
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.stageBackground,
    path: `${ART_ROOT}/environment/stage/tex_stage_tile.webp`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.snakeHead,
    path: `${ART_ROOT}/characters/snake/spr_snake_head.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.snakeBody,
    path: `${ART_ROOT}/characters/snake/tex_snake_body_strip.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.snakeTail,
    path: `${ART_ROOT}/characters/snake/spr_snake_tail.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.enemyStationary,
    path: `${ART_ROOT}/characters/enemies/spr_enemy_stationary.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.enemyWanderer,
    path: `${ART_ROOT}/characters/enemies/spr_enemy_wanderer.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.enemyTracker,
    path: `${ART_ROOT}/characters/enemies/spr_enemy_tracker.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.powerUpShield,
    path: `${ART_ROOT}/items/powerups/spr_powerup_shield.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.powerUpHeal,
    path: `${ART_ROOT}/items/powerups/spr_powerup_heal.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.powerUpStasis,
    path: `${ART_ROOT}/items/powerups/spr_powerup_stasis.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.powerUpHaste,
    path: `${ART_ROOT}/items/powerups/spr_powerup_haste.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.powerUpResonance,
    path: `${ART_ROOT}/items/powerups/spr_powerup_resonance.png`,
    status: "ready",
  },
  {
    type: "image",
    key: OUROBOROS_ART_KEYS.captureParticle,
    path: `${ART_ROOT}/effects/fx_capture_particle.png`,
    status: "todo",
  },
  {
    type: "spritesheet",
    key: OUROBOROS_ART_KEYS.hitBurst,
    path: `${ART_ROOT}/effects/sheet_hit_burst.png`,
    status: "todo",
    frameWidth: 128,
    frameHeight: 128,
  },
];
