# Golden Retriever — Interaction Visual Spec

**World:** Golden Bay (Golden Retriever adventure, second breed world)
**Status:** concept / pre-production. Assets + spec only — no gameplay implementation, no scene edits.
**Companion:** `docs/GOLDEN_RETRIEVER_WORLD_VISUAL_SPEC.md` (base 51-SVG pack, §4 interaction states), `docs/GOLDEN_RETRIEVER_WORLD_LAYOUT.md` (spatial contract, encounter coordinates).

This document specifies the **interaction state variants and FX** created for the eight Golden Bay interactions. All new assets live under `public/assets/worlds/golden-retriever/interactions/`; stable texture keys are in `src/visuals/GoldenRetrieverInteractionArtPack.ts` (`GOLDEN_INTERACTION_ART_KEYS`, prefix `golden-interact-`).

Design rule throughout: **success must visibly change the environment.** Every interaction has a clear before → after read at 1280×720 Chromebook gameplay scale.

---

## 1. Dock repair — Damaged dock (1750, 520), math-gated

| State | Asset (base pack unless noted) | Visual read |
|---|---|---|
| Damaged (before) | `dock-damaged` | Missing planks, tilted section, dangling plank |
| Repair in progress | `interactions/dock-repair-pieces` *(new)* | Loose planks + post + rope coil + hammer floating beside the dock; small gold sparkles |
| Repaired (after) | `dock-repaired` | Whole dock, warm wood, solid |
| Success FX | `interactions/dock-repair-success` *(new)* | Gold starburst + teal check badge + white sparkles |

**Suggested sequence (Lennon):** math success → swap to `dock-repair-pieces` overlaid on the damaged dock → tween each piece into place (stagger ~120 ms, ease-out-back) → crossfade to `dock-repaired` → play `dock-repair-success` (scale 0.6→1, fade out ~900 ms). Pieces are drawn as one sheet; if per-piece tweens are wanted, split the sheet or tween the whole group with a slight bounce.

**Layering:** pieces overlay at depth of dock + 1; success FX at depth + 3 (above Kiki).

---

## 2. Stream / water crossing — Creek crossing (1350, 500)

| State | Asset | Visual read |
|---|---|---|
| Blocked / unsafe (before) | `interactions/stream-blocked` *(new)* | Dark fast water, white speed streaks, stones barely submerged, coral warning triangle |
| Stepping solution | `interactions/stream-stepping-route` *(new)* | Calm creek, stones clear, dotted hop arcs, gold glints growing 1→2→3 to imply order |
| Completed (after) | `interactions/stream-crossing-complete` *(new)* | Calm creek, ripple rings around settled stones, gentle glints, coral pennant on far bank |
| Wrong-stone splash | `interactions/splash-big` *(new)* | Large plume; reuse base `splash` for small mistakes |

**Suggested sequence:** on approach show `stream-blocked`; after the "calm the creek" beat (or first successful hop) crossfade to `stream-stepping-route`; highlight the next stone with a `sun-glint` tween (alpha pulse) while the player chooses; wrong stone → `splash-big` at the stone + soft shake; all stones cleared → `stream-crossing-complete` (pennant pops with a scale bounce).

**Layering:** creek band at water depth; route overlay (dotted arcs are baked into the asset — no extra layer needed); splash FX above water, below Kiki.

---

## 3. Floating toy retrieval

| State | Asset | Visual read |
|---|---|---|
| Toy drifting | base toy (`toy-tennis-ball` / `toy-rope` / `toy-stick`) + `interactions/toy-drift-wake` *(new)* | Wake ripples trailing behind the bobbing toy |
| Target / retrieval cue | `interactions/toy-target-ring` *(new)* | Coral/white concentric target rings around the toy station |
| Retrieved | `interactions/toy-retrieved` *(new)* | Tennis ball wrapped in a gold sparkle burst |
| Relay drop-off | `interactions/toy-basket-empty` / `toy-basket-full` *(new)* | Wicker basket; full version shows all three toys + sparkles |
| Celebration splash | `interactions/splash-celebration` *(new)* | Big plume + confetti dots + white glints |

**Suggested sequence:** toy bobs on `ripple-ring` (base) + `toy-drift-wake` behind it → on Kiki's grab range show `toy-target-ring` (pulse scale 1↔1.12, ~600 ms loop) → grab → toy tweens to Kiki's mouth anchor → `toy-retrieved` pops at the catch point → drop into basket: swap `toy-basket-empty` → `toy-basket-full` per toy, with `splash-celebration` on the third.

**Layering:** wake under toy; target ring under toy (depth − 1); retrieved burst above.

---

## 4. Boathouse — (2050, 480), exploration-gated

| State | Asset (base pack unless noted) | Visual read |
|---|---|---|
| Closed (before) | `boathouse-closed` | Shut double doors, porthole, lock cue |
| Opening | `interactions/boathouse-opening` *(new)* | Doors half-swung, warm light wedge spilling onto the ground |
| Open (after) | `boathouse-open` | Doors swung, canoe + warm interior |
| Warm interior / reward cue | `interactions/boathouse-warm-glow` *(new)* | Radial warm glow + canoe prow silhouette + white glints (overlay) |

**Suggested sequence:** unlock → crossfade closed → opening (hold ~800 ms, doors could also be two separate tweens if the sheet is split) → `boathouse-open` → fade in `boathouse-warm-glow` over the doorway (alpha 0→0.9, additive feel via `setBlendMode(ADD)` if cheap) → reward cue sparkles.

