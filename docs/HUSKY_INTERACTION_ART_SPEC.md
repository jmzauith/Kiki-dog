# Husky Environmental Interaction Art — Visual Spec

Art pack: `public/assets/worlds/husky/interactions/` (37 SVGs).
Preload helper: `src/visuals/InteractionArtPack.ts` → `preloadInteractionArt(scene)`.

**ART ONLY.** No gameplay, progression, or scene-file changes. Every asset is a
state in a before → during → after sequence: when math or exploration succeeds,
the world visibly changes by swapping (or cross-fading) these states.

---

## 1. Broken Bridge (encounter: bridge math, forest region)

| State | Asset | Sequence |
|---|---|---|
| Damaged | `bridge-damaged.svg` (400×200) | Initial. Broken deck with a gap, dangling plank, sagging rail, red dashed warning rope. Impassable. |
| Repair in progress | `bridge-plank.svg` (120×80) + `bridge-hammer.svg` (120×120) + `repair-debris.svg` (140×100) | On math success: planks fly in from the sides (tween to deck slots), hammer taps 3× (rotate tween) with `repair-sparkle.svg` (120×120) popping per tap, `repair-debris.svg` puffs on each landing. |
| Repaired | `bridge-repaired.svg` (400×200) | Cross-fade / scale-pop from damaged. Full deck, rails, snow caps, rope ties, newness sparkle. Kiki can cross. |

Layering: bridge body depth 6 (same as map landmarks); planks fly at depth 8;
`repair-sparkle` at depth 20, additive-ish (alpha pulse).

## 2. Frozen Lake (encounter: lake crossing, valley region)

| State | Asset | Sequence |
|---|---|---|
| Unsafe | `ice-unsafe.svg` (320×140) | Initial. Dark thin ice, spreading cracks, red warning tint. Stepping here = slip (rules unchanged). |
| Safe path | `ice-safe-path.svg` (400×120, **tileable**) | On success: glowing stepping stones fade in along the safe route, warm halo pulse. Repeat 2–3× to span the lake. |
| Cracked variants | `ice-crack-1.svg` / `ice-crack-2.svg` (200×120) | Overlay FX: crack-1 bursts under a wrong step; crack-2 spreads along the unsafe area as a warning before the first attempt. |
| Glints | `ice-glint.svg` (100×100) | Idle life: 3–4 glints twinkle (alpha tween, staggered) across the lake surface. |

Layering: lake base depth 5; `ice-unsafe` depth 5; `ice-safe-path` depth 6
(above); cracks depth 7; glints depth 20.

## 3. Fallen Tree (encounter: forest blockage)

| State | Asset | Sequence |
|---|---|---|
| Blocked | `tree-fallen.svg` (420×200) | Initial. Trunk + snowy branches across the path, snapped stump, red "!" cue. |
| Clearing | `log-segment.svg` (200×90) + `snow-debris.svg` (160×120) | On success: the trunk fades out while `log-segment` (the sawn piece) tweens to the side; `snow-debris` bursts at the cut points. |
| Cleared | `tree-cleared.svg` (420×200) | Stump remains, sawn log rests at the side, clear path with success sparkles. |

Layering: tree body depth 6; debris burst depth 20. Keep the stump in the
cleared state — it proves the world changed.

## 4. Ice Cave (encounter: challenge route, valley region)

| Asset | Use |
|---|---|
| `cave-entrance.svg` (360×260) | The mouth: ice cliff, dark opening, icicles, faint inner glow + gold star hint. Initial state. |
| `cave-crystals.svg` (220×160) | Challenge reward cue: glowing crystal cluster. Fades/scales in inside the mouth after the challenge math succeeds. Depth 7, additive glow. |
| `cave-mouth-inner.svg` (360×260) | Interior-mouth variation: seen from just inside — dark walls, glowing ice veins, bright exit glow. Use for a "step inside" beat or the challenge prompt backdrop. |

