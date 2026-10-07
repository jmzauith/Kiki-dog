/**
 * GoldenKiki — the endgame of Kiki's Dog Adventure.
 *
 * THE UNAMBIGUOUS FLOW (João's law):
 *   1. Complete all 12 breed adventures → 12 NORMAL stickers = collection complete.
 *   2. Collection complete unlocks the Ultimate Corgi Quiz.
 *   3. Pass the Ultimate Corgi Quiz → Golden Kiki Sticker (one-time, permanent).
 *
 * Golden breed mastery stickers are prestigious bonuses and NEVER block the
 * true ending — they are irrelevant to every gate below.
 *
 * Kiki (the corgi) is NOT one of the 12 collectible breeds. She is the
 * special final completion reward.
 *
 * Design rules:
 *  - Pure TypeScript, zero imports. Gate states are RE-DERIVED from facts
 *    on load (like BreedRewardState), never trusted from the save — a
 *    hand-edited save can never grant Golden Kiki early.
 *  - Idempotent: re-recording a quiz pass or re-checking the unlock can
 *    never corrupt state or double-award.
 *  - Persistence follows the established pattern (versioned JSON in
 *    sessionStorage, injectable store, defensive reads) under its own key —
 *    it never touches AdventurePersistence / BreedReward / quiz saves.
 */

import { BreedRegistry } from "./BreedRegistry";
import { CollectionProgress } from "./CollectionProgress";

/** Endgame phases, for UI gating. */
export type EndgamePhase =
  | "collecting" // still earning the 12 normal stickers
  | "quiz-unlocked" // collection complete, Ultimate Corgi Quiz available
  | "golden-kiki"; // quiz passed — Golden Kiki earned (terminal)

export interface UltimateQuizConfig {
  /** Questions per final session. */
  questionsPerSession: number;
  /** First-try accuracy 0..1 needed to pass. */
  passThreshold: number;
}

/**
 * Why 4/5 (0.8): it matches the BreedQuiz engine's mastery semantics
 * (first-try accuracy, threshold 0.8), so the final quiz feels like the
 * same game the child already knows — just the hardest round. Retries are
 * free and unlimited, so a miss never punishes; the child replays until
 * they know it. 80% first-try is a genuine final challenge for a 9-year-old
 * without demanding perfection or obscure trivia.
 */
export const ULTIMATE_CORGI_QUIZ_CONFIG: UltimateQuizConfig = {
  questionsPerSession: 5,
  passThreshold: 0.8,
};

/** Storage key — coexists with adventure/reward/quiz saves, never overlaps. */
export const GOLDEN_KIKI_SAVE_KEY = "kiki-dog:golden-kiki:v1";

const SAVE_VERSION = 1;

/** Minimal storage interface — structurally identical to the other systems. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface GoldenKikiSaveData {
  version: 1;
  collection: Record<string, unknown>;
  ultimateQuizCompleted: boolean;
  ultimateQuizBest: number;
  savedAt: number;
}

export interface UltimateQuizResult {
  /** Was this attempt a pass (>= threshold)? */
  passed: boolean;
  /** Did THIS call newly unlock Golden Kiki? */
  goldenKikiNewlyUnlocked: boolean;
  goldenKikiUnlocked: boolean;
  masteryPercent: number;
}

export class UltimateRewardState {
  readonly collection: CollectionProgress;
  readonly quizConfig: UltimateQuizConfig;
  /** Has the Ultimate Corgi Quiz ever been passed (best attempt >= threshold). */
  ultimateQuizCompleted = false;
  /** Best ultimate-quiz masteryPercent 0..1 across attempts. */
  ultimateQuizBest = 0;

  constructor(
    registry: BreedRegistry = new BreedRegistry(),
    quizConfig: UltimateQuizConfig = ULTIMATE_CORGI_QUIZ_CONFIG,
  ) {
    this.collection = new CollectionProgress(registry);
    this.quizConfig = { ...quizConfig };
  }

  // ------------------------------------------------------------ recording

  /** Feed per-breed progress in (Lennon wires this from BreedRewardState). */
  recordBreed(
    breedId: string,
    partial: {
      adventureCompleted?: boolean;
      normalStickerUnlocked?: boolean;
      goldenStickerUnlocked?: boolean;
      quizMastery?: number;
    },
  ): void {
    this.collection.recordBreed(breedId, partial);
  }

