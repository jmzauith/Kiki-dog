> **Documentation status — design proposal; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Technical integration proposal with delivered files: all 14 textures and 13 JSON files exist. Only part is used live; see the [exact integration matrix](HUSKY_ART_AND_DEPTH_STATUS.md).

# Snowy Peaks Playable Depth System

**Branch:** `harrison/snowy-peaks-playable-depth-system`
**Baseline reviewed:** `integration/husky-verified-slice` (world 3360×720, Kiki depth 15 / scale 0.8)
**Visual direction:** APPROVED AND LOCKED — no restyle, no repaint. This pass makes the
approved paintings *inhabitable*, not prettier.

## 1. Depth philosophy

Kiki must never feel like a sticker on a painting. Every scene answers five questions:

- **What is behind Kiki?** — far/mid/back layers (depths 1–7)
- **What is under Kiki?** — terrain decals, shadows, crack overlays (depths 8–13)
- **What can pass in front of Kiki?** — foreground occluders (depth 16)
- **Where can Kiki go?** — walk paths with control points + scale (metadata JSON)
- **How does the world move?** — parallax factors per layer

The cheapest depth on a Chromebook is **draw order + scale + parallax**. No shaders,
no masks, no new render pipeline. Everything here works with plain `setDepth` /
`setScrollFactor`, which the engine already uses.

Core trick: **sandwich Kiki**. Back art below depth 15, occluder art above depth 15.
The moment a bridge rail, snowbank, or doorway edge draws *over* Kiki, she lives inside
the world.

## 2. Layer hierarchy

| Layer | Depth | Scroll | Contents |
|---|---|---|---|
| far | 1 | 0.10–0.15 | distant mountains, sky haze (`ip-px-far`) |
| fx-far | 2–3 | 0.15 | drifting mist bands (`dl-mist`) |
| mid | 4 | 0.30–0.45 | distant pine groups, cliffs (`ip-px-mid`) |
| back | 5–7 | 1.0 | back scenery, landmark art (existing `wlm-*`, `lm-*`) |
| terrain | 8 | 1.0 | walkable surface decals: path, ice, deck |
| interact-behind | 10–12 | 1.0 | interactive objects behind Kiki |
| contact | 13 | 1.0 | ground shadow, crack overlays (`dl-ice-cracks`), ripples — ON the ground UNDER Kiki |
| **kiki** | **15** | 1.0 | **Kiki — unchanged** |
| fore | 16 | 1.0 (attached) / 1.2–1.25 (ambient) | foreground occluders (`dl-*`) |
| fx-near | 17 | 1.0–1.25 | snowfall, gusts, spray (`dl-snowfall`, `dl-gust`, `dl-spray-alpha`) |
| markers | 18 | 1.0 | node markers (existing — unchanged) |
| fx-top | 19 | 1.25 | foreground particles |
| ui | 20+ | 0 | UI (existing — unchanged) |

Why this works: today *all* scenery sits at depths 4–7, i.e. always behind Kiki.
Adding **one new band at 16** (foreground occluders) plus **contact at 13** fixes
9 of the 10 review findings with zero changes to existing art.

## 3. Area-by-area breakdown

| Area | World x-range | Walk-path | Key occluder | Scale story |
|---|---|---|---|---|
| Trailhead | 80–500 | meadow curve | `dl-branch-top`, `dl-trunk` | flat 0.8 |
| Broken Bridge | 620–1040 | approach → deck arc → exit | `dl-bridge-rail-front` | 0.8 → 0.74 → 0.8 (elevation) |
| Whisper Forest | 880–1300 | forest weave | `dl-trunk` ×2 (weave) | flat 0.8 |
| Frozen Lake | 1600–2080 | waypoint hops + detour | `dl-lake-edge`, cracks at 13 | flat 0.8 |
| Fallen Tree | 2050–2310 | blocked → cleared | `dl-branch-top` | flat 0.8 |
| Ice Cave | 1720–2040 | approach → mouth → interior | `dl-cave-wall` | 0.8 → 0.72 (inside) |
| Secret Igloo | 2000–2340 | trail → approach → doorway | `dl-igloo-doorframe` | 0.78 → 0.72 (entering) |
| Bone Cache | 2260–2480 | short beat | `dl-snowbank` | flat 0.8 |
| Snow Pass | 2380–2640 | climb → crest → descent | `dl-rock`, gusts at 17 | 0.8 → 0.75 → 0.78 |
| Summit Gate | 2600–2900 | approach → through gate | `dl-trunk` | 0.75 (altitude) |
| Race Camp | 2920–3260 | trail → meet → sled → start | `dl-snowbank`, canopy | 0.76 (altitude) |
| Sled Race | screen 1280×720 | 6 sections | `dl-race-pine` @1.25x | section-driven |
| Finish | screen 1280×720 | line crossing | `dl-snowbank` | 0.78 (triumph) |

