> **Documentation status — historical record; classified 16 October 2026.** [Current-build index](../HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](../HUSKY_REMAINING_WORK.md). Preserved original scope, results and provenance; not final-build acceptance.

> Historical preview audit. Current integration status and remaining work: [Husky Final Polish](HUSKY_FINAL_POLISH.md).

# Kiki visual upgrade: full image-design backlog

## Locked direction and implementation boundaries

Mechanical baseline: PR18, remote head `9fe44b0c1f87c404abb584cc2bf35e48d00c19fe`. Its complete tree was compared with the local baseline and matched. Main is untouched. Character source: PR24 at `24fbbcf111d6173f933b9754080e1ceac5c5d532`. Environment direction: PR23 at `b383a1e79ae2599d307538d14626b0f4cc0b08f4`.

Kiki is locked: tricolor eye/cheek markings, white blaze/muzzle/chest/paws, orange/tan body, recognizable ears and proportions, **no visible tail**. Reuse all 18 approved poses. Do not regenerate or redesign Kiki. The painterly background plates in this preview are adaptations of Harrison's references, not Harrison-supplied final modular production assets. Originals remain under `public/assets/preview/reference` and are not loaded in play because they contain baked characters and UI.

Production contract: numbers and text remain runtime-rendered; gameplay characters stay independent; no click target or world obstacle is baked into a background; correct answers change a separate world asset; all hit areas, graph rules, operands, race increments, and completion gates stay as PR18. Keep the 3360×720 adventure contract and 1280×720 reference viewport until a separately approved gameplay change.

## Scenes and screens

| Scene/screen | Current preview | Final redesign required |
|---|---|---|
| Player start | Painted scene, canonical Kiki, nickname creation and player buttons | Illustrated player cards and avatar builder; saved-progress badges; empty/focus/error states; no hardcoded player names |
| Snowy Peaks exploration | Continuous painted panorama, live Kiki, snowfall, existing paths and vector targets | Separate sky/mountains/forest/terrain/foreground layers; ground aligned to every existing route; keep first destination readable |
| Broken bridge | Dedicated painted ravine, live Kiki, timber math card, live vector broken/fixed bridge | Modular painterly broken/fixed bridge with interchangeable plank gaps, snow contact, ropes, repair sequence, in-world sign and answer stones |
| Forest fork | Working PR18 route-choice modal; vector sign | Painted fork destination, two distinct readable routes, integrated timber choice UI; preserve safe/challenge options |
| Frozen lake | Existing hut and sparkle success over painted panorama | Frozen lake surface, cracks, stepping stones in dark/lit states, shore banks and hut; repair must visibly light stepping stones |
| Fallen tree | Five-tap placeholder marker/counter | Fallen log with 0/5–5/5 push states, loosened snow and cleared path; no new failure rules |
| Ice cave | Existing vector cave, harder math | Painted mouth/interior framing, crystal groups dim/lit, glowing trail; same shortcut math |
| Snow Pass | Existing vector arch and checkpoint | Sculpted ice arch, wind ribbons, sheltered rest spot and checkpoint glow |
| Summit Gate | Placeholder marker plus flag | Painted gate closed/open, friendly gatekeeper placeholder replacement, palace approach; retain separate race launcher |
| Secret Igloo | Existing vector igloo | Concealed/revealed snowy igloo, warm entry, bonus scene, glint; preserve optional status |
| Bone Cache | Placeholder discovery marker | Snow mound partially dug/open, bone cache separate asset, discovery puff; revealed does not mean found |
| Sled race | Painted course, canonical Kiki, old Husky and sled geometry, live five-space rules | Painted Husky, two sleds, harness/runner layers, speed/steady snow effects, foreground parallax, live finish banner; keep +1/+2 and 3–5 turns |
| Normal reward | Painted backdrop, navy/gold card, canonical Kiki celebration, placeholder Husky medallion | Final Husky die-cut sticker, friendship illustration/poses, reveal light and album insertion; stats/buttons remain readable |
| Golden Husky | Reward state/points connected; final visual ceremony absent | Golden border/rays around natural-color Husky, mastery progress panel, earned/locked states; never recolor dog gold |
| Breed facts/quiz | Imported/tested data and quiz engine; no playable quiz screen yet | Discovery fact cards, 5-question quiz scene, answer/retry/hint states, mastery result; separate future screen, no changes to encounter math |
| Album | Collection rollup connected; full album screen absent | Cover, spread, 12 slots, silhouettes, normal/golden/locked states, navigation and completion seal |
| Golden Kiki endgame | Imported/tested logic; no playable endgame screen | Unique locked/available/earned Kiki medallion, ultimate quiz screen, final reveal; only 12 normal stickers unlock it |
| Golden Bay | Concept/asset PR13/17 only; no scene in this branch | Re-art concept vocabulary in approved painterly language; complete separate world and rescue-relay implementation |