  /**
   * Record a finished Ultimate Corgi Quiz attempt. masteryPercent is 0..1
   * (first-try accuracy, same semantics as the breed quiz engine). Best is
   * kept; a pass is permanent once earned. Safe to call repeatedly.
   */
  recordUltimateQuizResult(masteryPercent: number): UltimateQuizResult {
    const m =
      typeof masteryPercent === "number" && Number.isFinite(masteryPercent)
        ? Math.max(0, Math.min(1, masteryPercent))
        : 0;
    const wasUnlocked = this.goldenKikiUnlocked;
    if (m > this.ultimateQuizBest) this.ultimateQuizBest = m;
    if (m >= this.quizConfig.passThreshold) this.ultimateQuizCompleted = true;
    const nowUnlocked = this.goldenKikiUnlocked;
    return {
      passed: m >= this.quizConfig.passThreshold,
      goldenKikiNewlyUnlocked: !wasUnlocked && nowUnlocked,
      goldenKikiUnlocked: nowUnlocked,
      masteryPercent: m,
    };
  }

  /** Clean reset (new run / testing). */
  reset(): void {
    this.collection.reset();
    this.ultimateQuizCompleted = false;
    this.ultimateQuizBest = 0;
  }

  // ------------------------------------------------------------ gates (derived, never stored)

  /**
   * The Ultimate Corgi Quiz is available IFF the collection is complete
   * (all 12 NORMAL stickers). 11/12 does not unlock it. Golden breed
   * stickers are irrelevant.
   */
  get ultimateQuizUnlocked(): boolean {
    return this.collection.collectionComplete;
  }

  /**
   * Golden Kiki is earned IFF: collection complete AND ultimate quiz
   * unlocked (implied) AND ultimate quiz passed. Never automatic at 12/12
   * alone. Re-derived from facts — permanent and idempotent.
   */
  get goldenKikiUnlocked(): boolean {
    return this.collection.collectionComplete && this.ultimateQuizCompleted;
  }

  get phase(): EndgamePhase {
    if (this.goldenKikiUnlocked) return "golden-kiki";
    if (this.ultimateQuizUnlocked) return "quiz-unlocked";
    return "collecting";
  }

  // ------------------------------------------------------------ serialization

  toJSON(): GoldenKikiSaveData {
    return {
      version: SAVE_VERSION,
      collection: this.collection.toJSON() as Record<string, unknown>,
      ultimateQuizCompleted: this.ultimateQuizCompleted,
      ultimateQuizBest: this.ultimateQuizBest,
      savedAt: Date.now(),
    };
  }

  static fromJSON(
    registry: BreedRegistry,
    data: GoldenKikiSaveData,
  ): UltimateRewardState {
    const s = new UltimateRewardState(registry);
    if (!data || data.version !== SAVE_VERSION) {
      throw new Error("Incompatible golden-kiki save data");
    }
    s.collection.reset();
    const restored = CollectionProgress.fromJSON(registry, data.collection);
    // Re-feed through recordBreed so stickiness/idempotency rules apply.
    for (const b of registry.enabled) {
      const e = restored.entry(b.id);
      if (e.adventureCompleted || e.normalStickerUnlocked || e.goldenStickerUnlocked || e.quizMastery > 0) {
        s.collection.recordBreed(b.id, e);
      }
    }
    // Quiz completion is re-derived from best: a save claiming "completed"
    // with a below-threshold best is repaired, never trusted blindly.
    const best = Number(data.ultimateQuizBest);
    s.ultimateQuizBest = Number.isFinite(best) ? Math.max(0, Math.min(1, best)) : 0;
    s.ultimateQuizCompleted =
      data.ultimateQuizCompleted === true &&
      s.ultimateQuizBest >= s.quizConfig.passThreshold;
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

export function saveGoldenKiki(
  key: string,
  state: UltimateRewardState,
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

/** Load; null on missing/corrupt/version-mismatch. Never throws. */
export function loadGoldenKiki(
  key: string,
  registry: BreedRegistry,
  store: StorageLike | null = defaultStore(),
): UltimateRewardState | null {
  if (!store) return null;
  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  let data: GoldenKikiSaveData;
  try {
    data = JSON.parse(raw) as GoldenKikiSaveData;
  } catch {
    return null;
  }
  try {
    return UltimateRewardState.fromJSON(registry, data);
  } catch {
    return null;
  }
}

export function clearGoldenKiki(
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

/** In-memory StorageLike for tests (and storage-less environments). */
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
