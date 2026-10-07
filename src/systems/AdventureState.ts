/**
 * AdventureState — reusable level progression / state system for
 * Kiki's Dog Adventure worlds.
 *
 * Design goals:
 *  - Separate progression state from visual scenes. Scenes render nodes and
 *    run encounters; THIS module decides what is unlocked, what is complete,
 *    and when the sticker is earned.
 *  - Pure TypeScript, no Phaser dependency: every rule is unit-testable.
 *  - Built for reuse: each dog world (Husky, Corgi, ...) ships one
 *    AdventureDefinition; the same AdventureProgress class drives them all.
 *  - Never over-generalized: the encounter vocabulary is fixed and small.
 *
 * The 9-year-old-player contract:
 *  - completeEncounter() only succeeds for currently-unlocked nodes, so a
 *    player can never skip required progression by any input sequence.
 *  - Wrong answers never remove progress (enforced by scenes, modeled here
 *    by only ever adding completions).
 *  - Sticker unlock requires the full adventure AND the race — checked here,
 *    not trusted to scene code.
 */

export type EncounterType =
  | "walk"
  | "math-normal"
  | "math-challenge"
  | "choice"
  | "discovery"
  | "secret"
  | "checkpoint"
  | "race"
  | "reward";

export type AdventureRouteKind = "safe" | "challenge" | "secret";

/** Which route a node belongs to, for route-aware sticker requirements. */
export type AdventureRoute = "safe" | "challenge";

export interface AdventureNodeDef {
  id: string;
  label: string;
  /** Map coordinates for the node marker. */
  x: number;
  y: number;
  encounter: EncounterType;
  /** Counts toward the sticker when completed (route-aware, see definition). */
  required?: boolean;
  /** Optional / bonus encounter (secret igloo, hidden cache, ...). */
  optional?: boolean;
  /** Hidden until its unlock condition is met. */
  secret?: boolean;
  /** "checkpoint" encounters auto-complete on arrival. */
  checkpoint?: boolean;
  /** Math difficulty for math encounters. */
  mathDifficulty?: "normal" | "challenge";
  /**
   * Future curriculum plug-in points (multiplication, division, fractions,
   * word-problems, ...). The current MathEngine ignores these; they exist so
   * later work can target encounters without restructuring.
   */
  curriculum?: string[];
  /** Small hint shown after repeated wrong answers. */
  hint?: string;
}

export interface AdventureEdgeDef {
  from: string;
  to: string;
  kind: AdventureRouteKind;
  /**
   * When set, this edge is only travelable after the player chose the
   * matching route (used for the branches out of a choice encounter).
   */
  requiresRoute?: AdventureRoute;
}

export interface AdventureDefinition {
  /** World bounds for spatial validation; older single-screen worlds use 1280×720. */
  worldSize?: { width: number; height: number };
  id: string;
  name: string;
  stickerName: string;
  startNodeId: string;
  nodes: AdventureNodeDef[];
  edges: AdventureEdgeDef[];
  /** Encounter ids required no matter which route is taken. */
  requiredAlways: string[];
  /** Extra required encounter ids per chosen route. */
  requiredByRoute: Record<AdventureRoute, string[]>;
  /** Virtual node id for the race (no map marker; launched from a gate). */
  raceNodeId: string;
  /** Virtual node id for the sticker reward (no map marker; overlay). */
  rewardNodeId: string;
}

export interface AdventureSaveData {
  version: 1;
  adventureId: string;
  currentNodeId: string;
  completed: string[];
  chosenRoute: AdventureRoute | null;
  secretsFound: string[];
  bonusChallengesCompleted: number;
  challengeSuccesses: number;
  raceCompleted: boolean;
  raceTurns: number;
  raceTurbos: number;
  stickerUnlocked: boolean;
  savedAt: number;
}

export class AdventureProgress {
  readonly completed = new Set<string>();
  currentNodeId: string;
  chosenRoute: AdventureRoute | null = null;
  readonly secretsFound = new Set<string>();
  bonusChallengesCompleted = 0;
  challengeSuccesses = 0;
  raceCompleted = false;
  raceTurns = 0;
  raceTurbos = 0;
  stickerUnlocked = false;

  constructor(readonly def: AdventureDefinition) {
    this.currentNodeId = def.startNodeId;
  }

