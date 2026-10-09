/**
 * HuskyInteractions — the non-math gameplay inventory for the Husky adventure.
 *
 * The pacing problem is solved with PLAY, not worksheets. This module defines:
 * - the reusable physical mini-interaction model (Lennon renders these;
 *   no Phaser input is implemented here),
 * - the catalog of ≥10 meaningful non-math player interactions,
 * - the PlayerAdviceChoice system (Kiki asks the player — no correct answer),
 * - micro-decisions (small choices that do not branch the map),
 * - per-location depth designs (igloo mini-adventure, fallen tree, frozen
 *   lake stones, snow pass markers, race camp, race beats, reward sequence).
 *
 * Node ids align with HuskyAdventure.ts. Narrative copy hooks align with
 * HuskyNarrative.ts (referenced by id, never duplicated).
 */

export type MiniInteractionKind =
  | "multi-tap-clear"   // tap N targets; each tap reacts (clear branches)
  | "ordered-tap"       // tap targets in a shown order (trail markers)
  | "choose-path"       // pick one of several routes/options (stones, fork)
  | "search-hidden"     // find hidden objects in an area (igloo, cache)
  | "drag-move"         // drag an object from A to B (reserved for future)
  | "timing-tap"        // tap at the right moment (race beats)
  | "inspect-choice";   // inspect one of several things; flavor only, no wrong answer

export interface InteractionDef {
  id: string;
  nodeId: string;
  kind: MiniInteractionKind;
  /** What the player does, in plain words. */
  action: string;
  /** What happens in the world as a result. */
  result: string;
  childSec: number;
  adultSec: number;
  required: boolean;
  /** Why this moment exists in the story. */
  narrativePurpose: string;
  /** What progression this unlocks/records, e.g. "unlocks:fallen-tree-cleared". */
  progressionHook: string;
  /** Every required interaction must be retryable or un-failable. */
  retryable: boolean;
  /** Kind-specific tuning Lennon renders (counts, options, windows). */
  params: Record<string, number | string | string[]>;
}

export interface AdviceOption {
  id: string;
  /** Button label, 1–4 words. */
  label: string;
  /** What happens — never punishment. */
  outcome: string;
  /** Optional content this choice reveals, e.g. "clue:bone-cache". */
  reveals?: string;
}

export interface PlayerAdviceChoice {
  id: string;
  nodeId: string;
  /** Kiki's question to the player. */
  kikiLine: string;
  kikiReaction: string; // semantic reaction id (see narrative layer)
  options: [AdviceOption, AdviceOption]; // exactly two, no correct answer
}

/** A small decision that flavors the moment without branching the map. */
export interface MicroDecision {
  id: string;
  nodeId: string;
  prompt: string;
  options: { id: string; label: string; outcome: string }[];
  note: string;
}

const I = (i: InteractionDef): InteractionDef => i;

/**
 * The full non-math interaction inventory. Target: ≥10 meaningful player
 * actions across a normal run (optionals excluded from the "required" count
 * but counted toward depth).
 */
