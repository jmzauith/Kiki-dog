import { describe, it, expect } from "vitest";
import {
  HUSKY_NARRATIVE,
  KNOWN_HUSKY_FACT_IDS,
} from "../HuskyNarrative";
import { validateAdventureNarrative, BANNED_PHRASES } from "../Narrative";

/** The 12 node ids from HuskyAdventure.ts — narrative must cover exactly these. */
const EXPECTED_NODE_IDS = [
  "trailhead",
  "broken-bridge",
  "forest",
  "frozen-lake",
  "fallen-tree",
  "ice-cave",
  "snow-pass",
  "summit-camp",
  "secret-igloo",
  "snow-cache",
  "sled-race",
  "husky-reward",
];

/** Collect every player-facing string in the definition for copy QA. */
function allCopy(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const e of HUSKY_NARRATIVE.encounters) {
    const push = (label: string, t: string | undefined) => {
      if (t) out.push({ where: `${e.nodeId}.${label}`, text: t });
    };
    push("arrival", e.arrival);
    push("problem", e.problem);
    push("correctResponse", e.correctResponse);
    push("success", e.success);
    push("discovery", e.discovery);
    push("secretText", e.secretText);
    push("completion", e.completion);
    e.math && push("math.template", e.math.template);
    e.hints?.hints.forEach((h, i) => push(`hint[${i}]`, h));
    e.wrongResponses?.forEach((w, i) => push(`wrong[${i}]`, w));
    e.dialogue?.forEach((d, i) => push(`dialogue[${i}]`, d.line));
    e.choiceButtons?.forEach((b, i) => push(`choice[${i}]`, b));
  }
  for (const b of HUSKY_NARRATIVE.raceBeats) {
    out.push({ where: `race.${b.id}.situation`, text: b.situation });
    out.push({ where: `race.${b.id}.detail`, text: b.detail });
    out.push({ where: `race.${b.id}.steadyText`, text: b.steadyText });
    out.push({ where: `race.${b.id}.turboText`, text: b.turboText });
  }
  for (const r of HUSKY_NARRATIVE.rewardSequence) {
    out.push({ where: `reward.${r.id}`, text: r.text });
    if (r.huskyLine) out.push({ where: `reward.${r.id}.husky`, text: r.huskyLine.line });
  }
  for (const [k, lines] of Object.entries(HUSKY_NARRATIVE.breedCharacter.dialogue)) {
    lines.forEach((d, i) => out.push({ where: `husky.${k}[${i}]`, text: d.line }));
  }
  return out;
}

describe("HuskyNarrative coverage", () => {
  it("covers exactly the 12 HuskyAdventure node ids", () => {
    const ids = HUSKY_NARRATIVE.encounters.map((e) => e.nodeId).sort();
    expect(ids).toEqual([...EXPECTED_NODE_IDS].sort());
  });

  it("passes engine validation", () => {
    expect(validateAdventureNarrative(HUSKY_NARRATIVE)).toEqual([]);
  });

  it("has the right adventure/breed identity", () => {
    expect(HUSKY_NARRATIVE.adventureId).toBe("husky");
    expect(HUSKY_NARRATIVE.breedId).toBe("husky");
  });

  it("every math encounter frames math with world purpose (not bare arithmetic)", () => {
    for (const e of HUSKY_NARRATIVE.encounters) {
      if (e.kind === "math-normal" || e.kind === "math-challenge") {
        expect(e.math, e.nodeId).toBeDefined();
        // The template must mention the world, not just "solve".
        expect(e.math!.template.toLowerCase()).not.toMatch(/^solve \d/);
        expect(e.math!.template).toMatch(/\{a\}.*\{b\}|\{b\}.*\{a\}/);
      }
    }
  });

  it("factUnlock hooks reference real HuskyFacts ids", () => {
    const known = new Set<string>(KNOWN_HUSKY_FACT_IDS);
    expect(known.size).toBe(12);
    for (const e of HUSKY_NARRATIVE.encounters) {
      if (e.factUnlock) {
        expect(known.has(e.factUnlock), `${e.nodeId} factUnlock "${e.factUnlock}"`).toBe(true);
      }
    }
    for (const r of HUSKY_NARRATIVE.rewardSequence) {
      if (r.factUnlock) {
        expect(known.has(r.factUnlock), `reward ${r.id} factUnlock`).toBe(true);
      }
    }
  });

  it("facts surface at story moments, not all at once", () => {
    const withFacts = [
      ...HUSKY_NARRATIVE.encounters.filter((e) => e.factUnlock).map((e) => e.nodeId),
      ...HUSKY_NARRATIVE.rewardSequence.filter((r) => r.factUnlock).map((r) => `reward:${r.id}`),
    ];
    expect(withFacts.length).toBeGreaterThanOrEqual(3);
    expect(withFacts.length).toBeLessThanOrEqual(6);
  });
});