**Layering:** glow overlay at doorway depth + 2, below Kiki.

---

## 5. Log obstacle — Log jam (2500, 540), push/move

| State | Asset (base pack unless noted) | Visual read |
|---|---|---|
| Blocked (before) | `log-pile` | Stacked logs + coral "!" cue |
| Movable | `interactions/log-movable` *(new)* | Top log shifted with motion lines + two coral push arrows |
| Cleared (after) | `interactions/log-cleared` *(new)* | Open dirt path, logs resting aside, gold glints |

**Suggested sequence:** on approach (after the push prompt is earned) swap `log-pile` → `log-movable`; on push success, tween the top log aside (or crossfade) → `log-cleared` with a small dust `pollen-puff` (base FX). The cleared path must read as walkable: keep the dirt path shape centered where Kiki will walk.

**Layering:** same depth as `log-pile` was.

---

## 6. Pawprint trail

| State | Asset | Visual read |
|---|---|---|
| Hidden / subtle | `interactions/paw-trail-hidden` *(new)* | Same prints at 22% opacity — barely there |
| Revealed | `interactions/paw-trail-revealed` *(new)* | Clear golden-brown prints with dark outline |
| Complete route cue | `interactions/paw-trail-guiding` *(new)* | Prints + dotted white guide line + gold glints above |

**Suggested sequence:** trail starts `hidden`; on sniff/discover beat crossfade to `revealed` (~600 ms); when the trail becomes the active guide, swap to `guiding` and tween glints (alpha pulse). All three share identical print positions so swaps are seamless.

**Layering:** ground decal depth (below Kiki, above path strip).

---

## 7. Hidden picnic cache — Meadow (1050, 520), optional discovery

| State | Asset (base pack unless noted) | Visual read |
|---|---|---|
| Hidden (before) | `basket-hidden` | Grassy mound |
| Partially discovered | `interactions/basket-partial` *(new)* | Mound half-dug, wicker basket corner peeking out, one gold glint |
| Open / revealed (after) | `basket-open` | Dug hollow, basket + treats, golden glints |

**Suggested sequence:** sniff prompt → `basket-partial` (mound "opens" — crossfade ~500 ms) → dig complete → `basket-open` + `sun-glint` sparkles.

---

## 8. Golden tennis ball secret — Willow grove (2150, 300)

| State | Asset (base pack unless noted) | Visual read |
|---|---|---|
| Hidden (before) | `willow-curtain` | Closed weeping strands |
| Discovered | `interactions/willow-curtain-parted` *(new)* | Strands swept aside, warm glow of the grove beyond |
| Special glow / reward cue | `interactions/golden-ball-glow` *(new)* | Radiant halo + gold rays + white sparkles (overlay; the `golden-ball` itself shows through the transparent center) |

**Suggested sequence:** Kiki pushes through → crossfade curtain → parted (~700 ms; strands could sway via a gentle rotation tween on the whole asset) → `golden-ball` fades/scales in at the grove center → `golden-ball-glow` overlay pulses (alpha 0.7↔1, slow) while the reward prompt is up.

---

## Animation timing cheat-sheet

| Beat | Suggested timing |
|---|---|
| State crossfades (blocked → solution → complete) | 500–700 ms, ease-in-out |
| Piece fly-in (dock repair) | stagger 120 ms, ease-out-back, ~450 ms each |
| Success FX (all) | scale 0.6→1 + fade out, ~900 ms total |
| Target ring pulse | scale 1↔1.12, 600 ms yoyo loop |
| Glint twinkles | alpha 0.4↔1, 700–1000 ms, staggered |
| Splashes | one-shot ~600 ms, then fade |

## Performance notes (Chromebook)

- All 22 interaction SVGs are small (largest 480×300); rasterize once at load via the preload helper — zero per-frame cost.
- Ambient loops are 2–3 alpha/scale tweens max per interaction; pause tweens for off-screen interactions.
- Overlays (`boathouse-warm-glow`, `golden-ball-glow`) are single sprites; prefer alpha tweens over blend modes, or use ADD sparingly (one at a time).
- No filters, no gradients animated per frame — all gradients are baked.

## Integration notes for Lennon

- New folders: `public/assets/worlds/golden-retriever/interactions/` (22 SVGs). Nothing in the base `golden-retriever/` folder was touched.
- Preload: `preloadGoldenRetrieverInteractionArt(this)` from `src/visuals/GoldenRetrieverInteractionArtPack.ts` (new file, additive — does not modify `GoldenRetrieverArtPack.ts` or any scene).
- Keys: `GOLDEN_INTERACTION_ART_KEYS` (prefix `golden-interact-`). Filenames are kebab-case and match the key names.
- `toy-target-ring`, `dock-repair-success`, `splash-celebration`, `glint-shower` (challenge) are generic enough to reuse in later worlds — consider promoting to shared FX later.
- `retriever-silhouette` (in the challenge pack) is a **placeholder for Ringo** — simple environmental figure, no animation; replace with his character art when available.
- This PR depends on the base concept pack branch (`harrison/golden-retriever-world-concept-pack`, PR #13) for the base assets referenced above (`dock-damaged`, `boathouse-closed`, `log-pile`, `willow-curtain`, toys, etc.). Merge #13 first, or merge both together.