export const HUSKY_INTERACTIONS: InteractionDef[] = [
  I({
    id: "inspect-trail-sign", nodeId: "trailhead", kind: "inspect-choice",
    action: "Tap the wooden trail sign to read it.",
    result: "The sign shows a paw-print map of Snowy Peaks; Kiki sniffs it and wags.",
    childSec: 15, adultSec: 6, required: true, retryable: true,
    narrativePurpose: "Orients the player: there is a mountain, a race, and a trail.",
    progressionHook: "flags:trailhead-oriented",
    params: { choices: ["paw-map", "snowflake-carving", "kiki-sniff"] },
  }),
  I({
    id: "sniff-pawprints", nodeId: "forest", kind: "inspect-choice",
    action: "Choose what Kiki should sniff: the pawprints or the carved sign.",
    result: "Pawprints point two ways (the route choice); the sign warns about thin ice.",
    childSec: 20, adultSec: 8, required: true, retryable: true,
    narrativePurpose: "Kiki investigates like a real dog; the player reads the world.",
    progressionHook: "flags:forest-investigated",
    params: { choices: ["pawprints", "carved-sign"] },
  }),
  I({
    id: "choose-route", nodeId: "forest", kind: "choose-path",
    action: "Pick the Safe Trail or the Ice Shortcut.",
    result: "The chosen path glows; Kiki trots toward it. Neither choice is wrong.",
    childSec: 20, adultSec: 8, required: true, retryable: true,
    narrativePurpose: "The adventure's big agency moment — the player's call shapes the run.",
    progressionHook: "route:set",
    params: { options: ["safe", "challenge"] },
  }),
  I({
    id: "clear-fallen-tree", nodeId: "fallen-tree", kind: "multi-tap-clear",
    action: "Tap the fallen branches to clear them, in any order.",
    result: "Each branch cracks aside; Kiki reacts after every one, then squeezes through.",
    childSec: 35, adultSec: 18, required: true, retryable: true,
    narrativePurpose: "Physical helping — Kiki can't move the tree alone.",
    progressionHook: "unlocks:fallen-tree-cleared",
    params: { targetCount: 5, reactionPerTap: "encouraged" },
  }),
  I({
    id: "choose-stepping-stones", nodeId: "frozen-lake", kind: "choose-path",
    action: "After the math lights the stones, pick the left or right stone path.",
    result: "Kiki hops the chosen stones. A wobbly pick gets a funny crack sound and a retry — never punishment.",
    childSec: 40, adultSec: 15, required: true, retryable: true,
    narrativePurpose: "The math earns the crossing; the choice makes it the player's crossing.",
    progressionHook: "unlocks:lake-crossed",
    params: { options: ["left-stones", "right-stones"], wrongPickReaction: "fun-crack" },
  }),
  I({
    id: "follow-trail-markers", nodeId: "snow-pass", kind: "ordered-tap",
    action: "The wind briefly reveals glowing trail markers — tap them in order.",
    result: "Each correct marker chimes; the pass route lights up for Kiki.",
    childSec: 35, adultSec: 15, required: true, retryable: true,
    narrativePurpose: "Navigation as play: read the mountain, don't just walk it.",
    progressionHook: "unlocks:snow-pass-charted",
    params: { markerCount: 4, revealMs: 2500 },
  }),
  I({
    id: "search-igloo-objects", nodeId: "secret-igloo", kind: "search-hidden",
    action: "Search 3 interesting objects inside the igloo.",
    result: "Each object tells a tiny story; the third hides a Husky fact and an expedition item.",
    childSec: 35, adultSec: 15, required: false, retryable: true,
    narrativePurpose: "The 'I FOUND SOMETHING!' discovery beat.",
    progressionHook: "secrets:igloo-searched",
    params: { hiddenCount: 3 },
  }),
  I({
    id: "uncover-bone-cache", nodeId: "snow-cache", kind: "search-hidden",
    action: "Something smells suspicious — tap the sparkling snow drift.",
    result: "Kiki digs up a buried bone cache. Very funny. Very Kiki.",
    childSec: 25, adultSec: 12, required: false, retryable: true,
    narrativePurpose: "Small playful secret at a different emotional scale than the igloo.",
    progressionHook: "secrets:cache-found",
    params: { hiddenCount: 1 },
  }),
  I({
    id: "greet-bolt", nodeId: "race-camp", kind: "inspect-choice",
    action: "Respond to Bolt the Husky's greeting.",
    result: "Bolt sizes Kiki up, grins, and the rivalry turns friendly.",
    childSec: 20, adultSec: 8, required: true, retryable: true,
    narrativePurpose: "The rival becomes a character, not a sprite.",
    progressionHook: "flags:bolt-met",
    params: { choices: ["wave-paw", "confident-bark", "offer-snack"] },
  }),
  I({
    id: "inspect-sled", nodeId: "race-camp", kind: "inspect-choice",
    action: "Inspect Bolt's racing sled before the race.",
    result: "Kiki learns what makes a fast sled — and spots one loose strap she tightens.",
    childSec: 15, adultSec: 7, required: false, retryable: true,
    narrativePurpose: "Optional world detail that pays off: preparation matters.",
    progressionHook: "flags:sled-inspected",
    params: { choices: ["runners", "harness", "loose-strap"] },
  }),
  I({
    id: "race-beat-event", nodeId: "sled-race", kind: "timing-tap",
    action: "React to each race event (downhill, ice turn, deep snow, final sprint).",
    result: "Well-timed taps give Kiki a little surge; mistimed taps just look funny.",
    childSec: 72, adultSec: 36, required: true, retryable: true,
    narrativePurpose: "The race is raced, not just answered — 4 physical beats between questions.",
    progressionHook: "race:beats-completed",
    params: { beatCount: 4, beats: ["downhill", "icy-turn", "deep-snow", "final-sprint"] },
  }),
  I({
    id: "pick-favorite-moment", nodeId: "husky-reward", kind: "inspect-choice",
    action: "Pick Kiki's favorite moment of the adventure for the recap.",
    result: "The recap spotlights the player's pick — the adventure becomes THEIR story.",
    childSec: 15, adultSec: 6, required: true, retryable: true,
    narrativePurpose: "Memory beats math: the player retells what happened to Kiki.",
    progressionHook: "reward:recap-personalized",
    params: { choices: ["bridge", "forest-choice", "lake-or-cave", "igloo", "race"] },
  }),
];

