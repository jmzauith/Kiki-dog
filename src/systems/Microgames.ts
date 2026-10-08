/**
 * Microgames — generic data model for small in-world gameplay moments.
 *
 * A "microgame" is a 15–60 second physical interaction that happens INSIDE
 * the game world (not inside a modal card): the child does something with
 * the pointer, Kiki reacts visibly, and the world visibly changes.
 *
 * This module is pure data + validation. It does not import Phaser and does
 * not render anything. Lennon implements the rendering; this file is the
 * contract both sides share. The model is breed-agnostic: future breeds
 * reuse these types with their own data definitions.
 *
 * Design rules enforced by the validators below:
 * - required math across a full run stays small (target <= 6)
 * - no single mechanic dominates (variety is a design requirement)
 * - every required microgame must be retryable without punishment
 * - optional content must never block progression
 */

/** Every distinct physical input pattern a microgame can use. */
export type MicrogameMechanic =
  | "count-and-collect" // tap physical objects in the world to count them
  | "drag-to-target" // drag an object onto a destination in the world
  | "ordered-tap" // tap things in a shown or discovered order
  | "choose-path" // pick between visible world options
  | "memory-sequence" // watch, then recall a sequence
  | "spot-pattern" // observation: find the missing/different thing
  | "hidden-object" // search the environment for hidden items
  | "timing-tap" // tap at the right moment
  | "trace-path" // drag along a visible path
  | "inspect-choose" // inspect clues in the world, then decide
  | "sequence-order" // arrange items into an order
  | "advice-choice" // Kiki asks the player what to do (no wrong answer)
  | "physical-sequence"; // chained physical beats (race situations)

export type MicrogameComplexity = "low" | "medium" | "high";

export type MathRole =
  | "none"
  | "determines-quantity" // math answers "how many / how much" for the world
  | "unlocks" // math opens/unlocks something the player then operates
  | "tactical-choice"; // math is a decision point inside a bigger activity

/** What kind of beat this is in the adventure flow. */
export type InteractionKind =
  | "microgame" // a real gameplay moment (the default)
  | "advice-choice" // Kiki asks the player; no wrong answer
  | "exploration-beat"; // short narrative moment, intentionally light

/** One phase inside a microgame. Phases run in order. */
export interface MicrogamePhaseDef {
  /** Unique within the microgame, e.g. "count-gaps". */
  id: string;
  /** What this phase is for. */
  kind: "observe" | "act" | "math" | "resolve";
  /** Plain-language description of what the child physically does. */
  playerDoes: string;
  /** Semantic Kiki reaction id (matches Narrative.ts KikiReactionId vocabulary). */
  kikiDoes: string;
  /** Declarative description of the visible world change. */
  worldChange: string;
  /** Estimated seconds for a 9-year-old: [min, max]. */
  childSec: [number, number];
  /** Can the child retry this phase without punishment? */
  retryable: boolean;
  /** Telemetry event name Lennon should emit. */
  telemetry: string;
}

/**
 * A complete microgame / interaction specification.
 * Data only — Lennon renders it, the validators audit it.
 */
export interface MicrogameDef {
  /** Unique across the adventure, e.g. "bridge-repair". */
  id: string;
  /** Adventure node id this belongs to (matches HuskyAdventure node ids). */
  encounterId: string;
  /** Human-readable name. */
  name: string;
  /** What kind of beat this is. */
  kind: InteractionKind;
  /** The primary physical mechanic (advice-choice beats use "advice-choice"). */
  mechanic: MicrogameMechanic;
  /** True if the adventure cannot complete without it. */
  required: boolean;
  /** Cognitive skills exercised, e.g. ["observation", "counting"]. */
  cognitiveSkills: string[];
  /** Number of REQUIRED math problems this contributes (0 for most). */
  mathProblems: number;
  /** How math participates, if at all. */
  mathRole: MathRole;
  /** Ordered phases. Must be non-empty. */
  phases: MicrogamePhaseDef[];
  /** Semantic Kiki reaction ids used across phases. */
  kikiReactions: string[];
  /** Declarative list of world-state changes, e.g. "bridge.repaired=true". */
  worldStateChanges: string[];
  /** What old prompt/card-style interaction this replaces ("" if none). */
  replacesOld: string;
  /** Implementation complexity for Lennon. */
  complexity: MicrogameComplexity;
}

