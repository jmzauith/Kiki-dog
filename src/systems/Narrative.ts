/**
 * Narrative — reusable adventure content model for Kiki's Dog Adventure.
 *
 * This module is CONTENT + DATA + VALIDATION only. It contains no Phaser
 * code, no rendering, no scene logic. It tells a future scene WHAT happened
 * at each encounter; the scene decides HOW to render it.
 *
 * Design principles (from the product brief):
 * - If you removed the numbers from an encounter, a small adventure should
 *   still be happening. Math is HOW Kiki solves the problem; math is NOT
 *   the reason the problem exists.
 * - Wrong answers never punish. Hints escalate without giving the answer.
 * - Kiki reactions are SEMANTIC ids ("curious", "celebrate") — never coupled
 *   to any character artist's pose names.
 * - The engine has zero breed-specific assumptions. A future breed ships a
 *   new AdventureNarrativeDefinition; this file never changes per breed.
 */

/** Semantic Kiki reaction ids. The scene maps these to actual poses. */
export type KikiReactionId =
  | "excited"
  | "curious"
  | "thinking"
  | "determined"
  | "cautious"
  | "happy"
  | "surprised"
  | "proud"
  | "celebrate"
  | "affectionate"
  | "playful"
  | "worried";

/** Human-readable description of each reaction, for content authors. */
export const KIKI_REACTIONS: Record<KikiReactionId, string> = {
  excited: "Tail wagging fast, bouncing on front paws",
  curious: "Head tilt, nose forward, sniffing the air",
  thinking: "One ear up, one ear down, looking side to side",
  determined: "Low stance, eyes locked on the goal",
  cautious: "Slow careful steps, ears slightly back",
  happy: "Relaxed wag, soft eyes, tongue out",
  surprised: "Ears straight up, eyes wide",
  proud: "Chest out, chin up, slow dignified wag",
  celebrate: "Happy spin, little hop",
  affectionate: "Nuzzles, leans in close",
  playful: "Play-bow, butt in the air, ready to zoom",
  worried: "Ears droop slightly, looks back at the player",
};

/** Encounter kinds — mirrors the adventure progression vocabulary. */
export type EncounterKind =
  | "checkpoint"
  | "math-normal"
  | "math-challenge"
  | "choice"
  | "discovery"
  | "secret"
  | "race"
  | "reward";

/**
 * Environmental math wrapper. The math engine still generates equivalent
 * problems; this template gives the generated numbers a WORLD PURPOSE.
 * Placeholders {a} and {b} are filled with the generated operands.
 * Serializable — no functions, so content stays data.
 */
export interface MathFraming {
  /** e.g. "The bridge needs {a} rows of {b} boards. How many boards does Kiki need?" */
  template: string;
  /** Short label for the math moment, e.g. "board-counting". */
  flavor: string;
}

/** 2–3 escalating hints. Later hints are genuinely more useful. */
export interface HintLadder {
  hints: string[];
}

/** One line of breed-character dialogue. */
export interface CharacterLine {
  speaker: "husky" | "kiki" | "narrator";
  /** For "husky", the breed character's display name (e.g. "Bolt"). */
  characterName?: string;
  line: string;
}

/** One beat of the sticker reward sequence. */
export interface RewardBeat {
  id: string;
  /** Short scene-setting line. */
  text: string;
  kikiReaction: KikiReactionId;
  huskyLine?: CharacterLine;
  /** Optional breed fact id to surface as a discovery (not a popup). */
  factUnlock?: string;
  soundCue?: string;
  visualEvent?: string;
}

/** One situational race decision. */
export interface RaceBeat {
  id: string;
  /** The situation, e.g. "Deep snow ahead!" */
  situation: string;
  detail: string;
  steadyLabel: string;
  turboLabel: string;
  /** What Steady means here, e.g. "Plow through steadily." */
  steadyText: string;
  /** What Turbo means here, e.g. "Leap over the drifts!" */
  turboText: string;
  kikiReaction: KikiReactionId;
}