/** Kiki asks the player — 2–3 advisory moments, no correct answer, never punishing. */
export const HUSKY_ADVICE_CHOICES: PlayerAdviceChoice[] = [
  {
    id: "advice-forest-noise",
    nodeId: "forest",
    kikiLine: "I hear something behind the trees. Should we check it out?",
    kikiReaction: "curious",
    options: [
      { id: "check-it-out", label: "CHECK IT OUT", outcome: "Rustling leaves… just a snow hare! It drops a shiny bone clue.", reveals: "clue:bone-cache" },
      { id: "keep-going", label: "KEEP GOING", outcome: "Kiki nods. The trail waits for no corgi. (The clue stays for later.)" },
    ],
  },
  {
    id: "advice-igloo-mound",
    nodeId: "snow-pass",
    kikiLine: "That snow mound looks funny. Peek inside?",
    kikiReaction: "thinking",
    options: [
      { id: "peek", label: "PEEK INSIDE", outcome: "It's hollow! A hidden igloo entrance glints in the snow.", reveals: "secret:secret-igloo" },
      { id: "keep-going", label: "KEEP GOING", outcome: "Kiki makes a mental note: funny mound, check later. It stays discoverable." },
    ],
  },
  {
    id: "advice-race-ready",
    nodeId: "race-camp",
    kikiLine: "Ready to race, or should we look around first?",
    kikiReaction: "excited",
    options: [
      { id: "race-now", label: "RACE NOW", outcome: "Bolt whoops! The sleds line up. Here we go!" },
      { id: "look-around", label: "LOOK AROUND", outcome: "Kiki sniffs the camp, tightens a sled strap, and feels ready.", reveals: "bonus:camp-explored" },
    ],
  },
];