/** A full adventure's pacing plan: microgames + travel budget. */
export interface AdventurePacingPlan {
  breedId: string;
  /** All microgames/beats in adventure order. */
  microgames: MicrogameDef[];
  /**
   * Total travel/movement time budget in seconds [min, max], per audience.
   * Travel is Kiki walking between encounters — real movement, not waiting.
   */
  travelSecChild: [number, number];
  travelSecAdult: [number, number];
  /**
   * Which encounter ids form the required safe route and challenge route.
   * Used to validate that both routes reach the race and the reward.
   */
  safeRouteEncounters: string[];
  challengeRouteEncounters: string[];
  raceEncounterId: string;
  rewardEncounterId: string;
}

/** Pacing targets a plan is audited against. */
export interface PacingTargets {
  /** [min, max] total seconds for a child playing naturally. */
  childSec: [number, number];
  /** [min, number] total seconds for an adult fast-playing. */
  adultSec: [number, number];
  /** Maximum required math problems per complete run. */
  maxRequiredMath: number;
  /** Minimum distinct mechanics across required microgames. */
  minMechanicVariety: number;
  /** Maximum times one mechanic may appear across required microgames. */
  maxMechanicRepeats: number;
  /** Minimum non-math interactions (kind microgame/advice-choice, mathProblems === 0). */
  minNonMathInteractions: number;
  /** Minimum optional discoveries. */
  minOptionalDiscoveries: number;
  /** Minimum advice-choice beats. */
  minAdviceChoices: number;
}

export const HUSKY_PACING_TARGETS: PacingTargets = {
  childSec: [600, 900], // 10–15 minutes
  adultSec: [300, 480], // 5–8 minutes
  maxRequiredMath: 6,
  minMechanicVariety: 8,
  maxMechanicRepeats: 2,
  minNonMathInteractions: 10,
  minOptionalDiscoveries: 2,
  minAdviceChoices: 2,
};

/** Result of auditing one pacing plan (inventory-level, route-agnostic). */
export interface PacingAudit {
  requiredMathTotal: number;
  mechanicCounts: Record<string, number>;
  distinctMechanics: number;
  requiredCount: number;
  optionalCount: number;
  adviceChoiceCount: number;
  nonMathInteractionCount: number;
}

/** Per-route audit: runtime and math for one specific route. */
export interface RouteAudit {
  routeName: string;
  childSec: [number, number];
  adultSec: [number, number];
  requiredMathTotal: number;
  microgameCount: number;
}

function microgamesForRoute(
  plan: AdventurePacingPlan,
  routeEncounters: string[],
): MicrogameDef[] {
  const set = new Set(routeEncounters);
  return plan.microgames.filter(
    (m) => (m.required && set.has(m.encounterId)) || !m.required,
  );
}

/**
 * Audit one route: a natural playthrough does the route's required beats
 * plus the optional discoveries. Returns runtime + math for that route.
 */
export function auditRoute(
  plan: AdventurePacingPlan,
  routeName: string,
  routeEncounters: string[],
): RouteAudit {
  const ms = microgamesForRoute(plan, routeEncounters);
  const childRanges = ms.flatMap((m) => m.phases.map((p) => p.childSec));
  const adultRanges = ms.flatMap((m) =>
    m.phases.map(
      (p): [number, number] => [
        Math.round(p.childSec[0] * 0.45),
        Math.round(p.childSec[1] * 0.45),
      ],
    ),
  );
  return {
    routeName,
    childSec: sumRanges([plan.travelSecChild, ...childRanges]),
    adultSec: sumRanges([plan.travelSecAdult, ...adultRanges]),
    requiredMathTotal: ms
      .filter((m) => m.required)
      .reduce((n, m) => n + m.mathProblems, 0),
    microgameCount: ms.length,
  };
}

function sumRanges(ranges: Array<[number, number]>): [number, number] {
  return ranges.reduce<[number, number]>(
    (acc, r) => [acc[0] + r[0], acc[1] + r[1]],
    [0, 0],
  );
}