Full per-area specs (control points, zones, anchors): `public/assets/worlds/snowy-peaks/depth/*.json`
(13 files, schema `snowy-peaks-depth-v1`).

## 4. Bridge depth specification (priority)

**Problem:** Kiki moves *over* the bridge image.

**Solution — the sandwich:**
- **Behind Kiki (depth 6):** existing approved bridge art — back rail, ravine, far cliff. Untouched.
- **Under Kiki (depth 8):** deck walk line. No new art needed; the deck is in the existing painting.
- **In front of Kiki (depth 16):** NEW `dl-bridge-rail-front.svg` — the front handrail as a
  transparent-background occluder, drawn from the same approved style. Kiki passes *behind* it.
- **FX (depth 17):** snow shaken off rails during the wobble beat.

**Crossing curve** (world coords, Catmull-Rom):
`(690,566,0.80)` → `(760,550,0.78)` → `(820,538,0.74)` → `(880,544,0.76)` → `(950,560,0.80)`

The scale dip 0.80 → 0.74 at mid-bridge sells elevation and distance; the y-rise sells the
deck arc. The rail occluder is strongest at x 760–900 (the deck span).

**Lennon:** draw order = back art → Kiki → rail occluder. Drive Kiki along the curve;
scale from the `scale` field per control point. No art changes.

## 5. Frozen Lake depth specification (priority)

**Problem:** the lake reads as an illustrated card.

**Solution — terrain plane:**
- The ice is a **plane**, not a backdrop: Kiki's y stays in the 560–585 band, scale ~0.8.
- **Cracks go UNDER her feet:** `dl-ice-cracks.svg` at **depth 13** (contact layer) —
  above the ice surface (depth 8), below Kiki (15). Stepping on a crack = crack visible
  underfoot, then safe-fail hop.
- **Foreground ice shelf** `dl-lake-edge.svg` at depth 16 along the bottom: Kiki's
  crossing passes *behind* the shelf at the lowest point of the path.
- **Ripple zones** at foot-contact points spawn ripple FX (depth 13).
- **Detour island** at (1830,510): slightly smaller scale (0.78) = farther.

**Lennon:** waypoints are in `depth/lake.json` (`walkPath.points`, `detour`). Safe/risky/
cracked stones are interaction anchors; the crack overlay and ripple spawns are data-driven.

## 6. Igloo depth specification

**Problem:** Kiki stands *on* the igloo illustration.

**Solution — doorway occlusion:**
- Hidden state: existing `lm-igloo-hidden.svg` mound at (2150,265), depth 6.
- Approach: Kiki scales 0.78 → 0.72 walking to the doorway.
- **Entering:** NEW `dl-igloo-doorframe.svg` at depth 16 — the curved ice-block doorway edge.
  Kiki walks *behind* it and partially disappears, then the interior close plate
  (`ip-ig-interior.svg`) takes over.
- Interior inspectables (lantern, map, reward nook) sit at depth 11 on the interior plate.

**Lennon:** the enter sequence = move along `walkPath` → swap to interior plate when Kiki
is >60% behind the doorframe. Exit reverses it.

## 7. Ice Cave depth specification

- **Mouth walls** `dl-cave-wall.svg` at depth 16 frame the entrance; Kiki enters *through*
  the open middle, occluded at the edges.
- **Inside = smaller + a band down:** Kiki drops to depth 14 / scale 0.72 inside —
  the one place she leaves depth 15, selling "interior".
- Crystals (`ip-ic-crystal-glow`) at depth 11 (behind Kiki, she reaches toward them).

## 8. Snow Pass depth specification

- **Elevation is the star:** scale 0.80 → 0.75 over the crest (control points in JSON).
- **Gusts** `dl-gust.svg` at depth 17 sweep on a timer and telegraph the timing gate.
- **Rocks** `dl-rock.svg` at depth 16: Kiki threads *behind* them on the climb.
- Heavier ambient snowfall (`dl-snowfall.svg`, scrollFactor 0.9) only in this area.

## 9. Summit / Race Camp depth specification

- **Altitude reads as scale:** the entire summit region runs Kiki at 0.75–0.76.
  One number change, instant "we're high up".
- Gate: approach at 0.78 → 0.75 at the gate; Kiki passes *through* (no occluder needed —
  the open-gate art frames her).
- Race camp: foreground drift `dl-snowbank` at depth 16 across the camp's lower third;
  canopy `dl-branch-top` at top. Meet spot left at depth 15 for Ringo's Husky (scale ~0.9).

## 10. Race depth specification

**Problem:** beautiful but static backdrop; racers slide over it.

