import { describe, expect, it, vi } from "vitest";
import { OuroborosAudioController } from "./OuroborosAudioController";
import { OUROBOROS_AUDIO_KEYS } from "./audioCatalog";

class FakeAudioParam {
  value = 1;
  cancelScheduledValues = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
  setTargetAtTime = vi.fn();
  setValueAtTime = vi.fn();
}

class FakeAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeOscillatorNode extends FakeAudioNode {
  type: OscillatorType = "sine";
  frequency = new FakeAudioParam();
  start = vi.fn();
  stop = vi.fn();
  addEventListener = vi.fn();
}

class FakeAudioContext {
  state: AudioContextState = "suspended";
  currentTime = 0;
  sampleRate = 48_000;
  destination = new FakeAudioNode();
  oscillators: FakeOscillatorNode[] = [];
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });

  createGain(): FakeGainNode {
    return new FakeGainNode();
  }

  createOscillator(): FakeOscillatorNode {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }
}

function createController(context: FakeAudioContext): OuroborosAudioController {
  return new OuroborosAudioController(
    () => context as unknown as AudioContext,
  );
}

describe("OuroborosAudioController", () => {
  it("plays a queued cue after the browser audio context resumes", async () => {
    const context = new FakeAudioContext();
    const controller = createController(context);

    controller.play("ui-click");

    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(0);

    await Promise.resolve();

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0]?.start).toHaveBeenCalledOnce();
  });

  it("starts one music graph after resume and does not duplicate it", async () => {
    const context = new FakeAudioContext();
    const controller = createController(context);

    controller.startMusic();
    expect(context.oscillators).toHaveLength(0);

    await Promise.resolve();
    expect(context.oscillators).toHaveLength(3);

    controller.startMusic();
    expect(context.oscillators).toHaveLength(3);
  });

  it("uses Phaser's audio context without taking ownership of it", () => {
    const context = new FakeAudioContext();
    context.state = "running";
    const fallbackFactory = vi.fn(() => null);
    const controller = new OuroborosAudioController(fallbackFactory);

    controller.attachContext(
      context as unknown as AudioContext,
      context.destination as unknown as AudioNode,
    );
    controller.play("ui-click");
    controller.destroy();

    expect(fallbackFactory).not.toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(1);
    expect(context.close).not.toHaveBeenCalled();
  });

  it("switches to boss music at the configured 5 percent music volume", () => {
    const context = new FakeAudioContext();
    context.state = "running";
    const bossMusic = {
      manager: {},
      pendingRemove: false,
      isPlaying: false,
      isPaused: false,
      play: vi.fn(() => true),
      pause: vi.fn(() => true),
      resume: vi.fn(() => true),
      stop: vi.fn(() => true),
      destroy: vi.fn(),
      setVolume: vi.fn(),
    };
    const sound = {
      add: vi.fn(() => bossMusic),
      play: vi.fn(() => true),
      stopByKey: vi.fn(() => 0),
    };
    const controller = createController(context);

    controller.attachBossAudio(sound as never);
    controller.startMusic();
    controller.startBossEncounter();

    expect(bossMusic.play).toHaveBeenCalledWith({
      loop: true,
      volume: 0.56 * 0.05,
    });
  });

  it("routes boss effects through the effects volume", () => {
    const context = new FakeAudioContext();
    const bossMusic = {
      manager: {},
      pendingRemove: false,
      isPlaying: false,
      isPaused: false,
      play: vi.fn(() => true),
      pause: vi.fn(() => true),
      resume: vi.fn(() => true),
      stop: vi.fn(() => true),
      destroy: vi.fn(),
      setVolume: vi.fn(),
    };
    const sound = {
      add: vi.fn(() => bossMusic),
      play: vi.fn(() => true),
      stopByKey: vi.fn(() => 0),
    };
    const controller = createController(context);

    controller.attachBossAudio(sound as never);
    controller.setEffectsVolume(0.5);
    controller.handleEvent({ type: "boss-charge" });

    expect(sound.stopByKey).toHaveBeenCalledWith(
      OUROBOROS_AUDIO_KEYS.bossCharge,
    );
    expect(sound.play).toHaveBeenCalledWith(
      OUROBOROS_AUDIO_KEYS.bossCharge,
      { volume: 0.3 * 0.5 },
    );
  });
});
