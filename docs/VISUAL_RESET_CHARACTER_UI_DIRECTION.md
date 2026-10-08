# Visual Reset — Character & UI Direction

**Project:** Kiki's Dog Adventure · **Lane:** Ringo (character/UI art)
**Status:** approval prototype — no implementation, no scene changes, no art overwritten
**Prototype files:** `docs/visual-reset/ringo/` (6 SVGs, this doc)
**Audience verdict that triggered this:** Aurora and Olivia reviewed the Phaser graphics and
strongly preferred the original HTML version. This document defines the new visual language
that reconnects with that charm — and exceeds it.

---

## 1. What the girls responded to (the HTML benchmark)

Studying the original HTML version's screens (player select, world map, Husky intro,
Husky adventure map), the charm comes from five things:

1. **Painterly softness.** Nothing is flat. Fur, wood, and panels are rendered with layered
   radial gradients — light falls from the upper-left, forms feel touchable.
2. **Kiki as a premium protagonist.** Big glossy eyes with double highlights, soft blush,
   fluffy cheek ruffs, a real muzzle with a shiny nose. She looks *expensive*, not clip-art.
3. **Tactile UI.** Everything is rounded and chunky: wooden plaques with carved borders and
   nails, cream cards with thick warm borders, pill buttons with top-gloss highlights and
   soft drop shadows. Buttons beg to be tapped.
4. **Adventure-embedded math.** The math question lives in a cream card with a bone crest —
   it reads as "part of the quest," never as a worksheet.
5. **Warm, saturated color.** Cream/ivory panels, deep navy text, wooden browns, gold stars,
   sky blues. Cheerful without being toddlerish.

## 2. How the new Kiki differs from the current Phaser version

> **v2 revision (current):** the v1 style sheet was rejected by João as too cartoon —
> flat fills, blobby muzzle, wing-like cheek tufts. v2 was rebuilt from the HTML
> Kiki reference: narrower blaze that flows into the muzzle as one white mask,
> dense layered cheek ruffs hugging the head, compact nose + mouth, wide-based
> ears, and larger profile heads with real necks on side views. The table below
> describes v2.

| Current Phaser Kiki | New direction |
|---|---|
| Flat fills, dark brown outline strokes (`#8e5227`, 2–3px) | Layered radial gradients; contours suggested by darker fur tones, thin warm outlines only where needed |
| Dot/pill eyes, minimal highlights | Large glossy eyes: dark-amber iris gradient, big upper-left highlight + small secondary sparkle |
| Perfectly circular head, geometric body | Dense layered cheek ruffs (5-row tuft fans) hugging the head — broken silhouettes that read as *fluff* |
| One generic smile | Expression system (see §6): happy / curious / thinking / surprised / proud each change eyes + brows + mouth + head angle together |
| Ears as sharp triangles | Wide-based ears (64×58) with rounded tips, pink inners, and tip furnishings |
| Legs as plain rects | Rounded legs with cream paws; trot uses wide diagonal pairs, race extends and leans |
| White blaze as a separate stripe + balloon muzzle | One white mask: blaze flows into the muzzle with wavy edges; compact nose + mouth sit inside it |

The single biggest shift: **from vector-icon construction to soft-illustration rendering.**
Same SVG technology, completely different hand.

## 3. How it reconnects with the HTML charm (and exceeds it)

- **Kiki's face** follows the HTML Kiki beat-for-beat: white blaze down the forehead,
  white muzzle, black shiny nose, open smile with tongue for joy, pink blush zones.
- **UI shapes** copy the HTML vocabulary: wooden plaques for locations, navy pills for
  status, cream cards with warm orange borders for math, chunky answer buttons.
- **Where it exceeds:** the HTML Kiki is a single painted render; our Kiki is a *system* —
  8 consistent expressions on one rig, so she can act across every scene. The HTML UI is
  DOM/CSS; ours is specified as game-native vector components (medallions, plaques,
  panels) that work at any resolution on the Chromebook.

