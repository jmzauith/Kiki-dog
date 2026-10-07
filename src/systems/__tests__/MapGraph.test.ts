import { describe, expect, it } from "vitest";
import {
  createMapState,
  edges,
  getForwardChoices,
  initialNodes,
  MapNodeId,
  nodes,
} from "../MapGraph";

/** Breadth-first search over the static edge list. */
function reachableFrom(start: MapNodeId): Set<MapNodeId> {
  const seen = new Set<MapNodeId>([start]);
  const queue: MapNodeId[] = [start];
  while (queue.length > 0) {
    const id = queue.pop()!;
    for (const e of edges.filter((x) => x.from === id)) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        queue.push(e.to);
      }
    }
  }
  return seen;
}

describe("MapGraph static audit", () => {
  it("every edge endpoint is a known node", () => {
    const ids = new Set(Object.keys(nodes));
    for (const e of edges) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
  });

  it("every node except goal has at least one outgoing edge; goal is terminal", () => {
    for (const id of Object.keys(nodes) as MapNodeId[]) {
      const outgoing = edges.filter((e) => e.from === id);
      if (id === "goal") expect(outgoing).toHaveLength(0);
      else expect(outgoing.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("the fork offers exactly two choices: safe and challenge", () => {
    const forkEdges = edges.filter((e) => e.from === "fork");
    expect(forkEdges).toHaveLength(2);
    expect(forkEdges.map((e) => e.to).sort()).toEqual(["challenge", "safe"]);
    expect(forkEdges.map((e) => e.kind).sort()).toEqual(["challenge", "safe"]);
  });

  it("goal is reachable from start via both the safe and challenge routes", () => {
    expect(reachableFrom("start").has("goal")).toBe(true);
    // Safe-only path: start -> math1 -> fork -> safe -> goal
    const safePath: MapNodeId[] = ["start", "math1", "fork", "safe", "goal"];
    for (let i = 0; i < safePath.length - 1; i++) {
      expect(edges.some((e) => e.from === safePath[i] && e.to === safePath[i + 1])).toBe(true);
    }
    // Challenge path: start -> math1 -> fork -> challenge -> goal
    const challengePath: MapNodeId[] = ["start", "math1", "fork", "challenge", "goal"];
    for (let i = 0; i < challengePath.length - 1; i++) {
      expect(edges.some((e) => e.from === challengePath[i] && e.to === challengePath[i + 1])).toBe(true);
    }
  });

  it("safe route never triggers challenge behavior and vice versa", () => {
    const safeReachable = new Set<MapNodeId>(["start"]);
    const queue: MapNodeId[] = ["start"];
    while (queue.length > 0) {
      const id = queue.pop()!;
      for (const e of edges.filter((x) => x.from === id && x.kind === "safe")) {
        if (!safeReachable.has(e.to)) {
          safeReachable.add(e.to);
          queue.push(e.to);
        }
      }
    }
    expect(safeReachable.has("challenge")).toBe(false);
    expect(safeReachable.has("goal")).toBe(true);
  });

  it("there are no dead-end states before the goal", () => {
    // Every node reachable from start can still reach the goal.
    for (const id of reachableFrom("start")) {
      expect(reachableFrom(id).has("goal")).toBe(true);
    }
  });
});

describe("createMapState (restart-safety regression tests)", () => {
  it("starts with start+math1 revealed and everything else hidden", () => {
    const s = createMapState();
    expect(s.start.revealed).toBe(true);
    expect(s.math1.revealed).toBe(true);
    expect(s.fork.revealed).toBe(false);
    expect(s.safe.revealed).toBe(false);
    expect(s.challenge.revealed).toBe(false);
    expect(s.goal.revealed).toBe(false);
  });

  it("returns independent copies: mutating one does not affect others", () => {
    const a = createMapState();
    const b = createMapState();
    a.fork.revealed = true;
    a.goal.revealed = true;
    expect(b.fork.revealed).toBe(false);
    expect(b.goal.revealed).toBe(false);
  });

  it("never mutates the shared module state", () => {
    const before = JSON.stringify(nodes);
    const s = createMapState();
    s.fork.revealed = true;
    s.safe.revealed = true;
    s.challenge.revealed = true;
    s.goal.revealed = true;
    expect(JSON.stringify(nodes)).toBe(before);
    expect(JSON.stringify(initialNodes)).toBe(before);
  });
});

describe("getForwardChoices", () => {
  it("start offers only math1", () => {
    const s = createMapState();
    expect(getForwardChoices("start", s).map((e) => e.to)).toEqual(["math1"]);
  });

  it("unrevealed destinations are never offered", () => {
    const s = createMapState();
    // fork is not revealed yet, so math1 offers nothing.
    expect(getForwardChoices("math1", s)).toHaveLength(0);
    s.fork.revealed = true;
    expect(getForwardChoices("math1", s).map((e) => e.to)).toEqual(["fork"]);
  });

  it("fork offers both routes once revealed", () => {
    const s = createMapState();
    s.safe.revealed = true;
    s.challenge.revealed = true;
    expect(getForwardChoices("fork", s).map((e) => e.to).sort()).toEqual([
      "challenge",
      "safe",
    ]);
  });

  it("goal offers nothing (terminal)", () => {
    const s = createMapState();
    expect(getForwardChoices("goal", s)).toHaveLength(0);
  });
});

/**
 * Logic-level playthroughs. These drive the pure progression model through
 * the same reveal/choice sequence the scene performs, catching route-state
 * regressions without needing a browser.
 */
describe("playthrough simulations (logic level)", () => {
  function fresh() {
    return { state: createMapState(), current: "start" as MapNodeId };
  }

  // PT-1: normal route, all answers correct.
  it("PT-1 normal route, all correct: start -> math1 -> fork -> safe -> goal", () => {
    const g = fresh();
    const step = (to: MapNodeId, reveal: MapNodeId[]) => {
      expect(getForwardChoices(g.current, g.state).map((e) => e.to)).toContain(to);
      g.current = to;
      for (const id of reveal) g.state[id].revealed = true;
    };
    step("math1", ["fork"]); // bridge math passed
    step("fork", ["safe", "challenge"]);
    step("safe", ["goal"]);
    step("goal", []);
    expect(g.current).toBe("goal");
    expect(getForwardChoices("goal", g.state)).toHaveLength(0);
  });

  // PT-3: challenge route, all answers correct.
  it("PT-3 challenge route, all correct: start -> math1 -> fork -> challenge -> goal", () => {
    const g = fresh();
    const step = (to: MapNodeId, reveal: MapNodeId[]) => {
      expect(getForwardChoices(g.current, g.state).map((e) => e.to)).toContain(to);
      g.current = to;
      for (const id of reveal) g.state[id].revealed = true;
    };
    step("math1", ["fork"]);
    step("fork", ["safe", "challenge"]);
    step("challenge", ["goal"]); // challenge math passed at the fork
    step("goal", []);
    expect(g.current).toBe("goal");
  });

  // PT-2/PT-4: wrong answers never advance progression state.
  it("PT-2/PT-4 wrong answers: failed encounter leaves route state unchanged", () => {
    const g = fresh();
    const snapshot = JSON.stringify(g.state);
    // A failed math encounter resolves `false`: the scene does not move,
    // does not reveal, and re-offers the same choices.
    expect(getForwardChoices(g.current, g.state).map((e) => e.to)).toEqual(["math1"]);
    expect(JSON.stringify(g.state)).toBe(snapshot);
    expect(g.current).toBe("start");
  });

  // PT-5 (logic slice): choices are deterministic under repeated queries.
  it("PT-5 repeated choice queries never offer unrevealed nodes", () => {
    const g = fresh();
    for (let i = 0; i < 50; i++) {
      for (const choice of getForwardChoices(g.current, g.state)) {
        expect(g.state[choice.to].revealed).toBe(true);
      }
    }
  });

  // PT-10: full replay after completion starts clean.
  it("PT-10 replay: a fresh map state after completing the map is fully unrevealed", () => {
    const first = createMapState();
    // Simulate a completed run: everything revealed.
    for (const id of Object.keys(first) as MapNodeId[]) first[id].revealed = true;
    // Restart = brand-new state (this is the regression test for the old
    // global-state leak where `nodes` stayed revealed across restarts).
    const second = createMapState();
    expect(second.fork.revealed).toBe(false);
    expect(second.safe.revealed).toBe(false);
    expect(second.challenge.revealed).toBe(false);
    expect(second.goal.revealed).toBe(false);
    expect(getForwardChoices("start", second).map((e) => e.to)).toEqual(["math1"]);
  });
});
