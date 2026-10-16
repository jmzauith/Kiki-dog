> **Documentation status — historical record; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Historical asset-package delivery, not proof that every supplied state/depth asset is rendered. Current replacements and unused assets are distinguished in [art status](HUSKY_ART_AND_DEPTH_STATUS.md).

# Husky Visual Migration Manifest

**Branch:** `harrison/husky-complete-visual-migration`
**Style bible:** approved Snowy Peaks painterly direction (PR #23, `docs/visual-reset/round2/`).
**Scope:** every environment visual in the playable Husky vertical slice. No gameplay changes. No character work (Ringo owns Kiki and all dogs).

All replacement assets live under `public/assets/worlds/snowy-peaks/`.
Each `.svg` is a self-contained wrapper (embedded WebP illustration) so it
pushes through the text-only connector and rasterizes in Phaser's SVG loader
at the stated production dimensions. Chromebook budget respected: landmarks
≤ 512px, backdrops 960px.

## Replacement table

| Old asset | Scene / location | Replacement asset | Status | Layer | Dimensions | Implementation notes |
|---|---|---|---|---|---|---|
| `public/assets/landmarks/trailhead.svg` | HuskyScene node `start` (Trailhead) | `public/assets/worlds/snowy-peaks/lm-trailhead.svg` | REPLACE | world | 512×512 | Drop-in for Landmarks key `lm-trailhead`. Carved sign is blank — overlay "TRAILHEAD" text in Phaser as today. |
| `public/assets/landmarks/bridge-broken.svg` | HuskyScene node `math1` (before solve) | `public/assets/worlds/snowy-peaks/lm-bridge-broken.svg` | REPLACE | world | 512×512 | Drop-in for key `lm-bridge-broken`. |
| *(new)* | HuskyScene node `math1` (repair in progress) | `public/assets/worlds/snowy-peaks/lm-bridge-repairing.svg` | NEW | world | 512×288 | Show between broken→fixed during the repair beat: planks fly in with golden sparkles. Lennon wires into the success sequence. |
| `public/assets/landmarks/bridge-fixed.svg` | HuskyScene node `math1` (after solve) | `public/assets/worlds/snowy-peaks/lm-bridge-fixed.svg` | REPLACE | world | 512×512 | Swapped in on success (existing logic unchanged). |
| `public/assets/landmarks/fork-sign.svg` | HuskyScene node `fork` (Whisper Forest) | `public/assets/worlds/snowy-peaks/lm-fork-sign.svg` | REPLACE | world | 512×512 | Drop-in for key `lm-fork`. Arrow arms are blank carved wood — overlay "safe"/"challenge" labels in Phaser. |
| `public/assets/landmarks/shelter.svg` | HuskyScene node `safe` (Snow Trail) | `public/assets/worlds/snowy-peaks/lm-shelter.svg` | REPLACE | world | 512×512 | Drop-in for key `lm-shelter`. |
| `public/assets/landmarks/ice-cave.svg` | HuskyScene node `challenge` (Ice Shortcut) | `public/assets/worlds/snowy-peaks/lm-ice-cave.svg` | REPLACE | world | 512×512 | Drop-in for key `lm-ice`. |
| `public/assets/landmarks/race-gate.svg` | HuskyScene node `goal` (Lookout / Summit) | `public/assets/worlds/snowy-peaks/lm-race-gate.svg` | REPLACE | world | 512×512 | Drop-in for key `lm-gate`. Signboard blank — overlay text in Phaser. |
| `public/assets/landmarks/igloo.svg` | Secret igloo (discovered) | `public/assets/worlds/snowy-peaks/lm-igloo-discovered.svg` | REPLACE | world | 512×512 | Drop-in for key `lm-igloo` discovered state. |
| *(new)* | Secret igloo (hidden) | `public/assets/worlds/snowy-peaks/lm-igloo-hidden.svg` | NEW | world | 512×288 | The igloo as an ordinary snow mound with paw-print clues and a faint blue glint. Use as the pre-discovery visual (replaces/augments current occluders). |
| *(new)* | Secret igloo (warm glow) | `public/assets/worlds/snowy-peaks/lm-igloo-glow.svg` | NEW | world | 512×288 | Dusk state: warm light through ice seams. Payoff visual after full discovery. |
| *(new)* | Bone cache (hidden) | `public/assets/worlds/snowy-peaks/lm-bonecache-hidden.svg` | NEW | world | 512×341 | Future encounter: innocent snow mound, bone tip + glint clues. |
| *(new)* | Bone cache (revealed) | `public/assets/worlds/snowy-peaks/lm-bonecache-revealed.svg` | NEW | world | 512×341 | Future encounter: dug hollow with bones + sparkles. |
| *(new)* | Fallen tree (blocked) | `public/assets/worlds/snowy-peaks/lm-fallentree-blocked.svg` | NEW | world | 512×288 | Future encounter: trunk across trail. |
| *(new)* | Fallen tree (cleared) | `public/assets/worlds/snowy-peaks/lm-fallentree-cleared.svg` | NEW | world | 512×288 | Future encounter: sawn logs stacked, trail open. |
| *(new)* | Snow pass (blocked) | `public/assets/worlds/snowy-peaks/lm-snowpass-blocked.svg` | NEW | world | 512×288 | Future encounter: wind-sculpted drift between cliffs. |
| *(new)* | Snow pass (cleared) | `public/assets/worlds/snowy-peaks/lm-snowpass-cleared.svg` | NEW | world | 512×288 | Future encounter: shoveled path, marker post visible. |
| `SnowyWorld.build()` procedural background | HuskyScene backdrop | `public/assets/worlds/snowy-peaks/map-backdrop.svg` | REPLACE | sky/far (depth 0–2) | 960×540 (cover 1280×720) | Replaces flat Graphics fills: panoramic valley, layered mountains, calm center for landmark placement. Scale to cover. |
| RaceScene procedural track/background | Great Husky Sled Race | `public/assets/worlds/snowy-peaks/race-backdrop.svg` | REPLACE | background | 960×540 (cover 1280×720) | Painted race course: curving trail, pennants, distant checkpoint. Racers drawn over it. Mechanics untouched. |
| *(new)* | RaceScene checkpoint | `public/assets/worlds/snowy-peaks/race-checkpoint.svg` | NEW | world | 512×288 | Checkered arch prop for start/finish. Blank signboard for overlay text. |
| *(new)* | Reusable sign template | Any location | `public/assets/worlds/snowy-peaks/sign-blank-carved.svg` | NEW | world | 512×512 | Blank carved post sign. Overlay text in Phaser. Replaces all generic/rectangular signs. |
| *(new)* | Reusable banner | Race camp / gates | `public/assets/worlds/snowy-peaks/prop-banner-cloth.svg` | NEW | world | 512×341 | Blank red cloth banner on wooden pole. Overlay text in Phaser. |
| *(new)* | RaceScene FX | Snow spray particles | `public/assets/worlds/snowy-peaks/fx-snowspray.svg` | NEW | FX | 512×341 | White-background spray burst. Use `blendMode: Phaser.BlendModes.ADD` so the white drops out against snow. |

## Kept as-is

| Asset | Reason |
|---|---|
| `public/assets/kiki/*` | Ringo owns Kiki and all dog character design. |
| `DiscoveryFog` zones | Mechanic; visual restyle optional, not required. |
| Route edge lines (`drawRoutes`) | Mechanics; Lennon may re-tint to match palette. |
| Title plaque (procedural) | Already wood-toned; keep. |
| Math prompt UI | Systems; not in visual scope. |

## Old files

The 8 SVGs under `public/assets/landmarks/` are superseded by this pack.
Lennon deletes them when the replacements are wired (no delete tool on the
connector from this side).

## Wiring notes for Lennon

1. `src/visuals/Landmarks.ts` — `preloadLandmarks`: point the 8 keys at the
   new `public/assets/worlds/snowy-peaks/lm-*.svg` files (same keys, same
   `setScale` values still work; wrappers rasterize at 512).
2. Bridge repair beat: insert `lm-bridge-repairing` between broken and fixed
   during the success animation.
3. Igloo: `lm-igloo-hidden` pre-discovery → `lm-igloo-discovered` on
   discovery → `lm-igloo-glow` as the reward state.
4. `SnowyWorld.build()`: replace procedural fills with `map-backdrop`
   (cover-fit). Keep node/route drawing on top.
5. `RaceScene`: `race-backdrop` behind everything; `race-checkpoint` at
   start/finish; `fx-snowspray` (ADD blend) for sled spray; `prop-banner-cloth`
   + `sign-blank-carved` for any race signage with Phaser text overlays.
6. Future encounters (bone cache, fallen tree, snow pass) use the
   before/after pairs when those nodes are built — the art is ready.

