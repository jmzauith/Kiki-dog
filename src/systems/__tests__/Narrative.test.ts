import { describe, it, expect } from "vitest";
import {
  validateEncounterNarrative,
  validateAdventureNarrative,
  assertValidAdventureNarrative,
  KIKI_REACTIONS,
  BANNED_PHRASES,
  MAX_LINE_LENGTH,
  MAX_BUTTON_WORDS,
  type EncounterNarrative,
  type AdventureNarrativeDefinition,
} from "../Narrative";

const goodEncounter = (over: Partial<EncounterNarrative> = {}): EncounterNarrative => ({
  nodeId: "test-node",
  locationName: "Test Place",
  kind: "discovery",
  arrival: "Kiki arrives somewhere fun.",
  problem: "Something small needs doing.",
  kikiReaction: "curious",
  completion: "All done!",
  ...over,
});

const goodMathEncounter = (over: Partial<EncounterNarrative> = {}): EncounterNarrative =>
  goodEncounter({
    kind: "math-normal",
    math: { template: "There are {a} groups of {b} pebbles. How many?", flavor: "pebbles" },
    hints: { hints: ["Count the groups.", "{a} groups of {b} — add them up."] },
    wrongResponses: ["Kiki tilts her head.", "Try another number!", "Almost — count again."],
    correctResponse: "Yes! Perfect.",
    success: "The pebbles line up neatly.",
    ...over,
  });

const goodDef = (over: Partial<AdventureNarrativeDefinition> = {}): AdventureNarrativeDefinition => ({
  adventureId: "test",
  breedId: "testbreed",
  encounters: [goodEncounter({ nodeId: "n1" }), goodMathEncounter({ nodeId: "n2" })],
  routes: [{ routeId: "safe", tagline: "Gentle.", adjectives: ["calm"], mathTone: "Easy.", lengthNote: "Short." }],
  breedCharacter: {
    name: "Test",
    species: "Test Breed",
    personality: ["friendly"],
    dialogue: {
      "first-meeting": [{ speaker: "husky", characterName: "T", line: "Hi!" }],
      "race-start": [{ speaker: "husky", characterName: "T", line: "Go!" }],
      "mid-race": [{ speaker: "husky", characterName: "T", line: "Woo!" }],
      "race-finish": [{ speaker: "husky", characterName: "T", line: "Done!" }],
      reward: [{ speaker: "husky", characterName: "T", line: "Yay!" }],
    },
  },
  raceBeats: [
    { id: "r1", situation: "Hill!", detail: "Steep.", steadyLabel: "Steady", turboLabel: "Turbo", steadyText: "Slow.", turboText: "Fast!", kikiReaction: "excited" },
    { id: "r2", situation: "Turn!", detail: "Sharp.", steadyLabel: "Steady", turboLabel: "Turbo", steadyText: "Slow.", turboText: "Fast!", kikiReaction: "excited" },
    { id: "r3", situation: "Snow!", detail: "Deep.", steadyLabel: "Steady", turboLabel: "Turbo", steadyText: "Slow.", turboText: "Fast!", kikiReaction: "excited" },
  ],
  rewardSequence: [{ id: "rw1", text: "Sticker earned!", kikiReaction: "celebrate" }],
  ...over,
});