## 4. Character proportions (Kiki) — v2 rig

Front rig (400×400 cell, art drawn at 0.9 scale): head ellipse 86×74 at cy=150;
eyes rx=15 ry=18 at (±46, cy−2) — always the darkest value on the face so they
read first at small sizes; white mask max half-width ~27px at the cheeks;
compact nose 26×19 with white specular dot; body ellipse 72×78 with layered
cream chest ruff; short legs 30×52 with cream paws.
Side rig: body 196×112 (long corgi loaf), head scaled 1.18× with a furred neck
bridge to the chest, plumed tail curling from the rump, short legs 26×62–70.

Rules for production:
- Head never smaller than 40% of body height in expressive poses.
- Ears: 64 wide × 58 tall, wide-based triangles with rounded tips, pink inners.
- Fur direction follows the body; tuft fans denser on cheeks, chest ruff, haunches.
- Realism must survive 120px: verified — face reads (blaze/eyes/nose), trot reads
  (body/head/legs/tail) at gameplay scale.

## 5. Line treatment

- **Characters:** 2.5–3.5px warm dark outlines (`#7a4a1e` fur, `#54637a` husky gray,
  `#2c3a4e` mouths) with `stroke-linejoin="round"`. Outlines are *warm*, never black.
- **UI wood:** 4px `#5f3c17` outer + 2.5px inner carved line at 65% opacity.
- **UI panels:** cream cards use 4px warm orange (`#e8912d`); answer buttons 3–4px deep
  navy (`#2b3a55`).
- Interior detail lines (mouth, brows, fur tufts): round caps, no sharp corners anywhere.

## 6. Shading

- One light source: upper-left. Every fur mass gets a radial gradient
  (`#f8bd67` → `#efa14a` → `#d97f2e`) plus a white overlay ellipse at 14–16% opacity,
  upper-left.
- Contact shadows: blurred cool ellipse (`#1d3a5f`, 12–14%) under characters.
- Buttons: top-gloss white rounded rect at 22% opacity over the upper half.
- Stickers/medallions: gold radial ring + white inner + a white arc highlight at 50%.

## 7. Palette

| Role | Values |
|---|---|
| Kiki fur | `#f8bd67` / `#efa14a` / `#d97f2e`, shade `#b0621d` |
| Kiki cream | `#fffdf8` → `#f2e2c6` |
| Husky gray | `#c3cfdb` / `#a7b6c6` / `#8494a8`, shade `#67778d` |
| Wood | `#b57e42` → `#7c4e22`, dark `#5f3c17` |
| Navy ink | `#2b3a55` text, panels `#31435f` → `#1d2942` |
| Cream UI | `#fffdf5`, border `#e8912d` |
| Gold | `#ffe9a8` → `#f7c948` → `#dd9a1f` |
| Buttons | green `#7ed957→#3faf3c`, blue `#5db9f5→#2f7fd0`, orange `#ffb14e→#ef7d1a`, purple `#c58af0→#8e4fd1` |
| Accents | blush `#f0907e`, tongue `#f27d8c`, inner ear `#f4a9b8` |

Backgrounds stay light and airy (sky `#8ed4f7→#eef9ff`, snow `#ffffff→#dceefb`);
reward/celebration moments go deep navy (`#1d2942`) so gold pops.

## 8. Facial-expression rules

Expressions are *chords*: eyes + brows + mouth + head angle change together.

- **idle:** open glossy eyes, gentle closed smile, head level.
- **happy:** eyes become upward arcs (no pupils), mouth opens with tongue, blush to 60%.
- **curious:** head tilts −8°, pupils shift toward the point of interest, small smile.
- **thinking:** pupils up-left, one paw raised to chin, mouth a flat short line, tilt +7°.
- **surprised:** eyes +2px, brows become raised arcs, mouth a small vertical oval, ears at
  maximum perk.
