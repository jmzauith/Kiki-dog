import { describe, it, expect } from "vitest";
import {
  HUSKY_TIMING_PLAN,
  validatePacingPlan,
  isPlanOnTarget,
  childTotalSec,
  adultTotalSec,
  requiredMathCount,
  CHILD_TARGET_MIN_SEC,
  CHILD_TARGET_MAX_SEC,
  ADULT_TARGET_MAX_SEC,
  MAX_REQUIRED_MATH,
  MAX_BEAT_CHILD_SEC,
  type TimingBudget,
  type BeatEstimate,
} from "../HuskyPacing";

describe("HuskyPacing — built-in plan meets every target", () => {
  it("validates clean", () => {
    expect(validatePacingPlan(HUSKY_TIMING_PLAN)).toEqual([]);
    expect(isPlanOnTarget()).toBe(true);
  });

  it("child-paced total is 10–15 minutes on both routes", () => {
    for (const route of ["safe", "challenge"] as const) {
      const total = childTotalSec(HUSKY_TIMING_PLAN, route);
      expect(total).toBeGreaterThanOrEqual(CHILD_TARGET_MIN_SEC);
      expect(total).toBeLessThanOrEqual(CHILD_TARGET_MAX_SEC);
    }
  });

  it("adult fast-play stays under ~8 minutes on both routes", () => {
    for (const route of ["safe", "challenge"] as const) {
      expect(adultTotalSec(HUSKY_TIMING_PLAN, route)).toBeLessThanOrEqual(ADULT_TARGET_MAX_SEC);
    }
  });

  it("required math is capped at 6 per run (documented: exactly 6)", () => {
    for (const route of ["safe", "challenge"] as const) {
      const math = requiredMathCount(HUSKY_TIMING_PLAN, route);
      expect(math).toBeLessThanOrEqual(MAX_REQUIRED_MATH);
      expect(math).toBe(6); // bridge + lake/cave + summit + 3 race questions
    }
  });

  it("no single beat exceeds the anti-padding ceiling", () => {
    for (const b of HUSKY_TIMING_PLAN.beats) {
      expect(b.childSec).toBeLessThanOrEqual(MAX_BEAT_CHILD_SEC);
    }
  });

  it("race uses exactly 3 math questions across 4 physical beats", () => {
    const raceBeats = HUSKY_TIMING_PLAN.beats.filter((b) => b.nodeId === "sled-race");
    expect(raceBeats).toHaveLength(4);
    expect(raceBeats.reduce((s, b) => s + b.mathCount, 0)).toBe(3);
  });
});

describe("HuskyPacing — validator catches violations", () => {
  const clone = (): TimingBudget => ({
    beats: HUSKY_TIMING_PLAN.beats.map((b) => ({ ...b })),
  });

  function codes(plan: TimingBudget): string[] {
    return validatePacingPlan(plan).map((i) => i.code);
  }

  it("rejects a plan with 7 required math problems", () => {
    const plan = clone();
    const extra: BeatEstimate = {
      id: "extra-worksheet", nodeId: "forest", label: "Extra worksheet",
      kind: "math", route: "both", required: true,
      childSec: 60, adultSec: 30, mathCount: 1,
    };
    plan.beats.push(extra);
    expect(codes(plan)).toContain("TOO_MUCH_REQUIRED_MATH");
  });

  it("rejects a child total under 10 minutes (not enough gameplay)", () => {
    const plan = clone();
    for (const b of plan.beats) b.childSec = Math.max(1, Math.floor(b.childSec / 4));
    expect(codes(plan)).toContain("CHILD_TOTAL_OUT_OF_RANGE");
  });

  it("rejects a beat over the anti-padding ceiling", () => {
    const plan = clone();
    plan.beats[0].childSec = MAX_BEAT_CHILD_SEC + 1;
    expect(codes(plan)).toContain("BEAT_TOO_LONG");
  });

  it("rejects a required node with no beat", () => {
    const plan: TimingBudget = { beats: [] };
    expect(codes(plan)).toContain("NODE_WITHOUT_BEAT");
  });

  it("rejects duplicate beat ids", () => {
    const plan = clone();
    plan.beats.push({ ...plan.beats[0] });
    expect(codes(plan)).toContain("DUPLICATE_BEAT_ID");
  });

  it("rejects adult estimates slower than child estimates", () => {
    const plan = clone();
    plan.beats[0].adultSec = plan.beats[0].childSec + 1;
    expect(codes(plan)).toContain("ADULT_SLOWER_THAN_CHILD");
  });
});
