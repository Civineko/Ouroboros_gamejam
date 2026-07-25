import { describe, expect, it, vi } from "vitest";
import { OuroborosAudioController } from "./OuroborosAudioController";

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
});