/** Small flavor decisions that do not branch the map. */
export const HUSKY_MICRO_DECISIONS: MicroDecision[] = [
  {
    id: "micro-forest-sniff-vs-sign",
    nodeId: "forest",
    prompt: "Sniff the pawprints or inspect the carved sign?",
    options: [
      { id: "sniff", label: "SNIFF", outcome: "The prints smell like husky — the shortcut is that way." },
      { id: "sign", label: "SIGN", outcome: "The sign warns: thin ice on the lake. Good to know!" },
    ],
    note: "Both give useful flavor; neither is wrong. Feeds the route choice.",
  },
  {
    id: "micro-lake-left-right",
    nodeId: "frozen-lake",
    prompt: "Left stones or right stones?",
    options: [
      { id: "left", label: "LEFT", outcome: "Kiki hops left. Solid!" },
      { id: "right", label: "RIGHT", outcome: "Kiki hops right. Also solid!" },
    ],
    note: "Pure agency — the choice is the gameplay.",
  },
  {
    id: "micro-pass-backpack-vs-prints",
    nodeId: "snow-pass",
    prompt: "Search the supply backpack or follow the fresh prints?",
    options: [
      { id: "backpack", label: "BACKPACK", outcome: "A warm snack! Kiki is delighted." },
      { id: "prints", label: "PRINTS", outcome: "The prints lead toward a funny-shaped mound…" },
    ],
    note: "Backpack is comfort; prints foreshadow the igloo. Both are wins.",
  },
  {
    id: "micro-igloo-now-or-later",
    nodeId: "snow-pass",
    prompt: "Explore the igloo now or come back later?",
    options: [
      { id: "now", label: "NOW", outcome: "Into the igloo!" },
      { id: "later", label: "LATER", outcome: "The igloo waits. Kiki marks it with a snowball." },
    ],
    note: "Respects the player's pacing — secrets never expire.",
  },
];

/** Secret Igloo as a 45–90s optional mini-adventure. No required math. */
export const IGLOO_MINI_ADVENTURE = {
  id: "secret-igloo",
  targetSec: { child: 75, adult: 35 },
  steps: [
    { id: "notice-clue", label: "Notice the clue", detail: "A funny-shaped mound / glint in the snow catches Kiki's eye.", childSec: 8 },
    { id: "decide", label: "Decide to investigate", detail: "Advice choice: peek inside or keep going. No wrong answer.", childSec: 12 },
    { id: "reveal", label: "Reveal the igloo", detail: "Snow brushes away — a hidden igloo! Kiki gasps.", childSec: 10 },
    { id: "enter", label: "Enter", detail: "Kiki squeezes through the little tunnel.", childSec: 5 },
    { id: "search-objects", label: "Search 3 interesting objects", detail: "Old sled bell, expedition map scrap, warm blanket — each tells a tiny story.", childSec: 25 },
    { id: "discover", label: "Discover fact + expedition item", detail: "Husky fact surfaces as a discovery; Kiki pockets an expedition badge.", childSec: 10 },
    { id: "optional-challenge", label: "Optional small challenge", detail: "Tiny bonus puzzle for Golden Husky progress. Skippable.", childSec: 12 },
  ],
  masteryHook: "secrets:igloo-complete",
} as const;

/** Fallen Tree: ~20–40s of physical interaction. No math. */
export const FALLEN_TREE_SEQUENCE = {
  id: "fallen-tree",
  targetSec: { child: 35, adult: 18 },
  branches: 5,
  perBranchReaction: true,
  note: "Tap branches in any order; Kiki reacts (pushes, wiggles, proud hop) after each. The last branch needs two taps — Kiki really leans into it.",
} as const;

/** Frozen Lake: route-selection gameplay around the math. Wrong = funny, never punished. */
export const FROZEN_LAKE_STONES = {
  id: "frozen-lake",
  targetSec: { child: 40, adult: 15 },
  stones: 5,
  wrongPick: "A stone wobbles with a funny CRACK — Kiki hops back, giggling. Try another!",
  note: "Math lights the safe stones first; the player's stone picks are the gameplay.",
} as const;

/** Snow Pass: wind reveals markers; the player follows them. */
export const SNOW_PASS_MARKERS = {
  id: "snow-pass",
  targetSec: { child: 35, adult: 15 },
  markerCount: 4,
  revealMs: 2500,
  note: "Markers glow briefly in the wind, then fade. Tap them in the order shown. Miss = they glow again, no penalty.",
} as const;

