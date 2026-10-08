/**
 * HuskyPacing — target timing model for the Snowy Peaks Husky adventure.
 *
 * The problem: an adult can currently play the whole Husky map in ~2 minutes.
 * The solution is NOT more math — it is more PLAY. This module defines the
 * timing budget every beat must fit, and the automated QA gates that keep
 * the adventure in the 10–15 minute child-paced target.
 *
 * Design targets:
 * - Child playing naturally: 10–15 minutes (600–900 s)
 * - Adult fast-play (skips optionals, no retries, fast taps): ~5–8 minutes
 * - Required math: 5–6 problems per normal complete run (race uses 3)
 * - If an expert adult can still finish in 2 minutes, there is not enough gameplay.
 *
 * Anti-padding rule: time must come from PLAY. No beat may buy time with
 * forced waits, unskippable walls of text, or artificially slow movement.
 * MAX_BEAT_CHILD_SEC enforces this per beat.
 *
 * Node ids align with HuskyAdventure.ts. Route node lists mirror its
 * requiredAlways/requiredByRoute (documented here so this module stays
 * zero-import and independently testable).
 */

export type BeatKind =
  | "travel"
  | "interaction"
  | "dialogue"
  | "math"
  | "discovery"
  | "race"
  | "checkpoint"
  | "reward";

export type PacingRoute = "safe" | "challenge" | "both";

export interface BeatEstimate {
  /** Unique beat id, e.g. "bridge-math". */
  id: string;
  /** Node id from HuskyAdventure.ts, or "travel:<from>-<to>" for walks. */
  nodeId: string;
  label: string;
  kind: BeatKind;
  /** Which routes include this beat. */
  route: PacingRoute;
  required: boolean;
  /** Child-paced estimate, seconds. */
  childSec: number;
  /** Adult fast-play estimate, seconds. */
  adultSec: number;
  /** Required math problems inside this beat. */
  mathCount: number;
  note?: string;
}

/** Hard ceiling: no single beat may take a child longer than this.
 *  Anything slower is padding, not play. */
export const MAX_BEAT_CHILD_SEC = 180;

/** Child-paced target window for a full required-path run, seconds. */
export const CHILD_TARGET_MIN_SEC = 600;
export const CHILD_TARGET_MAX_SEC = 900;

/** Adult fast-play ceiling, seconds. */
export const ADULT_TARGET_MAX_SEC = 480;

/** Required-math ceiling per normal complete run. */
export const MAX_REQUIRED_MATH = 6;

/** Required node ids per route (mirrors HuskyAdventure.ts). */
export const REQUIRED_NODES_SAFE = [
  "trailhead",
  "broken-bridge",
  "forest",
  "frozen-lake",
  "fallen-tree",
  "snow-pass",
  "summit-camp",
  "race-camp",
  "sled-race",
  "husky-reward",
] as const;

export const REQUIRED_NODES_CHALLENGE = [
  "trailhead",
  "broken-bridge",
  "forest",
  "ice-cave",
  "snow-pass",
  "summit-camp",
  "race-camp",
  "sled-race",
  "husky-reward",
] as const;

const B = (b: BeatEstimate): BeatEstimate => b;

export interface TimingBudget {
  beats: BeatEstimate[];
}

/**
 * The target timing budget. Child column assumes a 9-year-old playing
 * naturally: reading at grade-4 pace, one retry here and there, pausing to
 * look at things. Adult column assumes fast taps, skipped optionals,
 * no retries, no dawdling.
 */