/** Full narrative for one adventure node/encounter. */
export interface EncounterNarrative {
  /** Must match the adventure definition's node id. */
  nodeId: string;
  locationName: string;
  kind: EncounterKind;
  /** 1–2 short sentences on arriving. */
  arrival: string;
  /** The environmental problem — the reason the encounter exists. */
  problem: string;
  kikiReaction: KikiReactionId;
  /** Optional breed-character dialogue at this encounter. */
  dialogue?: CharacterLine[];
  /** Choice buttons (1–4 words each) for "choice" encounters. */
  choiceButtons?: string[];
  /** Environmental math wrapper (math encounters only). */
  math?: MathFraming;
  /** Hint ladder (math encounters should have 2–3). */
  hints?: HintLadder;
  /** Varied, kind wrong-answer responses (math encounters). */
  wrongResponses?: string[];
  /** Said when the math is solved. */
  correctResponse?: string;
  /** How the WORLD changes on success. */
  success?: string;
  /** Non-math discovery text (discovery/secret encounters). */
  discovery?: string;
  /** Breed fact id to surface as a natural discovery (hook, not a popup). */
  factUnlock?: string;
  /** Extra text for secrets (mastery hook description etc.). */
  secretText?: string;
  /** 1-sentence wrap-up. */
  completion: string;
  /** Semantic animation cue for the scene (not a pose name). */
  animationCue?: string;
  /** Sound hook, e.g. "sfx:bridge-repair". Scene decides the asset. */
  soundCue?: string;
  /** Visual-event hook, e.g. "vfx:bridge-boards-fly-in". */
  visualEvent?: string;
}

/** Personality framing for a route — neither route is the "wrong" choice. */
export interface RoutePersonality {
  routeId: string;
  tagline: string;
  /** e.g. ["exploratory", "thoughtful", "scenic"] */
  adjectives: string[];
  mathTone: string;
  lengthNote: string;
}

/** The breed character's personality + dialogue set. */
export interface BreedCharacter {
  name: string;
  species: string;
  personality: string[];
  /** Keyed dialogue moments: first-meeting, race-start, mid-race, race-finish, reward, ... */
  dialogue: Record<string, CharacterLine[]>;
}