/** Race Camp flow before the race. */
export const RACE_CAMP_FLOW = {
  id: "race-camp",
  targetSec: { child: 55, adult: 28 },
  steps: [
    { id: "meet-bolt", label: "Meet Bolt", detail: "First meeting dialogue — confident, playful, friendly.", childSec: 15 },
    { id: "exchange", label: "Short exchange", detail: "Bolt teases Kiki about short legs; Kiki grins back.", childSec: 10 },
    { id: "inspect-sled", label: "Inspect the sled (optional)", detail: "Runners, harness, one loose strap Kiki tightens.", childSec: 12 },
    { id: "advice-ready", label: "Kiki asks: ready or look around?", detail: "PlayerAdviceChoice advice-race-ready.", childSec: 12 },
  ],
} as const;

/** Race beats: a physical event before each math question (4th beat is pure run-in). */
export const RACE_BEATS = [
  { id: "race-downhill", label: "Downhill stretch", event: "Tap at the right moment to tuck low and gain speed.", kind: "timing-tap" as const, childSec: 18 },
  { id: "race-icy-turn", label: "Icy turn", event: "Choose the inside or outside line around the turn.", kind: "choose-path" as const, childSec: 18 },
  { id: "race-deep-snow", label: "Deep snow", event: "Paddle! Tap quickly to power through the drift.", kind: "multi-tap-clear" as const, childSec: 18 },
  { id: "race-final-sprint", label: "Final sprint", event: "No question — just cheer Kiki home. Pure celebration.", kind: "timing-tap" as const, childSec: 16 },
];

/** Reward sequence: 30–60s, mostly visual/interactive, not text. */
export const REWARD_SEQUENCE = {
  id: "husky-reward",
  targetSec: { child: 45, adult: 22 },
  steps: [
    { id: "finish-moment", label: "Finish moment", detail: "Kiki crosses — confetti snow, happy spin.", childSec: 8 },
    { id: "friendship-beat", label: "Husky friendship beat", detail: "Bolt congratulates Kiki. Rivals → friends.", childSec: 8 },
    { id: "kiki-reaction", label: "Kiki reaction", detail: "Proud hop, ears up.", childSec: 5 },
    { id: "recap", label: "Short adventure recap", detail: "Player picks their favorite moment (interaction).", childSec: 10 },
    { id: "sticker", label: "Sticker reveal", detail: "The Husky sticker stamps into the album with a flourish.", childSec: 7 },
    { id: "album-progress", label: "Album progress", detail: "Album shows 1 of 12 — the collection begins.", childSec: 4 },
    { id: "golden-tease", label: "Golden Husky teaser", detail: "A golden glimmer hints at mastery. Optional, intriguing.", childSec: 3 },
  ],
} as const;

export interface InteractionIssue {
  code: string;
  message: string;
}

/** Known node ids for the Husky adventure (mirrors HuskyAdventure.ts). */
export const HUSKY_NODE_IDS = [
  "trailhead", "broken-bridge", "forest", "frozen-lake", "fallen-tree",
  "ice-cave", "snow-pass", "summit-camp", "secret-igloo", "snow-cache",
  "race-camp", "sled-race", "husky-reward",
] as const;

/**
 * Automated QA gates for the interaction inventory.
 */