export const HUSKY_TIMING_PLAN: TimingBudget = {
  beats: [
    // ---- Trailhead ----
    B({ id: "trailhead-arrival", nodeId: "trailhead", label: "Arrive at Trailhead", kind: "checkpoint", route: "both", required: true, childSec: 38, adultSec: 18, mathCount: 0, note: "Arrival + Kiki looks around + inspect trail sign + set off." }),
    B({ id: "travel-trailhead-bridge", nodeId: "travel:trailhead-broken-bridge", label: "Walk to Broken Bridge", kind: "travel", route: "both", required: true, childSec: 28, adultSec: 12, mathCount: 0 }),

    // ---- Broken Bridge ----
    B({ id: "bridge-encounter", nodeId: "broken-bridge", label: "Broken Bridge encounter", kind: "math", route: "both", required: true, childSec: 110, adultSec: 45, mathCount: 1, note: "Arrival/problem 25s + math repairs bridge 60s + crossing 25s." }),
    B({ id: "travel-bridge-forest", nodeId: "travel:broken-bridge-forest", label: "Walk to Whisper Forest", kind: "travel", route: "both", required: true, childSec: 28, adultSec: 12, mathCount: 0 }),

    // ---- Whisper Forest ----
    B({ id: "forest-encounter", nodeId: "forest", label: "Whisper Forest: pawprints + advice + route choice", kind: "interaction", route: "both", required: true, childSec: 85, adultSec: 35, mathCount: 0, note: "Inspect pawprints 20s + Kiki advice moment 25s + route choice 20s + reactions 20s." }),

    // ---- Safe branch ----
    B({ id: "travel-forest-lake", nodeId: "travel:forest-frozen-lake", label: "Walk to Frozen Lake", kind: "travel", route: "safe", required: true, childSec: 28, adultSec: 12, mathCount: 0 }),
    B({ id: "lake-encounter", nodeId: "frozen-lake", label: "Frozen Lake: math + stepping-stone choice", kind: "math", route: "safe", required: true, childSec: 100, adultSec: 40, mathCount: 1, note: "Math lights the stones 45s + player chooses stone path 40s + crossing 15s." }),
    B({ id: "travel-lake-tree", nodeId: "travel:frozen-lake-fallen-tree", label: "Walk to Fallen Tree", kind: "travel", route: "safe", required: true, childSec: 22, adultSec: 10, mathCount: 0 }),
    B({ id: "tree-encounter", nodeId: "fallen-tree", label: "Fallen Tree: clear branches", kind: "interaction", route: "safe", required: true, childSec: 35, adultSec: 18, mathCount: 0, note: "Multi-tap branch clearing, Kiki reacts after each." }),
    B({ id: "travel-tree-pass", nodeId: "travel:fallen-tree-snow-pass", label: "Walk to Snow Pass", kind: "travel", route: "safe", required: true, childSec: 28, adultSec: 12, mathCount: 0 }),

    // ---- Challenge branch ----
    B({ id: "travel-forest-cave", nodeId: "travel:forest-ice-cave", label: "Walk to Ice Cave", kind: "travel", route: "challenge", required: true, childSec: 28, adultSec: 12, mathCount: 0 }),
    B({ id: "cave-encounter", nodeId: "ice-cave", label: "Ice Cave: explore + harder math", kind: "math", route: "challenge", required: true, childSec: 85, adultSec: 35, mathCount: 1, note: "Crystal explore 25s + challenge math 45s + exit 15s." }),
    B({ id: "travel-cave-pass", nodeId: "travel:ice-cave-snow-pass", label: "Walk to Snow Pass", kind: "travel", route: "challenge", required: true, childSec: 28, adultSec: 12, mathCount: 0 }),

    // ---- Rejoin ----
    B({ id: "pass-encounter", nodeId: "snow-pass", label: "Snow Pass: checkpoint + trail markers", kind: "interaction", route: "both", required: true, childSec: 55, adultSec: 25, mathCount: 0, note: "Rest beat 20s + wind-revealed marker following 35s." }),
    B({ id: "igloo-encounter", nodeId: "secret-igloo", label: "Secret Igloo mini-adventure (optional)", kind: "discovery", route: "both", required: false, childSec: 70, adultSec: 30, mathCount: 0, note: "45–90s optional: clue → investigate → search 3 objects → fact → mastery reward." }),
    B({ id: "cache-encounter", nodeId: "snow-cache", label: "Bone Cache (optional)", kind: "discovery", route: "both", required: false, childSec: 25, adultSec: 12, mathCount: 0, note: "Smell → investigate → funny payoff." }),
    B({ id: "travel-pass-summit", nodeId: "travel:snow-pass-summit-camp", label: "Walk to Summit Gate", kind: "travel", route: "both", required: true, childSec: 26, adultSec: 12, mathCount: 0 }),
    B({ id: "summit-encounter", nodeId: "summit-camp", label: "Summit Gate: math opens the gate", kind: "math", route: "both", required: true, childSec: 55, adultSec: 28, mathCount: 1, note: "Gatekeeper math 40s + gate opens 15s." }),
    B({ id: "travel-summit-camp", nodeId: "travel:summit-camp-race-camp", label: "Walk to Race Camp", kind: "travel", route: "both", required: true, childSec: 22, adultSec: 10, mathCount: 0 }),

    // ---- Race Camp ----
    B({ id: "racecamp-encounter", nodeId: "race-camp", label: "Race Camp: meet Bolt, inspect sled, advice", kind: "interaction", route: "both", required: true, childSec: 55, adultSec: 28, mathCount: 0, note: "Meet Husky 20s + inspect sled 15s + Kiki asks ready-or-explore 20s." }),

    // ---- Sled Race: 4 physical beats interleaved with 3 math questions ----
    B({ id: "race-beat-downhill", nodeId: "sled-race", label: "Race beat 1: downhill stretch", kind: "race", route: "both", required: true, childSec: 35, adultSec: 18, mathCount: 1, note: "Physical event ~18s + math decision ~17s." }),
    B({ id: "race-beat-icy-turn", nodeId: "sled-race", label: "Race beat 2: icy turn", kind: "race", route: "both", required: true, childSec: 35, adultSec: 18, mathCount: 1, note: "Physical event ~18s + math decision ~17s." }),
    B({ id: "race-beat-deep-snow", nodeId: "sled-race", label: "Race beat 3: deep snow", kind: "race", route: "both", required: true, childSec: 35, adultSec: 18, mathCount: 1, note: "Physical event ~18s + math decision ~17s." }),
    B({ id: "race-beat-final-sprint", nodeId: "sled-race", label: "Race beat 4: final sprint (no math)", kind: "race", route: "both", required: true, childSec: 35, adultSec: 16, mathCount: 0, note: "Pure celebration run-in." }),

    // ---- Reward ----
    B({ id: "reward-sequence", nodeId: "husky-reward", label: "Reward: finish → friendship → sticker", kind: "reward", route: "both", required: true, childSec: 45, adultSec: 22, mathCount: 0, note: "30–60s, mostly visual/interactive, not text." }),
  ],
};