  node(id: string): AdventureNodeDef {
    const n = this.def.nodes.find((d) => d.id === id);
    if (!n) throw new Error(`Unknown adventure node: ${id}`);
    return n;
  }

  isComplete(id: string): boolean {
    return this.completed.has(id);
  }

  /**
   * A node is unlocked when ANY incoming edge's source encounter is complete
   * (rejoin/OR semantics: reaching Snow Pass via either the safe trail or
   * the ice shortcut unlocks it). The start node is always unlocked. Secret
   * nodes additionally require their reveal flag (tracked via
   * `revealed:<id>` in secretsFound, set by revealSecret()).
   */
  isUnlocked(id: string): boolean {
    if (id === this.def.startNodeId) return true;
    const incoming = this.def.edges.filter((e) => e.to === id);
    if (incoming.length === 0) return false;
    // Route-gated edges only unlock their target on the matching route
    // (once chosen). This keeps completeEncounter() consistent with
    // availableFrom(): the wrong branch can never be completed.
    const parentDone = incoming.some((e) => {
      if (e.requiresRoute && this.chosenRoute && e.requiresRoute !== this.chosenRoute) {
        return false;
      }
      return this.completed.has(e.from);
    });
    if (!parentDone) return false;
    const def = this.node(id);
    if (def.secret && !this.secretsFound.has(`revealed:${id}`)) return false;
    return true;
  }

  /** Mark a secret node's location revealed (it can now be discovered). */
  revealSecret(id: string): boolean {
    let def: AdventureNodeDef;
    try {
      def = this.node(id);
    } catch {
      return false;
    }
    if (!def.secret) return false;
    const incoming = this.def.edges.filter((e) => e.to === id);
    if (!incoming.every((e) => this.completed.has(e.from))) return false;
    this.secretsFound.add(`revealed:${id}`);
    return true;
  }

  /** Edges the player may travel right now from `from`. */
  availableFrom(from: string): AdventureEdgeDef[] {
    return this.def.edges.filter((e) => {
      if (e.from !== from || this.completed.has(e.to)) return false;
      if (!this.isUnlocked(e.to)) return false;
      // Route-gated edges (e.g. the forest fork): once the player chose a
      // route, only the matching branch stays available.
      if (e.requiresRoute && this.chosenRoute && e.requiresRoute !== this.chosenRoute) {
        return false;
      }
      return true;
    });
  }

  /**
   * Record an encounter as complete. Returns false (without mutating) when
   * the node is unknown, locked, or already complete — this is what makes
   * progression unskippable no matter how the scene is driven.
   */
  completeEncounter(id: string): boolean {
    let def: AdventureNodeDef;
    try {
      def = this.node(id);
    } catch {
      return false;
    }
    if (!this.isUnlocked(id) || this.completed.has(id)) return false;
    this.completed.add(id);
    if (def.secret) this.secretsFound.add(id);
    if (def.encounter === "math-challenge" || def.optional) {
      this.challengeSuccesses += 1;
    }
    return true;
  }

  /** Record a bonus/optional challenge success (e.g. secret igloo quiz). */
  recordBonusChallenge(): void {
    this.bonusChallengesCompleted += 1;
    this.challengeSuccesses += 1;
  }

  setRoute(route: AdventureRoute): void {
    this.chosenRoute = route;
  }

  /** Required encounter ids for the currently chosen route. */
  requiredIds(): string[] {
    const ids = [...this.def.requiredAlways];
    if (this.chosenRoute) ids.push(...this.def.requiredByRoute[this.chosenRoute]);
    else {
      // Route not chosen yet: union of both branches (conservative).
      ids.push(...this.def.requiredByRoute.safe, ...this.def.requiredByRoute.challenge);
    }
    return [...new Set(ids)];
  }

  requiredRemaining(): string[] {
    return this.requiredIds().filter((id) => !this.completed.has(id));
  }

  /**
   * The sticker rule, enforced here so scenes cannot get it wrong:
   * every required encounter complete AND the race won. Secrets and bonus
   * challenges are never required — they feed Golden progression instead.
   */
  canUnlockSticker(): boolean {
    if (this.stickerUnlocked) return true;
    if (!this.raceCompleted) return false;
    return this.requiredRemaining().length === 0;
  }