function microgameChildSec(m: MicrogameDef): [number, number] {
  return sumRanges(m.phases.map((p) => p.childSec));
}

/**
 * Validate a single microgame definition. Returns a list of problems
 * (empty = valid). Used by tests and by Lennon before implementing.
 */
export function validateMicrogameDef(def: MicrogameDef): string[] {
  const problems: string[] = [];
  if (!def.id) problems.push("missing id");
  if (!def.encounterId) problems.push("missing encounterId");
  if (!def.name) problems.push("missing name");
  if (def.phases.length === 0) problems.push(`${def.id}: no phases`);
  if (def.mathProblems < 0) problems.push(`${def.id}: negative mathProblems`);
  if (def.mathProblems > 0 && def.mathRole === "none")
    problems.push(`${def.id}: has math problems but mathRole is "none"`);
  if (def.mathProblems === 0 && def.mathRole !== "none")
    problems.push(`${def.id}: mathRole set but mathProblems is 0`);
  if (def.required && def.phases.some((p) => !p.retryable && p.kind === "act"))
    problems.push(`${def.id}: required microgame has a non-retryable act phase`);
  for (const p of def.phases) {
    if (!p.playerDoes) problems.push(`${def.id}.${p.id}: playerDoes is empty`);
    if (!p.kikiDoes) problems.push(`${def.id}.${p.id}: kikiDoes is empty`);
    if (p.childSec[0] > p.childSec[1])
      problems.push(`${def.id}.${p.id}: inverted duration range`);
    if (p.childSec[1] > 180)
      problems.push(
        `${def.id}.${p.id}: single phase over 180s — split it or it is padding`,
      );
  }
  const [cMin, cMax] = microgameChildSec(def);
  if (cMax > 180)
    problems.push(
      `${def.id}: total child duration ${cMin}-${cMax}s exceeds 180s — not a microgame anymore`,
    );
  return problems;
}

/** Audit a whole pacing plan: inventory totals a designer can check. */
export function auditPacingPlan(plan: AdventurePacingPlan): PacingAudit {
  // Mechanic variety is measured across required *microgames* (advice-choice
  // beats share one mechanic by nature; exploration beats are light by design).
  const requiredMicrogames = plan.microgames.filter(
    (m) => m.required && m.kind === "microgame",
  );
  const mechanicCounts: Record<string, number> = {};
  for (const m of requiredMicrogames) {
    mechanicCounts[m.mechanic] = (mechanicCounts[m.mechanic] ?? 0) + 1;
  }
  const required = plan.microgames.filter((m) => m.required);
  return {
    requiredMathTotal: required.reduce((n, m) => n + m.mathProblems, 0),
    mechanicCounts,
    distinctMechanics: Object.keys(mechanicCounts).length,
    requiredCount: required.length,
    optionalCount: plan.microgames.filter((m) => !m.required).length,
    adviceChoiceCount: plan.microgames.filter(
      (m) => m.kind === "advice-choice",
    ).length,
    nonMathInteractionCount: plan.microgames.filter(
      (m) => m.mathProblems === 0,
    ).length,
  };
}

/**
 * Check an audit against pacing targets. Returns human-readable violations
 * (empty = the plan meets every target).
 */
export function checkPacingTargets(
  audit: PacingAudit,
  targets: PacingTargets,
): string[] {
  const v: string[] = [];
  // NOTE: required-math is checked per-route (checkRoutePacing/checkRouteMath).
  // A plan-level total double-counts branching routes, so it is not flagged
  // here; audit.requiredMathTotal remains informational.
  if (audit.distinctMechanics < targets.minMechanicVariety)
    v.push(
      `only ${audit.distinctMechanics} distinct mechanics, need ${targets.minMechanicVariety} — mechanics are repeating`,
    );
  for (const [mech, count] of Object.entries(audit.mechanicCounts)) {
    if (count > targets.maxMechanicRepeats)
      v.push(
        `mechanic "${mech}" used ${count}x across required microgames (max ${targets.maxMechanicRepeats}) — vary it`,
      );
  }
  // Runtime is checked per-route (see checkRoutePacing), because safe and
  // challenge routes contain different beats.
  if (audit.nonMathInteractionCount < targets.minNonMathInteractions)
    v.push(
      `only ${audit.nonMathInteractionCount} non-math interactions, need ${targets.minNonMathInteractions}`,
    );
  if (audit.optionalCount < targets.minOptionalDiscoveries)
    v.push(
      `only ${audit.optionalCount} optional discoveries, need ${targets.minOptionalDiscoveries}`,
    );
  if (audit.adviceChoiceCount < targets.minAdviceChoices)
    v.push(
      `only ${audit.adviceChoiceCount} advice choices, need ${targets.minAdviceChoices}`,
    );
  return v;
}

