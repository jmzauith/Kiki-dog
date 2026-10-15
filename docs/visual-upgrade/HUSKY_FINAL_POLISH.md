# Husky Final Polish integration — 8 October 2026

Playable integration branch: `integration/husky-final-polish`. Main was not merged or changed. This is a local integration checkout; no remote push or PR creation is claimed.

## Provenance

Base: fully browser-verified visual preview `757819a6ea4b4607dcbf1ce1abef8f777447b5dd`, built on the PR18 mechanical slice. The local PR18 mirror has different ancestry from the remote PR18 head, but the earlier audit verified its source tree against PR18.

| Input | Exact source commit | Integrated content |
|---|---|---|
| Harrison PR27 | `1519b6bee22b3565c6f256b7540069f7730a640e` | Snowy Peaks map/race plates, landmark and before/after state art, wood surface, migration documentation |
| Ringo PR26 | `a9f5d35234f763e3f34ba555bffc36bb9aed0eed` | Canonical Husky pose set, greeting/race/friendship art, normal/golden rewards, model documentation |
| McCartney PR28 | `b2d7b75fe63c0f8cadddd69727cca18d9674e03e` | Interaction inventory, pacing plan, local telemetry model and 39 associated tests; new scene wiring added here |
| PR25 reference audit | `d9bdc5d8213e70b8fa414cd17a0770fe950bdfaa` | Visual consistency checklist only |

These are source-file integrations, not Git merge commits. Originals are preserved. `scripts/build-polish-assets.py` packages existing raster pixels into SVG atlases/adapters, feathers opaque vignette borders, adds intrinsic SVG dimensions, and fits the sticker portrait inside its existing circle. Kiki remains the locked, tailless character.

## What is playable

- Profile creation/selection, isolated per-player saves and replay.
- Painted exploration, math-repaired bridge, forest investigation, Kiki advice and safe/challenge route choice.
- Safe: lake math, left/right choice, ordered stones, five branch targets and cleared-tree state.
- Challenge: crystal targets and harder cave math.
- Shared: ordered Snow Pass markers, igloo advice, summit math, Race Camp greeting, optional sled inspection, readiness advice.
- Optional igloo three-object search, expedition fact/badge text, skippable bonus math; bone-cache discovery.
- Three Steady/Turbo race questions, downhill/icy-bend/deep-snow beats and a non-math final sprint. Steady +1/Turbo +2 and rival safety cap remain. The final sprint supplies any distance remaining after turn three.
- Favorite-moment recap, canonical friendship scene, sticker, mastery progress, Play again and Keep exploring.
- Local telemetry persisted inside the selected profile. Add `?playtest=1` to expose expandable results at the reward screen. Nothing is sent to external analytics.

## Browser results and timing

Both routes completed manually through browser controls; no hidden game state was used to skip progression. Safe tested all Steady, both secrets, bonus-math skip, sled inspection, and a wrong stone-order retry. Challenge tested all Turbo, alternate forest/ice-bend choices, and skipping optional discoveries. Completed reward saves reopened after refresh. Browser error/warning log was empty on the final reward verification.

| Measured result | Safe + optional content | Challenge, no optional content |
|---|---:|---:|
| Required math asked/correct | 6 / 6 | 6 / 6 |
| Completed non-math interactions | 21 | 14 |
| Kiki advice choices | 3 | 3 |
| Optional discoveries | 2 | 0 |
| Race turns / physical beats | 3 / 4 | 3 / 4 |
| Total recorded QA elapsed | 17:23.664 | 10:02.908 |
| Recorded idle | 7:31.920 | 0:45.779 |
| Recorded active QA elapsed | 9:51.744 | 9:17.129 |

**These are browser-driven QA times, not a clean human adult fast-play benchmark.** They include screenshot/tool/inspection overhead. Idle starts after 30 seconds without input, so shorter inspection delays remain in active time. The PR28 5–8 minute adult and 10–15 minute child targets are estimates, not proven by these runs. A timed human playtest remains a release gate; do not infer child pacing from these numbers.

