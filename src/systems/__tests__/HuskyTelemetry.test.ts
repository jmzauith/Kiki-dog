import { describe, it, expect } from "vitest";
import { PlaythroughLog } from "../HuskyTelemetry";

/** Deterministic clock for tests. */
function makeClock() {
  let t = 0;
  return {
    now: () => t,
    advance: (ms: number) => { t += ms; },
  };
}

describe("HuskyTelemetry — event recording and summary", () => {
  it("summarizes a full playthrough", () => {
    const c = makeClock();
    const log = new PlaythroughLog(c.now);

    log.record("run-started");
    c.advance(10_000);
    log.record("encounter-entered", "broken-bridge");
    log.record("math-asked", "broken-bridge");
    c.advance(30_000);
    log.record("math-answered", "broken-bridge", { correct: true });
    log.record("interaction-completed", "forest", { interactionId: "sniff-pawprints" });
    log.record("advice-choice-made", "forest", { choiceId: "advice-forest-noise", picked: "check-it-out" });
    log.record("advice-choice-made", "forest", { choiceId: "advice-forest-noise", picked: "check-it-out" }); // dedupe
    log.record("discovery-found", "snow-cache", { discoveryId: "bone-cache" });
    log.record("race-turn", "sled-race", { turn: 1 });
    log.record("race-beat", "sled-race", { beatId: "race-downhill" });
    c.advance(20_000);
    log.record("run-ended");

    const s = log.summarize();
    expect(s.totalMs).toBe(60_000);
    expect(s.idleMs).toBe(0);
    expect(s.activeMs).toBe(60_000);
    expect(s.mathAsked).toBe(1);
    expect(s.mathAnsweredCorrect).toBe(1);
    expect(s.interactionsCompleted).toBe(1);
    expect(s.adviceChoicesMade).toEqual(["advice-forest-noise"]);
    expect(s.discoveriesFound).toEqual(["bone-cache"]);
    expect(s.raceTurns).toBe(1);
    expect(s.raceBeats).toBe(1);
    expect(s.encountersVisited).toEqual(["broken-bridge"]);
  });

  it("excludes idle time from active playtime", () => {
    const c = makeClock();
    const log = new PlaythroughLog(c.now);
    log.record("run-started");
    c.advance(60_000);
    log.markIdle();
    c.advance(120_000); // child stares out the window
    log.markActive();
    c.advance(60_000);
    log.record("run-ended");

    const s = log.summarize();
    expect(s.totalMs).toBe(240_000);
    expect(s.idleMs).toBe(120_000);
    expect(s.activeMs).toBe(120_000);
  });

  it("hint and wrong-answer events are tracked", () => {
    const c = makeClock();
    const log = new PlaythroughLog(c.now);
    log.record("run-started");
    log.record("math-asked", "broken-bridge");
    log.record("math-answered", "broken-bridge", { correct: false });
    log.record("hint-shown", "broken-bridge", { level: 1 });
    log.record("math-answered", "broken-bridge", { correct: true });
    const s = log.summarize();
    expect(s.mathAsked).toBe(1);
    expect(s.mathAnsweredCorrect).toBe(1);
    expect(s.hintsShown).toBe(1);
  });

  it("toJSON round-trips events and summary", () => {
    const c = makeClock();
    const log = new PlaythroughLog(c.now);
    log.record("run-started");
    log.record("discovery-found", "secret-igloo", { discoveryId: "igloo" });
    const parsed = JSON.parse(log.toJSON());
    expect(parsed.events).toHaveLength(2);
    expect(parsed.summary.discoveriesFound).toEqual(["igloo"]);
  });

  it("clear resets the log", () => {
    const c = makeClock();
    const log = new PlaythroughLog(c.now);
    log.record("run-started");
    log.clear();
    expect(log.getEvents()).toHaveLength(0);
    expect(log.summarize().totalMs).toBe(0);
  });

  it("markIdle is idempotent until markActive", () => {
    const c = makeClock();
    const log = new PlaythroughLog(c.now);
    log.record("run-started");
    c.advance(10_000);
    log.markIdle();
    c.advance(10_000);
    log.markIdle(); // second call does nothing
    c.advance(10_000);
    log.markActive();
    const idleEvents = log.getEvents().filter((e) => e.type === "idle-started");
    expect(idleEvents).toHaveLength(1);
    expect(log.summarize().idleMs).toBe(20_000);
  });
});