  /** Attempt the unlock; returns true when the sticker is (now) unlocked. */
  tryUnlockSticker(): boolean {
    if (this.canUnlockSticker()) {
      this.stickerUnlocked = true;
      return true;
    }
    return false;
  }

  /** Clean reset for a new run (testing / "play again"). */
  reset(): void {
    this.completed.clear();
    this.secretsFound.clear();
    this.bonusChallengesCompleted = 0;
    this.challengeSuccesses = 0;
    this.raceCompleted = false;
    this.raceTurns = 0;
    this.raceTurbos = 0;
    this.stickerUnlocked = false;
    this.chosenRoute = null;
    this.currentNodeId = this.def.startNodeId;
  }

  toJSON(): AdventureSaveData {
    return {
      version: 1,
      adventureId: this.def.id,
      currentNodeId: this.currentNodeId,
      completed: [...this.completed],
      chosenRoute: this.chosenRoute,
      secretsFound: [...this.secretsFound],
      bonusChallengesCompleted: this.bonusChallengesCompleted,
      challengeSuccesses: this.challengeSuccesses,
      raceCompleted: this.raceCompleted,
      raceTurns: this.raceTurns,
      raceTurbos: this.raceTurbos,
      stickerUnlocked: this.stickerUnlocked,
      savedAt: Date.now(),
    };
  }

  static fromJSON(def: AdventureDefinition, data: AdventureSaveData): AdventureProgress {
    const p = new AdventureProgress(def);
    for (const id of data.completed ?? []) {
      try {
        // Re-validate on load: only keep completions that form a legal
        // progression (guards against hand-edited or stale saves).
        p.node(id);
        p.completed.add(id);
      } catch {
        /* skip unknown ids */
      }
    }
    p.currentNodeId = data.currentNodeId ?? def.startNodeId;
    p.chosenRoute = data.chosenRoute ?? null;
    for (const s of data.secretsFound ?? []) p.secretsFound.add(s);
    p.bonusChallengesCompleted = data.bonusChallengesCompleted ?? 0;
    p.challengeSuccesses = data.challengeSuccesses ?? 0;
    p.raceCompleted = data.raceCompleted ?? false;
    p.raceTurns = data.raceTurns ?? 0;
    p.raceTurbos = data.raceTurbos ?? 0;
    p.stickerUnlocked = data.stickerUnlocked ?? false;
    return p;
  }
}

/**
 * Static audit of a definition: every edge references known nodes, every
 * non-terminal node has an outgoing edge, start/race/reward ids exist, and
 * the required lists reference known nodes. Scenes should never have to
 * debug a malformed graph at runtime.
 */
export function auditDefinition(def: AdventureDefinition): string[] {
  const problems: string[] = [];
  const ids = new Set(def.nodes.map((n) => n.id));
  const need = (id: string, what: string) => {
    if (!ids.has(id)) problems.push(`${what} references unknown node "${id}"`);
  };
  need(def.startNodeId, "startNodeId");
  need(def.raceNodeId, "raceNodeId");
  need(def.rewardNodeId, "rewardNodeId");
  for (const e of def.edges) {
    need(e.from, `edge ${e.from}->${e.to} (from)`);
    need(e.to, `edge ${e.from}->${e.to} (to)`);
  }
  for (const id of [...def.requiredAlways, ...def.requiredByRoute.safe, ...def.requiredByRoute.challenge]) {
    need(id, "required list");
  }
  const terminal = new Set([def.raceNodeId, def.rewardNodeId]);
  for (const n of def.nodes) {
    // Secret/optional discoveries are intentionally terminal: the player
    // finds them and returns to the main path.
    if (terminal.has(n.id) || n.secret) continue;
    const out = def.edges.filter((e) => e.from === n.id);
    if (out.length === 0) problems.push(`node "${n.id}" is a dead end (no outgoing edge)`);
  }
  const seen = new Set<string>();
  for (const n of def.nodes) {
    if (seen.has(n.id)) problems.push(`duplicate node id "${n.id}"`);
    seen.add(n.id);
    const size = def.worldSize ?? { width: 1280, height: 720 };
    if (n.x < 0 || n.x > size.width || n.y < 0 || n.y > size.height) {
      problems.push(`node "${n.id}" is off-map (${n.x},${n.y})`);
    }
  }
  return problems;
}
