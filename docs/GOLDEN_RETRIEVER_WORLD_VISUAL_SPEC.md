# Golden Bay — World Visual Spec

**Second breed world: Golden Retriever.** Concept / pre-production pack.
No scene implementation, no gameplay logic, no Husky file changes.

**Theme in one line:** a warm lakeside adventure where Kiki learns what
retrievers are born to do — dive in, swim out, and bring it back.

---

## 1. Theme

**Golden Bay** — a sunny lakeside cove at golden hour. Grassy meadow trails
run down through willow wetlands to a sandy bay with a wooden dock, a
boathouse, and the Retriever Club's floating regatta course. The mood is
warm, joyful, playful, and water-friendly: butterflies, pollen motes,
lily pads, picnic blankets, and dogs who love to swim.

This is deliberately the emotional opposite of Snowy Peaks: where the Husky
world was cold, vertical, and stark, Golden Bay is warm, horizontal, and
lush.

## 2. Region breakdown

### Region 1 — Sunny Meadow (x 0–1200)
Golden-hour grasslands. `meadow-strip` ground, `path-strip` trail,
`oak-tree` / `sapling` / `bush-round`, wildflower dots
(`flower-red/yellow/white`), `sunflower` patches marking the math encounter,
`sign-golden-bay` entrance arch, `picnic-blanket` + `picnic-basket` area.
Light: warm, open, high sun.

### Region 2 — Willow Wetlands (x 1200–2400)
The trail narrows between `reeds-cluster` and `cattails`. `water-strip`
appears as creek bands; `footbridge` and `stream-stones` cross them.
`willow-tree` becomes the signature silhouette — weeping strands frame the
path and hang from the top edge as foreground. `boathouse-closed/open`,
`waterwheel`, `dock-damaged/repaired`, `lily-pad` chains, and the hidden
`willow-curtain` grove. Light: greener, dappled, dragonflies implied by
`sun-glint` twinkles.

### Region 3 — Golden Bay (x 2400–3600)
The wetlands open onto `sand-strip` beach. `water-shore` edges the bay;
`dive-platform`, `buoy` course, floating toys, `finish-arch-float`,
`pennant-festival` strings, `sign-regatta`, Retriever Club flags. The
triumphant finale: **The Golden Bay Rescue Relay**. Light: low warm sun,
long shadows, sparkling water.

## 3. Landmark list

| Landmark | Asset(s) | Region |
|---|---|---|
| World entrance arch | `sign-golden-bay` | Meadow |
| Trail signs | `sign-trail` | All |
| Picnic area | `picnic-blanket`, `picnic-basket` | Meadow |
| Creek crossing | `stream-stones`, `footbridge` | Wetlands |
| Damaged dock → repaired | `dock-damaged`, `dock-repaired`, `dock-planks`, `dock-post` | Wetlands |
| Boathouse closed → open | `boathouse-closed`, `boathouse-open` | Wetlands |
| Waterwheel | `waterwheel` | Wetlands |
| Log jam | `log-pile`, `log-floating` | Wetlands→Bay |
| Hidden willow grove | `willow-curtain`, `golden-ball` | Wetlands (secret) |
| Hidden picnic basket | `basket-hidden`, `basket-open` | Meadow (optional) |
| Bay overlook | (vista beat — no asset, camera reveal) | Bay |
| Dive platform | `dive-platform` | Bay |
| Regatta course | `buoy` ×3, `toy-tennis-ball`, `toy-rope`, `toy-stick` | Bay |
| Floating finish arch | `finish-arch-float` | Bay |
| Rescue station | `rescue-ring` | Bay |

## 4. Interaction visual states

Designed visually readable; logic to be implemented later:

- **Retrieve floating toy** — toy bobs on `ripple-ring`; on success Kiki
  "carries" it (toy tweens to her mouth position), `splash` + `sun-glint`.
- **Repair dock** — `dock-damaged` → planks fly in → `dock-repaired`;
  reuse the Husky `fx-sparkle-burst` language (generic shared FX allowed).
- **Open boathouse** — `boathouse-closed` → `boathouse-open` (doors swing,
  canoe + warm light revealed).
- **Cross stream** — `stream-stones` light up in hop order (`sun-glint`
  on the next stone); wrong stone = `splash`.
- **Follow pawprints** — `path-strip` already has baked paw prints; a
  `sun-glint` trail leads the way when the trail is "active".
- **Uncover hidden picnic basket** — `basket-hidden` (grassy mound) →
  `basket-open` (dug hollow, basket + treats, golden glints).
- **Move logs** — `log-pile` (blocking, "!" cue) → logs tween aside
  (`log-floating` drifts off on the creek).
- **Activate waterwheel** — `waterwheel` still → rotating (rotate the
  wheel group), `splash` at the base, creek "flows" (wave offset tween).
- **Find hidden golden tennis ball** — `willow-curtain` parts (strands
  tween aside) → `golden-ball` glow reveal.

## 5. Final challenge — The Golden Bay Rescue Relay

**Why this one:** it is the most retriever thing possible — diving,
swimming, and retrieving — and it is mechanically distinct from the Husky
sled race (no speed contest; a skill course).