function beatsForRoute(plan: TimingBudget, route: "safe" | "challenge"): BeatEstimate[] {
  return plan.beats.filter((b) => b.route === "both" || b.route === route);
}

/** Required beats only (optionals excluded) for a route. */
export function requiredBeats(plan: TimingBudget, route: "safe" | "challenge"): BeatEstimate[] {
  return beatsForRoute(plan, route).filter((b) => b.required);
}

export function childTotalSec(plan: TimingBudget, route: "safe" | "challenge"): number {
  return requiredBeats(plan, route).reduce((s, b) => s + b.childSec, 0);
}

export function adultTotalSec(plan: TimingBudget, route: "safe" | "challenge"): number {
  return requiredBeats(plan, route).reduce((s, b) => s + b.adultSec, 0);
}

export function requiredMathCount(plan: TimingBudget, route: "safe" | "challenge"): number {
  return requiredBeats(plan, route).reduce((s, b) => s + b.mathCount, 0);
}

export interface PacingIssue {
  code: string;
  message: string;
}

/**
 * Automated QA gates for the pacing plan. Returns an empty array when the
 * plan meets every target.
 */
export function validatePacingPlan(plan: TimingBudget): PacingIssue[] {
  const issues: PacingIssue[] = [];
  const routes: ("safe" | "challenge")[] = ["safe", "challenge"];

  for (const route of routes) {
    const child = childTotalSec(plan, route);
    if (child < CHILD_TARGET_MIN_SEC || child > CHILD_TARGET_MAX_SEC) {
      issues.push({
        code: "CHILD_TOTAL_OUT_OF_RANGE",
        message: `${route}: child total ${child}s outside ${CHILD_TARGET_MIN_SEC}–${CHILD_TARGET_MAX_SEC}s target.`,
      });
    }
    const adult = adultTotalSec(plan, route);
    if (adult > ADULT_TARGET_MAX_SEC) {
      issues.push({
        code: "ADULT_TOTAL_TOO_SLOW",
        message: `${route}: adult fast-play ${adult}s exceeds ${ADULT_TARGET_MAX_SEC}s ceiling.`,
      });
    }
    const math = requiredMathCount(plan, route);
    if (math > MAX_REQUIRED_MATH) {
      issues.push({
        code: "TOO_MUCH_REQUIRED_MATH",
        message: `${route}: ${math} required math problems exceeds cap of ${MAX_REQUIRED_MATH}. Do not pace with worksheets.`,
      });
    }
    if (math < 3) {
      issues.push({
        code: "TOO_LITTLE_MATH",
        message: `${route}: only ${math} required math problems — the adventure still needs its educational spine.`,
      });
    }
  }

  // Every required node on each route must have at least one beat.
  const requiredByRoute: Record<string, readonly string[]> = {
    safe: REQUIRED_NODES_SAFE,
    challenge: REQUIRED_NODES_CHALLENGE,
  };
  for (const route of routes) {
    for (const nodeId of requiredByRoute[route]) {
      const has = beatsForRoute(plan, route).some((b) => b.nodeId === nodeId);
      if (!has) {
        issues.push({ code: "NODE_WITHOUT_BEAT", message: `${route}: required node "${nodeId}" has no timing beat.` });
      }
    }
  }

  // Anti-padding: no single beat may exceed the per-beat ceiling.
  for (const b of plan.beats) {
    if (b.childSec > MAX_BEAT_CHILD_SEC) {
      issues.push({
        code: "BEAT_TOO_LONG",
        message: `Beat "${b.id}" is ${b.childSec}s for a child — over the ${MAX_BEAT_CHILD_SEC}s anti-padding ceiling. Split it into play, not waiting.`,
      });
    }
    if (b.adultSec > b.childSec) {
      issues.push({
        code: "ADULT_SLOWER_THAN_CHILD",
        message: `Beat "${b.id}": adult estimate (${b.adultSec}s) exceeds child estimate (${b.childSec}s).`,
      });
    }
    if (b.childSec <= 0 || b.adultSec <= 0) {
      issues.push({ code: "NON_POSITIVE_DURATION", message: `Beat "${b.id}" has a non-positive duration.` });
    }
  }

  // Unique beat ids.
  const seen = new Set<string>();
  for (const b of plan.beats) {
    if (seen.has(b.id)) issues.push({ code: "DUPLICATE_BEAT_ID", message: `Duplicate beat id "${b.id}".` });
    seen.add(b.id);
  }

  return issues;
}

/** Is the built-in plan currently within all targets? */
export function isPlanOnTarget(plan: TimingBudget = HUSKY_TIMING_PLAN): boolean {
  return validatePacingPlan(plan).length === 0;
}
