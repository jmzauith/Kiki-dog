# Kiki Production Notes — Direction A Pose Set

**Branch:** `ringo/kiki-production-poses`
**Status:** production game art (direction A approved by the family: HTML Remaster, tailless)
**Canonical identity:** the real Kiki — tricolor Pembroke Welsh Corgi.

## Identity checklist (holds for EVERY pose)

- BLACK patches above the eyes (like eyebrows / mask markings)
- BLACK patches on the cheeks and sides of the muzzle
- White blaze up the center of the face, white muzzle front, black nose
- Large upright orange/tan ears; fluffy white chest; white legs with white paws; orange/tan body
- **NO TAIL — smooth rounded tailless rump, always.** Any future Kiki art showing a tail is wrong.
- Direction A finish: soft painterly children's-book illustration, warm dimensional shading — NOT flat vector, NOT chibi, NOT anime eyes.

## Pose list (18 single key poses)

The KikiMover tweens/bobs single poses rather than cycling frames, so each pose
below was art-directed to read cleanly on its own at ~110px gameplay size.

| # | File | Pose | Use |
|---|------|------|-----|
| 1 | `kiki-a-idle.svg` | idle — neutral standing, gentle expression | default / waiting for input |
| 2 | `kiki-a-trot.svg` | walk/trot — mid-stride 3/4 | normal travel between landmarks |
| 3 | `kiki-a-run.svg` | run/dash — extended stride, ears back slightly | fast movement |
| 4 | `kiki-a-curious.svg` | curious — head tilt, ears perked | approaching points of interest |
| 5 | `kiki-a-surprised.svg` | surprised — alert, ears up | discoveries, bridge gap |
| 6 | `kiki-a-happy.svg` | happy — open smile, tongue | small wins, greetings |
| 7 | `kiki-a-thinking.svg` | thinking — head tilt, paw raised hint | math prompt open |
| 8 | `kiki-a-proud.svg` | proud — chin up, confident | correct answer |
| 9 | `kiki-a-sniff.svg` | sniff/explore — nose toward ground | secret hunting, trail following |
| 10 | `kiki-a-jump.svg` | jump — all paws off ground, joyful | leaps, celebration beats |
| 11 | `kiki-a-shiver.svg` | shiver — hunched, cold | Snowy Peaks exposure moments |
| 12 | `kiki-a-success.svg` | success — triumphant, paw raised | solving success |
| 13 | `kiki-a-confused.svg` | confused — soft head tilt | mild failure, wrong answer |
| 14 | `kiki-a-sled-ready.svg` | sled-ready — eager, harness strap | race start |
| 15 | `kiki-a-race-steady.svg` | race-steady — balanced gallop | Steady pace |
| 16 | `kiki-a-race-turbo.svg` | race-turbo — leaning dash, ears back | Turbo pace |
| 17 | `kiki-a-celebrate.svg` | finish celebration — paws raised high | race won, adventure complete |
| 18 | `kiki-a-sticker.svg` | sticker celebration — sitting, waving | sticker earned moment |

Suggested `KikiCharacter` pose-name mapping: `idle`, `trot`, `run`, `curious`,
`surprised`, `happy`, `thinking`, `proud`, `sniff`, `jump`, `shiver`,
`success`, `confused`, `sledReady`, `raceSteady`, `raceTurbo`, `celebrate`,
`sticker`.

## Technique

- AI-painted base per pose, all generated from the approved tailless direction-A
  reference plus the identity description above; every pose hand-reviewed against
  the approved A image and the real Kiki photos for marking placement, ear
  shape, and body proportions.
- Backgrounds removed (border-connected white detection), trimmed, resized to
  ~176–224px tall (2x of the ~110px gameplay size), color-quantized, transparent PNG.
- **Binary push limitation:** the GitHub connector cannot push binary files
  (`create_or_update_file` stores base64 as literal text). Each pose is therefore
  committed as a self-contained **SVG wrapper with an embedded transparent-PNG
  data URI** — renders in browsers and loads in Phaser via `this.load.svg(key, url)`.
  The raw transparent PNGs are staged at `~/workspace/ringo-kiki-poses/raw/` and
  zipped as `~/workspace/ringo-kiki-poses/kiki-a-production-pngs.zip` — the lead
  dev can commit them as real `.png` files whenever convenient and swap the
  loader to PNG.

## Verification

- All 18 poses: identity checklist pass (markings, tailless, ears, style).
- Gameplay-size check: all 18 read clearly at 110px (face + silhouette).
- Transparency verified on green and dark-blue backgrounds — no white boxes, no fringe.
- SVG wrappers verified to rasterize (cairosvg) — data URIs decode correctly.
- Diff is purely additive: 18 new SVGs + this doc. No scene, logic, UI, Husky,
  sticker, or album changes.
