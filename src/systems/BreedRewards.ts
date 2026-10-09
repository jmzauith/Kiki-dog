/**
 * BreedRewards — standalone reward & mastery logic for Kiki's Dog Adventure.
 *
 * Two sticker tracks per breed:
 *  - NORMAL sticker: earned by FINISHING the adventure — all required
 *    encounters (route-aware) completed AND the sled race won. Optional
 *    challenges and secrets NEVER block the normal sticker.
 *  - GOLDEN sticker: mastery track for curious players. Mastery points come
 *    from exploration and retry-friendly achievements (secrets, bonus
 *    challenges, challenge math, turbo race turns, quiz mastery, replays).
 *    Golden requires the normal sticker first, so it can never unlock
 *    accidentally early — but it must stay earnable by a 9-year-old through
 *    a realistic path, never perfection-only.
 *
 * Design rules:
 *  - Pure TypeScript, no Phaser, no scene imports: every rule is unit-testable
 *    and the module compiles standalone against current main (it does NOT
 *    depend on AdventureState/AdventurePersistence, which live in an unmerged
 *    PR — the reward state is driven by plain encounter/secret ids that the
 *    scenes already know).
 *  - Reusable across breeds: each dog world ships one BreedRewardDefinition;
 *    the same BreedRewardState class drives them all. The Husky is just the
 *    first instance (see HuskyRewards.ts).
 *  - Wrong answers never remove progress: every record*() method only ever
 *    ADDS. All recording is idempotent — repeating an event never corrupts
 *    state or double-counts points.
 *  - Persistence follows the AdventurePersistence approach (versioned JSON in
 *    sessionStorage, injectable store, defensive reads) without importing it.
 */
export type AdventureRoute = "safe" | "challenge";

/** Locked, or unlocked by the call that just happened, or unlocked earlier. */
export type StickerState = "locked" | "newly-unlocked" | "already-unlocked";

export interface StickerUnlockResult {
  normalSticker: StickerState;
  goldenSticker: StickerState;
  masteryPoints: number;
  pointsToGolden: number;
}

/** An optional discovery (Secret Igloo, Bone Cache, ...). */
export interface SecretDef {
  id: string;
  label: string;
  /** Mastery points awarded once when found. */
  points: number;
}

/** An optional harder challenge (Ice Cave shortcut, ...). */
export interface BonusChallengeDef {
  id: string;
  label: string;
  /** Mastery points awarded once when completed. */
  points: number;
}

/** Repeatable-event point values and caps. Caps keep grinding bounded. */
export interface MasteryPointsConfig {
  /** Points per UNIQUE challenge-difficulty math encounter cleared. */
  challengeMathSuccessPoints: number;
  challengeMathSuccessCap: number;
  /** Points per race turn won with Turbo. */
  turboSuccessPoints: number;
  turboSuccessCap: number;
  /** Max points from the breed quiz (scaled by score 0..1). Hook for later. */
  quizMaxPoints: number;
  /** Points per completed full replay of the adventure. */
  replayPoints: number;
  replayCap: number;
}

export interface BreedRewardDefinition {
  breedId: string;
  breedName: string;
  stickerName: string;
  goldenStickerName: string;
  /** Encounter ids required no matter which route is taken. */
  requiredAlways: string[];
  /** Extra required encounter ids per chosen route. */
  requiredByRoute: Record<AdventureRoute, string[]>;
  secrets: SecretDef[];
  bonusChallenges: BonusChallengeDef[];
  points: MasteryPointsConfig;
  /** Mastery points needed for the golden sticker (after normal is earned). */
  goldenThreshold: number;
}