**Solution — horizontal parallax + section plates:**
- **far (1, 0.1x):** `ip-px-far` mountains
- **mid (4, 0.3x):** `ip-px-mid` forest
- **track (8, 1.0x):** section plates swap by race progress —
  `ip-re-downhill` → `ip-re-icyturn` → `ip-re-deepsnow` → `ip-re-narrowpass` → `ip-re-finish`
- **racers (12, 1.0x):** unchanged depths; section-driven scale/tilt:
  downhill 1.0→1.08 (speed), icy turn tilt + outside racer slightly larger,
  deep snow 0.95 + heavy spray, narrow pass 1.0 with cliff-edge occlusion
- **fore (16, 1.25x):** `dl-race-pine` + `dl-snowbank` slide past *in front of* the racers —
  this one change makes the race feel fast
- **fx (17, 1.25x):** `dl-spray-alpha` kicked up behind sleds
- **checkpoint arch** (`race-checkpoint.svg`) at depth 16: racers pass *behind* it

**Lennon:** sections are data in `depth/race.json`. Foreground spawner: every ~2s spawn a
pine/snowbank at right edge, scroll left at 1.25x, despawn left. Cheap, huge feel win.

## 11. Parallax recommendations

| Layer | Scroll factor | Notes |
|---|---|---|
| far | 0.10–0.15 | mountains; slower = farther |
| mist | 0.15 | barely drifts |
| mid | 0.30–0.45 | forest; forest region gets 0.45 (denser feel) |
| world (back/terrain/kiki) | 1.0 | locked together — never separate Kiki from her ground |
| attached foreground | 1.0 | bridge rail, doorway, trunks — anchored to world spots |
| ambient foreground | 1.20–1.25 | race pines, drifting banks — speed feel only |
| fx-near | 1.0–1.25 | gusts 1.0 (in-world), race spray 1.25 |

**Do not overdo it.** Two moving planes (far + mid) behind a locked world, one faster
plane in front during the race. That is the whole system. Anything more is distraction.

## 12. Walk-path recommendations

- **Curves, not straight lines.** Every `walkPath` in the JSON uses Catmull-Rom through
  control points *except* the lake, which uses explicit waypoints (hop feel).
- Each control point carries **x, y, scale** — y gives the ground line, scale gives
  elevation/distance. Lennon interpolates both along the curve.
- **Scale language** (the whole game reads through this):
  - 0.80 — normal ground
  - 0.77–0.78 — slight rise / approach
  - 0.74–0.75 — elevation (bridge deck, pass crest, summit altitude)
  - 0.72 — interior / entering (cave, igloo doorway)
  - 0.78 — triumph (finish line, slightly larger)
- **Never separate Kiki from her shadow.** Contact shadow stays at depth 13, following
  her x/y. If the shadow lags, the depth illusion breaks instantly.

## 13. Occlusion zones

An occlusion zone = {rect, asset, depth 16, when}. Full list per area is in the JSONs;
the pattern is always one of:

1. **Pass-behind:** Kiki's path crosses behind a static occluder (bridge rail, trunk,
   doorway). Strongest depth cue in the game — use at every area at least once.
2. **Foreground drift:** an ambient strip (snowbank, branch) slides past during travel.
   Use sparingly outside the race.
3. **Edge framing:** static top/bottom framing (branches, banks) that Kiki never crosses
   behind — pure cinema, zero logic.

## 14. Scale/elevation zones

Defined per area as `scaleZones: [{x0, x1, scale, note}]`. Rules:

- Change scale **gradually** along the walk path (interpolate, never pop).
- Total range across the whole game: 0.72–0.82. Small range, big readability.
- Summit altitude is a *regional* scale (0.75–0.76 everywhere past x=2600), not a zone —
  the air itself is thinner.

## 15. Terrain metadata proposal

**Format: JSON, one file per area**, `public/assets/worlds/snowy-peaks/depth/<area>.json`,
schema `snowy-peaks-depth-v1`. 13 files shipped in this PR.

```jsonc
{
  "$schema": "snowy-peaks-depth-v1",
  "area": "bridge",
  "worldRect": {"x": 620, "y": 360, "w": 420, "h": 220},
  "layers": [{"id": "far", "depth": 1, "scrollFactor": 0.15, "contents": "..."}],
  "walkPath": {"curve": "catmullrom",
    "points": [{"x": 690, "y": 566, "scale": 0.8, "note": "approach"}]},
  "depthBands": [{"y0": 500, "y1": 570, "kikiDepth": 15, "kikiScale": 0.8}],
  "occluders": [{"asset": "dl-bridge-rail-front.svg", "x": 820, "y": 512,
                 "depth": 16, "scrollFactor": 1.0, "scale": 1.1, "note": "..."}],
  "overlays": [{"asset": "dl-ice-cracks.svg", "x": 1800, "y": 568, "depth": 13}],
  "scaleZones": [{"x0": 620, "x1": 760, "scale": 0.8}],
  "interactionAnchors": [{"id": "planks", "x": 800, "y": 545,
                 "asset": "ip-br-planks.svg", "action": "tap"}],
  "rippleZones": [{"x": 1720, "y": 575}],
  "fx": [{"asset": "dl-gust.svg", "depth": 17}],
  "noWalk": [{"x": 620, "y": 360, "w": 420, "h": 120, "note": "ravine air"}],
  "parallax": {"far": 0.12, "mid": 0.35, "base": 1.0, "fore": 1.0},
  "notes": "..."
}
```

