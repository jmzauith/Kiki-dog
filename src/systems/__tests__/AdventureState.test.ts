import { describe, expect, it } from "vitest";
import {
  AdventureDefinition,
  AdventureProgress,
  auditDefinition,
} from "../AdventureState";

/**
 * A small synthetic adventure used to test the generic progression rules
 * without depending on the Husky definition.
 *
 *   start → a → choice → b1 → d → race → reward
 *                    └→ b2 ┘
 *   start → s1 (secret, unlocked after a)
 */
function toyDef(): AdventureDefinition {
  return {
    id: "toy",
    name: "Toy Adventure",
    stickerName: "Toy",
    startNodeId: "start",
    raceNodeId: "race",
    rewardNodeId: "reward",
    nodes: [
      { id: "start", label: "Start", x: 100, y: 100, encounter: "checkpoint", checkpoint: true },
      { id: "a", label: "A", x: 200, y: 100, encounter: "math-normal", required: true },
      { id: "choice", label: "Choice", x: 300, y: 100, encounter: "choice", required: true },
      { id: "b1", label: "B1", x: 400, y: 200, encounter: "discovery", required: true },
      { id: "b2", label: "B2", x: 400, y: 50, encounter: "math-challenge", required: true },
      { id: "d", label: "D", x: 500, y: 100, encounter: "math-normal", required: true },
      { id: "s1", label: "Secret", x: 250, y: 300, encounter: "secret", optional: true, secret: true },
      { id: "race", label: "Race", x: 0, y: 0, encounter: "race", required: true },
      { id: "reward", label: "Reward", x: 0, y: 0, encounter: "reward" },
    ],
    edges: [
      { from: "start", to: "a", kind: "safe" },
      { from: "a", to: "choice", kind: "safe" },
      { from: "choice", to: "b1", kind: "safe", requiresRoute: "safe" },
      { from: "choice", to: "b2", kind: "challenge", requiresRoute: "challenge" },
      { from: "b1", to: "d", kind: "safe" },
      { from: "b2", to: "d", kind: "challenge" },
      { from: "d", to: "race", kind: "safe" },
      { from: "a", to: "s1", kind: "secret" },
    ],
    requiredAlways: ["a", "choice", "d"],
    requiredByRoute: { safe: ["b1"], challenge: ["b2"] },
  };
}

function fresh() {
  return new AdventureProgress(toyDef());
}

describe("auditDefinition", () => {
  it("passes a well-formed definition", () => {
    expect(auditDefinition(toyDef())).toEqual([]);
  });

  it("flags edges to unknown nodes", () => {
    const def = toyDef();
    def.edges.push({ from: "d", to: "nope", kind: "safe" });
    expect(auditDefinition(def).some((p) => p.includes("nope"))).toBe(true);
  });

  it("flags dead-end non-secret nodes", () => {
    const def = toyDef();
    def.nodes.push({ id: "stuck", label: "Stuck", x: 10, y: 10, encounter: "walk" });
    def.edges.push({ from: "d", to: "stuck", kind: "safe" });
    expect(auditDefinition(def).some((p) => p.includes("stuck"))).toBe(true);
  });

  it("does not flag secret nodes as dead ends", () => {
    expect(auditDefinition(toyDef()).some((p) => p.includes("s1"))).toBe(false);
  });

  it("flags off-map and duplicate node ids", () => {
    const def = toyDef();
    def.nodes.push({ id: "a", label: "Dup", x: 9999, y: 10, encounter: "walk" });
    const problems = auditDefinition(def);
    expect(problems.some((p) => p.includes("duplicate"))).toBe(true);
    expect(problems.some((p) => p.includes("off-map"))).toBe(true);
  });
});

