import { describe, expect, it } from "vitest";
import { AdventureProgress, auditDefinition } from "../AdventureState";
import { HUSKY_ADVENTURE, kikiTargetFor, LANDMARK_FOR } from "../HuskyAdventure";

function fresh() {
  return new AdventureProgress(HUSKY_ADVENTURE);
}

/** Drive a full legal playthrough on one route, optionally with secrets. */
function playthrough(route: "safe" | "challenge", secrets: boolean): AdventureProgress {
  const p = fresh();
  const done = (id: string) => {
    expect(p.completeEncounter(id), `could not complete ${id}`).toBe(true);
    p.currentNodeId = id;
  };
  done("trailhead");
  done("broken-bridge");
  done("forest");
  p.setRoute(route);
  if (route === "safe") {
    done("frozen-lake");
    done("fallen-tree");
  } else {
    done("ice-cave");
  }
  done("snow-pass");
  if (secrets) {
    expect(p.revealSecret("secret-igloo")).toBe(true);
    done("secret-igloo");
    p.recordBonusChallenge();
    expect(p.revealSecret("snow-cache")).toBe(true);
    done("snow-cache");
    p.currentNodeId = "snow-pass";
  }
  done("summit-camp");
  // Race: unlocked only after the summit encounter.
  expect(p.isUnlocked("sled-race")).toBe(true);
  p.raceCompleted = true;
  p.raceTurns = 4;
  done("sled-race");
  // The reward screen attempts the unlock (mirrors HuskyScene behavior).
  p.tryUnlockSticker();
  return p;
}

describe("Husky definition audit", () => {
  it("validates the scrolling world bounds without accepting off-world nodes", () => {
    expect(HUSKY_ADVENTURE.worldSize).toEqual({ width: 3360, height: 720 });
    const invalid = { ...HUSKY_ADVENTURE, nodes: HUSKY_ADVENTURE.nodes.map((n) =>
      n.id === "forest" ? { ...n, x: 3361 } : n) };
    expect(auditDefinition(invalid)).toContain('node "forest" is off-map (3361,520)');
  });
  it("passes the static graph audit", () => {
    expect(auditDefinition(HUSKY_ADVENTURE)).toEqual([]);
  });

  it("every node has a landmark mapping entry", () => {
    for (const n of HUSKY_ADVENTURE.nodes) {
      expect(n.id in LANDMARK_FOR, `missing landmark mapping for ${n.id}`).toBe(true);
    }
  });

  it("every node has a Kiki stand offset", () => {
    for (const n of HUSKY_ADVENTURE.nodes) {
      if (n.encounter === "race" || n.encounter === "reward") continue;
      const t = kikiTargetFor(n);
      expect(Number.isFinite(t.x) && Number.isFinite(t.y)).toBe(true);
    }
  });

  it("map markers keep a healthy minimum distance (no overlap)", () => {
    const pts = HUSKY_ADVENTURE.nodes.filter(
      (n) => n.encounter !== "race" && n.encounter !== "reward",
    );
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        expect(d, `${pts[i].id} vs ${pts[j].id}`).toBeGreaterThan(90);
      }
    }
  });
});

describe("encounter budget (the anti-worksheet check)", () => {
  it("has 5–7 required encounters before the sticker", () => {
    const p = fresh();
    p.setRoute("safe");
    const safeCount = p.requiredIds().length + 1; // + race node
    const q = fresh();
    q.setRoute("challenge");
    const challengeCount = q.requiredIds().length + 1;
    expect(safeCount).toBeGreaterThanOrEqual(5);
    expect(safeCount).toBeLessThanOrEqual(7);
    expect(challengeCount).toBeGreaterThanOrEqual(5);
    expect(challengeCount).toBeLessThanOrEqual(7);
  });

  it("has 2–3 optional/challenge encounters", () => {
    const optional = HUSKY_ADVENTURE.nodes.filter((n) => n.optional);
    // secret igloo, bone cache (+ ice-cave counts as the challenge encounter)
    expect(optional.length).toBeGreaterThanOrEqual(2);
    expect(optional.length).toBeLessThanOrEqual(3);
  });

  it("not every encounter is a math popup (60/40 rhythm)", () => {
    const nodes = HUSKY_ADVENTURE.nodes.filter(
      (n) => n.encounter !== "race" && n.encounter !== "reward",
    );
    const math = nodes.filter((n) => n.encounter.startsWith("math")).length;
    const play = nodes.length - math;
    // Exploration/gameplay should be the clear majority of encounters.
    expect(play).toBeGreaterThan(math);
  });

  it("every math encounter declares a curriculum plug-in point", () => {
    for (const n of HUSKY_ADVENTURE.nodes) {
      if (n.encounter.startsWith("math")) {
        expect(n.curriculum?.length ?? 0, n.id).toBeGreaterThan(0);
      }
    }
  });
});