describe("HuskyNarrative copy QA", () => {
  it("contains no banned failure language anywhere", () => {
    for (const { where, text } of allCopy()) {
      const lower = text.toLowerCase();
      for (const banned of BANNED_PHRASES) {
        expect(lower.includes(banned), `${where} contains "${banned}"`).toBe(false);
      }
    }
  });

  it("keeps every line within the reading-level length budget", () => {
    for (const { where, text } of allCopy()) {
      expect(text.length, where).toBeLessThanOrEqual(140);
    }
  });

  it("choice buttons are 1–4 words", () => {
    const forest = HUSKY_NARRATIVE.encounters.find((e) => e.nodeId === "forest")!;
    expect(forest.choiceButtons).toBeDefined();
    for (const b of forest.choiceButtons!) {
      const words = b.trim().split(/\s+/).length;
      expect(words, `"${b}"`).toBeLessThanOrEqual(4);
    }
  });

  it("wrong-answer responses never remove progress or score", () => {
    const punish = [/\blose\b/, /\bpoints\b/, /-1/, /game over/, /start over/];
    for (const e of HUSKY_NARRATIVE.encounters) {
      for (const w of e.wrongResponses ?? []) {
        for (const p of punish) {
          expect(p.test(w.toLowerCase()), `${e.nodeId}: "${w}"`).toBe(false);
        }
      }
    }
  });

  it("every math encounter has a 2–3 level hint ladder", () => {
    for (const e of HUSKY_NARRATIVE.encounters) {
      if (e.kind === "math-normal" || e.kind === "math-challenge") {
        const n = e.hints?.hints.length ?? 0;
        expect(n, e.nodeId).toBeGreaterThanOrEqual(2);
        expect(n, e.nodeId).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe("HuskyNarrative routes", () => {
  it("defines safe and challenge personalities", () => {
    const ids = HUSKY_NARRATIVE.routes.map((r) => r.routeId).sort();
    expect(ids).toEqual(["challenge", "safe"]);
  });

  it("neither route is framed as the wrong choice", () => {
    for (const r of HUSKY_NARRATIVE.routes) {
      const text = `${r.tagline} ${r.mathTone} ${r.lengthNote}`.toLowerCase();
      expect(text).not.toMatch(/wrong|bad choice|don't pick|avoid/);
      expect(r.adjectives.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("routes feel different from each other", () => {
    const [safe, challenge] = ["safe", "challenge"].map(
      (id) => HUSKY_NARRATIVE.routes.find((r) => r.routeId === id)!,
    );
    expect(safe.tagline).not.toBe(challenge.tagline);
    const overlap = safe.adjectives.filter((a) => challenge.adjectives.includes(a));
    expect(overlap.length).toBeLessThan(Math.min(safe.adjectives.length, challenge.adjectives.length));
  });
});

describe("HuskyNarrative race + reward", () => {
  it("has 4 situational race beats", () => {
    expect(HUSKY_NARRATIVE.raceBeats.length).toBe(4);
    const situations = HUSKY_NARRATIVE.raceBeats.map((b) => b.situation);
    expect(new Set(situations).size).toBe(4);
  });

  it("steady/turbo mean something different per situation", () => {
    for (const b of HUSKY_NARRATIVE.raceBeats) {
      expect(b.steadyText).not.toBe(b.turboText);
      expect(b.steadyText.length).toBeGreaterThan(0);
      expect(b.turboText.length).toBeGreaterThan(0);
    }
  });

  it("reward sequence tells a whole-adventure story, not a quiz result", () => {
    const texts = HUSKY_NARRATIVE.rewardSequence.map((r) => r.text).join(" ").toLowerCase();
    expect(texts).toMatch(/bridge/);
    expect(texts).toMatch(/race|finish/);
    expect(texts).toMatch(/sticker/);
    expect(texts).not.toMatch(/question/);
  });

  it("reward sequence has the full 7-beat arc", () => {
    expect(HUSKY_NARRATIVE.rewardSequence.length).toBe(7);
  });

  it("Bolt feels like a friend by the end, not a villain", () => {
    const rewardLines = HUSKY_NARRATIVE.breedCharacter.dialogue["reward"]
      .map((d) => d.line)
      .join(" ")
      .toLowerCase();
    expect(rewardLines).toMatch(/friend/);
    const allLines = Object.values(HUSKY_NARRATIVE.breedCharacter.dialogue)
      .flat()
      .map((d) => d.line.toLowerCase())
      .join(" ");
    expect(allLines).not.toMatch(/destroy|crush you|pathetic|loser/);
  });
});

describe("most important product rule", () => {
  it("every encounter has an environmental problem independent of numbers", () => {
    for (const e of HUSKY_NARRATIVE.encounters) {
      expect(e.problem.trim().length, e.nodeId).toBeGreaterThan(20);
      // The problem text itself must not be a math question.
      expect(e.problem).not.toMatch(/\d+\s*[×x+]\s*\d+\s*=/);
    }
  });
});
