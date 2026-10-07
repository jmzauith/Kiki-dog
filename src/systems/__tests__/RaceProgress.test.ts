import { describe, expect, it } from "vitest";
import { RaceMoveMode, RaceProgressState } from "../RaceProgress";

function fresh() {
  return new RaceProgressState();
}

describe("RaceProgressState rules", () => {
  it("steady moves 1 space, turbo moves 2 spaces", () => {
    const r = fresh();
    expect(r.playerMove("steady")).toBe(1);
    expect(r.kiki).toBe(1);
    expect(r.playerMove("turbo")).toBe(2);
    expect(r.kiki).toBe(3);
  });

  it("progress never exceeds the finish (clamped, no overshoot)", () => {
    const r = fresh();
    r.kiki = 5;
    expect(r.playerMove("turbo")).toBe(1); // only 1 space was actually available
    expect(r.kiki).toBe(6);
    expect(r.kiki).toBeLessThanOrEqual(r.finish);
  });

  it("victory is sticky: the race cannot finish twice", () => {
    const r = fresh();
    r.kiki = 6;
    expect(r.over).toBe(true);
    expect(r.playerMove("steady")).toBe(0);
    expect(r.playerMove("turbo")).toBe(0);
    expect(r.kiki).toBe(6);
    expect(r.over).toBe(true);
  });

  it("rival advances 1 space per turn, capped one below the finish", () => {
    const r = fresh();
    for (let i = 0; i < 10; i++) r.rivalMove();
    expect(r.rival).toBe(r.finish - 1);
    // The rival can never win: Kiki always gets there first by design.
    expect(r.rival).toBeLessThan(r.finish);
  });

  it("a wrong answer moves nobody on Kiki's side but the rival still goes", () => {
    const r = fresh();
    // Wrong answer: no playerMove call (scene skips it on failure).
    r.rivalMove();
    expect(r.kiki).toBe(0);
    expect(r.rival).toBe(1);
    expect(r.over).toBe(false);
  });

  it("reset restores a fresh race", () => {
    const r = fresh();
    r.kiki = 6;
    r.rival = 5;
    r.reset();
    expect(r.kiki).toBe(0);
    expect(r.rival).toBe(0);
    expect(r.over).toBe(false);
  });

  it("random move sequences never violate bounds", () => {
    const modes: RaceMoveMode[] = ["steady", "turbo"];
    for (let trial = 0; trial < 200; trial++) {
      const r = fresh();
      let moves = 0;
      while (!r.over && moves < 20) {
        r.playerMove(modes[Math.floor(Math.random() * 2)]);
        r.rivalMove();
        moves++;
        expect(r.kiki).toBeLessThanOrEqual(r.finish);
        expect(r.rival).toBeLessThan(r.finish);
        expect(r.kiki).toBeGreaterThanOrEqual(0);
        expect(r.rival).toBeGreaterThanOrEqual(0);
      }
      expect(r.over).toBe(true);
    }
  });
});

describe("race playthrough simulations (logic level)", () => {
  // PT-7: steady-only sled race.
  it("PT-7 steady-only: 6 correct steady answers wins the race", () => {
    const r = fresh();
    for (let turn = 0; turn < 6; turn++) {
      r.playerMove("steady"); // correct answer
      if (r.over) break;
      r.rivalMove();
    }
    expect(r.over).toBe(true);
    expect(r.kiki).toBe(6);
    expect(r.rival).toBeLessThan(6);
  });

  // PT-8: turbo-heavy sled race.
  it("PT-8 turbo-heavy: 3 correct turbo answers wins the race", () => {
    const r = fresh();
    for (let turn = 0; turn < 3; turn++) {
      r.playerMove("turbo");
      if (r.over) break;
      r.rivalMove();
    }
    expect(r.over).toBe(true);
    expect(r.kiki).toBe(6);
  });

  // PT-9: mixed race choices with a wrong answer in the middle.
  it("PT-9 mixed: steady, turbo, wrong, steady, turbo wins without breaking", () => {
    const r = fresh();
    const script: Array<RaceMoveMode | "wrong"> = [
      "steady",
      "turbo",
      "wrong",
      "steady",
      "turbo",
    ];
    for (const turn of script) {
      if (turn !== "wrong") r.playerMove(turn);
      if (r.over) break;
      r.rivalMove();
    }
    // 1 + 2 + 0 + 1 + 2 = 6 -> victory despite the wrong answer.
    expect(r.over).toBe(true);
    expect(r.kiki).toBe(6);
    expect(r.rival).toBeLessThanOrEqual(5);
  });

  // PT-2 (race slice): all wrong answers -> Kiki never moves, rival caps out,
  // race never finishes, never soft-locks the state machine.
  it("PT-2 race slice: endless wrong answers never corrupt race state", () => {
    const r = fresh();
    for (let turn = 0; turn < 30; turn++) {
      r.rivalMove(); // rival still takes its turn
      expect(r.over).toBe(false);
    }
    expect(r.kiki).toBe(0);
    expect(r.rival).toBe(5);
    // Player can still win afterwards: state machine is healthy.
    for (let i = 0; i < 3; i++) r.playerMove("turbo");
    expect(r.over).toBe(true);
  });
});

describe("configurable race length (Husky: 3–5 turns)", () => {
  it("defaults to finish=6 (original track)", () => {
    expect(new RaceProgressState().finish).toBe(6);
  });

  it("finish=5: all-turbo wins in 3 turns", () => {
    const r = new RaceProgressState(5);
    let turns = 0;
    while (!r.over && turns < 10) {
      r.playerMove("turbo");
      turns++;
    }
    expect(r.over).toBe(true);
    expect(turns).toBe(3);
  });

  it("finish=5: all-steady wins in 5 turns", () => {
    const r = new RaceProgressState(5);
    let turns = 0;
    while (!r.over && turns < 10) {
      r.playerMove("steady");
      turns++;
    }
    expect(turns).toBe(5);
    expect(r.kiki).toBe(5);
  });

  it("finish=5: mixed play wins in 3–5 turns", () => {
    for (let t = 0; t < 50; t++) {
      const r = new RaceProgressState(5);
      let turns = 0;
      while (!r.over && turns < 10) {
        r.playerMove(Math.random() < 0.5 ? "steady" : "turbo");
        turns++;
      }
      expect(turns).toBeGreaterThanOrEqual(3);
      expect(turns).toBeLessThanOrEqual(5);
    }
  });

  it("finish=5: rival still capped below the finish (Kiki always can win)", () => {
    const r = new RaceProgressState(5);
    for (let i = 0; i < 20; i++) r.rivalMove();
    expect(r.rival).toBe(4);
    for (let i = 0; i < 5; i++) r.playerMove("steady");
    expect(r.over).toBe(true);
  });

  it("reset() restores a custom-finish race cleanly", () => {
    const r = new RaceProgressState(5);
    r.playerMove("turbo");
    r.reset();
    expect(r.kiki).toBe(0);
    expect(r.over).toBe(false);
    expect(r.finish).toBe(5);
  });
});
