# Husky QA Report — Snowy Peaks vertical slice

**Agent:** McCartney (QA / systems-reliability / playtesting)
**Branch:** `mccartney/husky-qa-reliability`
**Date:** 2026-10-07
**Scope:** `src/scenes/HuskyScene.ts`, `src/scenes/RaceScene.ts`,
`src/systems/MapGraph.ts`, `src/systems/MathEngine.ts` (+ new pure helpers and tests)

**How this was verified:** automated logic tests (Vitest, 43 tests, all passing),
`tsc --noEmit`, and a full `vite build` — all executed locally. The game was
**not** played in a real browser (this environment has no browser access), so
rendering, real tap handling, and tween timing were verified by code inspection
only. See "Manual test results" and "Recommendations" below.

---

## Test matrix

| # | Playthrough | Level | Result |
|---|-------------|-------|--------|
| PT-1 | Normal route, all answers correct | Logic simulation (vitest) | ✅ Pass |
| PT-2 | Normal route, several wrong answers | Logic simulation | ✅ Pass |
| PT-3 | Challenge route, all answers correct | Logic simulation | ✅ Pass |
| PT-4 | Challenge route, wrong-answer retries | Logic simulation | ✅ Pass |
| PT-5 | Rapid tapping everywhere | Logic slice + code inspection | ✅ Pass (guards verified) |
| PT-6 | Refresh/restart behavior | Logic simulation + code inspection | ⚠️ Pass with known limitation (no persistence — see below) |
| PT-7 | Steady-only sled race | Logic simulation | ✅ Pass |
| PT-8 | Turbo-heavy sled race | Logic simulation | ✅ Pass |
| PT-9 | Mixed race choices | Logic simulation | ✅ Pass |
| PT-10 | Full replay after completion | Logic simulation | ✅ Pass (regression test for fixed bug #1) |
| PT-11 | Route-state static audit (dead ends, reachability, route separation) | Automated | ✅ Pass |
| PT-12 | MathEngine property tests (500 random questions × 2 difficulties) | Automated | ✅ Pass |
| PT-13 | Race fuzz (200 random move sequences, bounds checking) | Automated | ✅ Pass |
| PT-14 | In-browser manual playthroughs | — | ⏳ Not performed (no browser access) |

---

## Bugs discovered

### P0 — fixed

**#1 Global map-state leak: restarting HuskyScene kept the map revealed.**
`revealNode()` mutated the module-level `nodes` object in `MapGraph.ts`.
Phaser reuses module state across scene restarts, so re-entering HuskyScene
left every node revealed — a player could skip the bridge math and jump
straight to the goal, and the freshly recreated fog zones rendered "?" over
already-discovered areas. **Fixed:** `createMapState()` factory in
`MapGraph.ts`; HuskyScene now owns an instance-local copy (`this.mapNodes`)
and never touches the shared module object. Covered by regression tests
(`MapGraph.test.ts`: "never mutates the shared module state", "PT-10 replay").

**#2 Scene-restart soft locks (both scenes).**
Phaser reuses the same Scene instance on restart; class field initializers do
**not** re-run. Consequences found by inspection:
- *RaceScene:* `kikiProgress`/`rivalProgress` retained their finished values,
  so a replayed race hit the `kikiProgress >= finish` guard in
  `showPaceChoices()` → no pace buttons → soft lock.
- *HuskyScene:* `currentNode` retained `"goal"` → `highlightForwardChoices()`
  immediately fired the delayed `scene.start("RaceScene")` — replaying Husky
  skipped straight to the race. `routeVisuals` also kept growing across
  restarts (duplicate edge redraws).
**Fixed:** both scenes now reset all mutable state at the top of `create()`
(progress, busy flag, prompt reference, route visuals, node/fog registries,
map state). Race progression state gained an explicit `reset()`.

### P1 — fixed

**#3 Stale `pointerdown` listeners accumulated on route nodes.**
Every `highlightForwardChoices()` cycle called `setInteractive()` + `once()`
on each choice node without removing listeners from nodes the player never
tapped. After a few cycles one tap could invoke `takeRoute()` multiple times.
(The synchronous `busy` guard masked it, but it was fragile.) **Fixed:**
`clearHighlights()` now calls `node.off("pointerdown")`.

**#4 Math prompt could resolve twice on a fast double-tap.**
Both scenes' answer buttons used `on("pointerdown")` with no re-entrancy
guard. **Fixed:** a `resolved` flag in both `showMathPrompt()` implementations
— the encounter resolves exactly once.

**#5 Race rules were embedded untestably in RaceScene.**
Any visual change risked silently altering progression math. **Fixed:**
extracted pure `RaceProgressState` (`src/systems/RaceProgress.ts`) and wired
the scene to it. Rules (steady=1, turbo=2, clamp at finish, rival cap,
sticky victory) are now unit-tested and independent of rendering.

### P1 — found, not fixed (needs a decision / out of lane)

**#6 No persistence: a browser refresh restarts the Husky slice from the
Trailhead.** Verified by code inspection — there is no save/checkpoint
anywhere. Refresh before the first move, at the fork, or mid-race all lose
progress. For a 9-year-old this is a real frustration risk, but adding a save
architecture is new scope. **Recommendation:** a minimal `sessionStorage`
checkpoint (current node + revealed set + race progress) in a follow-up;
João's call.

### P2 — noted, not fixed (Harrison's / Ringo's lane)

**#7** `walkKiki` moves Kiki on a straight tween, not along the trail curve,
and flips direction with `setScale(-1)`. Ringo's movement system will replace
this — documented here so his tests keep the input-lock contract (see
"Contract for parallel work" below).
**#8** `MathEngine.uniqueAnswers` fills missing answers in a
probabilistically-terminating loop. Terminates in practice (verified over
1000 generations); left as is.

### Design notes (not bugs)

- The rival is hard-capped at `finish - 1`, so Kiki always wins the race.
  This reads as intentional (young players) — documented, not changed.
- Challenge operands (6–12 × 4–9) overlap normal (2–9 × 2–9) at the low end
  (e.g. 6×4=24 can appear in both). Challenge skews harder on average;
  not a correctness issue.

### Areas inspected, no bug found

- **Input locking:** `takeRoute()` and `beginTurn()` set `busy = true`
  synchronously before their first `await`, so rapid taps cannot start
  duplicate movements, math prompts, or turns. `disableAllNodes()` +
  the modal prompt shade cover the remaining windows.
- **Scene transition (HuskyScene → RaceScene):** exactly one path (single
  `delayedCall`), no re-entry while `busy` is set, old scene timers die
  with the scene.
- **Math encounters:** exactly one correct answer, four unique positive
  answers, wrong answers retry without advancing state, challenge stays
  challenge difficulty.
- **Movement completion:** every `walkKiki`/`moveRacer` promise resolves via
  tween `onComplete`; no orphaned timers (step puffs are removed; particles
  self-destroy).
- **Route state:** BFS audit — no dead ends, goal reachable via both routes,
  safe route can never trigger challenge nodes and vice versa, unrevealed
  nodes are never offered or tappable.

---

## Bugs fixed (summary)

| # | Severity | Bug | Fix |
|---|----------|-----|-----|
| 1 | P0 | Global `nodes` mutation leaked reveal state across restarts | `createMapState()` + instance-local map state |
| 2 | P0 | Restarting either scene reused stale instance fields (race soft lock / instant race skip) | Full state reset at top of both `create()` methods |
| 3 | P1 | Stale `once("pointerdown")` listeners accumulated on route nodes | `node.off("pointerdown")` in `clearHighlights()` |
| 4 | P1 | Math prompt could resolve twice on double-tap | `resolved` guard in both scenes |
| 5 | P1 | Race rules untestable inside RaceScene | Extracted + wired `RaceProgressState` |

## Bugs still open

| # | Severity | Bug | Next step |
|---|----------|-----|-----------|
| 6 | P1 | No persistence — refresh loses all progress | Needs João's decision: minimal `sessionStorage` checkpoint (new scope) |
| 7 | P2 | Straight-tween movement, scale-flip facing | Ringo's lane (movement system replacement) |
| 8 | P2 | `uniqueAnswers` fill loop is probabilistic | Monitor; no action needed |

---

## Automated tests added

`npm test` → `vitest run`. 43 tests, all passing.

- `src/systems/__tests__/MathEngine.test.ts` (14) — property tests over 500
  random questions per difficulty: exactly 4 answers, unique, correct appears
  exactly once, prompt operands multiply to the answer, all answers positive,
  difficulty ranges (normal 2–9, challenge 6–12 × 4–9).
- `src/systems/__tests__/MapGraph.test.ts` (18) — static graph audit
  (endpoints valid, no dead ends, fork offers safe+challenge, goal terminal,
  route separation), `createMapState` independence + no shared-state mutation,
  `getForwardChoices` behavior, and logic-level playthroughs PT-1/2/3/4/5/10.
- `src/systems/__tests__/RaceProgress.test.ts` (11) — steady/turbo movement,
  finish clamping, sticky victory (can't finish twice), rival cap, wrong-answer
  behavior, reset, 200-trial fuzz for bounds, and race playthroughs PT-7/8/9.

## CI changes

`.github/workflows/build.yml` now runs `npm test` after install and before
typecheck/build, so tests gate every push to `main` and every PR.
`package.json` gains `vitest` (dev) and the `test` script. `package-lock.json`
is added for reproducible installs.

## Manual test results

In-browser manual playthroughs were **not performed** — this environment has
no browser access. What ran instead:
- `npm test` — 43/43 pass.
- `npm run build` (`tsc --noEmit` + `vite build`) — clean.
- The 10 required playthroughs were executed as automated logic-level
  simulations (see matrix PT-1…PT-10); rendering, real pointer input, and
  tween timing were verified by code inspection only.

## Known limitations

1. No in-browser verification yet (see above).
2. No persistence across refresh (bug #6).
3. The `dist/` build chunk is 1.7 MB (Phaser) — pre-existing; code-splitting
   is a future optimization, not a reliability issue.
4. Tests cover pure logic; Phaser rendering/input is intentionally not
   unit-tested (per brief — too brittle for the value).

## Contract for parallel work (Harrison / Ringo)

- **Ringo:** if you replace `walkKiki`'s movement, keep the busy-guard
  contract — movement must always resolve (promise or callback), unlock input
  exactly once on arrival, and never leave orphaned tweens/timers. My tests
  in `RaceProgress`/`MapGraph` stay valid regardless of how Kiki animates.
  I did not touch character art, curves, or FX.
- **Harrison:** I did not touch environment art, landmarks, or reveal
  visuals. `drawGraph`/`drawEnvironment` are unchanged apart from reading the
  instance-local map copy (same coordinates).
- **Lead dev:** the `nodes` export in `MapGraph.ts` is still there for
  compatibility, but treat it as read-only — new code should use
  `createMapState()`. `initialNodes` is an explicit alias for the template.

## Recommendations before calling Husky "production ready"

1. **In-browser playthroughs PT-1…PT-10** by someone with browser access,
   especially rapid-tapping (PT-5) and refresh (PT-6) — my logic-level
   simulations need their real-world counterpart.
2. **Decide on persistence** (bug #6): even a session-only checkpoint would
   remove the biggest young-player frustration.
3. **Re-run this QA pass after Ringo's movement lands** — the input-lock
   analysis assumes his replacement keeps the resolve/unlock contract.
4. **Playtest with the actual audience** (the two 9-year-olds): a kid will
   find paths no matrix covers. Watch one full session before calling it done.