/**
 * Required math problems for one route (by encounter ids). Both routes must
 * independently respect the math cap — a plan that is fine on average can
 * still worksheet one route.
 */
export function requiredMathForRoute(
  plan: AdventurePacingPlan,
  routeEncounters: string[],
): number {
  const set = new Set(routeEncounters);
  return plan.microgames
    .filter((m) => m.required && set.has(m.encounterId))
    .reduce((n, m) => n + m.mathProblems, 0);
}

/** Check per-route pacing: runtime and math for safe and challenge routes. */
export function checkRoutePacing(
  plan: AdventurePacingPlan,
  targets: PacingTargets,
): string[] {
  const v: string[] = [];
  for (const [routeName, route] of [
    ["safe", plan.safeRouteEncounters],
    ["challenge", plan.challengeRouteEncounters],
  ] as const) {
    const r = auditRoute(plan, routeName, route);
    const [cMin, cMax] = r.childSec;
    if (cMax < targets.childSec[0])
      v.push(
        `${routeName} route child runtime ${cMin}-${cMax}s below ${targets.childSec[0]}s — not enough gameplay`,
      );
    if (cMin > targets.childSec[1])
      v.push(
        `${routeName} route child runtime ${cMin}-${cMax}s above ${targets.childSec[1]}s — too long or padded`,
      );
    const [aMin, aMax] = r.adultSec;
    if (aMax < targets.adultSec[0] || aMin > targets.adultSec[1])
      v.push(
        `${routeName} route adult fast-play ${aMin}-${aMax}s outside target ${targets.adultSec[0]}-${targets.adultSec[1]}s`,
      );
    if (r.requiredMathTotal > targets.maxRequiredMath)
      v.push(
        `${routeName} route has ${r.requiredMathTotal} required math problems (cap ${targets.maxRequiredMath})`,
      );
  }
  return v;
}

/** Check per-route math caps. Returns human-readable violations. */
export function checkRouteMath(
  plan: AdventurePacingPlan,
  targets: PacingTargets,
): string[] {
  const v: string[] = [];
  for (const [routeName, route] of [
    ["safe", plan.safeRouteEncounters],
    ["challenge", plan.challengeRouteEncounters],
  ] as const) {
    const n = requiredMathForRoute(plan, route);
    if (n > targets.maxRequiredMath)
      v.push(
        `${routeName} route has ${n} required math problems (cap ${targets.maxRequiredMath})`,
      );
  }
  return v;
}

/**
 * Validate that a plan's routes are structurally sound: both routes must
 * reach the race and the reward, and no optional microgame may be required
 * for either route to complete.
 */
export function validateRoutes(plan: AdventurePacingPlan): string[] {
  const problems: string[] = [];
  const byEncounter = new Map<string, MicrogameDef[]>();
  for (const m of plan.microgames) {
    const list = byEncounter.get(m.encounterId) ?? [];
    list.push(m);
    byEncounter.set(m.encounterId, list);
  }
  for (const [routeName, route] of [
    ["safe", plan.safeRouteEncounters],
    ["challenge", plan.challengeRouteEncounters],
  ] as const) {
    if (!route.includes(plan.raceEncounterId))
      problems.push(`${routeName} route never reaches the race`);
    if (!route.includes(plan.rewardEncounterId))
      problems.push(`${routeName} route never reaches the reward`);
    for (const enc of route) {
      const ms = byEncounter.get(enc) ?? [];
      if (ms.length === 0)
        problems.push(`${routeName} route: encounter "${enc}" has no microgame/beat defined`);
    }
  }
  return problems;
}
