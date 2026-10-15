import { describe, expect, it } from "vitest";
import {
  HUSKY_PACING_TARGETS,
  MicrogameDef,
  auditPacingPlan,
  auditRoute,
  checkPacingTargets,
  checkRouteMath,
  checkRoutePacing,
  requiredMathForRoute,
  validateMicrogameDef,
  validateRoutes,
} from "../Microgames";
import {
  HUSKY_MICROGAME_DEFS,
  HUSKY_PACING_PLAN,
} from "../HuskyMicrogames";

const VALID: MicrogameDef = {
  id: "test-game",
  encounterId: "test-encounter",
  name: "Test Game",
  kind: "microgame",
  mechanic: "hidden-object",
  required: true,
  cognitiveSkills: ["observation"],
  mathProblems: 0,
  mathRole: "none",
  phases: [
    {
      id: "act",
      kind: "act",
      playerDoes: "Taps the thing.",
      kikiDoes: "curious",
      worldChange: "thing.tapped=true",
      childSec: [10, 20],
      retryable: true,
      telemetry: "test.tapped",
    },
  ],
  kikiReactions: ["curious"],
  worldStateChanges: ["thing.tapped=true"],
  replacesOld: "Nothing.",
  complexity: "low",
};

describe("validateMicrogameDef", () => {
  it("accepts a well-formed definition", () => {
    expect(validateMicrogameDef(VALID)).toEqual([]);
  });

  it("rejects empty phases", () => {
    const bad = { ...VALID, phases: [] };
    expect(validateMicrogameDef(bad).length).toBeGreaterThan(0);
  });

  it("rejects negative mathProblems", () => {
    const bad = { ...VALID, mathProblems: -1 };
    expect(
      validateMicrogameDef(bad).some((p) => p.includes("negative")),
    ).toBe(true);
  });

  it("rejects math problems with mathRole none", () => {
    const bad = { ...VALID, mathProblems: 1, mathRole: "none" as const };
    expect(validateMicrogameDef(bad).length).toBeGreaterThan(0);
  });

  it("rejects mathRole set with zero math problems", () => {
    const bad = {
      ...VALID,
      mathProblems: 0,
      mathRole: "unlocks" as const,
    };
    expect(validateMicrogameDef(bad).length).toBeGreaterThan(0);
  });

  it("rejects required microgames with non-retryable act phases", () => {
    const bad: MicrogameDef = {
      ...VALID,
      phases: [{ ...VALID.phases[0], retryable: false }],
    };
    expect(
      validateMicrogameDef(bad).some((p) => p.includes("non-retryable")),
    ).toBe(true);
  });

  it("rejects inverted duration ranges", () => {
    const bad: MicrogameDef = {
      ...VALID,
      phases: [{ ...VALID.phases[0], childSec: [30, 10] }],
    };
    expect(validateMicrogameDef(bad).length).toBeGreaterThan(0);
  });

  it("rejects microgames longer than 180s (not a microgame anymore)", () => {
    const bad: MicrogameDef = {
      ...VALID,
      phases: [
        { ...VALID.phases[0], id: "a", childSec: [100, 100] },
        { ...VALID.phases[0], id: "b", childSec: [100, 100] },
      ],
    };
    expect(
      validateMicrogameDef(bad).some((p) => p.includes("180s")),
    ).toBe(true);
  });
});

describe("Husky microgame definitions", () => {
  it("every definition validates clean", () => {
    for (const def of HUSKY_MICROGAME_DEFS) {
      expect(validateMicrogameDef(def), def.id).toEqual([]);
    }
  });

  it("ids are unique", () => {
    const ids = HUSKY_MICROGAME_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every required microgame is retryable (no punishment)", () => {
    for (const def of HUSKY_MICROGAME_DEFS.filter((d) => d.required)) {
      for (const phase of def.phases) {
        if (phase.kind === "act") {
          expect(phase.retryable, `${def.id}.${phase.id}`).toBe(true);
        }
      }
    }
  });

  it("every microgame names at least one Kiki reaction", () => {
    for (const def of HUSKY_MICROGAME_DEFS) {
      expect(def.kikiReactions.length, def.id).toBeGreaterThan(0);
    }
  });

  it("every microgame declares what it replaces or is new depth", () => {
    for (const def of HUSKY_MICROGAME_DEFS) {
      expect(def.replacesOld.length, def.id).toBeGreaterThan(0);
    }
  });
});