Field semantics:
- `surface` (optional per zone): `snow | deepSnow | ice | wood | rock` — drives footstep
  FX/sound selection later. Included in schema; sparsely populated for now.
- `depthBand` / `scaleRange`: the y-bands mapping ground position → Kiki depth/scale.
- `occlusionGroup`: occluders sharing a show/hide trigger (e.g. bridge rail only during crossing).
- `walkPath`: the source of truth for movement; McCartney's logic moves Kiki *between*
  anchors, Lennon's renderer moves her *along* the path.
- `foregroundMask` / `interactionAnchor`: as named.
- `slope`: implied by consecutive control points' y/scale — no separate field needed.

## 16. Asset/layer changes required

**New assets (14)** — `public/assets/worlds/snowy-peaks/dl-*.svg` (self-contained SVG +
embedded transparent WebP; alpha extracted from isolated generations, verified by
composite test):

| Asset | Use | Key property |
|---|---|---|
| `dl-bridge-rail-front` | bridge front rail | THE bridge fix |
| `dl-ice-cracks` | lake crack overlay (depth 13) | under Kiki's feet |
| `dl-lake-edge` | lake foreground shelf | |
| `dl-igloo-doorframe` | igloo entry occlusion | Kiki disappears behind it |
| `dl-cave-wall` | cave mouth framing | |
| `dl-snowbank` | generic foreground drift | reused 5 areas + race |
| `dl-branch-top` | canopy framing | |
| `dl-trunk` | forest weave | reused |
| `dl-rock` | pass / foreground | |
| `dl-race-pine` | race foreground @1.25x | speed feel |
| `dl-snowfall` | near weather FX | |
| `dl-mist` | far weather FX | |
| `dl-gust` | snow-pass timing telegraph | |
| `dl-spray-alpha` | race / dig spray | true alpha (replaces white-bg trick) |

**Modified:** nothing. No existing asset was repainted or altered.

**Not changed:** all `lm-*` / `ip-*` art, Kiki, Husky, scene code.

## 17. Lennon integration notes

1. **Add the depth-16 band.** One-line change per occluder: draw `dl-*` at depth 16.
   Start with the bridge rail — it's the single highest-value change.
2. **Load depth JSON per area** (or all 13 at boot — they're tiny, ~2KB each).
3. **Drive Kiki along `walkPath` curves** instead of straight lerps; interpolate `scale`.
4. **Keep Kiki at depth 15 everywhere except the ice cave interior (14).**
5. **Contact layer (13):** shadow follows Kiki; crack overlay and ripples live here.
6. **Race foreground spawner:** interval-spawn `dl-race-pine` / `dl-snowbank` at right edge,
   scrollFactor 1.25, depth 16, despawn off left.
7. **Parallax:** set scrollFactor on far/mid strips per area table. World layers stay 1.0.
8. **SVG with transparency:** the `dl-*` SVGs embed transparent WebP — Phaser's SVG loader
   rasterizes with alpha intact (verified in this PR's build notes). Draw normally.
9. **Igloo enter/exit:** swap to interior plate when Kiki is >60% behind the doorframe.
10. **Do not invent new depths** outside the 1–20 table without updating this doc.

## 18. Chromebook performance considerations

- **14 new textures**, each ≤512px (most ≤384px), WebP-with-alpha: total < 1.2MB on disk,
  tiny in VRAM. No 2048px plates added.
- **Depth ordering is free.** `setDepth` costs nothing at render time; no new cameras,
  no render textures, no masks, no shaders introduced.
- **Parallax via scrollFactor** is a multiply per object — negligible.
- **13 JSON files**, ~2KB each — parse once, keep in memory.
- **Foreground spawner (race):** cap live instances (~6); reuse via simple pool.
- **FX overlays** (`dl-snowfall`, `dl-gust`) are single quads, not particle systems.
  If a real particle system comes later, these plates are the fallback.
- **SVG rasterization** happens once at load (Phaser caches the texture). No per-frame cost.
- Biggest risk is *overdraw* from stacked full-screen plates — the `dl-*` assets are
  tightly cropped to their elements (many are <512×288) specifically to keep overdraw low.

