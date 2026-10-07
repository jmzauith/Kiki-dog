# Golden Bay Rescue Relay — Final Challenge Visual Spec

**World:** Golden Bay (Golden Retriever adventure) — final challenge
**Status:** concept / pre-production. Assets + spec only — no gameplay implementation, no scene edits.
**Concept source:** `docs/GOLDEN_RETRIEVER_WORLD_VISUAL_SPEC.md` §5 (The Golden Bay Rescue Relay).

The Rescue Relay is the emotional opposite of the Husky sled race: not a speed contest but a **skill course** — Kiki dives from the dive platform, swims a buoy-marked course, and retrieves three floating toys one by one, bringing each back through the floating finish arch. Each leg is math-gated. The finale is a lakeside regatta celebration: festival pennants, golden sun-glint shower, Kiki's proud retrieve pose.

All new assets live under `public/assets/worlds/golden-retriever/challenge/`; stable texture keys are in `src/visuals/GoldenRetrieverInteractionArtPack.ts` (`GOLDEN_CHALLENGE_ART_KEYS`, prefix `golden-challenge-`).

---

## Challenge sequence (visual beats)

Spatial anchors from `docs/GOLDEN_RETRIEVER_WORLD_LAYOUT.md`: dive platform (3050, 470) → buoys at (3120, 470), (3200, 470), (3280, 470) with floating toys between them → finish arch (3320, 470).

| # | Beat | Assets | Visual |
|---|---|---|---|
| 0 | Challenge intro | `relay-start-banner` *(new)* over `dive-platform` (base) | Pennant strings + blank center ribbon (UI renders "GO!"/leg text) |
| 1 | Dive! | `splash-dive` *(new)* | Tall dramatic plume at the platform edge |
| 2 | Swim leg | `splash-speed` *(new)*, `wake-trail` *(new)* | Horizontal foam streaks + V-ripple wake trailing Kiki |
| 3 | Toy station | `relay-target-ring` → reuse `golden-interact-toy-target-ring` | Target rings mark each floating toy; toys bob on `ripple-ring` (base) |
| 4 | Grab | `splash-celebration` (interactions) | Confetti splash at the catch |
| 5 | Return swim | `wake-trail`, toy pinned at Kiki's mouth anchor | — |
| 6 | Drop in basket | `toy-basket-empty` → `toy-basket-full` (interactions) | Basket fills toy by toy |
| 7 | Leg complete | `relay-leg-done` *(new)* | Mini checkered flag pops + sparkles |
| 8 | Repeat | Legs 2–3: buoys farther apart (`relay-lane-rope` *(new)* marks the lanes) | Escalating distance, same language |
| 9 | Finale | `relay-finish-confetti` *(new)*, `glint-shower` *(new)*, `pennant-festival` (base) | Confetti burst at the arch + golden glint shower from the sky |
| — | Gentle retry | `relay-gentle-retry` *(new)* | Soft ripples + friendly curved arrow — encouraging, never harsh |

**Course dressing:** `relay-lane-rope` tiles horizontally between buoys (red/white floats); `relay-dock-section` provides floating rest platforms mid-course; `rescue-ring` + `sign-regatta` (base) mark the Retriever Club presence. `retriever-silhouette` *(new, PLACEHOLDER for Ringo)* may sit at the finish as the club's greeter — simple environmental figure, no animation; replace with Ringo's character art when available.

## Asset inventory (challenge folder)