## Existing assets: exhaustive disposition

`ASSET_INVENTORY.csv` lists **every file currently under public/assets**, including each canonical pose, each legacy duplicate, each landmark/scenery SVG and each preview/reference plate. No source art was silently deleted. The favicon can be reused unchanged. The old vector Kiki sheets and Kiki tail assets are unused; the Husky tail remains legitimate Husky anatomy. Some preloaded scenery is still only a placeholder; the three old pine SVGs are no longer used by the preview panorama.

## Required production image packages

| Priority | Package | Deliverables / states | Technical contract |
|---|---|---|---|
| P0 | Exploration background | Sky gradient, distant peaks, palace, three forest/valley/summit midgrounds, 3 terrain strips, near snowbanks | Match existing ground/route anchors; no characters/UI/landmarks baked in; transparent near layers |
| P0 | Kiki asset packaging | All 18 locked PNG poses; normalized logical footprint; shared atlas with semantic aliases | Reuse exact PR24 pixels; stand height ~110px; consistent feet anchor; no tail; one playable Kiki |
| P0 | Bridge | Broken and fixed bridge, 3 repair plank layers, rope/post set, gap snowbanks, lantern glow | Match existing bridge target and approach/crossing curve; repair state persistable |
| P0 | Bridge controls | Blank carved sign, four answer stones, hover/press/glow states, hint tag | Four unique live answers, not three from concept art; no baked numbers; readable at fitted viewport |
| P0 | Race plate layers | Painted mountains/sky, mid pines, broad two-racer snow track, near branch cutouts | Match live racer y anchors; keep correct finish x; parallax is visual only |
| P0 | Husky character | Idle, race, turbo, happy, surprised, celebrate; optional curious/guide | Painterly style equal to locked Kiki; stable gray/white identity; curled tail allowed |
| P0 | Race equipment | Two independent wooden sleds, runner/harness layers, Steady/Turbo banners | Separate from dogs; preserve travel increments and turn timing |
| P0 | Normal Husky reward | Natural-color die-cut sticker, cream/gold rim, reveal ray/glint, blank ribbon | Same friend as race; sticker art replaces temporary vector crop |
| P0 | Reward layout | Navy/gold stage, blank stats/ribbon components, friendship pose staging | Live text; no confetti over copy; Keep exploring/Play again preserved |
| P1 | Snowy prop kit | 3 pine silhouettes × 3 snow/light variants, 2 rocks × 3 sizes, icicle set, 3 snowbank shapes | Transparent RGBA, consistent lighting, logical bottom anchors; no flat triangle trees |
| P1 | Trailhead/fork | Entrance arch, blank destination sign, safe pawprints, shortcut ice glints | Warm/safe versus cool/challenge distinction; same targets |
| P1 | Lake | Hut, frozen water, dark/lit stones, cracks, bank edges, success glow | Clearly different before/after; no baked equation |
| P1 | Tree encounter | Standing blocker/log, five push progression variants, cleared trail, chips/snow | Keep five taps and harmless retries |
| P1 | Cave | Mouth, interior curtain, crystal groups dim/lit, floor snow | Leave safe route and shortcut visually distinct |
| P1 | Pass/summit | Ice arch, checkpoint pennants, summit flag, gate closed/open, gatekeeper | Keep Summit Gate and Race Camp distinct |
| P1 | Secrets/scenery | Igloo hidden/revealed, snow-cache closed/open, waterfall, star shard, clue glints | Clues visible after reveal; do not confuse scenery with tappable encounters |
| P1 | UI kit | Blank wooden title plaque, navy dialogue/hint strips, cream/gold reward card, answer stones, route arrows, reset/switch icons | Active/focus/pressed/disabled/error states; large touch targets; runtime typography |
| P1 | FX | Snowfall, footprints, paw puffs, bridge plank shimmer, stone glow, gate opening, snow spray, turbo streaks, confetti/glints | Small pooled transparent sprites; avoid full-screen opaque effects and heavy shaders |
| P1 | Profile/avatars | Base human portrait; 8 skin tones; 6 hair silhouettes; 5 hair colors; 10 shirt/bottom colors; 4 accessories; selected/empty player cards | Layered modular pieces following AvatarOptions registry; inclusive; no named-person artwork |
| P1 | Fact/quiz kit | Fact card, breed portrait, 4 answer-choice states, clue illustration window, mastery badge | Text separate; illustrations support knowledge; accessible retry states |
| P1 | Album chrome | Cover, spread, slot base, locked overlay, golden ring, tabs/arrows/progress seal | Restyle PR14 structure; do not treat its older vector art as final painterly approval |
| P1 | Golden rewards | Golden Husky badge, locked/quiz/earned Kiki medallions, 12/12 seal, finale stage | Gold is framing, not dog fur; Kiki separate from 12 breed slots |
| P2 | Golden Bay painterly kit | Meadow/sand/path/water strips; willows/oaks/reeds/flowers; dock broken/fixed; boathouse closed/open; waterwheel; stones/logs; picnic hidden/open; golden ball; buoys/toys/finish arch; splash/wake/glints | PR13/17 vocabulary can be reused as layout/spec references, all visual styles reviewed against approved painterly world; no gameplay imported blindly |
| P2 | Breeds 2–12 | Each needs friend idle/reaction/challenge/celebration art, normal/golden sticker, album silhouette, facts portrait and world-specific props | Golden Retriever, Beagle, Dachshund, Border Collie, Dalmatian, Shiba Inu, Bernese Mountain Dog, Cavalier King Charles Spaniel, Labrador Retriever, Chow Chow, Pug; world themes beyond Golden Bay remain TBD |