describe("validateEncounterNarrative", () => {
  it("accepts a well-formed discovery encounter", () => {
    expect(validateEncounterNarrative(goodEncounter())).toEqual([]);
  });

  it("accepts a well-formed math encounter", () => {
    expect(validateEncounterNarrative(goodMathEncounter())).toEqual([]);
  });

  it("rejects missing required copy", () => {
    const p = validateEncounterNarrative(goodEncounter({ arrival: "  ", problem: "", completion: "" }));
    expect(p.some((x) => x.includes("arrival"))).toBe(true);
    expect(p.some((x) => x.includes("problem"))).toBe(true);
    expect(p.some((x) => x.includes("completion"))).toBe(true);
  });

  it("rejects unknown kiki reaction ids", () => {
    const p = validateEncounterNarrative(goodEncounter({ kikiReaction: "dab" as never }));
    expect(p.some((x) => x.includes("kikiReaction"))).toBe(true);
  });

  it("rejects banned phrases", () => {
    const p = validateEncounterNarrative(goodEncounter({ arrival: "WRONG! You failed, loser." }));
    expect(p.length).toBeGreaterThan(0);
    expect(p.some((x) => x.includes("banned phrase"))).toBe(true);
  });

  it("rejects overlong lines", () => {
    const p = validateEncounterNarrative(goodEncounter({ arrival: "x".repeat(MAX_LINE_LENGTH + 1) }));
    expect(p.some((x) => x.includes("too long"))).toBe(true);
  });

  it("rejects button labels over the word limit", () => {
    const p = validateEncounterNarrative(
      goodEncounter({ kind: "choice", choiceButtons: ["This button label is way too long indeed"] }),
    );
    expect(p.some((x) => x.includes("words"))).toBe(true);
  });

  it("accepts 4-word button labels", () => {
    const p = validateEncounterNarrative(
      goodEncounter({ kind: "choice", choiceButtons: ["Take The Scenic Route"] }),
    );
    expect(p).toEqual([]);
  });

  it("requires {a} and {b} placeholders in math templates", () => {
    const p = validateEncounterNarrative(
      goodMathEncounter({ math: { template: "Solve 8 times 7.", flavor: "x" } }),
    );
    expect(p.some((x) => x.includes("placeholders"))).toBe(true);
  });

  it("requires at least 2 hints on math encounters", () => {
    const p = validateEncounterNarrative(goodMathEncounter({ hints: { hints: ["One hint."] } }));
    expect(p.some((x) => x.includes("hint ladder"))).toBe(true);
  });

  it("requires at least 3 wrong-answer responses on math encounters", () => {
    const p = validateEncounterNarrative(goodMathEncounter({ wrongResponses: ["One.", "Two."] }));
    expect(p.some((x) => x.includes("wrong-answer"))).toBe(true);
  });

  it("requires correctResponse and success on math encounters", () => {
    const p = validateEncounterNarrative(goodMathEncounter({ correctResponse: "", success: "" }));
    expect(p.length).toBeGreaterThan(0);
  });

  it("requires characterName on husky dialogue lines", () => {
    const p = validateEncounterNarrative(
      goodEncounter({ dialogue: [{ speaker: "husky", line: "Hi!" }] }),
    );
    expect(p.some((x) => x.includes("characterName"))).toBe(true);
  });
});

describe("validateAdventureNarrative", () => {
  it("accepts a well-formed definition", () => {
    expect(validateAdventureNarrative(goodDef())).toEqual([]);
    expect(() => assertValidAdventureNarrative(goodDef())).not.toThrow();
  });

  it("rejects duplicate encounter node ids", () => {
    const p = validateAdventureNarrative(
      goodDef({ encounters: [goodEncounter({ nodeId: "dup" }), goodEncounter({ nodeId: "dup" })] }),
    );
    expect(p.some((x) => x.includes("duplicate encounter"))).toBe(true);
  });

  it("requires 3–5 race beats", () => {
    const two = goodDef().raceBeats.slice(0, 2);
    expect(validateAdventureNarrative(goodDef({ raceBeats: two })).some((x) => x.includes("raceBeats"))).toBe(true);
    const six = [...goodDef().raceBeats, ...goodDef().raceBeats];
    expect(validateAdventureNarrative(goodDef({ raceBeats: six })).some((x) => x.includes("raceBeats"))).toBe(true);
  });

  it("rejects duplicate race beat ids", () => {
    const beats = goodDef().raceBeats;
    const dup = [{ ...beats[0] }, { ...beats[1], id: beats[0].id }, beats[2]];
    expect(validateAdventureNarrative(goodDef({ raceBeats: dup })).some((x) => x.includes("duplicate race beat"))).toBe(true);
  });

  it("rejects empty reward sequence", () => {
    expect(validateAdventureNarrative(goodDef({ rewardSequence: [] })).some((x) => x.includes("rewardSequence"))).toBe(true);
  });

  it("requires all five breed-character dialogue moments", () => {
    const def = goodDef();
    const { "mid-race": _drop, ...rest } = def.breedCharacter.dialogue;
    const broken = { ...def, breedCharacter: { ...def.breedCharacter, dialogue: rest } };
    expect(validateAdventureNarrative(broken).some((x) => x.includes("mid-race"))).toBe(true);
  });

  it("assertValid throws with a readable message", () => {
    expect(() => assertValidAdventureNarrative(goodDef({ encounters: [] }))).not.toThrow();
  });
});

describe("KIKI_REACTIONS", () => {
  it("defines exactly the documented semantic vocabulary", () => {
    const ids = Object.keys(KIKI_REACTIONS).sort();
    expect(ids).toEqual(
      ["affectionate", "cautious", "celebrate", "curious", "determined", "excited", "happy", "playful", "proud", "surprised", "thinking", "worried"].sort(),
    );
  });

  it("every reaction has a non-empty description", () => {
    for (const [id, desc] of Object.entries(KIKI_REACTIONS)) {
      expect(desc.trim().length, id).toBeGreaterThan(0);
    }
  });
});

describe("BANNED_PHRASES", () => {
  it("covers the forbidden failure language", () => {
    for (const phrase of ["wrong!", "try harder", "stupid", "loser"]) {
      expect(BANNED_PHRASES).toContain(phrase);
    }
  });
});