| Asset | Size | Purpose |
|---|---|---|
| `relay-start-banner.svg` | 480×170 | Start dressing for the dive platform; blank ribbon for UI text |
| `relay-lane-rope.svg` | 400×80 | Tileable lane rope with bobbing floats |
| `relay-dock-section.svg` | 360×170 | Floating rest platform (planks on barrels) |
| `relay-finish-confetti.svg` | 400×260 | Finish-line confetti burst |
| `splash-dive.svg` | 260×250 | Dive-entry plume (largest splash) |
| `splash-speed.svg` | 300×120 | Fast-swim foam streaks |
| `wake-trail.svg` | 360×100 | Trailing V-ripples behind the swimmer |
| `relay-leg-done.svg` | 220×200 | Mini checkered flag = leg complete |
| `relay-gentle-retry.svg` | 220×200 | Soft retry cue (no fail harshness) |
| `retriever-silhouette.svg` | 280×300 | PLACEHOLDER environmental retriever (Ringo's lane) |
| `glint-shower.svg` | 400×300 | Finale golden sun-glint shower |

Reuse from base/interactions packs: `dive-platform`, `buoy` ×3, `finish-arch-float`, `toy-tennis-ball` / `toy-rope` / `toy-stick`, `pennant-festival`, `rescue-ring`, `toy-target-ring`, `toy-basket-empty`/`full`, `splash-celebration`, `sun-glint`.

## Intended layering (top → bottom)

1. FX: `glint-shower`, `relay-finish-confetti`, `splash-dive`, `splash-celebration` (depth ~20)
2. Kiki + carried toy (depth ~15)
3. `relay-start-banner`, `relay-leg-done`, `relay-gentle-retry` (depth ~12)
4. `finish-arch-float`, `relay-dock-section`, buoys, lane ropes, toys (depth ~10)
5. Water: `water-strip` tiles + `wake-trail`, `splash-speed` (depth ~6)
6. Shore/sand (depth ~2)

## Suggested animation timing

| Beat | Timing |
|---|---|
| Dive entry | `splash-dive` one-shot ~700 ms, scale 0.5→1 |
| Swim traverse | `splash-speed` loops at Kiki's position; `wake-trail` spawns every ~400 ms, fades over 1.2 s |
| Target ring | pulse 1↔1.12, 600 ms yoyo (shared with toy retrieval) |
| Grab | `splash-celebration` one-shot ~800 ms |
| Leg complete | `relay-leg-done` pops (scale bounce ~400 ms) + sparkles |
| Gentle retry | fade in 400 ms, hold, fade out; arrow draws via a slight rotation wobble |
| Finale | `relay-finish-confetti` ×3 staggered 250 ms + `glint-shower` full-screen alpha 0→1 over 1 s, hold 2 s, fade |
| Pennants | gentle sway (rotation ±3°, 2 s yoyo) on the start banner strings |

## Camera treatment

Per `GOLDEN_RETRIEVER_WORLD_LAYOUT.md`: camera follows Kiki with lerp ~0.08 and `setFollowOffset(-200, 0)` so the course ahead stays visible. Suggested challenge-specific beats:
- **Intro:** slow pan from the dive platform across the buoy course to the finish arch (~2.5 s), then snap back to Kiki.
- **Each dive:** quick zoom punch (1→1.06→1 over 500 ms) on splash.
- **Finale:** pull back slightly (zoom 0.95) to frame the arch + confetti + glint shower together.

## Parallax behavior

Reuse the world parallax (sky fixed → far hills 0.1 → mid trees/reeds 0.3 → world 1.0). During the relay, the water band is the mid-ground star: `water-strip` tiles scroll with the camera at 1.0 while a second, lighter wave-line layer (baked into the strips) could drift at 0.9 for subtle relative motion. Keep it to one extra tween.

## Chromebook performance notes

- 11 challenge SVGs, all small (largest 480×300); rasterize once at load — zero per-frame cost.
- Wake trail: cap at ~6 concurrent sprites, fade + destroy (object pool recommended).
- Finale is the heaviest moment: confetti (3 bursts) + glint shower (1 full-screen sprite, alpha tween only) + pennant sway — all cheap tweens, no particles needed, though a small confetti emitter is fine if pooled.
- No per-frame gradient animation; water motion is baked wave lines + strip offset tweens.

## Integration notes for Lennon

- New folder: `public/assets/worlds/golden-retriever/challenge/` (11 SVGs). Base folder untouched.
- Preload: same `preloadGoldenRetrieverInteractionArt(this)` call covers both folders.
- Keys: `GOLDEN_CHALLENGE_ART_KEYS` (prefix `golden-challenge-`).
- `toy-target-ring` is intentionally shared with the interaction pack — one asset, used in both toy retrieval and the relay.
- `retriever-silhouette` is flagged **PLACEHOLDER for Ringo** in code comments and here: swap for his Golden Retriever character art when it lands; do not build animation around the silhouette.
- Depends on the base concept pack branch (`harrison/golden-retriever-world-concept-pack`, PR #13) for `dive-platform`, `buoy`, `finish-arch-float`, toys, `pennant-festival`, `rescue-ring`, `sun-glint`, `water-strip`. Merge #13 first, or merge together.
- No Husky files touched. No scene files touched. No gameplay logic in this PR.
