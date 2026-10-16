/**
 * Pure, UI-free model of the sled-race rules.
 *
 * Extracted from RaceScene so the progression math (steady = 1 space,
 * turbo = 2 spaces, optional competitive rival, single victory) is
 * unit-testable and cannot be accidentally broken by visual changes.
 * The scene owns one instance and mirrors its values to the track visuals.
 */
export type RaceMoveMode = "steady" | "turbo";

export class RaceProgressState {
  /**
   * Spaces needed to win. Configurable per adventure: the Husky race uses 5
   * (3–5 turns of Steady/Turbo decisions); default 6 preserves the original
   * track length.
   */
  readonly finish: number;

  kiki = 0;
  rival = 0;

  constructor(finish = 6, readonly competitive = false) {
    this.finish = finish;
  }

  /** True when a racer allowed to win reaches the finish. */
  get over(): boolean {
    return this.kiki >= this.finish || (this.competitive && this.rival >= this.finish);
  }

  /**
   * Advance Kiki after a correctly answered math question.
   * Returns the number of spaces actually moved (0 if the race is over).
   * Progress is clamped so it can never overshoot the finish.
   */
  playerMove(mode: RaceMoveMode): number {
    if (this.over) return 0;
    const spaces = mode === "turbo" ? 2 : 1;
    const before = this.kiki;
    this.kiki = Math.min(this.finish, this.kiki + spaces);
    return this.kiki - before;
  }

  /**
   * Advance the rival one space. Competitive Husky races allow Bolt to win.
   * Legacy callers retain their capped, forgiving rival behavior.
   */
  rivalMove(): number {
    if (this.competitive && this.over) return 0;
    const before = this.rival;
    this.rival = Math.min(this.competitive ? this.finish : this.finish - 1, this.rival + 1);
    return this.rival - before;
  }

  /** Reset for a fresh race (e.g. scene replay). */
  reset(): void {
    this.kiki = 0;
    this.rival = 0;
  }
}
