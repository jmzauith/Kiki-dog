# Husky Sled Race — Visual Spec

Art pack: `public/assets/worlds/husky-race/` (22 SVGs).
Preload helper: `src/visuals/RaceArtPack.ts` → `preloadRaceArt(scene)`.

This pack replaces the prototype board-game race with a real side-scrolling
snowy race. **Art only** — no gameplay, race rules, or progression changes.
Same Snowy Peaks visual language (soft blues, warm wood, red/gold accents).

---

## 1. Proposed camera framing

- Viewport stays 1280×720.
- **Track lane:** racers run on a horizontal lane centered around **y ≈ 470**
  (sled runners at ~y 500). Horizon/treeline sits at ~y 330; sky above.
- **Camera:** `setBounds(0, 0, TRACK_LENGTH, 720)`, follows the **player's sled**
  with lerp ~0.08 and a **negative follow offset** (Phaser subtracts
  `followOffset`, so use `setFollowOffset(-220, 0)` to keep the sled
  left-of-center and show more track ahead).
- The rival Husky sled should stay roughly in frame: if it falls more than
  ~700px behind/ahead, it is off-screen — acceptable, show a small
  "rival ahead/behind" edge tick instead of stretching the camera.
- **Finish approach:** when the player crosses 85% of the track, ease the
  camera to frame the finish gate (like the map's cinematic reveal pans),
  then hand control back on the finish sequence.

## 2. Parallax plan (4 depth layers + sky)

| Layer | Assets | Scroll factor | Notes |
|---|---|---|---|
| Sky (fixed) | gradient + sun + clouds (reuse `sky-grad`, `soft-blob` from the map pack) | `0` | Same sky as Snowy Peaks for continuity |
| Far | `bg-mountains.svg` (2000×420, single wide strip) | `0.12` | Pale atmospheric; one instance covers the parallax range |
| Mid-far | `bg-forest.svg` (1600×220, **tileable**) | `0.3` | Repeat 3–4× across the track; tint slightly per repeat for variety |
| Midground | `mid-pine-1.svg`, `mid-pine-2.svg`, `ice-formation.svg`, `rock-cluster.svg`, `snowdrift-1/2.svg` | `1.0` (world) | Scattered along the track at seeded positions, behind the lane |
| Foreground | `fg-snowbank.svg` (900×200 strip), `fg-pine.svg` (300×420) | `1.0` (world), drawn **in front** of racers at low alpha or bottom-edge | A few large pines/banks at the bottom edge give near-camera depth without hiding gameplay |

Depth order (back→front): sky −10, mountains −7, forest −5, midground props 2–4,
track 5, racers 8–10, foreground framing 14, weather/speed FX 20, UI 30+.

## 3. Track length recommendation

- **TRACK_LENGTH = 5200** world px (~4× viewport). At a Steady pace this reads
  as a real journey; 3–5 race turns (per current rules) map to progress ticks
  at ~1000px intervals — place `checkpoint-marker.svg` at each tick.
- Lane art: `track-strip.svg` (800×220, tileable) repeated 7× for the lane
  bed; `track-bank.svg` (800×160, tileable) repeated along the top edge as
  the raised bank; `snowdrift-1/2.svg` scattered at the lane edges.
- Start zone (x 0–600): `start-gate.svg` at x≈300, `race-tent.svg`,
  `sled-parked.svg`, `snowman.svg` spectators, `flag-string.svg` bunting
  overhead between poles.
- Finish zone (x 4600–5200): `finish-gate.svg` at x≈4900, denser bunting,
  snowmen + tents as a crowd.

## 4. Where Steady / Turbo movement should visually happen

- **Steady:** sled glides on the lane center; `snow-spray.svg` puffs at the
  runners every ~0.6s (small scale); no streaks; Kiki in trot pose.
- **Turbo:** `speed-streak.svg` instances stream past at the screen edges
  (3–5 streaks, alpha pulsing), `snow-spray.svg` bursts larger + more frequent
  behind the sled, slight camera zoom punch (e.g. `camera.zoomTo(1.04, 250ms)`
  then back), Kiki in dash/race pose leaning forward.
- **Rival:** same system, fewer streaks — the player's Turbo should always
  *feel* faster.
- **Turns:** each decision point = a `checkpoint-marker.svg` with a brief
  slow-mo ease (0.35× for 400ms) while the choice UI shows — keeps the race
  readable for kids.

## 5. Finish-line sequence concept

1. Player sled crosses x=4900 → freeze inputs, `finish-gate.svg` banner does a
   quick scale-pop; gold star burst (`sparkle` texture) over the gate.
2. Camera eases to frame gate + both sleds (1s), then slow push-in.
3. Winner: Kiki `happy` reaction + hop (already in KikiCharacter); snow-spray
   confetti loop for ~2s; `flag-string.svg` bunting drops from the gate
   crossbeam (simple y-tween).
4. Loser (rival): `surprised`/`thinking` pose, then both settle to idle.
5. UI card slides in (scrollFactor 0): result + sticker reward. Keep the
   existing race-end logic — only the staging is new.

## 6. Asset list

| File | Size | Purpose | Suggested use |
|---|---|---|---|
| `start-gate.svg` | 420×260 | Start arch, START banner, bunting | x≈300, depth 6, scale 1.0 |
| `finish-gate.svg` | 420×260 | Checkered finish arch, FINISH banner | x≈4900, depth 6, scale 1.1 |
| `track-strip.svg` | 800×220 | Tileable packed-snow lane with sled grooves | repeat 7×, y≈360, depth 5 |
| `track-bank.svg` | 800×160 | Tileable raised snow bank | repeat 7× along lane top, depth 4 |
| `bg-mountains.svg` | 2000×420 | Far mountain range (single strip) | scrollFactor 0.12, depth −7 |
| `bg-forest.svg` | 1600×220 | Tileable distant forest silhouette | repeat 3–4×, scrollFactor 0.3, depth −5 |
| `mid-pine-1.svg` | 240×300 | Midground pine cluster | scatter, depth 3, scale 0.8–1.3 |
| `mid-pine-2.svg` | 260×280 | Midground pine trio | scatter, depth 3, scale 0.8–1.3 |
| `fg-pine.svg` | 300×420 | Large near-camera pine | bottom edge, depth 14, alpha ~0.95, dark tint |
| `fg-snowbank.svg` | 900×200 | Foreground snowbank strip | bottom edge, depth 14 |
| `snowdrift-1.svg` | 300×120 | Snowdrift mound | lane edges, depth 4 |
| `snowdrift-2.svg` | 300×120 | Snowdrift mound (variant) | lane edges, depth 4 |
| `ice-formation.svg` | 220×200 | Ice/rock formation | midground, depth 3 |
| `rock-cluster.svg` | 260×140 | Snow-covered rocks | midground, depth 3 |
| `race-flag.svg` | 120×200 | Slalom pennant flag | slalom pairs along lane, depth 6, alternate colors via tint |
| `flag-string.svg` | 400×120 | Tileable bunting string | start/finish zones, depth 7, slight sway tween |
| `checkpoint-marker.svg` | 140×220 | Star checkpoint post | at each progress tick (~1000px), depth 6 |
| `race-tent.svg` | 260×200 | Race camp tent | start/finish zones, depth 4 |
| `sled-parked.svg` | 220×140 | Parked sled prop | near start gate, depth 6 |
| `snowman.svg` | 140×200 | Snowman spectator | track sides, depth 6, gentle rock tween |
| `speed-streak.svg` | 300×60 | Horizontal speed streaks | Turbo: spawn at screen edges, depth 20, alpha pulse |
| `snow-spray.svg` | 160×140 | Snow burst behind sled | Steady/Turbo: runner FX, depth 9 |

## 7. Notes for the integrator (Lennon)

- All SVGs are resolution-independent; raster sizes in `RaceArtPack.ts` are
  chosen for crispness at 1–1.5× display scale on Chromebooks.
- `track-strip.svg` and `track-bank.svg` tile seamlessly horizontally (straight
  edges, repeating groove phase); `bg-forest.svg` tiles too (matching end trees).
- Palette matches the map pack: reuse `sky-grad`/`soft-blob`/`sparkle`/`pine`
  canvas textures from `src/visuals/textures.ts` — do not duplicate them.
- Kiki and the Husky already exist as rigged characters (`KikiCharacter`);
  the sled itself is the one piece of art NOT in this pack — recommend a
  side-view sled + husky team SVG as the next art task, or reuse
  `sled-parked.svg` as a base.
- Do not use these assets in `HuskyScene.ts` — they belong to the future
  race scene only.