describe("unlocking and completion", () => {
  it("start is unlocked, everything else is locked initially", () => {
    const p = fresh();
    expect(p.isUnlocked("start")).toBe(true);
    expect(p.isUnlocked("a")).toBe(false);
    expect(p.isUnlocked("race")).toBe(false);
  });

  it("completing a node unlocks its children", () => {
    const p = fresh();
    expect(p.completeEncounter("start")).toBe(true);
    expect(p.isUnlocked("a")).toBe(true);
    expect(p.isUnlocked("choice")).toBe(false);
  });

  it("cannot complete a locked node (no skipping)", () => {
    const p = fresh();
    expect(p.completeEncounter("d")).toBe(false);
    expect(p.completeEncounter("race")).toBe(false);
    expect(p.completed.size).toBe(0);
  });

  it("cannot complete an unknown node", () => {
    expect(fresh().completeEncounter("nope")).toBe(false);
  });

  it("cannot complete the same node twice", () => {
    const p = fresh();
    expect(p.completeEncounter("start")).toBe(true);
    expect(p.completeEncounter("start")).toBe(false);
  });

  it("availableFrom only offers unlocked, incomplete children", () => {
    const p = fresh();
    p.completeEncounter("start");
    expect(p.availableFrom("start").map((e) => e.to)).toEqual(["a"]);
    expect(p.availableFrom("a")).toEqual([]);
  });

  it("route-gated edges respect the chosen route", () => {
    const p = fresh();
    for (const id of ["start", "a", "choice"]) p.completeEncounter(id);
    p.setRoute("safe");
    expect(p.availableFrom("choice").map((e) => e.to)).toEqual(["b1"]);
    const q = fresh();
    for (const id of ["start", "a", "choice"]) q.completeEncounter(id);
    q.setRoute("challenge");
    expect(q.availableFrom("choice").map((e) => e.to)).toEqual(["b2"]);
  });
});

describe("secrets", () => {
  it("secret nodes stay locked until revealed", () => {
    const p = fresh();
    p.completeEncounter("start");
    p.completeEncounter("a");
    expect(p.isUnlocked("s1")).toBe(false);
    expect(p.revealSecret("s1")).toBe(true);
    expect(p.isUnlocked("s1")).toBe(true);
  });

  it("cannot reveal a secret whose parents are incomplete", () => {
    const p = fresh();
    p.completeEncounter("start");
    expect(p.revealSecret("s1")).toBe(false);
  });

  it("completing a secret records it in secretsFound", () => {
    const p = fresh();
    p.completeEncounter("start");
    p.completeEncounter("a");
    p.revealSecret("s1");
    expect(p.completeEncounter("s1")).toBe(true);
    expect(p.secretsFound.has("s1")).toBe(true);
  });

  it("revealSecret on a non-secret node returns false", () => {
    expect(fresh().revealSecret("a")).toBe(false);
  });
});

describe("sticker gating", () => {
  function completeRoute(p: AdventureProgress, route: "safe" | "challenge") {
    p.completeEncounter("start");
    p.completeEncounter("a");
    p.completeEncounter("choice");
    p.setRoute(route);
    p.completeEncounter(route === "safe" ? "b1" : "b2");
    p.completeEncounter("d");
  }

  it("no sticker before the race, even with all encounters done", () => {
    const p = fresh();
    completeRoute(p, "safe");
    expect(p.canUnlockSticker()).toBe(false);
    expect(p.tryUnlockSticker()).toBe(false);
    expect(p.stickerUnlocked).toBe(false);
  });

  it("no sticker when required encounters are missing", () => {
    const p = fresh();
    p.completeEncounter("start");
    p.completeEncounter("a");
    p.raceCompleted = true;
    expect(p.canUnlockSticker()).toBe(false);
    expect(p.requiredRemaining()).toContain("choice");
  });

  it("sticker unlocks after full adventure + race (safe route)", () => {
    const p = fresh();
    completeRoute(p, "safe");
    p.raceCompleted = true;
    expect(p.canUnlockSticker()).toBe(true);
    expect(p.tryUnlockSticker()).toBe(true);
    expect(p.stickerUnlocked).toBe(true);
  });

  it("sticker unlocks after full adventure + race (challenge route)", () => {
    const p = fresh();
    completeRoute(p, "challenge");
    p.raceCompleted = true;
    expect(p.tryUnlockSticker()).toBe(true);
  });

  it("secrets are never required for the sticker", () => {
    const p = fresh();
    completeRoute(p, "safe");
    p.raceCompleted = true;
    expect(p.requiredRemaining()).not.toContain("s1");
    expect(p.canUnlockSticker()).toBe(true);
  });

  it("requiredRemaining is route-aware", () => {
    const p = fresh();
    p.completeEncounter("start");
    p.completeEncounter("a");
    p.completeEncounter("choice");
    p.setRoute("safe");
    expect(p.requiredRemaining()).toContain("b1");
    expect(p.requiredRemaining()).not.toContain("b2");
  });
});