- **proud:** eyes half-lidded (fur-colored lid ellipse over upper eye), one brow angled,
  smirk, chin (head) raised 7px, chest forward.
- **race:** side rig; determined angled brow, panting tongue, ears swept back −24°,
  speed lines behind.

Never: empty dot eyes, frozen smile across emotions, or toddler proportions
(head > 55% of height).

## 9. UI shape language

- **Plaques** (locations, titles, big announcements): carved wood, cream 900-weight text,
  nails at the sides. Used sparingly — 1–2 per screen.
- **Panels** (dialogue, interaction): deep navy, 18px radius, white 800-weight headline +
  `#c9d6ea` 600-weight subline. This is where Kiki "speaks."
- **Math cards:** cream, 5px `#e8912d` border, 24px radius, bone-crest header, 44px+
  900-weight question, 2×2 chunky answer buttons (cream, 3px navy border, 34px numerals).
- **Pills** (status, notifications, challenge buttons): full-round, gradient fill, white
  gloss, soft shadow, 26–30px 900-weight text.
- **Medallions** (stickers, avatars, nodes): gold radial ring, cream inner, gloss arc.

## 10. Typography recommendations

- Display/titles: a rounded bold sans (e.g. **Nunito 900**, Baloo 2, or Arial Rounded) —
  white on wood/navy, `#2b3a55` on cream. Never thin or condensed.
- Body/UI text: same family at 600–800. Minimum 18px at 1280×720 for hints.
- Numbers (math, scores): 900 weight, 34px+.
- Baked text in art: avoid. All labels in these prototypes are placeholders for
  game-rendered text (fonts vary by device).

## 11. Button hierarchy

1. **Primary action** (green pill, e.g. "KEEP GOING"): largest, top gloss, drop shadow.
2. **Challenge option** (orange pill, e.g. "ICE SHORTCUT"): same size, warm color signals
   risk/reward; always paired with a small caption ("harder math · golden progress").
3. **Answers** (cream chunky, navy border): equal weight, 2×2 grid, generous tap targets.
4. **Secondary** (blue pill / text button, e.g. "Leave adventure"): quieter, smaller.

## 12. Sticker / reward presentation

- Earned sticker appears in a **gold medallion** (not a flat card) with a red "NEW!"
  ribbon, on a **deep-navy celebration field** with golden burst rays and confetti —
  maximum contrast with the bright adventure screens, so the moment feels like an event.
- Kiki (happy) and the relevant breed (celebration pose) flank the medallion.
- Wooden plaque announces it ("STICKER EARNED!"); subtitle names the world + album owner.
- Golden variants: gold lives in the **frame/halo**, never recolors the dog.

## 13. From prototype to production assets

This prototype is the *art bible*, not the pipeline. Conversion path:

1. **Approve the 8 Kiki poses + 3 Husky poses** (this PR). Lock proportions, palette,
   expression rules.
2. **Rebuild as layered parts** (head / ears / body / legs / tail as separate groups with
   stable IDs) so animation can tween parts instead of swapping whole drawings.
3. **Extend the pose library** from the approved rig — walk-cycle frames, transitions —
   using the same builders; every new pose reuses the locked head construction.
4. **Slice medallions/stickers** from the approved faces (the reward-screen composition
   shows the recipe: face → cream inner → gold ring → gloss arc).
5. **UI kit → theme file**: plaques, panels, pills, buttons become nine-slice / parametric
   components with the exact radii, borders, and gradients specified here.
6. Keep the **HTML benchmark** as the permanent emotional reference; every future asset
   should pass the test: *"Would Aurora and Olivia say that's Kiki — and better than before?"*

---

*Files: `kiki-style-sheet.svg` (8 poses) · `husky-style-sheet.svg` (3 poses) ·
`ui-components.svg` (9 component groups) · `interaction-screen.svg` (1280×720 mockup) ·
`reward-screen.svg` (sticker-earned concept) · `album-concept.svg` (collection spread concept)*
