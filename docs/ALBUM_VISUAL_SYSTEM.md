# Album Visual System — Kiki's Dog Adventure

The full-album visual contract: cover, spread, slot states, the special Kiki
endgame slot, completion elements, and UI language. Assets live under
`public/assets/album/` (album chrome + UI) and `public/assets/rewards/kiki/`
(the final collectible). This doc is the contract between art and integration
(Lennon's lane).

Audience note: the album is for Aurora and Olivia (both 9). Every choice
optimizes for one feeling: **an empty album you immediately want to fill, and
a Golden Kiki that feels like the true ending of the whole game.**

Stylistic parent: `docs/STICKER_VISUAL_SYSTEM.md` (round 3). The album reuses
its die-cut language, gold hierarchy, and palette exactly:
die-cut white `#ffffff`, gold gradient `#fff3c4 → #f7d774 → #d9a92f →
#f9e28a → #c08f1f`, lock gold `#f5c542`, navy `#2e3a4d` / `#141c2a`, cream
`#fff9ef`. The one new color is **violet** (`#4a3563 → #241b38`), reserved
exclusively for Kiki's special slot — nothing else in the game uses it, so
the final reward reads as "different" at a glance.

## Final 12-breed roster (fixed)

1. Husky · 2. Golden Retriever · 3. Beagle · 4. Dachshund · 5. Border Collie ·
6. Dalmatian · 7. Shiba Inu · 8. Bernese Mountain Dog ·
9. Cavalier King Charles Spaniel · 10. Labrador Retriever · 11. Chow Chow ·
12. Pug

Poodle and Samoyed are **out** — do not include them anywhere.

## Why Kiki is separate from the 12

Kiki is the player's companion through every adventure, not a breed to
"collect" — you can't earn a sticker of the friend who helped you earn them.
Making her the 13th, gated-behind-everything reward turns the album's ending
into a story beat ("my journey with Kiki is complete") instead of a 13th
checkbox. Her slot is therefore visually distinct in shape (starburst seal,
not rounded card), color (violet, not navy/cream), and scale (larger).

## Asset inventory

```
public/assets/album/
  album-cover.svg            1280x720  sticker-book cover (title plate empty, Kiki emblem, 12 journey dots, tilted Husky sticker)
  album-spread.svg           1280x720  open spread: 12 baked slot frames, title plate, progress ring, mystery-Kiki hint
  slot-base.svg              256x256   reusable empty breed slot (cream card, dashed art window, empty name plate)
  slot-locked-overlay.svg    256x256   navy tint + gold padlock (composites over base + silhouette)
  slot-golden-ring.svg       256x256   gold frame + sparkles (composites over base + golden sticker)
  breeds/
    silhouettes.svg          1024x768  12 placeholder silhouettes, 256px cells, order = roster order
  kiki/
    kiki-emblem.svg          256x256   reusable Kiki medallion (cover, Kiki slot, quiz unlock)
    kiki-slot-locked.svg     480x480   mysterious locked ultimate slot + empty message plate
    kiki-slot-quiz.svg       480x480   quiz-available state (glowing seal + "?" badge; glyph is placeholder)
  ui/
    name-plate.svg           240x64    empty breed name plate (UI renders text)
    progress-badge.svg       160x160   empty center (UI renders "n/12")
    lock-badge.svg           96x96     standalone gold padlock
    golden-pip.svg           64x64     golden indicator pip
    completion-seal.svg      256x256   empty rosette seal (UI renders "12/12" or check)
    nav-arrow-left.svg       96x96     page-back treatment
    nav-arrow-right.svg      96x96     page-forward treatment
    page-tab.svg             200x80    page tab shape (empty)
  completion-1212.svg        640x360   laurel + rosette, empty center (12/12 beat)
  quiz-unlocked.svg          640x360   Kiki medallion burst + "?" badge + empty ribbon
  celebration-full.svg       960x540   full-screen finale stage (empty gold ring = Golden Kiki drop-in)
public/assets/rewards/kiki/
  kiki-sticker-golden.svg    480x480   THE final collectible (see below)
```

All art is hand-built SVG (no raster, no fonts except the two placeholder "?"
glyphs, no external refs). Static vector + cheap SVG filters only
(`feMorphology` dilate, one `feDropShadow`); ~2–18 KB per file.
Chromebook-first.

## Slot dimensions

- Breed slot component: **256×256** (`slot-base.svg`). Art window:
  `x 30, y 22, w 196, h 164` (dashed). Name plate: `x 48, y 198, w 160,
  h 42` (empty — UI text).
- On the 1280×720 spread the 12 slots are baked at **170×170** each
  (3 cols × 2 rows per page; same proportions, same plate ratio).
- Kiki special slot: **480×480** files, displayed larger than breed slots
  wherever it appears (~1.5× breed slot size recommended).

## Slot states (breed slots)

| State | Composite (back → front) |
|---|---|
| Locked | `slot-base.svg` + `breeds/silhouettes.svg` cell N + `slot-locked-overlay.svg` |
| Normal unlocked | `slot-base.svg` + `rewards/<breed>/<breed>-sticker.svg` |
| Golden unlocked | `slot-base.svg` + `rewards/<breed>/<breed>-sticker-golden.svg` + `slot-golden-ring.svg` |

Silhouette cells: `silhouettes.svg` is 1024×768, cells 256×256 in roster
order (cell 0 = Husky … cell 11 = Pug). Integrator crops
`(col*256, row*256, 256, 256)`.

Locked = curiosity, not emptiness: the breed's silhouette is recognizable
but unreadable as a character, on the dark card with the gold padlock.

## Final Kiki slot behavior

Three visual states, driven by collection progress:

1. **Locked** (`kiki/kiki-slot-locked.svg`) — violet starburst seal, Kiki
   silhouette (mysterious, larger than breed silhouettes), gold padlock,
   empty message plate below (UI renders e.g. "Complete all 12 adventures
   to unlock" — copy is the UI's job, the plate is sized `x 70, y 382,
   w 340, h 66` in the 480 space).
2. **Quiz available** (`kiki/kiki-slot-quiz.svg`) — the seal ignites gold:
   rays, glowing ring, Kiki in full color, "?" quiz badge. This is the
   "something amazing just unlocked" beat.
3. **Earned** — `rewards/kiki/kiki-sticker-golden.svg` occupies the slot
   (optionally inside `celebration-full.svg`'s center ring for the reveal).

The Kiki slot must never be rendered with the breed-slot components — no
cream card, no dashed window, no navy plate. Violet + starburst is its
identity.

## 12/12 completion presentation (recommended sequence)

1. 12th sticker lands → `completion-1212.svg` beat (laurel + seal, UI
   renders "12/12" in the empty center).
2. Kiki slot transitions locked → quiz state (see transition below);
   `quiz-unlocked.svg` banner.
3. Ultimate Corgi Quiz passed → `celebration-full.svg` stage, Golden Kiki
   sticker scale-pops into the center ring, confetti layers from round 3
   (`rewards/husky/confetti.svg`, `sparkles.svg`) drift over it.

## Golden Kiki treatment (why it's more prestigious)

Breed goldens = gold ring hugging the die-cut + halo + sparkles. Golden
Kiki adds, in order of importance:

1. **Gold rim outside the white die-cut** (dilate-22 gold silhouette behind
   the dilate-11 white cut) — a double frame no breed sticker has.
2. **Crown motif** above her head (gold gradient, ruby gem).
3. **Completion halo** — larger, warmer radial glow than breed halos.
4. **Outer thin gold ring** (r 224) + gold paw prints set into the ring.
5. **More elaborate composition** — 6 sparkles vs the breed standard 4.

The dog herself keeps her true colors (orange/tan `#d98f3e`, white chest /
blaze / muzzle). **Never gold-tint Kiki** — the prestige lives in the
frame, which is exactly why it reads as "honor bestowed on the real Kiki."

## How future sticker art drops into each slot

For breed N (2–12), the artist ships, per `docs/STICKER_VISUAL_SYSTEM.md`:
`<breed>-sticker.svg` (480×480, 3/4 front-right hero pose, die-cut filter),
`<breed>-sticker-golden.svg` (same + gold ring treatment), and the slot
system needs nothing new — the base/locked-overlay/golden-ring components
and the silhouette sheet already cover all states. When real art lands,
delete that breed's silhouette cell usage (keep the sheet for reference).

Naming stays strict: `public/assets/rewards/<breed>/<breed>-sticker.svg`.

## Recommended reward animations (integrator's job)

- Slot unlock: silhouette cross-fades to sticker with a 180ms scale-pop
  (1.0 → 1.12 → 1.0) + `slot-golden-ring.svg` fades in on golden.
- Kiki slot quiz transition: locked seal scales down slightly, gold rays
  wipe in, quiz state scales up with a soft glow pulse (2 pulses, then rest).
- Golden Kiki reveal: `celebration-full.svg` fades in → sticker drops from
  top with squash-and-stretch landing in the center ring → crown does a
  tiny celebratory bounce (it's a separate group, easy to animate).
- Album page turns: slide + slight rotate; slots stagger-fade in
  (40ms stagger reads as "filling up").

## Recommended transition when the Ultimate Corgi Quiz unlocks

The single most important transition in the game. Suggested: the album
auto-pans to the Kiki slot, everything else dims 30%, the violet seal
pulses twice, gold rays burst outward, quiz state cross-fades in with a
rising chime (audio hook), then `quiz-unlocked.svg` slides up as a banner.
Hold 1.2s before the quiz actually opens — anticipation is the reward.

## Layout / responsive recommendations

- Authoritative composition: **1280×720** (Chromebook). All slots and
  plates are vector — scale uniformly.
- Below 1100px width: switch the spread to **paginated single pages**
  (6 slots each) using `ui/page-tab.svg` + `ui/nav-arrow-*.svg`; slot
  components are resolution-independent so no asset changes are needed.
- Keep the Kiki slot at ≥1.5× breed slot size at every breakpoint — its
  hierarchy must survive small screens.
- Safe area: keep interactive slots inside a 64px margin (Chromebook
  shelf / window chrome).

## Performance notes

- Every file is static SVG, 2–18 KB; the whole album system is ~150 KB.
- Filters used: `feMorphology` dilate (die-cut, gold rim, silhouette),
  one `feDropShadow` (stickers only). No animated filters, no masks, no
  gradients-on-text. All cheap on Chromebook Chrome.
- `celebration-full.svg` is the heaviest (confetti + rays) — show it only
  during the finale beat, then remove from DOM.
- Silhouette sheet: one HTTP request for all 12 placeholders.

## What remains (not in this PR)

- Quiz logic + album state logic (McCartney's registry/endgame lane;
  visual states here map 1:1 to `UltimateRewardState` /
  `GoldenKikiUnlockState`).
- Real sticker art for breeds 2–12 (placeholder silhouettes ship here).
- Reward sequencing/timing (integrator).
- Real audio (hooks exist on the character side).
- The two "?" glyphs are placeholders — UI should render real text/badges.