export function validateInteractionPlan(
  interactions: InteractionDef[] = HUSKY_INTERACTIONS,
  advice: PlayerAdviceChoice[] = HUSKY_ADVICE_CHOICES,
  decisions: MicroDecision[] = HUSKY_MICRO_DECISIONS,
): InteractionIssue[] {
  const issues: InteractionIssue[] = [];

  if (interactions.length < 10) {
    issues.push({ code: "TOO_FEW_INTERACTIONS", message: `Only ${interactions.length} non-math interactions — need at least 10.` });
  }

  const discoveries = interactions.filter((i) => !i.required);
  if (discoveries.length < 2) {
    issues.push({ code: "TOO_FEW_DISCOVERIES", message: `Only ${discoveries.length} optional discoveries — need at least 2.` });
  }

  if (advice.length < 2) {
    issues.push({ code: "TOO_FEW_ADVICE_CHOICES", message: `Only ${advice.length} Kiki-asks-the-player moments — need at least 2.` });
  }

  // No required secret: optionals must never gate progression.
  for (const i of interactions) {
    if ((i.nodeId === "secret-igloo" || i.nodeId === "snow-cache") && i.required) {
      issues.push({ code: "REQUIRED_SECRET", message: `Interaction "${i.id}" on secret node "${i.nodeId}" is marked required.` });
    }
  }

  // Required interactions must be retryable (no fail states on the critical path).
  for (const i of interactions) {
    if (i.required && !i.retryable) {
      issues.push({ code: "REQUIRED_NOT_RETRYABLE", message: `Required interaction "${i.id}" is not retryable — the critical path must have no fail states.` });
    }
  }

  // Node ids must be known.
  const known = new Set<string>(HUSKY_NODE_IDS);
  for (const i of interactions) {
    if (!known.has(i.nodeId)) issues.push({ code: "UNKNOWN_NODE", message: `Interaction "${i.id}" references unknown node "${i.nodeId}".` });
  }
  for (const a of advice) {
    if (!known.has(a.nodeId)) issues.push({ code: "UNKNOWN_NODE", message: `Advice "${a.id}" references unknown node "${a.nodeId}".` });
  }

  // Unique ids everywhere.
  const seen = new Set<string>();
  for (const item of [...interactions.map((i) => i.id), ...advice.map((a) => a.id), ...decisions.map((d) => d.id)]) {
    if (seen.has(item)) issues.push({ code: "DUPLICATE_ID", message: `Duplicate id "${item}".` });
    seen.add(item);
  }

  // Advice choices: exactly 2 options, labels short, neither punishing.
  const banned = ["wrong", "try harder", "stupid", "fail", "lose"];
  for (const a of advice) {
    if (a.options.length !== 2) {
      issues.push({ code: "ADVICE_OPTION_COUNT", message: `Advice "${a.id}" must have exactly 2 options.` });
    }
    for (const o of a.options) {
      const words = o.label.trim().split(/\s+/).length;
      if (words > 4) issues.push({ code: "BUTTON_TOO_LONG", message: `Advice option "${o.id}" label is ${words} words — buttons should be 1–4 words.` });
      const lower = (o.label + " " + o.outcome).toLowerCase();
      for (const b of banned) {
        if (lower.includes(b)) issues.push({ code: "PUNISHING_LANGUAGE", message: `Advice "${a.id}" option "${o.id}" contains punishing language ("${b}").` });
      }
      if (!o.outcome.trim()) issues.push({ code: "EMPTY_OUTCOME", message: `Advice "${a.id}" option "${o.id}" has no outcome.` });
    }
    if (!a.kikiLine.trim()) issues.push({ code: "EMPTY_KIKI_LINE", message: `Advice "${a.id}" has no Kiki line.` });
  }

  // Micro-decisions: ≥2 options each, all outcomes present.
  for (const d of decisions) {
    if (d.options.length < 2) issues.push({ code: "MICRO_DECISION_OPTIONS", message: `Micro-decision "${d.id}" needs at least 2 options.` });
    for (const o of d.options) {
      if (!o.outcome.trim()) issues.push({ code: "EMPTY_OUTCOME", message: `Micro-decision "${d.id}" option "${o.id}" has no outcome.` });
    }
  }

  // Duration sanity.
  for (const i of interactions) {
    if (i.childSec <= 0 || i.adultSec <= 0) issues.push({ code: "NON_POSITIVE_DURATION", message: `Interaction "${i.id}" has non-positive duration.` });
    if (i.adultSec > i.childSec) issues.push({ code: "ADULT_SLOWER_THAN_CHILD", message: `Interaction "${i.id}": adult slower than child.` });
  }

  return issues;
}

export function isInteractionPlanOnTarget(): boolean {
  return validateInteractionPlan().length === 0;
}
