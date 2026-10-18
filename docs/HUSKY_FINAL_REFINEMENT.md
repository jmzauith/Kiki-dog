# Husky final refinement — implementation and acceptance ledger

Status: **frozen candidate for Roady QA and family review**, 17 October 2026. No known progression blocker observed. This is not production-template or physical-touch acceptance.

Frozen GitHub gameplay SHA: [`7a9f741fe705f919f06c29e291718c6c443aa892`](https://github.com/jmzauith/Kiki-dog/commit/7a9f741fe705f919f06c29e291718c6c443aa892). Local equivalent: `60a9913c1f1d498e6f1949399065255b85335ee6`. Exact shared tree: `6241586687bd534792645e47abd959c9ea9d8ccd`. Verified through GitHub commit API. Following documentation/evidence commits do not alter this code identity.

Branch: `feature/husky-final-refinement`. Starting local SHA: `8a7eab8367ee39941aff4622856efb9a9dbe5fd1` (same tree as published `feature/husky-final-game-feel` SHA `49d54e426dcd2d15dafb4ae0ad744a84c8b1bf6b`). Date: 2026-10-17. No deployment or main changes.

## Implemented and integrated in this working candidate

- Profile-scoped `math:history:v1`: last 120 arithmetic facts and selection ordinal. Retained on replay, shared by adventure, race and Yeti; isolated by existing ProfileScopedStore. Corrupt/unavailable storage falls back to memory. Old profiles need no migration. Facts are suppressed across equation/missing-number variants and commutative operand reversal. Bounded pools avoid random-generation deadlocks; exhausted pools allow repeats.
- Addition/subtraction/multiplication and occasional exact division; equations, short supply stories, missing numbers, equal grouping/sharing. Early bridge warm-up uses addition/subtraction; race challenge retains higher operands. Normal route question count is unchanged. No new paired mandatory encounters.
- Worked explanations use the generated arithmetic metadata; old multiplication-only narrative templates no longer overwrite live hints or stories. Race forfeits/rematches remain unchanged.
- Summit Lights-Out replaced with Lantern Trail Memory, 3/4/5 lights; completed rounds retained on error. Uses existing sequence-memory interaction. Legacy pure Lights-Out helpers remain historical/tested utility code, not a live board.
- Memory retains six pairs, now painted winter equipment. Shared painted equipment atlas supplies most game pieces. Original comparison paintings preload before the spot-difference board opens.
- Enterable Ice Cave with visible intact Kiki and a friendly painted Yeti. Optional three-question practice invitation; addition, subtraction, multiplication. Two misses explain and offer a fresh problem at the same practice step. No race penalty. Exit returns to the original cave progression question. Practice progress is transient; adventure persistence is unchanged. Optional practice adds three or more questions only when chosen.
- Natural-color Husky within gold foil frame replaces monochrome sticker in the shared reward/album renderer. This follows the children's explicit new direction; it does not retroactively approve older art.
- Painted bridge plank replaces generic panel texture; runtime frame excludes transparent padding. Plank and target orientation match; matching gap highlights on pickup. Existing exact-size, occupied-slot and magnetic tolerance rules preserved.
- Complete-character traversal gains slight speed-dependent lean. Existing distance-driven eight-frame gait, planted idle, footprints, contact shadow, follow camera, guidance, tutorial and album sequence retained.

## Minigame audit and reusable library

| Husky activity | Decision | Reusable mechanic / remaining limitation |
|---|---|---|
| Trail map | POLISH | Rotate-to-connect route; functional SVG path remains for readable topology |
| Spot difference | KEEP/POLISH | Two painted scenes, five targets; preload added; five target zones completed in both routes; independent child fairness review pending |
| Igloo memory | KEEP/POLISH | Six-pair illustrated memory; reusable object set |
| Bone hunt | POLISH | Scent-distance search; painted pieces, grid remains schematic |
| Mountain markers | KEEP | Sequence memory, three rounds |
| Cave crystals | REPLACE in live cave | Yeti practice visit now uses the cave; crystal board remains reusable unused registry entry |
| Fallen branches | POLISH | Topmost-object removal / drag-to-collect; separate transparent painted branch silhouettes now live; repeated silhouette and board presentation remain |
| Summit lanterns | REPLACE | Lantern sequence memory replaces neighbor-toggle rules |
| Bolt / igloo rematch | KEEP/POLISH | Tic-tac-toe with draw accepted; painted paw/snow tokens |
| Sled packing | POLISH | Shadow/shape matching; painted equipment |
| Lake | KEEP | Connected safe path with real-world crossing |
| Launch | KEEP | Timing window with assisted hint |
| Slalom | KEEP | Lane avoidance |
| Powder paddles | KEEP | Alternating rhythm |
| Finish cheering | KEEP | Target collection during finish |
| Bridge | POLISH | Sized drag-to-build / tap-select-place |

A future library can reuse these and add hidden objects, what's missing, odd-one-out, picture assembly, sorting, size ordering, pattern completion and copy-arrangement as proposals. Those mechanics are not claimed delivered. No next breed started.

## Generated-art provenance

Generated with the imagegen skill on 2026-10-17, in response to the attached refinement brief. These are active replacement candidates, not newly approved canonical character redesigns.

- `public/assets/collectibles/husky-natural-gold-v2.png`: edited existing foil sticker, preserved dog pose/anatomy/markings, restored charcoal/white fur and snowy background, gold frame retained. Source generation `exec-946b42f3-8383-4607-addb-07b0c8f841d3.png`.
- `public/assets/puzzles/winter-equipment-atlas.png`: 4×4 painted ivory-paper tiles: paw, pine, mountain, tent; snowflake, bone, branch, mittens; rope, bell, scarf, boots; sled, paddle, lantern, crystals. Runtime CSS atlas; source `exec-42b5da34-6def-47dd-a1d5-fb32c16ea781.png`.
- `public/assets/premium/yeti-cave-interior.png`: welcoming blue ice cave, warm lanterns, friendly white Yeti at right, open snowy entrance at left, floor for separate Kiki. Source `exec-ccb22034-b913-4359-9fd4-a665d19a00c4.png`.
- `public/assets/premium/bridge-repair-plank.png`: single transparent painted wooden plank, squared ends, snow edge, no interface; source `exec-9df17e4b-95fa-4693-b312-15b5a08aaf5d.png`.

## Evidence boundary

Starting build passed 497 tests, TypeScript and production build. Its historical route checks do **not** validate these changes. The following ledger records this pass separately. No previous screenshot or test count is relabeled as final acceptance.

## Browser ledger, first refinement pass

Test profile `Refinement Safe`, localhost:5177/?playtest=1, 2026-10-17. This run spans implementation checkpoints and is **not** fresh uninterrupted final-SHA acceptance: tutorial/initial recovery on 778bded, bridge/lake on 0e59a87, remainder on bb0b626. Changes during validation were limited to preserving bridge warm-up retries and replacing schematic branch artwork. Full final candidate route acceptance is still outstanding.

Personally completed: tutorial tap-select/pack; trail map; bridge incorrect drag return + correct drag and tap slots + repaired crossing; forest five differences; Safe selection; lake math and nine-tile route/crossing; six fallen branches; marker 3/4/5 memory; Golden Bone; entered igloo, six illustrated memory pairs, optional tic-tac-toe draw; summit math and three lantern rounds; Bolt friendship draw; race launch/slalom/paddles/cheering; 3-turn race victory; reading + 3 correct breed questions; animated book opening and natural-color sticker; reward reload retained quiz 3/3, sticker and bone. Replay invoked after reload for further checks.

Visible telemetry saved in `qa/final-refinement/safe-telemetry.txt`: 1,217,185 ms total, 179,157 idle, 1,038,028 active, 8 math asked/6 correct (includes intentional failure and reload), 23 interactions, 2 discoveries, 3 race turns, 4 race beats. This includes inspection, code repair and screenshot pauses; **not adult fast-play timing**. Finale/album occur after telemetry run-end.

Screenshots: `qa/final-refinement/` includes recovery, bridge, comparison art, lake arrival, Golden Bone, memory, lantern completion, race division/victory, natural-color album and reward after reload. `safe-bridge-crossing.jpg` was captured after the earlier displayed crossing frame and may show arrival rather than midpoint; inspect file before describing it as a crossing frame.

Issues found and subsequently fixed in `5ad1030`: lantern idle artwork now dims; Challenge/Turbo addition and subtraction use larger operands and multiplication/division have stronger lower bounds. The later Challenge run and final Safe replay exercise those fixes. Race and movement use existing polished systems with modest changes, not a new animation package. Real touch-device testing remains unperformed.


## Final combined-build browser validation

Desktop in-app browser, 1101 × 984, normal profile-scoped durable saves at localhost:5177/?playtest=1. All actions were through the visible UI; sequence hints and puzzle assistance were used. No save injection or debug completion was used.

| Run / build | Personally completed | Boundary |
|---|---|---|
| `Refinement Challenge`, 5ad1030 → 60a9913 | New-profile drag/pack tutorial; map; two incorrect bridge answers → worked explanation → fresh warm-up; three visible board drags and crossing; five differences; Ice Shortcut; enter cave; Yeti addition/subtraction/multiplication, two misses and fresh retry; exit; harder cave math; marker memory; lantern 3/4/5; Bolt strategy draw; optional six-item sled packing; race launch; five forfeits → Bolt victory; rematch Turbo/Steady, slalom/paddles/cheers, three-turn win; reading, wrong quiz retry, partial quiz reload at question two; three correct answers; album; completed reward reload | Only code change during route was cave CSS framing, keeping Yeti visible at this taller viewport. No other gameplay changes. Not an uninterrupted run begun after the final SHA was frozen |
| `Refinement Safe` replay, all replay actions on 60a9913 | Completed tutorial skipped; map; new bridge 12−8; drag/tap repair and crossing; differences; Safe Trail; lake missing-number 3+?=10, nine-tile path/crossing; six painted branches; marker and lantern 3/4/5; summit 8×7; camp strategy; all four race beats, math 14−6, 60÷5, 4+?=13; three-turn win; saved quiz skipped; Golden Bone and natural Husky retained; reward reload | Replay had been initiated earlier and left idle before this complete traversal. Thus total telemetry includes that long pause. Optional bone/igloo were not repeated here; their full checks belong to the first Safe pass above |

Visible Challenge telemetry: 1,119,803 ms total (18m40), 300,927 idle, 818,876 active (13m39), 16 math presentations / 9 correct, 17 completed interactions, 0 discoveries, 8 race turns (5 forfeits + 3 rematch), 4 race beats. The 16 presentations include four Yeti practice presentations, one bridge replacement and five forfeited race problems. Optional Yeti is **not** required math. Clean base progression remains six required successful questions.

Final Safe replay telemetry: 1,847,723 ms total (30m48), 1,279,272 idle, 568,451 active (9m28), **6 math / 6 correct**, 18 interactions, 0 new discoveries, 3 turns, 4 beats. These are tool-assisted inspection times, **not clean adult fast-play benchmarks**. All telemetry stops before breed reading/quiz/album. Source logs and screenshot scope: [evidence index](qa/final-refinement/README.md).

### Automated validation on frozen code

- TypeScript: passed, `tsc --noEmit`.
- Vitest: **498 tests / 34 files passed**. Previous candidate had 497; one additional arithmetic difficulty-floor test accounts for the net increase. The rewritten MathEngine tests also cover operation/format validity, exact division, distinct answers, replay history, profile isolation and blocked/corrupt storage.
- Production build: passed. JS 1,871.33 kB / gzip 441.79 kB. Existing >500 kB chunk warning remains; generated cave/atlas PNGs also appear as bundled CSS assets. No performance budget claim.

## Navigation, motion, tutorial and interaction audit

The previous pass's first-profile packing lesson, delayed fading paw guidance, destination emphasis, distance-driven gait, smooth start/stop and camera look-ahead remain integrated. This pass adds only small whole-body lean; it does not create independent head/ear/blink or new directional frames. Tutorial drag and tap paths were exercised in separate profiles, and replay skipped the completed lesson. No 45–75-second child tutorial timing or first-time-child comprehension study was performed.

Bridge visible pointer controls passed invalid return, size matching, drag and tap placement, repaired crossing and final idle. Invisible accessibility mirror buttons did not activate through automation in one attempt; actual canvas pointer controls passed. Real touchscreen testing remains pending. No chopped body or backward walk was seen in these runs. Rails, terrain perspective and race sled/rider pose still deserve production-art review; this is not a claim of complete 3D grounding.

Task-specific puzzle instructions, hints and race explanations are live. Some general exploration status copy remains. Most puzzles remain framed boards; map topology, bone search, ice path and race subgames still have schematic elements. Painted props improve cohesion but do not make every board a finished bespoke world scene.

## Additional art provenance

`public/assets/puzzles/fallen-branch.png`: transparent painted forked branch, generated 17 October; source `exec-1c0d5974-d2a1-403e-a7aa-61da5768ae3f.png`. Replaces live inline schematic branch drawing. The natural Husky sticker, equipment atlas, cave and plank sources are listed above. All are active replacement candidates; exact final family approval remains unrecorded.

## Roady handoff — frozen candidate

**Ready for independent QA: YES. Ready to declare the production template complete: NO.** No known progression P0 was observed, but the brief's full subjective visual/child/touch acceptance is not proven. Do not merge main.

- Branch: `feature/husky-final-refinement`; frozen gameplay SHA shown at top. Do not change this candidate during QA. Any fix should receive a new SHA and explicit retest scope.
- Environment: Vite local browser at `http://127.0.0.1:5177/?playtest=1`; server must be running. Candidate is not deployed by the existing Pages workflow. `?playtest=1` shows telemetry; it is not a save sandbox.
- Changed areas: math/history/explanations, lantern sequence, painted minigame props/branches, bridge plank fit, natural-color foil reward, optional Yeti cave and minor traversal lean.
- New-player test: create a unique QA nickname. Do not delete family saves. A new profile gives tutorial and clean reward/quiz history. Browser origin/port matters; Chrome and the in-app browser may have separate save stores.
- Safe expectation: map → bridge → differences → Safe lake/path → tree → markers → summit/lanterns → camp → three successful race stages → reflection → reading/three-answer quiz → album. Bone and igloo are optional.
- Challenge expectation: same opening → Ice Shortcut → enter Yeti cave, optional three-question practice → required harder cave problem → markers/summit/camp/race/finale. Practice can be declined at entry. After starting, exit is offered after three correct answers; retries are unlimited.
- Failure test: two incorrect race answers show explanation; Watch Bolt’s turn holds Kiki and advances Bolt. Five forfeits permit Bolt victory. Race again retains mountain and already-completed race activities, resets race counters and presents new math.
- Replay: Play again resets adventure/run/race; retains quiz, sticker, bone, tutorial and arithmetic history. Passed quiz is skipped. Reload returns to profile chooser; choose the same profile to resume. Partial puzzles/practice/active question are not saved. Do not use the legacy breed-reset helper as a full profile reset.
- Inspect phone/touch, reduced motion, production base path, storage failure and simultaneous same-profile tabs independently. Remaining priorities and suggested owners: [single backlog](HUSKY_REMAINING_WORK.md).

## Final quality assessment

The slice is more varied and coherent: genuine painted comparison scenes, illustrated six-pair memory, intuitive lantern sequence, natural-color collectible and friendly cave practice are playable. It is suitable for a focused family playtest and independent QA. It is **not yet justified to call every minigame production-quality or adopt this unchanged as the template for eleven worlds**: schematic boards, richer directional/terrain animation, physical touch testing, first-child navigation and difficulty/pacing review remain explicit work. No Golden Retriever work, deployment change or main merge occurred.