Interaction count is completed activities, not individual taps. Advice and the favorite-moment choice count as activities; each five-target set counts once. Raw timestamped logs are saved alongside screenshots under `docs/qa/husky-final-polish/`.

Validation: TypeScript passes; **426 tests across 27 files pass**; Vite production build passes with its existing large-bundle warning. New tests cover telemetry restoration/idle intervals and the three-math-turn + physical-sprint rule. Race checkpoint persistence is implemented, but an interrupted mid-race browser reload is not yet covered by the manual route evidence.

## Bugs found and fixed

1. Reward SVGs rendered black: supplied viewBox-only SVGs needed intrinsic dimensions for Phaser.
2. Sticker portrait lost its head to the circular clip: adjusted SVG placement, preserving the artwork.
3. Kiki Turbo pose shrank because its source had large transparent padding: normalized alpha bounds and foot baseline. Verified the resulting atlas visually; the full route captures predate this last presentation-only fix.
4. Movement could stop at a bob offset: snap to the curve endpoint before returning to idle.
5. Footprints were placed from the wrong coordinate space: use transformed foot anchor.
6. Old flat world markers, Husky atlas, separate tails, primitive sled rectangles and reward placeholder have been replaced in the active Husky rendering path.

## Remaining blockers and limits

This is ready for **an explicitly labeled preview playtest**, not final-art approval or a main merge.

- Frozen Lake still displays Harrison's shelter as a placeholder. It needs a real lake scene and individual stone art.
- Igloo object search uses exterior art and labeled object targets. It needs a warm interior and actual bell/map/blanket objects.
- Physical interactions are simplified click-target prototypes. Downhill is currently a push button, Snow Pass has persistent numbered cues, branches clear in one tap each, and deep snow uses ordered paddles. The full timing window, brief marker reveal, two-tap heavier branches, and richer per-action character reactions from PR28 remain polish work.
- Kiki walk frames reuse one supplied trot image. Bob, weight transfer, facing, footfalls, grounded settling and race pose changes help, but a real multi-frame gait is still missing. Sled/rider contact and perspective need art review.
- Advice outcomes are mostly text and state choices. Snow hare appearance, digging, paw inspection, strap animation, crystal sound and environmental reactions need production treatment.
- Reward has a live sticker/mastery recap, but album presentation is a summary (1 of 12), not the full navigable album experience. Profile avatars and fact/quiz presentation remain future UI integration.
- Mid-encounter reload may ask a fresh math question; telemetry intentionally records every presentation, so interrupted sessions can exceed six asked questions. Completed progression remains saved. Do not mix resumed-session counts with uninterrupted run targets.
- Local branch has not been published. User playtest can use the running localhost build; sharing remotely requires a subsequent publish/push step.

## Full image-design backlog

All new art must preserve Harrison's painterly snow/light palette and locked Ringo character identity. Supply separate runtime text, transparent RGBA objects, bottom/foot anchors and before/after states. Do not redraw Kiki to hide atlas or layout defects.

