import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import { OuroborosAudioController } from "./OuroborosAudioController";
import { OUROBOROS_AUDIO_KEYS } from "./audioCatalog";

function createAudioHarness() {
  const bossMusic = {
    manager: {} as unknown,
    pendingRemove: false,
    isPlaying: false,
    play: vi.fn(() => true),
    stop: vi.fn(() => true),
    destroy: vi.fn(),
  };
  const sound = {
    add: vi.fn(() => bossMusic),
    play: vi.fn(() => true),
    stopByKey: vi.fn(() => 0),
    pauseAll: vi.fn(),
    resumeAll: vi.fn(),
  };
  const scene = { sound } as unknown as Phaser.Scene;

  return {
    bossMusic,
    sound,
    controller: new OuroborosAudioController(scene),
  };
}

describe("Ouroboros audio controller", () => {
  it("starts the battle track when a preview already contains a boss", () => {
    const { bossMusic, controller } = createAudioHarness();

    controller.startBossEncounter();

    expect(bossMusic.play).toHaveBeenCalledWith({
      loop: true,
      volume: 0.56,
    });
  });

  it("plays the charge voice once at its reduced mix volume", () => {
    const { sound, controller } = createAudioHarness();

    controller.handleEvent({ type: "boss-charge" });

    expect(sound.stopByKey).toHaveBeenCalledWith(
      OUROBOROS_AUDIO_KEYS.bossCharge,
    );
    expect(sound.play).toHaveBeenCalledWith(
      OUROBOROS_AUDIO_KEYS.bossCharge,
      { volume: 0.3 },
    );
  });

  it("ignores late lifecycle calls after Phaser destroys its sound manager", () => {
    const { bossMusic, sound, controller } = createAudioHarness();
    bossMusic.pendingRemove = true;
    bossMusic.manager = null;

    controller.pause();
    controller.resume();
    controller.reset();
    controller.destroy();

    expect(sound.pauseAll).not.toHaveBeenCalled();
    expect(sound.resumeAll).not.toHaveBeenCalled();
    expect(sound.stopByKey).not.toHaveBeenCalled();
    expect(bossMusic.destroy).not.toHaveBeenCalled();
  });
});
