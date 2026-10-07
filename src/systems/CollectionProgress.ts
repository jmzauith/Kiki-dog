/**
 * CollectionProgress — per-breed collection tracking for Kiki's Dog Adventure.
 *
 * Tracks, for every breed in the registry:
 *  - adventure completed
 *  - normal sticker unlocked
 *  - golden sticker unlocked (mastery bonus — NEVER blocks the endgame)
 *  - quiz mastery (0..1 best, when a breed quiz exists)
 *
 * THE UNAMBIGUOUS RULE (João's law):
 *   collectionComplete = every ENABLED breed has its NORMAL sticker.
 * Golden breed stickers are prestigious bonuses and are irrelevant to
 * collection completion.
 *
 * Design rules:
 *  - Pure TypeScript, zero imports. This layer consumes PLAIN DATA that
 *    Lennon feeds it from the real systems (BreedRewardState per breed,
 *    adventure completion flags) — it never imports them, so it compiles
 *    standalone and stays unit-testable.
 *  - Unknown breed ids are ignored (defensive against stale saves after a
 *    roster change).
 *  - Totals are computed from the registry — never hardcoded to 12.
 */

import type { BreedRegistry } from "./BreedRegistry";

export interface BreedCollectionEntry {
  adventureCompleted: boolean;
  normalStickerUnlocked: boolean;
  goldenStickerUnlocked: boolean;
  /** Best quiz mastery 0..1 (0 when the breed has no quiz yet). */
  quizMastery: number;
}

const EMPTY_ENTRY: BreedCollectionEntry = {
  adventureCompleted: false,
  normalStickerUnlocked: false,
  goldenStickerUnlocked: false,
  quizMastery: 0,
};

export class CollectionProgress {
  private readonly entries = new Map<string, BreedCollectionEntry>();

  constructor(readonly registry: BreedRegistry) {}

  /**
   * Record progress for a breed. Unknown ids are ignored. All fields are
   * sticky-true except quizMastery, which keeps the best value — progress
   * can never go backwards (a replay or re-save can't un-earn a sticker).
   */
  recordBreed(breedId: string, partial: Partial<BreedCollectionEntry>): void {
    if (!this.registry.has(breedId)) return;
    const cur = this.entries.get(breedId) ?? { ...EMPTY_ENTRY };
    const q =
      typeof partial.quizMastery === "number" && Number.isFinite(partial.quizMastery)
        ? Math.max(0, Math.min(1, partial.quizMastery))
        : cur.quizMastery;
    this.entries.set(breedId, {
      adventureCompleted: cur.adventureCompleted || partial.adventureCompleted === true,
      normalStickerUnlocked:
        cur.normalStickerUnlocked || partial.normalStickerUnlocked === true,
      goldenStickerUnlocked:
        cur.goldenStickerUnlocked || partial.goldenStickerUnlocked === true,
      quizMastery: Math.max(cur.quizMastery, q),
    });
  }

  entry(breedId: string): BreedCollectionEntry {
    return { ...(this.entries.get(breedId) ?? EMPTY_ENTRY) };
  }

  /** Breeds counted toward completion (enabled in the registry). */
  private counted() {
    return this.registry.enabled;
  }

  get totalBreeds(): number {
    return this.counted().length;
  }

  get adventuresCompleted(): number {
    return this.counted().filter((b) => this.entry(b.id).adventureCompleted).length;
  }

  get normalStickersCollected(): number {
    return this.counted().filter((b) => this.entry(b.id).normalStickerUnlocked).length;
  }

  get goldenStickersCollected(): number {
    return this.counted().filter((b) => this.entry(b.id).goldenStickerUnlocked).length;
  }

  /**
   * 0..100 — share of NORMAL stickers collected. Golden stickers do not
   * move this number: the album fills with normal stickers.
   */
  get completionPercent(): number {
    const total = this.totalBreeds;
    if (total === 0) return 0;
    return Math.round((this.normalStickersCollected / total) * 100);
  }

  /**
   * THE rule: every enabled breed's NORMAL sticker. Golden stickers are
   * irrelevant here — check goldenStickersCollected separately for display.
   */
  get collectionComplete(): boolean {
    const counted = this.counted();
    return counted.length > 0 && counted.every((b) => this.entry(b.id).normalStickerUnlocked);
  }

  /** Clean reset for testing / new-run flows. */
  reset(): void {
    this.entries.clear();
  }

  // ------------------------------------------------------------ serialization

  toJSON(): Record<string, unknown> {
    const breeds: Record<string, BreedCollectionEntry> = {};
    for (const [id, e] of this.entries) breeds[id] = { ...e };
    return { breeds };
  }

  static fromJSON(registry: BreedRegistry, data: unknown): CollectionProgress {
    const p = new CollectionProgress(registry);
    if (!data || typeof data !== "object") return p;
    const breeds = (data as { breeds?: unknown }).breeds;
    if (!breeds || typeof breeds !== "object") return p;
    for (const [id, raw] of Object.entries(breeds as Record<string, unknown>)) {
      if (!registry.has(id) || !raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const q = Number(r.quizMastery);
      p.entries.set(id, {
        adventureCompleted: r.adventureCompleted === true,
        normalStickerUnlocked: r.normalStickerUnlocked === true,
        goldenStickerUnlocked: r.goldenStickerUnlocked === true,
        quizMastery: Number.isFinite(q) ? Math.max(0, Math.min(1, q)) : 0,
      });
    }
    return p;
  }
}