| Priority | Scene/asset | Reuse now | New/replacement work and acceptance |
|---|---|---|---|
| P0 | Frozen Lake | Shelter only as explicit temporary landmark | Wide frozen-lake plate; 5 separate stones in dark/lit/wobble states; bank edges/crack/splash/glow. Visually readable left/right traversal. |
| P0 | Igloo interior | Hidden/discovered/glowing exterior states | Warm interior; bell, map scrap, blanket; revealed-object states; expedition badge. Three objects individually discoverable without labels giving away their location. |
| P0 | Kiki gait | Locked idle/trot/run and reaction drawings | Consistent 4–8 frame walk/run cycle, stop/turn/arrival transitions; no visible tail; markings and head/body scale identical. |
| P0 | Sled integration | Generated empty wooden sled and supplied dog race poses | Approved modular sled, runners, harness/rope/contact shadow; match rider stance and race perspective. No floating feet or scale jumps. |
| P0 | Physical interaction kit | Current click targets and art plates | Paint individual branches, stone targets, marker icons, paddles and timing cue. Add hover/pressed/completed/retry states and per-action motion. |
| P1 | Exploration terrain | Harrison map plate, approved bridge plate | Layered near/mid/far terrain across full 3360-unit route; foreground occluders, transparent rocks/pines/snow banks. Avoid repeated distant plate behind every landmark. |
| P1 | Broken bridge | Broken/repairing/fixed plates | Separable planks, rope and snow-contact effects; repair animation and clean traversal anchors. |
| P1 | Whisper Forest | Carved sign and fork | Visible paw-print alternatives, snow-hare reveal, bone clue, sniff/inspect reactions. |
| P1 | Fallen Tree | Blocked/cleared plates | Five separable branches (last two heavier), partial-clear states, chips/snow and Kiki tug poses. |
| P1 | Ice Cave | Approved cave mouth, canonical curious Kiki | Interior layers and three dim/lit crystals with chime/glow response; cave-specific success state. |
| P1 | Snow Pass | Blocked/cleared pass plates | Four independent marker sprites, wind reveal/retry effects, backpack/prints micro-choice props. |
| P1 | Bone Cache | Hidden/revealed plates | Dig stages, snow mound alpha cutout, bones, sniff/dig/funny payoff motion. |
| P1 | Summit Gate | Race gate/checkpoint repurposed | Distinct mountain gate closed/open, gatekeeper, flags; do not visually duplicate Race Camp. |
| P1 | Race Camp | Gate, canonical Husky greeting and generated sled | Camp staging, Bolt greeting exchange, strap/runners/harness targets, Kiki preparation poses. |
| P1 | Race course | Harrison backdrop/checkpoint and Ringo race poses | Separate downhill/icy turn/powder/final approach layers, banking/deep-snow/recovery transitions and snow spray. |
| P1 | Reward | Canonical friendship and normal/golden stickers | Sticker peel/glint/reveal, album slot placement, golden teaser; full album navigation with persistent collection state. |
| P1 | UI and accessibility | Wooden buttons, navy/cream/gold panels | Dedicated scalable panel/button/focus/disabled/error assets; touch spacing, canvas math keyboard access, profile avatars. |
| P1 | VFX/audio | Procedural snow, footprints, sparkle and simple bursts | Painterly atlas for puffs/glow/spray/confetti; pawsteps, wind, branch pull, crystal tones, race whoosh and reward cue. |
| P1 | Facts/quiz/album | Existing tested systems and supplied album art | Breed fact card, quiz choices/retry states, album cover/spread/slots/locked/golden chrome. |
| P2 | Other worlds and breeds | Existing mechanics, Golden Bay references | Separate approved painterly world kits and 11 additional friend/reward/portrait sets. Outside this Husky integration. |

Completed migration: all PR27 scene art and PR26 canonical sources are present; active Husky world/race/reward no longer uses the old flat Husky or corgi sheets. Retained legacy files are still in the repository and build's public directory; they should be removed from the shipping bundle only after consumer audit. Current per-file inventory: `ASSET_INVENTORY.csv`.

## Evidence

- `../qa/husky-final-polish/01-profile.png`
- `../qa/husky-final-polish/02-exploration.png`
- `../qa/husky-final-polish/03-broken-bridge.png`
- `../qa/husky-final-polish/04-route-choice.png`
- `../qa/husky-final-polish/05-fallen-tree.png`
- `../qa/husky-final-polish/06-igloo-search.png`
- `../qa/husky-final-polish/07-race.png`
- `../qa/husky-final-polish/08-safe-reward.png`
- `../qa/husky-final-polish/09-challenge-cave.png`
- `../qa/husky-final-polish/10-race-camp.png`
- `../qa/husky-final-polish/11-challenge-reward.png`
- `../qa/husky-final-polish/safe-telemetry.json`
- `../qa/husky-final-polish/challenge-telemetry.json`