/** A complete narrative definition for one breed adventure. */
export interface AdventureNarrativeDefinition {
  adventureId: string;
  breedId: string;
  encounters: EncounterNarrative[];
  routes: RoutePersonality[];
  breedCharacter: BreedCharacter;
  raceBeats: RaceBeat[];
  rewardSequence: RewardBeat[];
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** Phrases that must never appear in player-facing copy. */
export const BANNED_PHRASES = [
  "wrong!",
  "try harder",
  "stupid",
  "dumb",
  "loser",
  "you failed",
  "failure",
  "idiot",
];

export const MAX_LINE_LENGTH = 140;
export const MAX_BUTTON_WORDS = 4;

function checkLine(label: string, text: string | undefined, problems: string[]): void {
  if (text === undefined) return;
  if (text.length > MAX_LINE_LENGTH) {
    problems.push(`${label}: line too long (${text.length} > ${MAX_LINE_LENGTH}): "${text.slice(0, 60)}…"`);
  }
  const lower = text.toLowerCase();
  for (const banned of BANNED_PHRASES) {
    if (lower.includes(banned)) {
      problems.push(`${label}: banned phrase "${banned}" in: "${text.slice(0, 60)}…"`);
    }
  }
}

/** Validate one encounter's narrative. Returns a list of problems (empty = ok). */
export function validateEncounterNarrative(e: EncounterNarrative): string[] {
  const problems: string[] = [];
  const tag = `encounter "${e.nodeId}"`;

  if (!e.nodeId || !e.nodeId.trim()) problems.push(`${tag}: missing nodeId`);
  if (!e.locationName || !e.locationName.trim()) problems.push(`${tag}: missing locationName`);
  if (!e.arrival || !e.arrival.trim()) problems.push(`${tag}: missing arrival text`);
  if (!e.problem || !e.problem.trim()) problems.push(`${tag}: missing environmental problem`);
  if (!e.completion || !e.completion.trim()) problems.push(`${tag}: missing completion text`);
  if (!(e.kikiReaction in KIKI_REACTIONS)) {
    problems.push(`${tag}: unknown kikiReaction "${e.kikiReaction}"`);
  }

  for (const [label, text] of [
    ["arrival", e.arrival],
    ["problem", e.problem],
    ["correctResponse", e.correctResponse],
    ["success", e.success],
    ["discovery", e.discovery],
    ["secretText", e.secretText],
    ["completion", e.completion],
  ] as const) {
    checkLine(`${tag}.${label}`, text, problems);
  }

  if (e.choiceButtons) {
    for (const b of e.choiceButtons) {
      const words = b.trim().split(/\s+/).filter(Boolean).length;
      if (words > MAX_BUTTON_WORDS) {
        problems.push(`${tag}: button "${b}" has ${words} words (max ${MAX_BUTTON_WORDS})`);
      }
      checkLine(`${tag}.choiceButton`, b, problems);
    }
  }

  if (e.kind === "math-normal" || e.kind === "math-challenge") {
    if (!e.math) {
      problems.push(`${tag}: math encounter needs a math framing template`);
    } else {
      if (!e.math.template.includes("{a}") || !e.math.template.includes("{b}")) {
        problems.push(`${tag}: math template must contain {a} and {b} placeholders`);
      }
      checkLine(`${tag}.math.template`, e.math.template, problems);
    }
    if (!e.hints || e.hints.hints.length < 2) {
      problems.push(`${tag}: math encounter needs a hint ladder with at least 2 hints`);
    } else {
      for (const h of e.hints.hints) checkLine(`${tag}.hint`, h, problems);
    }
    if (!e.wrongResponses || e.wrongResponses.length < 3) {
      problems.push(`${tag}: math encounter needs at least 3 varied wrong-answer responses`);
    } else {
      for (const w of e.wrongResponses) checkLine(`${tag}.wrongResponse`, w, problems);
    }
    if (!e.correctResponse || !e.correctResponse.trim()) {
      problems.push(`${tag}: math encounter needs a correct-answer response`);
    }
    if (!e.success || !e.success.trim()) {
      problems.push(`${tag}: math encounter needs an environmental success description`);
    }
  }

  if (e.dialogue) {
    for (const d of e.dialogue) {
      checkLine(`${tag}.dialogue`, d.line, problems);
      if (d.speaker === "husky" && !d.characterName) {
        problems.push(`${tag}: husky dialogue line needs a characterName`);
      }
    }
  }

  return problems;
}

/** Validate a whole adventure narrative definition. */
export function validateAdventureNarrative(def: AdventureNarrativeDefinition): string[] {
  const problems: string[] = [];
  if (!def.adventureId) problems.push("missing adventureId");
  if (!def.breedId) problems.push("missing breedId");

  const seen = new Set<string>();
  for (const e of def.encounters) {
    if (seen.has(e.nodeId)) problems.push(`duplicate encounter nodeId "${e.nodeId}"`);
    seen.add(e.nodeId);
    problems.push(...validateEncounterNarrative(e));
  }

  if (def.raceBeats.length < 3 || def.raceBeats.length > 5) {
    problems.push(`raceBeats must have 3–5 beats, found ${def.raceBeats.length}`);
  }
  const beatIds = new Set<string>();
  for (const b of def.raceBeats) {
    if (beatIds.has(b.id)) problems.push(`duplicate race beat id "${b.id}"`);
    beatIds.add(b.id);
    for (const [label, text] of [
      ["situation", b.situation],
      ["detail", b.detail],
      ["steadyText", b.steadyText],
      ["turboText", b.turboText],
    ] as const) {
      checkLine(`raceBeat "${b.id}".${label}`, text, problems);
    }
    for (const lbl of [b.steadyLabel, b.turboLabel]) {
      const words = lbl.trim().split(/\s+/).filter(Boolean).length;
      if (words > MAX_BUTTON_WORDS) {
        problems.push(`raceBeat "${b.id}": button "${lbl}" has ${words} words (max ${MAX_BUTTON_WORDS})`);
      }
    }
    if (!(b.kikiReaction in KIKI_REACTIONS)) {
      problems.push(`raceBeat "${b.id}": unknown kikiReaction "${b.kikiReaction}"`);
    }
  }

  if (def.rewardSequence.length === 0) {
    problems.push("rewardSequence must not be empty");
  }
  for (const r of def.rewardSequence) {
    checkLine(`rewardBeat "${r.id}"`, r.text, problems);
    if (!(r.kikiReaction in KIKI_REACTIONS)) {
      problems.push(`rewardBeat "${r.id}": unknown kikiReaction "${r.kikiReaction}"`);
    }
  }

  if (def.routes.length === 0) problems.push("routes must not be empty");
  for (const r of def.routes) {
    if (!r.tagline) problems.push(`route "${r.routeId}": missing tagline`);
    if (r.adjectives.length === 0) problems.push(`route "${r.routeId}": missing adjectives`);
  }

  const dc = def.breedCharacter.dialogue;
  for (const key of ["first-meeting", "race-start", "mid-race", "race-finish", "reward"]) {
    if (!dc[key] || dc[key].length === 0) {
      problems.push(`breedCharacter missing dialogue moment "${key}"`);
    }
  }

  return problems;
}

/** Throw if the definition is invalid — fail fast for content authors. */
export function assertValidAdventureNarrative(def: AdventureNarrativeDefinition): void {
  const problems = validateAdventureNarrative(def);
  if (problems.length > 0) {
    throw new Error(`Invalid adventure narrative:\n- ${problems.join("\n- ")}`);
  }
}
