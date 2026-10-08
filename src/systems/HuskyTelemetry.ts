/**
 * HuskyTelemetry — structured local gameplay telemetry for testing.
 *
 * NO external analytics service. This is a local debug event log Lennon can
 * display in a dev overlay or export as JSON. It exists so we can MEASURE
 * the pacing targets instead of guessing:
 * - total playtime vs the 10–15 minute child target
 * - math question count vs the ≤6 cap
 * - non-math interaction count vs the ≥10 target
 * - advice choices, discoveries, race turns, idle time
 *
 * The clock is injectable so tests (and Lennon) control time.
 */

export type TelemetryEventType =
  | "run-started"
  | "run-ended"
  | "encounter-entered"
  | "encounter-exited"
  | "math-asked"
  | "math-answered"
  | "hint-shown"
  | "interaction-started"
  | "interaction-completed"
  | "advice-choice-made"
  | "micro-decision-made"
  | "discovery-found"
  | "race-turn"
  | "race-beat"
  | "idle-started"
  | "idle-ended";

export interface TelemetryEvent {
  type: TelemetryEventType;
  /** Milliseconds since the log's clock epoch. */
  atMs: number;
  nodeId?: string;
  detail?: Record<string, string | number | boolean>;
}

export interface PlaythroughSummary {
  totalMs: number;
  idleMs: number;
  activeMs: number;
  mathAsked: number;
  mathAnsweredCorrect: number;
  hintsShown: number;
  interactionsCompleted: number;
  adviceChoicesMade: string[];
  microDecisionsMade: number;
  discoveriesFound: string[];
  raceTurns: number;
  raceBeats: number;
  encountersVisited: string[];
}

export type Clock = () => number;

/**
 * Append-only playthrough log. Idle tracking: the scene reports idle-started
 * when the player hasn't touched anything for IDLE_THRESHOLD_MS, and
 * idle-ended on the next input. Idle time is excluded from "active" pacing
 * math — a child staring out the window shouldn't count as slow gameplay.
 */
export class PlaythroughLog {
  static readonly IDLE_THRESHOLD_MS = 30_000;

  private events: TelemetryEvent[] = [];
  private clock: Clock;
  private idleStart: number | null = null;

  constructor(clock: Clock = () => Date.now()) {
    this.clock = clock;
  }

  record(type: TelemetryEventType, nodeId?: string, detail?: Record<string, string | number | boolean>): void {
    this.events.push({ type, atMs: this.clock(), nodeId, detail });
  }

  /** Convenience: mark the player as idle (call when input lapses). */
  markIdle(): void {
    if (this.idleStart === null) {
      this.idleStart = this.clock();
      this.events.push({ type: "idle-started", atMs: this.idleStart });
    }
  }

  /** Convenience: mark input resuming after idle. */
  markActive(): void {
    if (this.idleStart !== null) {
      this.events.push({ type: "idle-ended", atMs: this.clock() });
      this.idleStart = null;
    }
  }

  getEvents(): readonly TelemetryEvent[] {
    return this.events;
  }

  /** Export for Lennon's dev overlay / JSON download. */
  toJSON(): string {
    return JSON.stringify({ events: this.events, summary: this.summarize() });
  }

  summarize(): PlaythroughSummary {
    const ofType = (t: TelemetryEventType) => this.events.filter((e) => e.type === t);
    const first = this.events.find((e) => e.type === "run-started")?.atMs ?? 0;
    const last = this.events.find((e) => e.type === "run-ended")?.atMs
      ?? (this.events.length ? this.events[this.events.length - 1].atMs : 0);

    let idleMs = 0;
    let openIdle: number | null = null;
    for (const e of this.events) {
      if (e.type === "idle-started") openIdle = e.atMs;
      if (e.type === "idle-ended" && openIdle !== null) {
        idleMs += e.atMs - openIdle;
        openIdle = null;
      }
    }
    // Unclosed idle at the end counts too.
    if (openIdle !== null) idleMs += last - openIdle;

    const totalMs = Math.max(0, last - first);
    const uniq = (arr: (string | undefined)[]) => [...new Set(arr.filter((x): x is string => !!x))];

    return {
      totalMs,
      idleMs,
      activeMs: Math.max(0, totalMs - idleMs),
      mathAsked: ofType("math-asked").length,
      mathAnsweredCorrect: ofType("math-answered").filter((e) => e.detail?.correct === true).length,
      hintsShown: ofType("hint-shown").length,
      interactionsCompleted: ofType("interaction-completed").length,
      adviceChoicesMade: uniq(ofType("advice-choice-made").map((e) => e.detail?.choiceId as string | undefined)),
      microDecisionsMade: ofType("micro-decision-made").length,
      discoveriesFound: uniq(ofType("discovery-found").map((e) => e.detail?.discoveryId as string | undefined)),
      raceTurns: ofType("race-turn").length,
      raceBeats: ofType("race-beat").length,
      encountersVisited: uniq(ofType("encounter-entered").map((e) => e.nodeId)),
    };
  }

  clear(): void {
    this.events = [];
    this.idleStart = null;
  }
}
