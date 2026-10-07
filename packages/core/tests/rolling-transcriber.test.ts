import { describe, expect, it } from "vitest";
import { RollingTranscriber } from "../src/rolling-transcriber";
import type { TranscriptEvent } from "../src/providers";

const RATE = 16000;
const loud = (ms: number) => new Float32Array((RATE * ms) / 1000).fill(0.2);
const quiet = (ms: number) => new Float32Array((RATE * ms) / 1000).fill(0.001);

function setup(opts: { maxWindowSec?: number } = {}) {
  const events: TranscriptEvent[] = [];
  const lengths: number[] = [];
  const t = new RollingTranscriber({
    transcribe: async (pcm) => {
      lengths.push(pcm.length / RATE);
      return "hello there friend";
    },
    onEvent: (e) => events.push(e),
    ...opts,
  });
  return { t, events, lengths };
}

describe("RollingTranscriber", () => {
  it("no transcribe silencio ni ruidos muy breves", async () => {
    const { t, events, lengths } = setup();
    for (let i = 0; i < 20; i++) t.push(quiet(100), i * 100);
    await t.tick(2000);
    t.push(loud(100), 2100); // 100 ms de ruido < minSpeech
    await t.tick(2200);
    await t.tick(4000);
    expect(lengths).toEqual([]);
    expect(events).toEqual([]);
  });

  it("emite parciales mientras hay voz y un final tras la pausa", async () => {
    const { t, events } = setup();
    for (let i = 0; i < 10; i++) t.push(loud(100), i * 100);
    await t.tick(1000);
    expect(events).toEqual([{ text: "hello there friend", isFinal: false }]);
    await t.tick(1500); // 500 ms de silencio: aún no
    expect(events).toHaveLength(2);
    expect(events[1]?.isFinal).toBe(false);
    await t.tick(2000); // > 700 ms de silencio
    expect(events.at(-1)).toEqual({ text: "hello there friend", isFinal: true });
    // tras el final queda en reposo
    await t.tick(3000);
    expect(events).toHaveLength(3);
  });

  it("conserva un pre-roll antes de la voz", async () => {
    const { t, lengths } = setup();
    for (let i = 0; i < 10; i++) t.push(quiet(100), i * 100);
    for (let i = 0; i < 5; i++) t.push(loud(100), 1000 + i * 100);
    await t.tick(1500);
    // 500 ms de voz + ~300 ms de pre-roll
    expect(lengths[0]).toBeGreaterThan(0.6);
    expect(lengths[0]).toBeLessThan(0.9);
  });

  it("cierra como final al superar la ventana máxima", async () => {
    const { t, events } = setup({ maxWindowSec: 2 });
    for (let i = 0; i < 25; i++) t.push(loud(100), i * 100);
    await t.tick(2500);
    expect(events).toEqual([{ text: "hello there friend", isFinal: true }]);
  });
});