Sequence: entrance (idle, star hint pulsing) → math success → `cave-crystals`
bloom + `fx-success-glow` → mouth brightens (cross-fade toward the inner
variation's glow, or overlay `fx-ice-shimmer`).

## 5. Snow Pass (encounter: mountain pass, summit approach)

| State | Asset | Sequence |
|---|---|---|
| Blocked | `pass-arch.svg` (380×260) | Initial. Snow arch with a deep drift filling the walkway, red/blue marker flags, wind swirls. |
| Wind | `pass-wind.svg` (320×120) | Ambient: 2–3 instances drifting across the arch (x-tween loop) while blocked — sells "impassable storm". Fade out on clear. |
| Cleared | `pass-cleared.svg` (380×260) | Open walkway through the arch, celebratory pennant string, gold sparkle. Cross-fade + `fx-snow-puff` as the drift collapses. |

Layering: arch depth 6; `pass-wind` depth 14 (in front, alpha ~0.8); pennants
are baked into the cleared state.

## 6. Summit Gate (encounter: race-camp gate, summit region)

| State | Asset | Sequence |
|---|---|---|
| Locked | `gate-locked.svg` (360×280) | Initial. Stone pillars, closed double doors, ice bars, big padlock. |
| Opening | `gate-opening.svg` (360×280) | On final success: doors swing ajar (rotate from locked positions), warm light spills through the gap, ice bars melt/fall (`fx-snow-puff` + falling shards). Hold ~1s. |
| Open | `gate-open.svg` (360×280) | Doors fully open, SUMMIT banner, mountain vista through the doorway. |
| Accents | `summit-pennants.svg` (200×160) | Flank the gate after opening — gentle sway tween. |

Recommended: cross-fade locked → opening (with a 300ms white flash), hold,
then opening → open with `fx-discovery-burst`. The banner should scale-pop.

## 7. Secret Igloo (secret discovery, valley region)

| State | Asset | Sequence |
|---|---|---|
| Hidden | `igloo-hidden.svg` (280×180) | Initial. Reads as an ordinary snow mound (grass tufts sell the disguise). Partially occluded by ice rocks/pines per the map layout. |
| Discovered | `igloo-discovered.svg` (280×180) | Igloo dome with block lines, doorway, warm light spilling out. Reveal: mound fades/scales into the igloo with `fx-discovery-burst` + `secret-sparkle.svg` (140×140). |
| Warm glow | `igloo-glow.svg` (120×120) | Overlay pinned over the doorway; slow alpha "breathing" tween (2.5s loop) so the igloo feels alive/occupied. Depth 7. |
| Reward cue | `secret-sparkle.svg` (140×140) | Pops above the igloo on discovery; gentle float loop afterward. No reward logic — visual only. |

Discovery must feel earned: keep the hidden state fully mundane until the
reveal beat.

## 8. Bone Cache (optional discovery)

| State | Asset | Sequence |
|---|---|---|
| Hidden | `cache-hidden.svg` (240×150) | Plain drift. |
| Partial | `cache-partial.svg` (240×150) | First nudge: hollow dug in the top, one bone tip poking out, curiosity sparkle, dug snow piles at the sides. |
| Open | `cache-open.svg` (240×150) | Full bone pile in the hollow, golden reward glints. `fx-sparkle-burst` on open. |

## 9. Modular transition FX (shared)

| Asset | Size | Use |
|---|---|---|
| `fx-sparkle-burst.svg` | 200×200 | Math success, repair taps, cache opening. Scale 0.6→1.2 + fade, ~500ms. |
| `fx-snow-puff.svg` | 200×160 | Drift collapse, debris landings, gate ice falling. Scale up + fade, ~600ms. |
| `fx-ice-shimmer.svg` | 200×120 | Ice magic: cave brightening, lake freezing. Sweep across (x-tween) or alpha pulse. |
| `fx-success-glow.svg` | 200×200 | Warm success aura behind any completed interaction. Alpha 0→0.9→0.4 hold, then fade. |
| `fx-discovery-burst.svg` | 220×220 | Secret reveals (igloo, cache, gate opening). Radiating rays + star; the "ta-da" moment. |

All FX: depth 20+, blend mode normal (ADD for the glows if the scene wants
extra pop — assets are designed to work either way), and always tween
alpha/scale — never leave FX sprites parked on screen.

## 10. Layering / depth recommendations

| Depth | Content |
|---|---|
| 5 | Lake/ice surfaces, pass drift base |
| 6 | Interaction bodies (bridge, tree, arch, gate, igloo, cache) — same band as map landmarks |
| 7 | Overlays: safe path, crystals, igloo glow, cracks |
| 8–10 | In-flight pieces (planks, log segment) |
| 14 | Wind streaks (in front, translucent) |
| 20+ | FX bursts, sparkles, glints |

## 11. Performance notes (Chromebook)

- 37 SVGs, all small (largest 420×200). Rasterize once at load via
  `preloadInteractionArt` — no per-frame cost.
- States are full-sprite swaps, not skeletal animation — cheap and reliable.
- FX are single sprites with tweens; cap concurrent FX at ~6.
- `pass-wind` uses 2–3 looping x-tweens — pause when off-screen.
- Idle loops (glints, igloo glow, pennant sway) are 2–4 alpha/rotation tweens
  total per interaction — negligible.
- No new particle textures needed: FX are baked into the SVGs.

## 12. Integration notes (Lennon)

- `src/visuals/InteractionArtPack.ts` exposes `preloadInteractionArt(scene)`
  and stable `INTERACTION_ART_KEYS`. Nothing references it yet — call it from
  wherever the 12-node adventure scene preloads.
- Encounter → asset map follows McCartney's progression nodes: bridge = math1,
  lake = safe, tree = forest encounter, cave = challenge, pass = Snow Pass
  node, gate = goal/Race Camp, igloo + cache = secrets.
- The previous map pack (`public/assets/worlds/husky/`) holds the *ambient*
  versions (e.g. `bridge-broken.svg`); this pack holds the *interactive*
  states. When integrating, prefer this pack for anything that changes state.