describe("reset and serialization", () => {
  it("reset clears everything back to the start", () => {
    const p = fresh();
    p.completeEncounter("start");
    p.setRoute("safe");
    p.bonusChallengesCompleted = 3;
    p.raceCompleted = true;
    p.reset();
    expect(p.completed.size).toBe(0);
    expect(p.chosenRoute).toBeNull();
    expect(p.bonusChallengesCompleted).toBe(0);
    expect(p.raceCompleted).toBe(false);
    expect(p.stickerUnlocked).toBe(false);
    expect(p.currentNodeId).toBe("start");
    expect(p.isUnlocked("start")).toBe(true);
  });

  it("toJSON/fromJSON round-trips all progress", () => {
    const p = fresh();
    p.completeEncounter("start");
    p.completeEncounter("a");
    p.setRoute("challenge");
    p.revealSecret("s1");
    p.completeEncounter("s1");
    p.recordBonusChallenge();
    p.currentNodeId = "choice";
    const q = AdventureProgress.fromJSON(toyDef(), p.toJSON());
    expect(q.completed.has("a")).toBe(true);
    expect(q.chosenRoute).toBe("challenge");
    expect(q.secretsFound.has("s1")).toBe(true);
    expect(q.bonusChallengesCompleted).toBe(1);
    // Completing the secret (+1) and the bonus challenge (+1).
    expect(q.challengeSuccesses).toBe(2);
    expect(q.currentNodeId).toBe("choice");
  });

  it("fromJSON drops unknown node ids (stale/hand-edited saves)", () => {
    const p = fresh();
    const data = p.toJSON();
    data.completed.push("ghost-node");
    const q = AdventureProgress.fromJSON(toyDef(), data);
    expect(q.completed.has("ghost-node")).toBe(false);
  });

  it("challenge encounters increment challengeSuccesses", () => {
    const p = fresh();
    for (const id of ["start", "a", "choice"]) p.completeEncounter(id);
    p.setRoute("challenge");
    const before = p.challengeSuccesses;
    p.completeEncounter("b2"); // math-challenge
    expect(p.challengeSuccesses).toBe(before + 1);
  });
});

describe("randomized progression fuzz", () => {
  it("100 random valid playthroughs always reach an unlockable sticker", () => {
    for (let t = 0; t < 100; t++) {
      const p = fresh();
      // Random legal walk: repeatedly complete a random available encounter.
      let guard = 0;
      while (guard++ < 50) {
        const options: string[] = [];
        for (const n of toyDef().nodes) {
          if (p.isUnlocked(n.id) && !p.isComplete(n.id) && n.encounter !== "race" && n.encounter !== "reward") {
            options.push(n.id);
          }
        }
        // Reveal secrets when possible so they can be discovered.
        for (const n of toyDef().nodes) {
          if (n.secret) p.revealSecret(n.id);
        }
        if (options.length === 0) break;
        const pick = options[Math.floor(Math.random() * options.length)];
        if (pick === "choice") p.setRoute(Math.random() < 0.5 ? "safe" : "challenge");
        p.completeEncounter(pick);
        p.currentNodeId = pick;
      }
      p.raceCompleted = true;
      // The core invariant: the sticker rule is exactly
      // "race won AND nothing required remains". No path through random
      // valid play can unlock it early or block it when earned.
      expect(p.canUnlockSticker()).toBe(
        p.raceCompleted && p.requiredRemaining().length === 0,
      );
      if (p.requiredRemaining().length === 0) {
        expect(p.tryUnlockSticker()).toBe(true);
        expect(p.stickerUnlocked).toBe(true);
        // Sticky: unlocking twice stays unlocked.
        expect(p.tryUnlockSticker()).toBe(true);
      }
    }
  });

  it("invalid action sequences never corrupt state", () => {
    const p = fresh();
    const ids = ["race", "reward", "d", "nope", "s1", "b2"];
    for (let i = 0; i < 200; i++) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      p.completeEncounter(id);
      p.revealSecret(id);
    }
    // Only legitimately unlocked completions could have landed.
    expect(p.completed.has("race")).toBe(false);
    expect(p.completed.has("d")).toBe(false);
    expect(p.stickerUnlocked).toBe(false);
  });
});
