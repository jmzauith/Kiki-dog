import { describe, it, expect } from "vitest";
import {
  HUSKY_INTERACTIONS,
  HUSKY_ADVICE_CHOICES,
  HUSKY_MICRO_DECISIONS,
  IGLOO_MINI_ADVENTURE,
  FALLEN_TREE_SEQUENCE,
  FROZEN_LAKE_STONES,
  SNOW_PASS_MARKERS,
  RACE_CAMP_FLOW,
  RACE_BEATS,
  REWARD_SEQUENCE,
  validateInteractionPlan,
  isInteractionPlanOnTarget,
  type InteractionDef,
} from "../HuskyInteractions";

describe("HuskyInteractions — built-in inventory meets every target", () => {
  it("validates clean", () => {
    expect(validateInteractionPlan()).toEqual([]);
    expect(isInteractionPlanOnTarget()).toBe(true);
  });

  it("has at least 10 non-math interactions", () => {
    expect(HUSKY_INTERACTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it("has at least 2 optional discoveries", () => {
    const optional = HUSKY_INTERACTIONS.filter((i) => !i.required);
    expect(optional.length).toBeGreaterThanOrEqual(2);
    expect(optional.map((i) => i.id)).toContain("search-igloo-objects");
    expect(optional.map((i) => i.id)).toContain("uncover-bone-cache");
  });

  it("has 3 Kiki-asks-the-player moments", () => {
    expect(HUSKY_ADVICE_CHOICES.length).toBeGreaterThanOrEqual(2);
    expect(HUSKY_ADVICE_CHOICES.map((a) => a.id)).toContain("advice-forest-noise");
    expect(HUSKY_ADVICE_CHOICES.map((a) => a.id)).toContain("advice-race-ready");
  });

  it("every required interaction is retryable — no fail states on the critical path", () => {
    for (const i of HUSKY_INTERACTIONS.filter((x) => x.required)) {
      expect(i.retryable).toBe(true);
    }
  });

  it("secrets are never required", () => {
    for (const i of HUSKY_INTERACTIONS) {
      if (i.nodeId === "secret-igloo" || i.nodeId === "snow-cache") {
        expect(i.required).toBe(false);
      }
    }
  });

  it("advice buttons are 1–4 words and kind", () => {
    for (const a of HUSKY_ADVICE_CHOICES) {
      expect(a.options).toHaveLength(2);
      for (const o of a.options) {
        expect(o.label.trim().split(/\s+/).length).toBeLessThanOrEqual(4);
        expect(o.outcome.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("micro-decisions never branch the map and always have outcomes", () => {
    expect(HUSKY_MICRO_DECISIONS.length).toBeGreaterThanOrEqual(3);
    for (const d of HUSKY_MICRO_DECISIONS) {
      expect(d.options.length).toBeGreaterThanOrEqual(2);
      for (const o of d.options) expect(o.outcome.trim().length).toBeGreaterThan(0);
    }
  });

  it("every interaction has a duration target and progression hook", () => {
    for (const i of HUSKY_INTERACTIONS) {
      expect(i.childSec).toBeGreaterThan(0);
      expect(i.adultSec).toBeGreaterThan(0);
      expect(i.adultSec).toBeLessThanOrEqual(i.childSec);
      expect(i.progressionHook.trim().length).toBeGreaterThan(0);
      expect(i.narrativePurpose.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("HuskyInteractions — depth designs", () => {
  it("igloo mini-adventure fits 45–90 seconds", () => {
    const total = IGLOO_MINI_ADVENTURE.steps.reduce((s, x) => s + x.childSec, 0);
    expect(total).toBeGreaterThanOrEqual(45);
    expect(total).toBeLessThanOrEqual(90);
  });

  it("fallen tree is 20–40 seconds of physical play", () => {
    expect(FALLEN_TREE_SEQUENCE.targetSec.child).toBeGreaterThanOrEqual(20);
    expect(FALLEN_TREE_SEQUENCE.targetSec.child).toBeLessThanOrEqual(40);
    expect(FALLEN_TREE_SEQUENCE.branches).toBeGreaterThanOrEqual(3);
  });

  it("frozen lake wrong picks are funny retries, not punishment", () => {
    expect(FROZEN_LAKE_STONES.wrongPick.toLowerCase()).not.toMatch(/wrong|fail|lose|stupid/);
    expect(FROZEN_LAKE_STONES.wrongPick.toLowerCase()).toMatch(/retry|try another|hop back/);
  });

  it("race has 4 physical beats and the last needs no math", () => {
    expect(RACE_BEATS).toHaveLength(4);
    expect(RACE_BEATS[3].id).toBe("race-final-sprint");
  });

  it("reward sequence is 30–60 seconds and ends with the golden teaser", () => {
    const total = REWARD_SEQUENCE.steps.reduce((s, x) => s + x.childSec, 0);
    expect(total).toBeGreaterThanOrEqual(30);
    expect(total).toBeLessThanOrEqual(60);
    expect(REWARD_SEQUENCE.steps[REWARD_SEQUENCE.steps.length - 1].id).toBe("golden-tease");
  });

  it("race camp flow includes the ready-or-explore advice moment", () => {
    expect(RACE_CAMP_FLOW.steps.some((s) => s.id === "advice-ready")).toBe(true);
  });

  it("snow pass markers are followable without punishment", () => {
    expect(SNOW_PASS_MARKERS.markerCount).toBeGreaterThanOrEqual(3);
    expect(SNOW_PASS_MARKERS.note.toLowerCase()).toMatch(/no penalty|miss/);
  });
});

describe("HuskyInteractions — validator catches violations", () => {
  function codes(
    interactions: InteractionDef[] = HUSKY_INTERACTIONS,
  ): string[] {
    return validateInteractionPlan(interactions).map((i) => i.code);
  }

  it("rejects fewer than 10 interactions", () => {
    expect(codes(HUSKY_INTERACTIONS.slice(0, 5))).toContain("TOO_FEW_INTERACTIONS");
  });

  it("rejects a required secret", () => {
    const bad = HUSKY_INTERACTIONS.map((i) =>
      i.id === "search-igloo-objects" ? { ...i, required: true } : i,
    );
    expect(codes(bad)).toContain("REQUIRED_SECRET");
  });

  it("rejects a required interaction that is not retryable", () => {
    const bad = HUSKY_INTERACTIONS.map((i) =>
      i.id === "clear-fallen-tree" ? { ...i, retryable: false } : i,
    );
    expect(codes(bad)).toContain("REQUIRED_NOT_RETRYABLE");
  });

  it("rejects an unknown node id", () => {
    const bad = [...HUSKY_INTERACTIONS, { ...HUSKY_INTERACTIONS[0], id: "x", nodeId: "atlantis" }];
    expect(codes(bad)).toContain("UNKNOWN_NODE");
  });

  it("rejects duplicate ids", () => {
    const bad = [...HUSKY_INTERACTIONS, { ...HUSKY_INTERACTIONS[0] }];
    expect(codes(bad)).toContain("DUPLICATE_ID");
  });
});