**Concept:** Kiki dives from the `dive-platform`, swims a buoy-marked
course, and retrieves three floating toys (`toy-tennis-ball`, `toy-rope`,
`toy-stick`) one by one, bringing each back through the
`finish-arch-float`. Each leg is gated by a math success (the "training"
beat): solve → dive → swim (hold/traverse) → grab (toy attaches) →
return → drop in the collection basket → next leg. Three legs, escalating
buoy distance. Finale: all three toys lined up, `pennant-festival`
drops, golden `sun-glint` shower, Kiki's proud retrieve pose.

**Visual language of the challenge:** turquoise water, red/white buoys,
checkered floating arch, festival pennants, splash rings on every dive —
a lakeside regatta, not a race track.

## 6. Asset table (51 SVGs)

Terrain: `meadow-strip`, `sand-strip`, `path-strip` (tileable).
Water: `water-strip` (tileable), `water-shore`, `lily-pad`, `ripple-ring`.
Trees: `oak-tree`, `willow-tree`, `sapling`, `bush-round`.
Ground cover: `grass-tuft`, `flower-red`, `flower-yellow`, `flower-white`,
`sunflower`, `reeds-cluster`, `cattails`.
Dock: `dock-planks` (tileable), `dock-post`, `dock-damaged`,
`dock-repaired`, `dive-platform`.
Crossings: `footbridge`, `stream-stones`, `log-floating`, `log-pile`.
Buildings: `boathouse-closed`, `boathouse-open`, `waterwheel`.
Picnic: `picnic-blanket`, `picnic-basket`, `basket-hidden`, `basket-open`.
Rocks: `rock-warm`, `pebbles`.
Signs: `sign-golden-bay`, `sign-trail`, `sign-regatta`.
Flags/course: `buoy`, `pennant-festival`, `rescue-ring`,
`finish-arch-float`.
Toys: `toy-tennis-ball`, `toy-rope`, `toy-stick`.
Hidden: `willow-curtain`, `golden-ball`.
FX: `splash`, `sun-glint`, `pollen-puff`.

Preload helper: `src/visuals/GoldenRetrieverArtPack.ts`
(`preloadGoldenRetrieverArt`, `GOLDEN_ART_KEYS`).

## 7. Visual differentiation from Snowy Peaks

| Axis | Snowy Peaks (Husky) | Golden Bay (Retriever) |
|---|---|---|
| Palette | Icy blues, white, slate; red/gold accents | Warm greens, turquoise water, sand gold; coral/teal accents |
| Lighting | Cold morning, blue-hour valley, crisp summit | Golden hour throughout; warm haze overlay; dappled wetland light |
| Silhouettes | Sharp pines, jagged peaks, angular ice | Round oaks, weeping willows, soft reeds, rolling water |
| Environmental motion | Blowing snow, fog banks, shimmer | Drifting pollen, rippling water, swaying reeds, butterflies |
| Parallax | Mountain ranges receding (vertical drama) | Tree lines and reed beds receding (horizontal calm) |
| Atmosphere | Fog = mystery / hidden danger | Haze = warmth / invitation; secrets hide in plain sight (groves, mounds) |
| Terrain | Snowfields, ice, rock | Meadow, sand, dirt path, shallow water |
| Challenge language | Endurance race, speed, checkpoints | Retrieval, rescue, skill course; toys not timers |

Shared with the Husky world (same game): Kiki herself, the math-prompt UI
language, star/sparkle reward FX vocabulary, the node-and-trail adventure
structure, and the camera-follow + cinematic-reveal grammar.

## 8. Kiki visual behavior notes (for Ringo)

No character code changes in this pack — these are pose/reaction proposals
for Ringo's character pass:

- **Splashing** — shake + water droplets; use on dive entry and shake-off.
- **Sniffing** — nose-down, tail up; at picnic basket, willow grove, pawprint trail.
- **Curious at water** — head tilt, one paw raised at the shoreline; first water reveal.
- **Shaking off** — full-body shake with `splash` droplets; after every swim leg.
- **Proud retrieve pose** — chest out, toy held high, tail wagging; after each relay leg and at the finale.
- **Playful excitement** — play-bow (front down, rear up); greeting the Retriever Club / discovering toys.

Suggested new bits: a simple droplet particle for shake-off (can reuse
`splash.svg` pieces), and a "toy in mouth" attach point convention
(toy asset pinned at the mouth anchor during carry).

## 9. Performance notes / Chromebook considerations

- 51 SVGs, all small (largest 460×260). Rasterize once at load; zero per-frame cost.
- Tileable strips (`meadow-strip`, `sand-strip`, `path-strip`,
  `water-strip`, `dock-planks`) repeat — no unique art per meter.
- Ambient motion is cheap: 2–3 looping tweens (pollen drift, reed sway,
  water shimmer, willow strand sway). Pause off-screen loops.
- Water: baked wave lines in the strips, not shader water. Sparkles are
  `sun-glint` sprites with alpha tweens.
- Same object budget as Snowy Peaks (~250 statics, 1–2 emitters).

## 10. Future gameplay hooks

See `docs/GOLDEN_RETRIEVER_WORLD_LAYOUT.md` for the spatial contract:
3600×720 world, three region bounds, encounter coordinates, secret
positions, final challenge coordinates, camera/parallax recommendations,
and future node spots. When the Golden progression graph is designed,
place nodes at those coordinates.
