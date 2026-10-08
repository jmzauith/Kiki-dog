# Visual Reset — Round 2 Direction

**Status:** concept / approval only. Nothing implemented in the game.
For approval by João, Aurora and Olivia.

**Deliverables** (`docs/visual-reset/round2/`):
- `01-snowy-peaks-exploration.png` — 1280×720
- `02-bridge-encounter.png` — 1280×720
- `03-husky-sled-race.png` — 1280×720
- `00-visual-direction-sheet.png` — 1280×720 treatment sheet

## What changed from round 1

Round 1 was rejected: it still read as flat SVG educational software —
geometric mountains, triangle trees, empty space, props on a background,
math UI placed on top of scenery.

Round 2 restarts from zero with a different technique and a different bar:
**painterly storybook illustration**, composed as complete screens first.
The original HTML version is the emotional benchmark; the target is to
surpass it — richer, more cinematic, more explorable.

## The three concepts

**1. Snowy Peaks exploration.** Kiki stands physically IN a snowy mountain
world: a winding path with paw prints curves past a wooden footbridge,
through varied snow-laden pines, lumpy snowbanks, rocks and ice patches,
toward a glowing ice palace on a distant peak. Foreground boughs frame the
shot; layered mountains dissolve into haze. The world visibly continues
beyond the frame. Subtle UI only (title plaque).

**2. Broken bridge encounter.** A real dramatic location: a weathered rope
bridge with missing planks and frayed ropes spans a misty ravine; Kiki
leans forward at the broken edge, worried but brave; a lantern glows on a
post; the ice palace waits beyond the gap. The math belongs to the scene:
a carved wooden sign asks "8 × 7 = ?" ("Mend the bridge!") and three
stones in the foreground snow carry the answers. Solving it would visibly
repair the bridge. No modal, no worksheet, no floating buttons.

**3. Great Husky Sled Race.** A cinematic still that communicates speed:
Kiki (blue scarf flying) chases a husky rival down a curving trail with a
banked turn; snow spray, motion-blurred foreground branches whipping past,
dense pine forest, layered mountains, and a checkered-flag checkpoint with
pennant banners and tiny spectators ahead. Steady/Turbo are small
secondary banners — the world is the star.

## Direction principles (see the sheet)

- **Snow:** sculpted, never flat — blue-violet shadows, warm highlights,
  texture pressed in; snow piles ON things.
- **Trees:** every pine a different character; dense clusters, never
  repeated triangles.
- **Rocks/cliffs:** chunky readable masses, snow lips, icicles, warm rim
  light; cliffs frame and add vertical drama.
- **Lighting:** crisp winter daylight + warm accents (lanterns, windows,
  palace). **Glow = meaning** — important things shine.
- **Atmosphere:** mist and haze separate depth layers; no flat horizon
  lines; terrain is irregular.
- **Foreground framing:** near-camera boughs and snowbanks on every shot.
- **Interactive objects:** weathered, touchable, hand-made. UI lives in the
  world — carved signs, stones, banners. Never a white modal.
- **Kiki:** physically located in the environment, large, expressive,
  reacting to the world (curious, worried, determined, joyful).

## The test

Hide Kiki and hide all UI: the environment alone must still look like a
beautiful game worth exploring. If it looks like educational browser
software, the direction is wrong.

## Production path (after approval)

These are illustrations first. Modularization for Phaser comes after the
direction is approved — options include layered raster art, texture
atlases, and hybrid assets. The concepts are composed in explicit depth
layers (sky → far mountains → mid → world → foreground) that map directly
to a parallax plan. Do not let implementation convenience lower the bar
now; decide the production technique once the look is locked.
