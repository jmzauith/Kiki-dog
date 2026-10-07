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

---

# Husky Level Expansion — full mini-adventure (2026-10-07)

**Agent:** McCartney (gameplay systems, progression, QA)
**Branch:** `mccartney/husky-level-expansion`
**Brief:** the Husky level ended after ~2 math interactions. It is now a
complete mini-adventure targeting ~12–18 minutes of first play: 5–7 required
encounters, 2–3 optional/challenge encounters, 3–5 race decisions — with
~60% exploration/gameplay and ~40% explicit educational interaction. Math
changes the world; the level is deeper through exploration, route choice,
environmental interaction, and optional discovery — not more math popups.

## New systems

- **`src/systems/AdventureState.ts`** — reusable, Phaser-free progression
  system for all dog worlds. `AdventureDefinition` (nodes, edges, encounter
  metadata, route-aware requirements) + `AdventureProgress` (completions,
  route choice, secrets, bonus counters, sticker gating, reset,
  serialization) + `auditDefinition()` static graph check. Unlock rule uses
  rejoin/OR semantics; route-gated edges (`requiresRoute`) keep the wrong
  branch uncompletable even if driven directly. The sticker rule lives here:
  **all required encounters + race won** — scenes cannot get it wrong.
- **`src/systems/HuskyAdventure.ts`** — the Husky definition: 12 nodes
  (10 map + 2 virtual), positions, encounter metadata, curriculum plug-in
  points, landmark→art mapping, Kiki stand offsets.
- **`src/systems/AdventurePersistence.ts`** — sessionStorage save/load with
  versioning and defensive reads (corrupt/version-mismatch/foreign saves →
  null, never a crash). Injectable store for tests. `markRaceComplete()`
  records the race outcome into the save.
- **`src/systems/AdventureEvents.ts`** — tiny typed event bus
  (`adventure:race-complete`, `adventure:sticker-unlocked`); persistence
  remains the source of truth.
- **`src/visuals/AdventureMarkers.ts`** — lightweight placeholder markers
  for new nodes without dedicated art (forest, frozen lake, fallen tree,
  snow pass, bone cache). Style-consistent with the world's UI; Harrison
  can reskin them. NOT an environment art redesign.

## Encounter design (safe path shown; challenge path in parentheses)

| # | Node | Encounter | What happens |
|---|------|-----------|--------------|
| 1 | Trailhead | checkpoint | Adventure begins (auto) |
| 2 | Broken Bridge | math-normal | Math repairs the bridge; planks swing back |
| 3 | Whisper Forest | choice | Read the clues: paw prints (Safe Trail) vs glittering ice (Shortcut ★) |
| 4 | Frozen Lake | math-normal | Math lights the safe stepping stones |
| 4′ | Ice Cave | math-challenge | Harder shortcut math (challenge route) |
| 5 | Fallen Tree | discovery | Tap 5× to clear the path — no fail state |
| 6 | Snow Pass | checkpoint | Rest stop (auto) |
| 7 | Summit Gate | math-normal | Solve to swing the gate open |
| 8 | Sled Race | race | 3–5 Steady/Turbo math decisions (finish=5) |
| 9 | Husky Reward | reward | Sticker celebration overlay |
| S1 | Secret Igloo | secret | Discovery + optional bonus math-challenge → Golden progress |
| S2 | Bone Cache | secret | Hidden discovery → Golden progress |

Required: 6 (safe) / 5 (challenge) + race. Optional: 2 secrets. Math
questions carry hints after 2 wrong answers; wrong answers never remove
progress and never loop punitively.

## Expanded route matrix

| # | Playthrough | Level | Result |
|---|-------------|-------|--------|
| PT-1 | Safe path, all correct, no secrets | Logic simulation | ✅ Pass |
| PT-2 | Safe path, wrong answers + retries | Logic simulation | ✅ Pass |
| PT-3 | Challenge path, all correct | Logic simulation | ✅ Pass |
| PT-4 | Challenge path, wrong-answer retries | Logic simulation | ✅ Pass |
| PT-5 | Safe path + both secrets + bonus challenge | Logic simulation | ✅ Pass |
| PT-6 | Refresh mid-adventure (frozen-lake) → resume | Persistence round-trip | ✅ Pass |
| PT-7 | Refresh during fog reveal → secrets not lost | Logic + persistence | ✅ Pass |
| PT-8 | Reset mid-run → clean state | Logic simulation | ✅ Pass |
| PT-9 | Steady-only race (5 turns) | Logic simulation | ✅ Pass |
| PT-10 | Turbo-heavy race (3 turns) | Logic simulation | ✅ Pass |
| PT-11 | Mixed race (3–5 turns fuzz, 50 runs) | Automated | ✅ Pass |
| PT-12 | Full replay after sticker | Logic simulation | ✅ Pass |
| PT-13 | Invalid action fuzz (200 walks) — no early unlock, no corruption | Automated | ✅ Pass |
| PT-14 | In-browser manual playthroughs | — | ⏳ Not performed (no browser access) |

## Expected first-run encounter count

