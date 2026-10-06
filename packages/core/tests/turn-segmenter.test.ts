import { describe, expect, it } from "vitest";
import { TurnSegmenter } from "../src/turn-segmenter";

function setup(silenceMs = 1500) {
  let nextId = 1;
  const timers = new Map<number, { fn: () => void; at: number }>();
  let t = 0;
  const turns: string[] = [];
  const seg = new TurnSegmenter((x) => turns.push(x), {
    silenceMs,
    setTimer: (fn, ms) => {
      const id = nextId++;
      timers.set(id, { fn, at: t + ms });
      return id;
    },
    clearTimer: (id) => void timers.delete(id as number),
  });
  const advance = (ms: number) => {
    t += ms;
    for (const [id, tm] of [...timers]) {
      if (tm.at <= t) {
        timers.delete(id);
        tm.fn();
      }
    }
  };
  return { seg, turns, advance };
}

describe("TurnSegmenter", () => {
  it("cierra el turno tras el silencio", () => {
    const { seg, turns, advance } = setup();
    seg.push("Tell me", false);
    seg.push("Tell me about yourself", true);
    advance(1499);
    expect(turns).toEqual([]);
    advance(1);
    expect(turns).toEqual(["Tell me about yourself"]);
  });

  it("nuevo texto reinicia el temporizador", () => {
    const { seg, turns, advance } = setup();
    seg.push("Why do you", false);
    advance(1000);
    seg.push("Why do you want this job", false);
    advance(1000);
    expect(turns).toEqual([]);
    advance(500);
    expect(turns).toEqual(["Why do you want this job"]);
  });

  it("acumula finales y respeta silencio configurable", () => {
    const { seg, turns, advance } = setup(800);
    seg.push("First part.", true);
    seg.push("Second part", false);
    expect(seg.current).toBe("First part. Second part");
    advance(800);
    expect(turns).toEqual(["First part. Second part"]);
    expect(seg.current).toBe("");
  });

  it("flush cierra de inmediato y reset descarta", () => {
    const { seg, turns } = setup();
    seg.push("Hello there friend", true);
    seg.flush();
    expect(turns).toEqual(["Hello there friend"]);
    seg.push("discard me", true);
    seg.reset();
    seg.flush();
    expect(turns).toHaveLength(1);
  });

  it("ignora texto vacío", () => {
    const { seg, turns, advance } = setup();
    seg.push("   ", true);
    advance(5000);
    expect(turns).toEqual([]);
  });
});