describe("full playthroughs", () => {
  it("safe path: sticker unlocks after adventure + race", () => {
    const p = playthrough("safe", false);
    expect(p.requiredRemaining()).toEqual([]);
    expect(p.tryUnlockSticker()).toBe(true);
  });

  it("challenge path: sticker unlocks after adventure + race", () => {
    const p = playthrough("challenge", false);
    expect(p.requiredRemaining()).toEqual([]);
    expect(p.tryUnlockSticker()).toBe(true);
  });

  it("secrets + bonus challenge: golden progress tracked, sticker still unlocks", () => {
    const p = playthrough("safe", true);
    expect(p.secretsFound.has("secret-igloo")).toBe(true);
    expect(p.secretsFound.has("snow-cache")).toBe(true);
    expect(p.bonusChallengesCompleted).toBe(1);
    expect(p.tryUnlockSticker()).toBe(true);
  });

  it("cannot reach the race without the summit encounter (no skipping)", () => {
    const p = fresh();
    p.completeEncounter("trailhead");
    p.completeEncounter("broken-bridge");
    expect(p.isUnlocked("sled-race")).toBe(false);
    expect(p.completeEncounter("sled-race")).toBe(false);
  });

  it("cannot unlock the sticker after just two questions (regression)", () => {
    const p = fresh();
    p.completeEncounter("trailhead");
    p.completeEncounter("broken-bridge");
    p.raceCompleted = true; // even cheating the race flag…
    expect(p.canUnlockSticker()).toBe(false);
    expect(p.requiredRemaining().length).toBeGreaterThan(0);
  });

  it("wrong route branch is unreachable after choosing", () => {
    const p = fresh();
    p.completeEncounter("trailhead");
    p.completeEncounter("broken-bridge");
    p.completeEncounter("forest");
    p.setRoute("safe");
    // The challenge branch is route-gated out of the available choices.
    expect(p.availableFrom("forest").map((e) => e.to)).toEqual(["frozen-lake"]);
    // …and direct completion is refused (parent incomplete for the walk).
    expect(p.completeEncounter("ice-cave")).toBe(false);
  });

  it("replay after completion: reset returns to a clean state", () => {
    const p = playthrough("safe", true);
    expect(p.stickerUnlocked).toBe(true);
    p.reset();
    expect(p.stickerUnlocked).toBe(false);
    expect(p.completed.size).toBe(0);
    expect(p.isUnlocked("trailhead")).toBe(true);
    expect(p.isUnlocked("broken-bridge")).toBe(false);
  });
});

describe("Husky graph fuzz", () => {
  it("200 random walks never corrupt state or unlock early", () => {
    const ids = HUSKY_ADVENTURE.nodes.map((n) => n.id);
    for (let t = 0; t < 200; t++) {
      const p = fresh();
      for (let i = 0; i < 60; i++) {
        const id = ids[Math.floor(Math.random() * ids.length)];
        if (id === "forest" && Math.random() < 0.5) {
          p.setRoute(Math.random() < 0.5 ? "safe" : "challenge");
        }
        if (Math.random() < 0.2) p.revealSecret(id);
        p.completeEncounter(id);
        if (Math.random() < 0.1) p.recordBonusChallenge();
      }
      // The sticker rule is exact: race won AND nothing required remains.
      expect(p.canUnlockSticker()).toBe(p.raceCompleted && p.requiredRemaining().length === 0);
      // Secrets can never satisfy required encounters.
      if (!p.raceCompleted) expect(p.stickerUnlocked).toBe(false);
    }
  });

  it("every required encounter is reachable on both routes", () => {
    for (const route of ["safe", "challenge"] as const) {
      const p = fresh();
      p.setRoute(route);
      // BFS over unlockable nodes from the start.
      const reachable = new Set<string>(["trailhead"]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const n of HUSKY_ADVENTURE.nodes) {
          if (reachable.has(n.id)) continue;
          const saved = new Set(p.completed);
          for (const r of reachable) p.completed.add(r);
          if (p.isUnlocked(n.id)) {
            reachable.add(n.id);
            grew = true;
          }
          p.completed.clear();
          for (const r of saved) p.completed.add(r);
        }
      }
      for (const id of p.requiredIds()) {
        expect(reachable.has(id), `${id} unreachable on ${route} route`).toBe(true);
      }
    }
  });
});
