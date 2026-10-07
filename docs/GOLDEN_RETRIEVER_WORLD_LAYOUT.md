# Golden Retriever World — Layout Contract

**World:** Golden Bay (second breed world for Kiki's Dog Adventure)
**Status:** concept / pre-production. No scene implementation yet.
**Dimensions:** `3600 × 720` world units (~2.8× the 1280×720 viewport).

This document is the spatial contract for the future Golden Retriever
adventure, in the spirit of `HuskyWorldLayout.ts`. When the adventure is
built, node coordinates should follow this file; if they move, update it.

---

## Regions

| Region | X range | Character |
|---|---|---|
| 1. Sunny Meadow | 0 – 1200 | Warm grasslands, oaks, wildflowers, picnic area. Safe, joyful, tutorial-friendly. Golden-hour light. |
| 2. Willow Wetlands | 1200 – 2400 | Reeds, cattails, creeks, docks, boathouse, waterwheel. Water crossings, gentle puzzles. Light gets greener, more dappled. |
| 3. Golden Bay | 2400 – 3600 | Sandy beach cove, Retriever Club, dive platform, buoy course, floating finish arch. Triumphant, open water, festival pennants. |

Region transitions are marked by landmarks, not walls: the meadow trail
narrows into a reed-lined creek path (~x 1200); the wetlands open onto the
beach through a willow-framed gap (~x 2400, `willow-curtain` motif).

## Key encounter coordinates (proposed)

| Encounter | Position | Notes |
|---|---|---|
| World entrance | (260, 560) | `sign-golden-bay` arch. Start node. |
| Meadow math | (700, 540) | `sunflower` patch encounter. First math. |
| Picnic basket (optional) | (1050, 520) | `basket-hidden` → `basket-open`. Optional discovery. |
| Creek crossing | (1350, 500) | `stream-stones` / `footbridge`. Traversal beat. |
| Damaged dock | (1750, 520) | `dock-damaged` → `dock-repaired`. Math-gated repair. |
| Boathouse | (2050, 480) | `boathouse-closed` → `boathouse-open`. Exploration-gated. |
| Waterwheel | (2250, 500) | `waterwheel` activation. Optional side beat. |
| Log jam | (2500, 540) | `log-pile` blocking → cleared. Push/move interaction. |
| Bay overlook | (2720, 470) | Vista beat; camera reveal of the bay. |
| Dive platform | (3050, 470) | Final challenge start. |
| Floating finish arch | (3320, 470) | Final challenge destination. |

## Optional secret positions

| Secret | Position | Notes |
|---|---|---|
| Willow grove (golden tennis ball) | (2150, 300) | Behind `willow-curtain`; `golden-ball` reward cue. The world's "secret igloo". |
| Lily-pad hop | (1900, 560) | `lily-pad` chain; purely playful, no fail state. |
| Crab cove | (2900, 600) | Tiny beach nook with `pebbles` + shells; flavor only. |

## Final challenge coordinates

- **The Golden Bay Rescue Relay** (see visual spec §4).
- Start: dive platform (3050, 470). Course: buoys at (3120, 470), (3200, 470), (3280, 470) with floating toys between them. Finish: `finish-arch-float` at (3320, 470).

## Camera / parallax recommendations

- `camera.setBounds(0, 0, 3600, 720)`; follow Kiki with lerp ~0.08 and a
  negative follow offset (`setFollowOffset(-200, 0)`) so she rides
  left-of-center and the path ahead stays visible.
- Parallax (4 layers + sky):
  - Sky (fixed, scrollFactor 0): warm gradient + sun + drifting clouds.
  - Far (0.1): soft distant hills/tree line silhouette (to be drawn).
  - Mid (0.3): `willow-tree` / `oak-tree` clusters, tileable reed beds.
  - World (1.0): everything interactive.
  - Foreground (1.0, depth 14): `grass-tuft`, `reeds-cluster`, `cattails`
    at the bottom edge + occasional `willow-curtain` strands hanging from
    the top edge for near-camera framing.
- Water: the lake/bay is a band across regions 2–3 at y ≈ 480–720 behind the
  trail; `water-strip` tiles horizontally, `water-shore` marks the edge.
- Warm haze: a fixed full-screen gradient overlay (peach, alpha ~0.12) sells
  golden hour without per-frame cost.

## Future node spots

When the Golden adventure's progression graph is designed, place nodes at
the encounter coordinates above. Suggested graph beats in order:
start → meadow math → creek crossing → dock repair → boathouse →
waterwheel (optional) → log jam → bay overlook → dive platform
(rescue relay) → finish arch. Secrets (picnic basket, willow grove,
lily-pad hop, crab cove) attach as optional branches off their nearest
encounter.

## Asset manifest

51 SVGs in `public/assets/worlds/golden-retriever/` — see
`docs/GOLDEN_RETRIEVER_WORLD_VISUAL_SPEC.md` §6 for the full table.
Preload helper: `src/visuals/GoldenRetrieverArtPack.ts`
(`preloadGoldenRetrieverArt`, stable `GOLDEN_ART_KEYS`).