describe("math budget", () => {
  it("safe route has exactly 6 required math problems", () => {
    expect(
      requiredMathForRoute(
        HUSKY_PACING_PLAN,
        HUSKY_PACING_PLAN.safeRouteEncounters,
      ),
    ).toBe(6);
  });

  it("challenge route has exactly 6 required math problems", () => {
    expect(
      requiredMathForRoute(
        HUSKY_PACING_PLAN,
        HUSKY_PACING_PLAN.challengeRouteEncounters,
      ),
    ).toBe(6);
  });

  it("checkRouteMath reports no violations", () => {
    expect(checkRouteMath(HUSKY_PACING_PLAN, HUSKY_PACING_TARGETS)).toEqual(
      [],
    );
  });

  it("math never exceeds the cap even counting optionals (optionals have none)", () => {
    const optionalMath = HUSKY_MICROGAME_DEFS.filter(
      (d) => !d.required && d.mathProblems > 0,
    );
    expect(optionalMath).toEqual([]);
  });
});

describe("mechanic variety", () => {
  it("uses at least 8 distinct mechanics across required microgames", () => {
    const audit = auditPacingPlan(HUSKY_PACING_PLAN);
    expect(audit.distinctMechanics).toBeGreaterThanOrEqual(8);
  });

  it("no mechanic repeats more than twice", () => {
    const audit = auditPacingPlan(HUSKY_PACING_PLAN);
    for (const [mech, count] of Object.entries(audit.mechanicCounts)) {
      expect(count, mech).toBeLessThanOrEqual(2);
    }
  });
});

describe("pacing targets", () => {
  it("checkPacingTargets reports no inventory violations", () => {
    const audit = auditPacingPlan(HUSKY_PACING_PLAN);
    expect(checkPacingTargets(audit, HUSKY_PACING_TARGETS)).toEqual([]);
  });

  it("checkRoutePacing reports no violations on either route", () => {
    expect(checkRoutePacing(HUSKY_PACING_PLAN, HUSKY_PACING_TARGETS)).toEqual(
      [],
    );
  });

  it("safe route child runtime is 10–15 minutes", () => {
    const r = auditRoute(
      HUSKY_PACING_PLAN,
      "safe",
      HUSKY_PACING_PLAN.safeRouteEncounters,
    );
    expect(r.childSec[0]).toBeGreaterThanOrEqual(600);
    expect(r.childSec[1]).toBeLessThanOrEqual(900);
  });

  it("challenge route child runtime is 10–15 minutes", () => {
    const r = auditRoute(
      HUSKY_PACING_PLAN,
      "challenge",
      HUSKY_PACING_PLAN.challengeRouteEncounters,
    );
    expect(r.childSec[0]).toBeGreaterThanOrEqual(600);
    expect(r.childSec[1]).toBeLessThanOrEqual(900);
  });

  it("no single microgame dominates pacing (>30% of route child max)", () => {
    for (const route of [
      HUSKY_PACING_PLAN.safeRouteEncounters,
      HUSKY_PACING_PLAN.challengeRouteEncounters,
    ]) {
      const r = auditRoute(HUSKY_PACING_PLAN, "route", route);
      const set = new Set(route);
      for (const m of HUSKY_MICROGAME_DEFS) {
        if (!m.required || !set.has(m.encounterId)) continue;
        const mMax = m.phases.reduce((n, p) => n + p.childSec[1], 0);
        expect(
          mMax / r.childSec[1],
          `${m.id} dominates the route`,
        ).toBeLessThanOrEqual(0.3);
      }
    }
  });
});

describe("routes and optionals", () => {
  it("validateRoutes reports no structural problems", () => {
    expect(validateRoutes(HUSKY_PACING_PLAN)).toEqual([]);
  });

  it("both routes reach the race and the reward", () => {
    for (const route of [
      HUSKY_PACING_PLAN.safeRouteEncounters,
      HUSKY_PACING_PLAN.challengeRouteEncounters,
    ]) {
      expect(route).toContain(HUSKY_PACING_PLAN.raceEncounterId);
      expect(route).toContain(HUSKY_PACING_PLAN.rewardEncounterId);
    }
  });

  it("optional content never blocks progression (all optionals required=false)", () => {
    const optionals = HUSKY_MICROGAME_DEFS.filter((d) => !d.required);
    expect(optionals.length).toBeGreaterThanOrEqual(2);
    for (const o of optionals) {
      expect(o.mathProblems, o.id).toBe(0);
    }
  });

  it("at least 10 non-math interactions exist", () => {
    const audit = auditPacingPlan(HUSKY_PACING_PLAN);
    expect(audit.nonMathInteractionCount).toBeGreaterThanOrEqual(10);
  });

  it("at least 2 advice choices exist", () => {
    const audit = auditPacingPlan(HUSKY_PACING_PLAN);
    expect(audit.adviceChoiceCount).toBeGreaterThanOrEqual(2);
  });
});