/** Minimal storage interface — structurally identical to AdventurePersistence's. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_VERSION = 1;

interface BreedRewardSaveData {
  version: 1;
  breedId: string;
  chosenRoute: AdventureRoute | null;
  completedRequired: string[];
  raceWon: boolean;
  secretsFound: string[];
  bonusChallengesCompleted: string[];
  challengeMathEncounters: string[];
  turboSuccesses: number;
  quizMastery: number;
  replaysCompleted: number;
  normalStickerUnlocked: boolean;
  goldenStickerUnlocked: boolean;
  savedAt: number;
}

export class BreedRewardState {
  readonly breedId: string;
  chosenRoute: AdventureRoute | null = null;
  readonly completedRequired = new Set<string>();
  raceWon = false;
  readonly secretsFound = new Set<string>();
  readonly bonusChallengesCompleted = new Set<string>();
  /** Unique challenge-difficulty encounters cleared (idempotent). */
  readonly challengeMathEncounters = new Set<string>();
  turboSuccesses = 0;
  /** 0..1 — hook for the future breed quiz. */
  quizMastery = 0;
  replaysCompleted = 0;
  normalStickerUnlocked = false;
  goldenStickerUnlocked = false;

  constructor(readonly def: BreedRewardDefinition) {
    this.breedId = def.breedId;
  }

  // ------------------------------------------------------------ recording

  /** Record the route chosen at the fork (needed for route-aware requirements). */
  setRoute(route: AdventureRoute): StickerUnlockResult {
    this.chosenRoute = route;
    return this.checkUnlocks();
  }

  /** Record a required encounter as complete. Unknown ids are ignored. */
  recordRequired(encounterId: string): StickerUnlockResult {
    if (this.isRequiredEncounter(encounterId)) {
      this.completedRequired.add(encounterId);
    }
    return this.checkUnlocks();
  }

  /**
   * Record a sled-race win. turbosWon counts race turns won with Turbo
   * (mastery points, capped). The win itself is idempotent, and turbo
   * successes are only counted from the first win report, so a scene that
   * reports the win twice (e.g. after a restart) can never inflate points.
   */
  recordRaceWon(turbosWon = 0): StickerUnlockResult {
    if (!this.raceWon) {
      this.raceWon = true;
      this.turboSuccesses += Math.max(0, Math.floor(turbosWon));
    }
    return this.checkUnlocks();
  }

  /** Record an optional secret discovery. Unknown ids are ignored. */
  recordSecretFound(secretId: string): StickerUnlockResult {
    if (this.def.secrets.some((s) => s.id === secretId)) {
      this.secretsFound.add(secretId);
    }
    return this.checkUnlocks();
  }

  /** Record an optional bonus challenge completion. Unknown ids ignored. */
  recordBonusChallenge(challengeId: string): StickerUnlockResult {
    if (this.def.bonusChallenges.some((c) => c.id === challengeId)) {
      this.bonusChallengesCompleted.add(challengeId);
    }
    return this.checkUnlocks();
  }

  /**
   * Record clearing a challenge-difficulty math encounter. Counts each unique
   * encounter once (retries don't inflate points — wrong answers never
   * punish, but they don't farm points either).
   */
  recordChallengeMathSuccess(encounterId: string): StickerUnlockResult {
    this.challengeMathEncounters.add(encounterId);
    return this.checkUnlocks();
  }

  /** Future breed-quiz hook: score is 0..1, clamped. */
  recordQuizMastery(score01: number): StickerUnlockResult {
    const s = Math.max(0, Math.min(1, score01));
    if (s > this.quizMastery) this.quizMastery = s;
    return this.checkUnlocks();
  }

  /**
   * Record a completed full replay (adventure finished again after the first
   * completion). Re-recording required encounters stays idempotent, so replays
   * can never corrupt state.
   */
  recordReplay(): StickerUnlockResult {
    this.replaysCompleted += 1;
    return this.checkUnlocks();
  }

  /** Wipe all progress for a clean new run (keeps the breed definition). */
  reset(): void {
    this.chosenRoute = null;
    this.completedRequired.clear();
    this.raceWon = false;
    this.secretsFound.clear();
    this.bonusChallengesCompleted.clear();
    this.challengeMathEncounters.clear();
    this.turboSuccesses = 0;
    this.quizMastery = 0;
    this.replaysCompleted = 0;
    this.normalStickerUnlocked = false;
    this.goldenStickerUnlocked = false;
  }

  // ------------------------------------------------------------ queries

  /** Encounter ids required for the currently chosen route (or always-only). */
  requiredForRoute(): string[] {
    const ids = [...this.def.requiredAlways];
    if (this.chosenRoute) ids.push(...this.def.requiredByRoute[this.chosenRoute]);
    return ids;
  }

  isRequiredEncounter(encounterId: string): boolean {
    return (
      this.def.requiredAlways.includes(encounterId) ||
      this.def.requiredByRoute.safe.includes(encounterId) ||
      this.def.requiredByRoute.challenge.includes(encounterId)
    );
  }

  /** Normal sticker rule: required encounters (route-aware) + race won. */
  normalRequirementsMet(): boolean {
    if (!this.raceWon) return false;
    const required = this.requiredForRoute();
    // A route must be chosen before the sticker can unlock: without it we
    // can't know which branch's encounters count, so we never guess.
    if (!this.chosenRoute) return false;
    return required.every((id) => this.completedRequired.has(id));
  }

  masteryPoints(): number {
    const cfg = this.def.points;
    let pts = 0;
    for (const s of this.def.secrets) {
      if (this.secretsFound.has(s.id)) pts += s.points;
    }
    for (const c of this.def.bonusChallenges) {
      if (this.bonusChallengesCompleted.has(c.id)) pts += c.points;
    }
    pts +=
      Math.min(this.challengeMathEncounters.size, cfg.challengeMathSuccessCap) *
      cfg.challengeMathSuccessPoints;
    pts +=
      Math.min(this.turboSuccesses, cfg.turboSuccessCap) * cfg.turboSuccessPoints;
    pts += Math.round(this.quizMastery * cfg.quizMaxPoints);
    pts += Math.min(this.replaysCompleted, cfg.replayCap) * cfg.replayPoints;
    return pts;
  }

  pointsToGolden(): number {
    return Math.max(0, this.def.goldenThreshold - this.masteryPoints());
  }

  // ------------------------------------------------------------ internals

  /**
   * Evaluate sticker unlocks. Golden additionally requires the normal
   * sticker — mastery points alone can never unlock it early.
   */
  private checkUnlocks(): StickerUnlockResult {
    let normal: StickerState = this.normalStickerUnlocked
      ? "already-unlocked"
      : "locked";
    if (!this.normalStickerUnlocked && this.normalRequirementsMet()) {
      this.normalStickerUnlocked = true;
      normal = "newly-unlocked";
    }
    let golden: StickerState = this.goldenStickerUnlocked
      ? "already-unlocked"
      : "locked";
    if (
      !this.goldenStickerUnlocked &&
      this.normalStickerUnlocked &&
      this.masteryPoints() >= this.def.goldenThreshold
    ) {
      this.goldenStickerUnlocked = true;
      golden = "newly-unlocked";
    }
    const pts = this.masteryPoints();
    return {
      normalSticker: normal,
      goldenSticker: golden,
      masteryPoints: pts,
      pointsToGolden: Math.max(0, this.def.goldenThreshold - pts),
    };
  }

  // ------------------------------------------------------------ serialization

  toJSON(): BreedRewardSaveData {
    return {
      version: SAVE_VERSION,
      breedId: this.breedId,
      chosenRoute: this.chosenRoute,
      completedRequired: [...this.completedRequired],
      raceWon: this.raceWon,
      secretsFound: [...this.secretsFound],
      bonusChallengesCompleted: [...this.bonusChallengesCompleted],
      challengeMathEncounters: [...this.challengeMathEncounters],
      turboSuccesses: this.turboSuccesses,
      quizMastery: this.quizMastery,
      replaysCompleted: this.replaysCompleted,
      normalStickerUnlocked: this.normalStickerUnlocked,
      goldenStickerUnlocked: this.goldenStickerUnlocked,
      savedAt: Date.now(),
    };
  }

  static fromJSON(def: BreedRewardDefinition, data: BreedRewardSaveData): BreedRewardState {
    if (!data || data.version !== SAVE_VERSION || data.breedId !== def.breedId) {
      throw new Error("Incompatible reward save data");
    }
    const s = new BreedRewardState(def);
    if (data.chosenRoute === "safe" || data.chosenRoute === "challenge") {
      s.chosenRoute = data.chosenRoute;
    }
    const strArray = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    for (const id of strArray(data.completedRequired)) {
      if (s.isRequiredEncounter(id)) s.completedRequired.add(id);
    }
    s.raceWon = data.raceWon === true;
    const secretIds = new Set(def.secrets.map((x) => x.id));
    for (const id of strArray(data.secretsFound)) {
      if (secretIds.has(id)) s.secretsFound.add(id);
    }
    const challengeIds = new Set(def.bonusChallenges.map((x) => x.id));
    for (const id of strArray(data.bonusChallengesCompleted)) {
      if (challengeIds.has(id)) s.bonusChallengesCompleted.add(id);
    }
    for (const id of strArray(data.challengeMathEncounters)) {
      s.challengeMathEncounters.add(id);
    }
    s.turboSuccesses = Math.max(0, Math.floor(Number(data.turboSuccesses) || 0));
    const q = Number(data.quizMastery);
    s.quizMastery = Number.isFinite(q) ? Math.max(0, Math.min(1, q)) : 0;
    s.replaysCompleted = Math.max(0, Math.floor(Number(data.replaysCompleted) || 0));
    // Re-derive unlock flags from the restored facts rather than trusting the
    // save: a hand-edited save can never grant a sticker the facts don't earn.
    s.normalStickerUnlocked = false;
    s.goldenStickerUnlocked = false;
    s.checkUnlocks();
    return s;
  }
}

// ------------------------------------------------------------ persistence

function defaultStore(): StorageLike | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    /* non-browser or blocked storage */
  }
  return null;
}

/** Persist reward state. Returns false when storage is unavailable. */
export function saveRewards(
  key: string,
  state: BreedRewardState,
  store: StorageLike | null = defaultStore(),
): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(state.toJSON()));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load persisted reward state for a breed definition. Returns null when there
 * is no save, the save is corrupt, the version is unknown, or the save
 * belongs to a different breed.
 */
export function loadRewards(
  key: string,
  def: BreedRewardDefinition,
  store: StorageLike | null = defaultStore(),
): BreedRewardState | null {
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let data: BreedRewardSaveData;
  try {
    data = JSON.parse(raw) as BreedRewardSaveData;
  } catch {
    return null;
  }
  try {
    return BreedRewardState.fromJSON(def, data);
  } catch {
    return null;
  }
}

/** Player-safe reset: wipes the reward save so the next run starts clean. */
export function clearRewards(
  key: string,
  store: StorageLike | null = defaultStore(),
): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** In-memory StorageLike for tests (and for environments without storage). */
export function memoryStore(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}