Safe path: 6 required encounters + race (3–5 decisions) + 0–2 optional
secrets = **9–13 interactions**. Challenge path: 5 + race + 0–2 secrets =
**8–12 interactions**. At a 9-year-old's pace (reading, thinking, watching
Kiki walk, celebrating), this targets the 12–18 minute brief.

## Persistence behavior (resolves old bug #6)

- Saves on every encounter completion: current node, completed encounters,
  chosen route, secrets, bonus counters, race result, sticker state.
- Refresh mid-adventure resumes at the saved checkpoint with visuals
  restored (revealed nodes, repaired bridge, cleared tree, discovered
  secrets). Refresh mid-race restarts the race only — pre-race progress is
  kept. Secrets reveal synchronously with their unlock (not after the fog
  tween) so a refresh during the reveal animation can't lose them.
- Corrupt/version-mismatched/foreign saves degrade to a fresh run.
- Player-safe reset: the ↺ button wipes the save and restarts cleanly
  (for testing and "play again").

## Sticker unlock conditions

`AdventureProgress.canUnlockSticker()` — enforced in the state module:
1. Every required encounter complete (route-aware: safe needs lake+tree,
   challenge needs cave; bridge+forest+summit always).
2. `raceCompleted` (set by RaceScene via `markRaceComplete`).
3. Secrets and bonus challenges are NEVER required — they feed Golden
   Husky progression (`secretsFound`, `bonusChallengesCompleted`,
   `challengeSuccesses`) instead.
Regression-tested: no sticker after two questions, even with the race flag
forced.

## Race changes

- `RaceProgressState` gains a configurable `finish` (default 6, unchanged
  for existing tests); the Husky race uses 5 → 3 (all-turbo) to 5
  (all-steady) decisions. Track visuals adapt automatically.
- `finishRace()` now persists the win, emits `adventure:race-complete`
  with `{turns, turbos}`, and shows a **Continue →** button back to
  HuskyScene (reward overlay) — the race no longer dead-ends on text.

## Known risks

1. **No in-browser verification** — same limitation as the QA pass:
   rendering, real pointer input, tween timing, and the new modal panels
   (forest choice, fallen-tree taps, secret encounters, reward overlay)
   need a real-browser playthrough, ideally the kid-playtest.
2. **Scene diff size** — HuskyScene's progression flow was restructured
   (same visual methods, new adventure-driven flow). If Harrison is
   mid-edit on HuskyScene, the lead dev should merge carefully; the new
   code is organized in clearly-marked sections.
3. **Placeholder markers** — forest/lake/tree/pass/cache use simple
   plaque markers until Harrison provides real art (tracked in PR).
4. **Legacy MapGraph** — `MapGraph.ts` remains (tested, untouched) but
   HuskyScene no longer uses it; the new `AdventureState` supersedes it.
   The lead dev may retire MapGraph or keep it for simpler worlds.
5. **CI tests** — still pending the Workflows permission (unchanged);
   `.github/workflows/build.yml` was NOT touched in this branch.
6. **Duration** is a design estimate (encounter counts × kid pace), not a
   measured 12–18 minutes — the kid-playtest should time a real first run.

## Future breed reuse notes

- A new world = one `AdventureDefinition` + art + encounter copy. The
  `AdventureProgress`, persistence, sticker rule, audit, and test patterns
  transfer unchanged.
- Encounter vocabulary is fixed (`walk`/`math-*`/`choice`/`discovery`/
  `secret`/`checkpoint`/`race`/`reward`); new worlds should reuse these
  before inventing types.
- Curriculum plug-in: math encounters carry `curriculum: string[]` and
  `mathDifficulty`; `MathEngine.nextQuestion()` can grow a topic parameter
  later without touching encounter flow.
- Golden sticker progression already has its counters
  (`secretsFound`, `bonusChallengesCompleted`, `challengeSuccesses`) —
  the final Golden screen is the remaining piece.

## Automated tests added (62 new, 105 total, all passing)

- `AdventureState.test.ts` (28) — definition audit, unlock/completion
  rules, route-gated edges, secrets, sticker gating (both routes, early-
  unlock regression, secrets-never-required), reset, serialization
  round-trip incl. stale-save pruning, challenge counters, 100-walk fuzz
  (sticker rule exactness), 200-action invalid-input fuzz.
- `HuskyAdventure.test.ts` (17) — audit passes, landmark-mapping
  completeness, Kiki offsets, marker spacing, encounter budget (5–7
  required, 2–3 optional, exploration majority, curriculum tags), full
  playthroughs per route ± secrets, no-skip regression, wrong-branch
  isolation, reset, 200-walk Husky fuzz, BFS reachability of every
  required encounter on both routes.
- `AdventurePersistence.test.ts` (11) — round-trip, no-save/corrupt/
  version-mismatch/foreign-adventure → null, clear/reset, simulated
  mid-adventure refresh, `markRaceComplete` (incl. no-save case, sticker
  stays locked), null/throwing stores degrade gracefully.
- `RaceProgress.test.ts` (+6) — configurable finish, 3/5-turn Husky races,
  50-run mixed-turn fuzz (3–5), rival cap at finish=5, reset keeps finish.
