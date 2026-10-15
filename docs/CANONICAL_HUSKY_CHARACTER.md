# Canonical Husky Character

**Status:** canonical — approved character for the Snowy Peaks adventure (replaces the old flat-vector Husky).
**Branch:** `ringo/canonical-husky-production-character` · PR: *Ringo: Canonical Husky character and race poses*

The Husky must visually belong in the same game as canonical Kiki (direction A, HTML Remaster)
and Harrison's painterly Snowy Peaks environment. Same rendering language: painterly illustration,
dimensional coat, warm rim light, selective fur detail.

---

## Proportions

- Athletic sled-dog build: lean torso, deep chest, sturdy straight legs.
- Shoulder height reads clearly larger than Kiki (Husky ≈ 1.3× Kiki's height at gameplay scale).
- Long body but NOT exaggerated — believable working-dog anatomy, natural weight distribution.
- Neck flows into a full chest ruff; head sits high and alert.

## Markings (mandatory in every pose — the identity checklist)

- **Upper coat:** gray to dark charcoal (saddle/back), soft painterly gradient, never flat.
- **White:** muzzle, chest (full bib), facial mask markings, legs/paws, underbelly.
- **Facial mask:** white blaze up the forehead center, white around the eyes breaking the gray —
  symmetric, crisp-edged but painterly.
- **Ears:** upright triangles, pink-gray inners, dark charcoal backs with warm rim light.
- **Tail:** thick, curled, carried up over the back. THE HUSKY HAS A TAIL.
  (Only Kiki is tailless — never confuse the two.)
- **Nose:** black. **Mouth:** dark lip line, friendly by default.

## Colors

| Area | Tone |
|---|---|
| Upper coat | Charcoal gray `#3a3f4a` → mid gray `#6b7280`, painterly variation |
| White areas | Warm white `#f7f3ea`, never pure `#ffffff` flat |
| Ear inners | Dusty pink-gray `#c9a9a4` |
| Eyes | Icy blue `#7fb3d5`–`#a8d0e6`, almond shaped |
| Nose / lips | Near-black `#1c1a18` |
| Harness (race) | Red `#c0392b` + black straps, consistent across all race poses |
| Rim light | Warm gold `#f5b942` on upper edges |

## Facial rules

- Expression comes from eye shape, brow area, ear angle, mouth, and head angle — NOT eye size.
- Eyes are almond-shaped, moderate size, icy blue. Never giant, never glossy-anime.
- Default expression: confident, friendly, slightly playful. The Husky is mountain-experienced
  and enjoys the race — never a villain, never angry, never a puppy.
- Competitive edge is allowed in race poses (focused, determined) but warmth must remain.

## Eye rules

- Icy-blue, almond, moderate. Catchlight: single small highlight, not multi-gloss.
- Looking direction must match the pose's intent (e.g. `look-back` glances over the shoulder).

## Fur treatment

- Selective, not scribbled: cheek ruffs, chest bib, neck, curled tail, leg feathering.
- Fur strokes follow body direction. Dimensional shading gives volume; avoid flat fills.
- Thicker cold-weather double-coat look vs Kiki's shorter coat — the Husky reads fluffier.

## Pose rules

- Every pose must be the SAME Husky (markings placement, ear shape, body proportions constant).
- Full body visible in production poses unless the pose is a portrait.
- Silhouette must read clearly at ~110px gameplay size — test every pose shrunk.
- No chibi/baby proportions, no mascot symmetry, no clip-art anatomy.

## Race treatment

- Harness: red + black, identical design in every race pose (`sled-ready`, `race-steady`,
  `race-fast`, `race-turbo`, `leaning-turn`, `deep-snow`, `recover`, `look-back`,
  `encouragement`, `finish-push`, `on-sled`).
- Traces (rope lines) extend from the harness in `sled-ready` and `on-sled`.
- Snow spray is part of the art in dynamic poses — white/blue painterly spray at paws.
- `on-sled`: Husky in full stride with correct harness→trace→sled contact; sled is a simple
  wooden racing sled (environment/prop, not a character).
- Body posture: lean into speed, ears back at pace, never stiff.

## Reward / sticker treatment

- Rebuilt set (`*-v2.svg`): normal sticker, golden sticker, celebration art, album thumbnails.
- Stickers use the `portrait` pose inside the established die-cut system (white die-cut border,
  drop shadow) from `docs/STICKER_VISUAL_SYSTEM.md`.
- **Golden rule: the dog keeps its real colors.** Gold belongs ONLY to frame, halo,
  sparkles, trim. Never tint the Husky gold.
- Album thumbnails: 256px, navy card, unlocked = portrait, golden = portrait + gold ring.

## Forbidden deviations

1. No flat-vector cartoon restyle — painterly finish is the canonical language.
2. No giant/glossy anime eyes.
3. No villain/angry read — friendly competitor only.
4. No tail removal — the Husky's curled tail is identity.
5. No gold-tinted fur on golden rewards.
6. No Kiki redraws — canonical Kiki is locked; the `friendship` pose composites her
   production art unchanged.
7. No environment art — Harrison's lane.
8. No pose may change the marking layout (mask, blaze, chest bib, ear color).

## Production notes

- Poses live at `public/assets/characters/husky/husky-<pose>.svg` — SVG wrappers with embedded
  transparent PNG data URIs (the GitHub connector cannot push raw binary; raw PNGs can be
  committed by the lead dev later if desired).
- Reward set at `public/assets/rewards/husky/*-v2.svg` (new files; old round-3 files untouched).
- Suggested `KikiCharacter`-style loader mapping: pose name = filename stem
  (`idle`, `greeting`, `curious`, `confident`, `happy`, `surprised`, `sled-ready`,
  `race-steady`, `race-fast`, `race-turbo`, `leaning-turn`, `deep-snow`, `recover`,
  `look-back`, `encouragement`, `finish-push`, `on-sled`, `celebrate`, `proud`,
  `portrait`, `friendship`).

