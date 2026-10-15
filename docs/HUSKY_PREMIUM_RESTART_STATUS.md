# Husky Premium recovery checkpoint — October 14, 2026

This is NOT an accepted João playtest candidate.

## Work completed

- Preserved the dirty October 8 integration; recovered specialist packages from verified GitHub trees (see restart audit).
- Wired the recovered semantic Kiki rig into exploration with scene update loop, natural turning, terrain modulation, contact FX and a ground-following shadow.
- Fixed recovered motion integration defects: command bindings could change character identity, root reaction tracks were not sampled, alternate closed-eye heads rendered as extra parts, foot-contact positions ignored parent transforms/scale, and shadow remained on an old fixed ground line.
- Corrected the ground/camera scroll mismatch; current single panoramic plate still needs proper terrain/depth assembly and is not premium quality.
- Added live bridge board placement (drag, or accessible pick/place), followed by curved traversal with perspective scale and a front rail. No bridge scene swap.
- Added live lake terrain anchors, careful ice movement, below-character crack feedback and safe inspection. The actual Kiki stays in the world.
- Fixed saved bridge/lake endpoint restoration and made visible Explore signs clickable.
- Restricted cave/lake/secret foreground layers to their own unlocked route nodes.

## Validation

- TypeScript clean before the final lake visibility change; final commands rerun with the checkpoint commit.
- Vitest: 470 tests / 30 files passed before final lake visibility change; final commands rerun with the checkpoint commit.
- Production build passed. Phaser bundle ~1.84 MB uncompressed / 431 KB gzip; Vite large-chunk warning remains.
- Fresh browser profile Premium Safe Oct14: bridge approach, math, board placement in a different order, repair, crossing, refresh/resume, forest choice and lake math/crossing passed.
- Dark ice inspection gave safe feedback. Kiki crossed all four lake anchors and unlocked Fallen Tree. No captured browser warning/error during that segment.
- Screenshots are fresh October 14 evidence in docs/qa/husky-premium-20261014, not the old October 8 captures.
- Full safe/challenge completion, race/reward/save-resume matrix and route runtimes are NOT freshly validated. Do not reuse old measurements as candidate results.

## Remaining acceptance failures

### P0

- Recovered articulated Kiki still exposes rectangular part boundaries and proportion changes between rigs. Original Ringo handoff/source rig is unavailable locally; compare it before changing locked character art. Current result fails the UI-hidden physical-presence gate.
- Several recovered foreground assets retain visible matte rectangles. Original Harrison handoff is unavailable locally; verify source alpha and export settings.
- Painterly terrain/landmark perspective and metadata are not a single continuous surface. Bridge fit is a presentation transform of the older guide; all scene anchors and no-walk bounds still need reconciliation.
- Fallen Tree, igloo, cave, pass, camp and race still contain modal/card interactions. McCartney's recovered microgame definitions do not constitute scene implementations.
- Race still uses the previous renderer; recovered race motion and terrain sections are not integrated.
- Full two-route and refresh/rapid-input validation remains outstanding.

### P1

- Assemble real far/mid/foreground parallax without stretching the ground painting.
- Tune stride against distance and landing/settle timing across terrain.
- Finish doorway/entrance approach/return paths for optional discoveries.
- Validate touch interaction and low-end Chromebook frame timing with the complete scene.

### P2

- Improve reward world staging, camera reveal, ambient sound and optional discovery animation after P0 passes.

## Delivery and retained assets

- No main merge, no Golden Retriever activation, no canonical art regeneration.
- Profile-scoped saves and existing reward bridge conventions retained; required math logic unchanged (3 exploration plus 3 race).
- Historical flat art retained for recovery until live reference audit and browser QA permit retirement.
- Git transport has no private-repository credentials. Connector publication, if performed, must verify the entire remote tree against local blob hashes; successful mutation messages alone are not evidence.
