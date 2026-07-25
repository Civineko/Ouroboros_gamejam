import type Phaser from "phaser";
import type { GameEvent } from "../../engine/types";
import {
  audioAssetFor,
  OUROBOROS_AUDIO_KEYS,
  type OuroborosAudioKey,
} from "./audioCatalog";

export class OuroborosAudioController {
  private readonly bossMusic: Phaser.Sound.BaseSound;

  constructor(private readonly scene: Phaser.Scene) {
    const music = audioAssetFor(OUROBOROS_AUDIO_KEYS.bossBattleMusic);
    this.bossMusic = scene.sound.add(music.key, {
      loop: music.loop,
      volume: music.volume,
    });
  }

  unlockFromGesture(): void {
    const manager = this.scene.sound as Phaser.Sound.BaseSoundManager & {
      unlock?: () => void;
    };
    manager.unlock?.();
  }

  startBossEncounter(): void {
    this.startBossMusic();
  }

  handleEvent(event: GameEvent): void {
    if (event.type === "boss-spawned") {
      this.playSfx(OUROBOROS_AUDIO_KEYS.bossSpawn);
      this.startBossEncounter();
    }

    if (event.type === "boss-charge") {
      this.playSfx(OUROBOROS_AUDIO_KEYS.bossCharge);
    }

    if (event.type === "boss-hit") {
      this.playSfx(OUROBOROS_AUDIO_KEYS.bossCoreHit);
    }

    if (event.type === "boss-defeated") {
      this.bossMusic.stop();
      this.playSfx(OUROBOROS_AUDIO_KEYS.bossDefeated);
    }

    if (event.type === "game-over") {
      this.bossMusic.stop();
    }
  }

  pause(): void {
    if (!this.hasLiveSoundManager()) return;
    this.scene.sound.pauseAll();
  }

  resume(): void {
    if (!this.hasLiveSoundManager()) return;
    this.scene.sound.resumeAll();
  }

  reset(): void {
    if (!this.hasLiveSoundManager()) return;
    for (const key of Object.values(OUROBOROS_AUDIO_KEYS)) {
      this.scene.sound.stopByKey(key);
    }
  }

  destroy(): void {
    if (!this.hasLiveSoundManager()) return;
    this.reset();
    this.bossMusic.destroy();
  }

  private startBossMusic(): void {
    if (!this.hasLiveSoundManager() || this.bossMusic.isPlaying) return;
    const music = audioAssetFor(OUROBOROS_AUDIO_KEYS.bossBattleMusic);
    this.bossMusic.play({ loop: music.loop, volume: music.volume });
  }

  private playSfx(key: OuroborosAudioKey): void {
    if (!this.hasLiveSoundManager()) return;
    const asset = audioAssetFor(key);
    this.scene.sound.stopByKey(key);
    this.scene.sound.play(key, { volume: asset.volume });
  }

  private hasLiveSoundManager(): boolean {
    return !this.bossMusic.pendingRemove && Boolean(this.bossMusic.manager);
  }
}
