#!/usr/bin/env python3
"""Generate the small procedural Boss cues shipped with the game."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 22_050
OUTPUT_DIR = (
    Path(__file__).resolve().parents[1]
    / "public"
    / "assets"
    / "ouroboros"
    / "audio"
    / "sfx"
    / "gameplay"
)


def envelope(time: float, duration: float, attack: float, release: float) -> float:
    return min(1.0, time / attack, max(0.0, (duration - time) / release))


def write_wave(name: str, duration: float, sample) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = bytearray()
    for index in range(round(duration * SAMPLE_RATE)):
        time = index / SAMPLE_RATE
        value = max(-1.0, min(1.0, sample(time, duration)))
        frames.extend(struct.pack("<h", round(value * 32_767)))

    with wave.open(str(OUTPUT_DIR / name), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(frames)


def spawn_cue(time: float, duration: float) -> float:
    rng = random.Random(round(time * SAMPLE_RATE) + 417)
    rise = time / duration
    pitch = 54 + rise * 76
    pulse = math.sin(math.tau * pitch * time + rise * rise * 10)
    overtone = math.sin(math.tau * pitch * 2.01 * time) * 0.32
    noise = (rng.random() * 2 - 1) * 0.18 * (1 - rise)
    impact = math.sin(math.tau * 43 * time) * math.exp(-time * 5.5)
    return (pulse * 0.46 + overtone + noise + impact * 0.55) * envelope(
        time, duration, 0.025, 0.24
    )


def core_hit_cue(time: float, duration: float) -> float:
    fall = 1 - time / duration
    pitch = 760 * (0.24 + fall * 0.76)
    ring = math.sin(math.tau * pitch * time) * 0.5
    metal = math.sin(math.tau * pitch * 1.51 * time) * 0.28
    thump = math.sin(math.tau * 92 * time) * math.exp(-time * 12)
    return (ring + metal + thump * 0.68) * envelope(
        time, duration, 0.008, 0.18
    )


def defeat_cue(time: float, duration: float) -> float:
    rng = random.Random(round(time * SAMPLE_RATE) + 911)
    notes = (261.63, 329.63, 392.0, 523.25)
    value = 0.0
    for index, note in enumerate(notes):
        note_time = time - index * 0.19
        if note_time >= 0:
            note_env = math.exp(-note_time * 1.45)
            value += math.sin(math.tau * note * note_time) * note_env * 0.21
            value += (
                math.sin(math.tau * note * 2.005 * note_time)
                * note_env
                * 0.065
            )
    sparkle = (rng.random() * 2 - 1) * 0.08 * max(0.0, 1 - time / duration)
    low_release = math.sin(math.tau * 65 * time) * math.exp(-time * 2.8) * 0.32
    return (value + sparkle + low_release) * envelope(
        time, duration, 0.012, 0.42
    )


def main() -> None:
    write_wave("sfx_boss_spawn.wav", 1.1, spawn_cue)
    write_wave("sfx_boss_core_hit.wav", 0.48, core_hit_cue)
    write_wave("stinger_boss_defeated.wav", 2.2, defeat_cue)


if __name__ == "__main__":
    main()