## Reuse rather than redesign

Reuse PR18 graph/progression, curve-following movement, reveal/camera contracts, operand generation, input locks, five-tap tree, race pace/state machine, optional discoveries and sticker gating. Reuse locked Kiki artwork. Reuse imported profile scoping, reward/collection idempotency, quiz and narrative data models. Reuse PR14 slot geometry and PR13/17 object/state vocabulary as specifications, not final style. Keep silent audio hooks; a separate audio backlog needs wind, pawsteps, plank snap, lake chime, snow push, gate, race whoosh and reward sting.

## Delivery order and acceptance checks

1. This preview proves canonical character + painted exploration/bridge/race/reward against the unchanged mechanics.
2. Replace P0 live vector props, Husky, sled and sticker; export true layered plates and normalize geometry. Confirm actual browser screenshots before art approval.
3. Replace P1 encounter landmarks, all leftover worksheet-style overlays, secrets, avatars, facts/quiz and album screens.
4. Adapt Golden Bay and add the next playable world. Endgame remains gated by the full 12 normal stickers, not by currently missing worlds.

Every art handoff includes named source, PNG/WebP RGBA exports, scale/anchor metadata, required states, a 1280×720 staging reference, and a contact sheet at gameplay size. Validate one Kiki, exact coat markings, zero tail, readable live text, correct shadows/ground contact, same target hits, repeat taps, wrong-answer hints, both routes, durable profile isolation, refresh/checkpoint restoration, race victory and reward replay. Test Chromebook/touch/device performance separately; desktop smoke tests do not establish that coverage.
