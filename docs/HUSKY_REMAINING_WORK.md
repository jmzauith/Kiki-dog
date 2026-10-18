# Reconciled Husky remaining work

> **Current implementation report / single active backlog — 17 October 2026.** Candidate gameplay `7a9f741fe705f919f06c29e291718c6c443aa892`. [Current build](HUSKY_CURRENT_BUILD.md), [Astra report and exact evidence](HUSKY_FINAL_REFINEMENT.md). Owners are role recommendations, not evidence of assignment.

**Known P0 gameplay blockers: none observed in Astra’s runs.** Both routes completed; a full Safe replay ran on frozen code. Challenge included a CSS-only cave-framing correction. Independent destructive QA and family review are still release gates; do not merge main automatically.

| Priority | Owner | Remaining work / acceptance boundary |
|---|---|---|
| P0 release gate | Roady + João | Independent QA of the frozen candidate and family review. Astra’s run matrix spans implementation and focused final fixes, not two fresh uninterrupted runs begun after final SHA freeze. Verify new-child navigation and whether the slice is an acceptable quality template |
| P1 | McCartney + João | Supervised ages 8–11 difficulty/pacing review and clean adult fast-play measurement; measure tutorial against 45–75 s goal. Existing timing includes tools/hints/inspection and telemetry excludes the finale |
| P1 | Ringo | Production complete-body turn, three-quarter/back, arrival and terrain frames, independent secondary motion/blink. Current intact eight-frame gait/idle refinements are active; do not re-expose sliced rigs |
| P1 | Harrison + Lennon | Reconcile depth pack with panorama, true-alpha entrance/foreground occlusion, far/mid parallax and elevation. All 14 images/13 JSON exist; only partial runtime integration. Enterable Yeti cave is delivered; animated cave/igloo doorway traversal and precise production rail/paw alignment remain |
| P1 | Harrison + Ringo + Lennon | Matching race rider/sled perspective and richer opponent/terrain response. Modest tilt, bounce, zoom and settle delivered; four staged paintings and separate race boards remain |
| P1 | Harrison + McCartney | Further bespoke puzzle props/world reactions where justified. Painterly differences, equipment atlas, transparent branch pieces, plank and Yeti interior delivered; most puzzles still use boards, not direct manipulation of world objects |
| P1 | Lennon | Actual touch/tablet/phone/Chromebook validation, narrow viewport/reduced-motion checks and production base-path asset loading. Pointer capture/tap alternatives and larger targets exist; desktop mouse tests are not physical touch acceptance |
| P1 | Lennon + McCartney | Save failures/quota/concurrent same-profile tabs and exhaustive cancel/reload matrix. Generic breed-reset helper still omits newer finale/Bone keys; do not use it to simulate a clean first-time profile. Use a new QA profile |
| P1 | Lennon + McCartney | Telemetry scope: include intended post-race learning/album duration and tutorial interaction if required; current counters use legacy kind labels for some replaced games. Do not reinterpret old logs |
| P1 | Ringo + Harrison + João | Approve exact active foil/puzzle/replacement art. No canonical redesign performed. New album cover/page/placement is implemented; eleven breed artworks and full multi-spread navigation remain future work |
| P2 | Lennon | Bundle/public asset audit, unused historical preloads/styles and sustained frame/memory profiling. Current JS ~1.871 MB with existing chunk warning; two puzzle PNGs add ~6.5 MB. No measured Chromebook budget yet |
| P2 | Harrison / Ringo / McCartney | Final audio for footsteps, crystal echo, snow, bridge, race and paper; existing semantic hooks do not supply sound assets |
| P2 | Lennon + McCartney | Tutorial replay setting and per-mechanic guidance familiarity if family testing warrants it. Current tutorial key is per profile; guidance weakens after completed Husky finale |
| P2 / future | Team + João | Eleven remaining worlds/breed sets, avatar builder, full collection/Golden Kiki ending. Empty album slots and reusable APIs do not imply delivered gameplay |

## Delivered — retain these distinctions

- Varied games, igloo interior/memory/bonus, Golden Bone, fixed breed finale, retry explanations, loss/rematch and profile persistence are integrated and exercised in this pass.
- Exact three-slot bridge, snap/invalid return, connected repair/crossing and reload have live checks; final asset approval is separate.
- Important minigame platform emoji art was replaced; functional map paths, star targets and schematic board layouts remain. Two painted comparison scenes were played. Do not broadly label all bespoke artwork missing or all art final.
- Adaptive fading paw guidance is visible after the final renderer correction; no permanent dotted route. First-time usability still needs a child who does not know the map.
- Tutorial and album presentation are reusable and integrated. New-profile packing and persistence, cover/placement, reward reload and replay were observed; mobile and reduced-motion setting remain unverified.
- Stale “Golden progress +1” bonus copy and success feedback were corrected in code. Remaining narrative labels in source/telemetry are not evidence that old prompt-only games are live.
- No deployment change is included. Main remains untouched. Candidate readiness for Roady is not permission to release.


## Refinement-specific boundaries

- P1 — McCartney + João: tune operation/difficulty progression using children; final Safe covered all four operations, but difficulty within a normal tier varies and division may include 72÷9. Six required questions remain. Recent-fact history is implemented, not a promise of infinite unique questions.
- P1 — Harrison + Lennon: map, bone search, ice path and race activity layouts still contain schematic boards. Painted tiles are active, not proof the entire minigame library meets the production-template bar. Replace board presentation selectively after family review; do not revert memory or the illustrated differences.
- P1 — Lennon: offer a graceful early exit after starting Yeti practice if review warrants it; current invitation can be declined, then three correct answers are needed to reach the exit. Practice is transient on reload.
- P1 — Roady: independently inspect invisible bridge accessibility mirror controls; visible canvas mouse drag/tap passed, automation against hidden mirrors did not. No keyboard expansion is requested.
- P2 — Harrison + Ringo: refine repeated branch silhouette, ivory tile crop edges and lantern color identity; inactive lanterns now dim and sequence is usable. Exact generated artwork awaits family approval.
- Delivered: four-operation history-aware math, warmer bridge retries, lantern sequence replacement, optional three-type Yeti practice, natural-color gold-frame sticker, painted atlas/plank/branch assets. Full code suite: 498 tests, TS/build passed. Historical missing-Lights-Out/Yeti/monochrome-sticker tasks must not be reopened as if these deliveries do not exist.

**Production-template gate remains open:** first-child comprehension, physical-touch acceptance and the brief's “no prototype-looking boards” criterion are not fully established. This does not prevent the frozen build being reviewed by Roady and the family.
