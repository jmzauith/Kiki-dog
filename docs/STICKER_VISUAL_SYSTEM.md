# Sticker Visual System — Kiki's Dog Adventure

How breed stickers look, how the normal / golden / locked states work, and how
to scale the system to all 12 breeds. Visual assets live under
`public/assets/rewards/`; this doc is the contract between art and integration.

Audience note: the stickers are for Aurora and Olivia (both 9). Every choice
below optimizes for one feeling: **"I earned this and I want the next one."**

## Asset inventory (Husky = breed #1)

```
public/assets/rewards/
  husky/
    husky-sticker.svg          480x480  normal sticker (die-cut)
    husky-sticker-golden.svg   480x480  golden sticker (die-cut + gold ring)
    kiki-celebrate.svg         360x360  Kiki proud pose + party hat (reward moment)
    husky-celebrate.svg        360x360  Husky celebrate pose + confetti
    reveal-burst.svg           480x480  radial gold burst (behind sticker reveal)
    confetti.svg               480x480  scattered confetti pieces (overlay)
    sparkles.svg               240x240  4-point sparkle shapes (accents)
    reward-badge.svg           360x360  gold paw badge + ribbons (milestone UI)
    album-locked.svg           256x256  locked silhouette + padlock
    album-unlocked.svg         256x256  normal sticker thumbnail
    album-golden.svg           256x256  golden sticker thumbnail
  shared/
    sticker-card-frame.svg     360x480  reusable breed card template
```

All art is hand-built SVG (no raster assets, no fonts, no external refs), so it
is crisp at any size and tiny on disk (~3–11 KB per file). Target platform is
Chrome on a Chromebook — everything here is static vector shapes plus two
cheap SVG filters (`feMorphology` dilate for the die-cut edge, one
`feDropShadow`). No animation is baked into the files; motion (reveal pop,
confetti fall, sparkle twinkle) is the integrator's job using these layers.

## Sticker anatomy (the collectible feel)

The "real sticker" read comes from three things, applied identically to every
breed:

1. **Die-cut white border** — the character art is dilated ~11px and flooded
   white behind itself, with a soft drop shadow (`filter#stickerCut`).
   The border follows the character silhouette exactly, like a physical
   die-cut sticker. Never use a plain rectangle or circle crop.
2. **Strong silhouette** — sticker poses are full-body, facing 3/4 front,
   limbs readable, tail visible. The silhouette must be recognizable at
   64px (album grid size).
3. **Drop shadow** — soft, `dy 7 / blur 7 / 28% black`, grounds the sticker
   on any background.

## Normal vs Golden treatment

| | Normal | Golden |
|---|---|---|
| Character art | full color | full color (unchanged — the character IS the reward) |
| Die-cut | white | white |
| Extra | — | metallic **gold ring** hugging the die-cut (gradient `#fff3c4 → #d9a92f → #c08f1f`), warm radial halo behind, 4-point sparkles |
| Backdrop | transparent | transparent + halo |
| Read at 64px | white edge | unmistakable gold edge |

Rules for gold: it must feel **premium, never cheap**. That means: keep the
character's true colors (no gold-tinting the dog), use a real metallic
gradient (light–mid–dark–light stops, never flat yellow), keep sparkles
small and few, and let the white die-cut sit *inside* the gold ring so the
sticker identity survives. If a golden variant ever looks gaudy at thumbnail
size, reduce sparkle count before touching the ring.

## Album states

- **Locked** (`album-locked.svg`): the breed's sticker silhouette flattened to
  near-black (`filter#silhouette`, `#141c26`) on a dark navy card, with a
  gold padlock badge bottom-center. The silhouette teases the shape without
  revealing the character — curiosity, not emptiness.
- **Unlocked** (`album-unlocked.svg`): the normal sticker, scaled.
- **Golden** (`album-golden.svg`): the golden sticker, scaled.
- Thumbnails are 256×256 with transparent backgrounds (locked keeps its own
  dark card). The album grid supplies its own cell background.

## Reward-moment layering (suggested composite, back → front)

1. `reveal-burst.svg` — full-screen or panel-sized, gold rays + center glow.
2. `confetti.svg` — overlay, can tile or drift downward.
3. Sticker (`husky-sticker.svg` / golden) — center, scale-pop in.
4. `kiki-celebrate.svg` + `husky-celebrate.svg` — flanking the sticker.
5. `sparkles.svg` — accents around the sticker edges.
6. `reward-badge.svg` — for the "adventure complete" beat, separate from the
   sticker reveal (two beats feel bigger than one).

No reward logic ships with these assets — sequencing/timing belongs to the
reward system integrator.

## Shared card template (`shared/sticker-card-frame.svg`, 360×480)

One template for all 12 breed cards. Slots (coordinates in the 360×480 space):

- **ART SLOT** — `x 26, y 26, w 308, h 308`, dashed rounded rect. Drop the
  breed's sticker SVG here, scaled to fit (~280px).
- **NAME SLOT** — `x 70, y 356, w 220, h 56` navy plate. Breed name is
  rendered by game UI text (never baked into art — fonts vary).
- **GOLD PIP SLOT** — circle `cx 312, cy 78, r 27`. Show the gold pip only
  on golden cards; hide it on normal cards.
- Corner sparkles + paw watermarks are baked decoration; keep them.

Card back: reuse the same file's outer card shape with the art slot replaced
by the breed's silhouette pattern at low opacity (integrator's option —
template supports it, art not shipped).

## Scaling to all 12 breeds — the checklist

For breed N, the artist produces:

1. `rewards/<breed>/<breed>-sticker.svg` — hero pose, same 480×480 canvas,
   same die-cut filter, same drop shadow. Same facing (3/4 front-right) so
   the album grid feels like a set.
2. `rewards/<breed>/<breed>-sticker-golden.svg` — copy the normal file,
   wrap with the gold ring + halo + sparkles. Do not redraw the character.
3. `rewards/<breed>/album-locked.svg` — silhouette filter + lock (copy the
   husky file, swap the character group).
4. `rewards/<breed>/album-unlocked.svg`, `album-golden.svg` — scaled copies.
5. Optional: `<breed>-celebrate.svg` if the breed appears in its own reward
   moment; otherwise reuse `sparkles.svg` / `confetti.svg` from husky
   (they are breed-agnostic by design).

Per-breed palette: each breed keeps its true coat colors (like the Husky's
gray/white/blue-eyes). The **system** colors never change: die-cut white
`#ffffff`, gold gradient stops above, lock gold `#f5c542`, navy `#2e3a4d`,
cream card `#fff9ef`. That consistency is what makes 12 different dogs feel
like one collection.

Naming is strict: `<breed>-sticker.svg`, `<breed>-sticker-golden.svg`,
`album-locked.svg`, `album-unlocked.svg`, `album-golden.svg`. The reward
system can then resolve every breed's assets by pattern.

## What remains (not in this PR)

- Reward sequencing / unlock logic (McCartney's lane: `docs/HUSKY_REWARD_RULES.md`).
- Real audio (hooks exist on the character side; no sounds shipped here).
- Card back art per breed (template supports it; artist pass per breed).
- Breeds 2–12 sticker sets.
