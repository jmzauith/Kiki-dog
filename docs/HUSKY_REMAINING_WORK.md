# Reconciled Husky remaining work

> **Current implementation report / single active backlog — 16 October 2026.** Candidate gameplay `85e801b0fd8bc45b9b9505f68bdb19ff7e5bab0e`. [Current build](HUSKY_CURRENT_BUILD.md), [Astra report and exact evidence](HUSKY_FINAL_GAME_FEEL.md). Owners are role recommendations, not evidence of assignment.

**Known P0 gameplay blockers: none observed in Astra’s runs.** Safe and Challenge completed during the pass, followed by a Safe replay and focused checks after small fixes. Independent destructive QA and family review are still release gates; do not merge main automatically.

| Priority | Owner | Remaining work / acceptance boundary |
|---|---|---|
| P0 release gate | Roady + João | Independent QA of the frozen candidate and family review. Astra’s run matrix spans implementation and focused final fixes, not two fresh uninterrupted runs begun after final SHA freeze. Verify new-child navigation and whether the slice is an acceptable quality template |
| P1 | McCartney + João | Supervised ages 8–11 difficulty/pacing review and clean adult fast-play measurement; measure tutorial against 45–75 s goal. Existing timing includes tools/hints/inspection and telemetry excludes the finale |
| P1 | Ringo | Production complete-body turn, three-quarter/back, arrival and terrain frames, independent secondary motion/blink. Current intact eight-frame gait/idle refinements are active; do not re-expose sliced rigs |
| P1 | Harrison + Lennon | Reconcile depth pack with panorama, true-alpha entrance/foreground occlusion, far/mid parallax and elevation. All 14 images/13 JSON exist; only partial runtime integration. Physical cave/igloo entry and precise production rail/paw alignment remain |
| P1 | Harrison + Ringo + Lennon | Matching race rider/sled perspective and richer opponent/terrain response. Modest tilt, bounce, zoom and settle delivered; four staged paintings and separate race boards remain |
| P1 | Harrison + McCartney | Further bespoke puzzle props/world reactions where justified. Painterly five-difference pair and authored vector game pieces delivered; most puzzles still use boards, not direct manipulation of world objects |
| P1 | Lennon | Actual touch/tablet/phone/Chromebook validation, narrow viewport/reduced-motion checks and production base-path asset loading. Pointer capture/tap alternatives and larger targets exist; desktop mouse tests are not physical touch acceptance |
| P1 | Lennon + McCartney | Save failures/quota/concurrent same-profile tabs and exhaustive cancel/reload matrix. Generic breed-reset helper still omits newer finale/Bone keys; do not use it to simulate a clean first-time profile. Use a new QA profile |
| P1 | Lennon + McCartney | Telemetry scope: include intended post-race learning/album duration and tutorial interaction if required; current counters use legacy kind labels for some replaced games. Do not reinterpret old logs |
| P1 | Ringo + Harrison + João | Approve exact active foil/puzzle/replacement art. No canonical redesign performed. New album cover/page/placement is implemented; eleven breed artworks and full multi-spread navigation remain future work |
| P2 | Lennon | Bundle/public asset audit, unused historical preloads/styles and sustained frame/memory profiling. Current JS ~1.885 MB with existing chunk warning; two puzzle PNGs add ~6.5 MB. No measured Chromebook budget yet |
| P2 | Harrison / Ringo / McCartney | Final audio for footsteps, crystal echo, snow, bridge, race and paper; existing semantic hooks do not supply sound assets |
| P2 | Lennon + McCartney | Tutorial replay setting and per-mechanic guidance familiarity if family testing warrants it. Current tutorial key is per profile; guidance weakens after completed Husky finale |
| P2 / future | Team + João | Eleven remaining worlds/breed sets, avatar builder, full collection/Golden Kiki ending. Empty album slots and reusable APIs do not imply delivered gameplay |

## Delivered — retain these distinctions

- Varied games, igloo interior/memory/bonus, Golden Bone, fixed breed finale, retry explanations, loss/rematch and profile persistence are integrated and exercised in this pass.
- Exact three-slot bridge, snap/invalid return, connected repair/crossing and reload have live checks; final asset approval is separate.
- Important minigame platform emoji art was replaced; authored SVG and abstract game symbols remain. Two painted comparison scenes were played. Do not broadly label all bespoke artwork missing or all art final.
- Adaptive fading paw guidance is visible after the final renderer correction; no permanent dotted route. First-time usability still needs a child who does not know the map.
- Tutorial and album presentation are reusable and integrated. New-profile packing and persistence, cover/placement, reward reload and replay were observed; mobile and reduced-motion setting remain unverified.
- Stale “Golden progress +1” bonus copy and success feedback were corrected in code. Remaining narrative labels in source/telemetry are not evidence that old prompt-only games are live.
- No deployment change is included. Main remains untouched. Candidate readiness for Roady is not permission to release.
