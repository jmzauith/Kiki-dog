# Husky Visual Consistency Audit

**Auditor:** McCartney (QA / specification)
**Date:** 2026-10-08
**Scope:** the current playable Husky adventure on `main` (commit `41c5905`)
**Method:** code-read of every scene, visual system, and asset on main — `src/scenes/HuskyScene.ts`, `src/scenes/RaceScene.ts`, `src/visuals/*`, `src/systems/KikiCharacter.ts`, `public/assets/**`. No screenshots were available in this environment; SVG style was determined by reading the vector code (path detail, shading, palette), not filenames.
**Constraint honored:** no art created, no scenes modified. This is a specification for Lennon (implementation/UI), Harrison (environment/world), and Ringo (characters/rewards).

**Important context:** a visual reset is in flight (open PRs #16, #20, #22, #23, #24). "NEW" below means *matches the visual direction currently on main*. Items marked NEW should still be re-checked against the reset direction once it lands — the reset may supersede them.

## Priority definitions

- **P0** — player-facing old art on the critical path. Must be replaced before Husky is called visually complete.
- **P1** — old art on optional paths, secondary UI, or missing UI that has a placeholder. Should be replaced in the next integration pass.
- **P2** — polish, future screens, or already-planned upgrades. Track, don't block on.

## Owners

- **HARRISON** — environment / world
- **RINGO** — characters / rewards
- **LENNON** — implementation / UI integration
- **MCCARTNEY** — content / logic QA

## Checklist

Format: location | asset or system | current style | NEW/OLD | owner | replacement needed? | priority | dependency

### Kiki

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | `KikiCharacter` + `public/assets/kiki/kiki-poses.svg` (9 hand-drawn poses) + `kiki-tail.svg` | Illustrated SVG, breathing idle, tail wag, walk cycle, reactions | NEW | RINGO | No — PR #5 upgrades to 27-pose production art when merged | P2 | PR #5 open |
| RaceScene | `KikiCharacter` "race" pose, scale 0.6, in sled container | Illustrated SVG | NEW | RINGO | No | P2 | PR #5 open |
| HuskyScene | Footprints (`KikiCharacter.stampFootprint`) — white ellipse stamps, fade out | Minimal FX | NEW (compatible) | RINGO | No | — | — |
| HuskyScene + RaceScene | Snow puffs under paws | White circle particles, subtle | NEW (compatible) | RINGO | No | — | — |

### Husky (rival)

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| RaceScene `createDog()` | Rival Husky: ellipse body, circle head, triangle ears, dot eyes — all primitive Phaser geometry | Primitive placeholder | **OLD** | RINGO | **Yes** — replace with `HuskyCharacter` art | **P0** | PR #5 (6-pose Husky production art, open) |
| RaceScene | "HUSKY" text tag on white pill above rival | Programmer UI text | **OLD** | LENNON | Yes, with UI pass | P1 | Visual reset |

### Backgrounds

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | `SnowyWorld.buildSky()` — `sky-grad` canvas gradient, sun glow, 4 drifting clouds | Procedural illustrated | NEW | HARRISON | No | — | Re-check vs reset PR #23 |
| RaceScene `create()` | `cameras.main.setBackgroundColor("#bde8ff")` flat fill | Flat color | **OLD** | HARRISON | **Yes** — needs a real race sky/environment | **P0** | PR #8 (race art pack, open) |

### Terrain

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | `SnowyWorld.buildTerrain()` — rolling snow mass, blue shadow swooshes, 26 twinkling sparkles | Procedural illustrated | NEW | HARRISON | No | — | — |
| RaceScene `drawTrack()` | Flat `#c9efff` rect under the track | Flat color | **OLD** | HARRISON | **Yes** | **P0** | PR #8 |

### Trees

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | `pine` generated texture — snow-dusted layered pine, instanced in mid band + foreground | Illustrated-ish generated | NEW | HARRISON | No | — | — |
| HuskyScene | Igloo occluders (`buildIglooOccluders`) — pine images | Same texture | NEW | HARRISON | No | — | — |

### Mountains

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | `jaggedRidge()` — two atmospheric ranges with snow-cap triangles | Procedural illustrated | NEW | HARRISON | No | — | Re-check vs reset PR #23 |

### Rocks

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | None observed in code | N/A | — | HARRISON | Verify visually; add only if the direction needs them | P2 | — |

### Bridge

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Node `math1` | `bridge-broken.svg` — illustrated chasm, snow banks, plank deck (code-verified) | Illustrated SVG | NEW | HARRISON | No | — | — |
| Node `math1` post-math | `bridge-fixed.svg` swap + 14-sparkle burst (`Landmarks.repairBridge`) | Illustrated SVG + FX | NEW | HARRISON | No | — | — |

### Signs

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Node `start` | `trailhead.svg` — illustrated wooden sign (code-verified) | Illustrated SVG | NEW | HARRISON | No | — | — |
| Node `fork` | `fork-sign.svg` — illustrated signpost, swaying idle | Illustrated SVG | NEW | HARRISON | No | — | — |

### Route markers

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| All edges | `redrawEdge()` — styled curves: safe = soft-blue underlay + white core + paw-print ellipses; challenge = blue core + gold dots | Stylized procedural, palette-matched | NEW | LENNON / HARRISON | No — design decision: keep, but get explicit sign-off | — | Visual reset sign-off |
| Choice nodes | Route arrows — white/gold `add.triangle` with stroke, bobbing tween | Primitive placeholder | **OLD** | LENNON | **Yes** — needs a designed direction (carved sign? glowing paw?) | P1 | Visual reset |
| Node reveal | Expanding white circle flash (`revealNode`) | Transient FX | NEW (compatible) | — | No | — | — |

### Frozen lake / Fallen tree / Snow pass / Summit gate / Bone cache / Race camp

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| — | Not on main | — | NOT PRESENT | — | Audit when it lands | — | PR #7 (expansion, open) — these nodes exist only there |

### Ice cave

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Node `challenge` | `ice-cave.svg` — illustrated ice cave, twinkle idle (code-verified) | Illustrated SVG | NEW | HARRISON | No | — | — |

### Secret igloo

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Hidden node | `igloo.svg` — illustrated ice-block dome, fade-in on reveal (code-verified) | Illustrated SVG | NEW | HARRISON | No | — | — |
| Igloo click | 10 `sparkle`-texture particles rising | Texture FX | NEW | — | No | — | — |

### Race environment

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| RaceScene `drawTrack()` | White rounded-rect arena, lane lines, checkpoint circles | Primitive geometry | **OLD** | HARRISON | **Yes** — full race environment | **P0** | PR #8 (open) |
| Finish line | Checkered flag from black/white primitive rects | Primitive placeholder | **OLD** | HARRISON | **Yes** | **P0** | PR #8 |
| Checkpoints | White/gold primitive circles + strokes | Primitive | **OLD** | HARRISON | **Yes** | P1 | PR #8 |

### Race characters

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| RaceScene | Kiki racer (see Kiki) | Illustrated SVG | NEW | RINGO | No | P2 | PR #5 |
| RaceScene | Rival Husky (see Husky) | Primitive | **OLD** | RINGO | **Yes** | **P0** | PR #5 |
| RaceScene | Kiki's sled — brown rectangle + gray line runners | Primitive placeholder | **OLD** | HARRISON | **Yes** — designed sled | **P0** | PR #8 (confirm sled art included) |
| RaceScene | Rival's sled — same primitive construction | Primitive placeholder | **OLD** | HARRISON | **Yes** | **P0** | PR #8 |

### Interaction UI

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Both scenes | Math prompt modal — dark shade rect (compatible), cream rounded panel, Arial Black 58px raw `8 × 7 = ?`, blue/orange rectangle answer buttons | Programmer UI | **OLD** | LENNON | **Yes** — designed UI pass | **P0** | Visual reset / PR #20 |
| RaceScene | Pace buttons STEADY / TURBO ★ — blue/purple rectangles + text | Programmer UI | **OLD** | LENNON | **Yes** | **P0** | Same UI pass |
| HuskyScene | Node tap targets — invisible hit circles on landmarks | Functional | NEW (compatible) | LENNON | No | — | — |

### Math UI

Same panel as Interaction UI above. Content note (not visual, but affects the UI): on main the prompt shows the raw generated problem (`8 × 7 = ?`) with no environmental framing and no hints — the narrative wrapping (PR #21) and hint ladder (PR #7) are unmerged. When Lennon builds the new math UI, it should be designed to host: environmental framing text, hint button + hint ladder, and kind wrong-answer responses.

### Hints

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Both scenes | None — `MathEngine` on main has no hint data, no hint UI | MISSING | — | LENNON / MCCARTNEY | Add with UI pass (logic exists in PR #7) | P1 | PR #7 |

### Discovery messages

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Status pill text | e.g. "You found the secret igloo!" on dark pill, Arial 20px | Programmer UI | **OLD** | LENNON | **Yes** — discovery deserves a designed moment, not a pill | P1 | Visual reset |

### Stickers

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| — | No sticker visuals on main | MISSING | — | RINGO | In progress | **P0** (needed for reward) | PR #10 (open) |

### Reward screen

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| RaceScene `finishRace()` | "KIKI WINS!" text, star particles, "Husky Adventure complete!" text panel | Placeholder text | **OLD** / MISSING | LENNON (impl) + RINGO (art) | **Yes** — real reward screen | **P0** | PR #10 (sticker art) |

### Album

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| — | Does not exist on main | MISSING | — | Future | Post-Husky | P2 | PR #14 (open) |

### Transitions

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene → RaceScene | Hard `scene.start()` cut, no transition | Placeholder | **OLD** | LENNON | **Yes** — transition FX/moment | P1 | — |

### Particle FX

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | Falling snow — `snow-dot` texture particles | Texture FX | NEW | HARRISON | No | — | — |
| HuskyScene | Fog bank wind-blown snow streaks | Texture FX | NEW | HARRISON | No | — | — |
| RaceScene | Turbo burst / victory stars — primitive star shapes | Celebratory FX | NEW (compatible) | — | No | P2 | — |
| RaceScene | Racer snow puffs — primitive white circles | Minimal FX | NEW (compatible) | — | No | — | — |
| HuskyScene | Discovery fog banks — layered `soft-blob` mist + drift | Illustrated FX | NEW | HARRISON | No | — | — |

### Icons

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| — | No icon system on main; buttons are text-only | MISSING | — | LENNON | Designed icon set | P2 | Visual reset |

### Buttons

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Both scenes | All buttons — colored rectangles + Arial Black text | Programmer UI | **OLD** | LENNON | **Yes** — designed button system | **P0** | Visual reset / PR #20 |

### Title / location UI

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| HuskyScene | "SNOWY PEAKS" title plaque — brown rounded rect + Arial Black | Programmer UI | **OLD** | LENNON | **Yes** | P1 | — |
| RaceScene | "THE GREAT HUSKY SLED RACE" header — Arial Black + stroke on sky | Programmer UI | **OLD** | LENNON | **Yes** | P1 | PR #8 (race title treatment?) |

### Status / progress UI

| Location | Asset / system | Current style | NEW/OLD | Owner | Replacement? | Priority | Dependency |
|---|---|---|---|---|---|---|---|
| Both scenes | Status pill — dark rounded rect + Arial ("Explore Snowy Peaks", "Choose your pace") | Programmer UI | **OLD** | LENNON | **Yes** | P1 | — |
| — | Progress indicator (map progress, breed progress) | MISSING | — | LENNON | Designed progress UI | P1 | — |

## Counts

- **OLD (replace): 19** — HARRISON 7 (race bg, track ground, track arena, finish flag, checkpoints, 2 sleds), RINGO 1 (rival Husky) + stickers in progress, LENNON 11 (HUSKY tag, route arrows, math panel, pace buttons, discovery pill, reward screen, transition, all buttons, title plaque, race header, status pill).
- **NEW (keep): ~25** — environment, landmarks, Kiki, fog, textures, FX.
- **MISSING (to build): 7** — hints UI, stickers, reward screen, album, progress UI, icons, transition FX.
- **NOT PRESENT (unmerged expansion nodes):** frozen lake, fallen tree, snow pass, summit gate, bone cache, race camp — audit when PR #7 lands.

## NEEDS-VISUAL-CHECK

Code could not settle these — a human needs eyes on them:
- [ ] Round-1 Kiki art vs environment palette harmony (may be moot — visual reset PRs #22/#24 in flight)
- [ ] Landmark SVGs vs the reset environment direction (PR #23) — confirm they still belong
- [ ] Route line style — functional and palette-matched, but needs explicit design sign-off (keep vs redesign)
- [ ] `sparkle`/`soft-blob` texture FX — assumed compatible; confirm against reset palette
- [ ] Kiki scale 0.66 in HuskyScene vs 0.6 in RaceScene vs landmark scales — eyeball proportions in one pass

## OLD-STYLE ASSET ZERO CHECK

Before Husky is called visually complete, every item below must be **replaced**, **deliberately hidden**, or **explicitly approved as compatible**. No accidental leftovers.

### HARRISON (environment/world)
- [ ] RaceScene background flat `#bde8ff` → replaced / hidden / approved
- [ ] RaceScene track ground flat `#c9efff` rect → replaced / hidden / approved
- [ ] Race track arena (white rounded rect + lane lines) → replaced / hidden / approved
- [ ] Checkered finish flag (primitive rects) → replaced / hidden / approved
- [ ] Checkpoint circles (primitive) → replaced / hidden / approved
- [ ] Kiki's sled (brown rectangle + line runners) → replaced / hidden / approved
- [ ] Rival's sled (brown rectangle + line runners) → replaced / hidden / approved

### RINGO (characters/rewards)
- [ ] Race rival Husky (primitive ellipse/circle/triangle dog) → replaced / hidden / approved
- [ ] Husky sticker art → delivered (PR #10) / approved-placeholder

### LENNON (implementation/UI integration)
- [ ] Rival "HUSKY" text tag → replaced / hidden / approved
- [ ] Route arrows (primitive triangles) → replaced / hidden / approved
- [ ] Math prompt panel (both scenes, programmer UI) → replaced / hidden / approved
- [ ] Pace buttons STEADY/TURBO (programmer UI) → replaced / hidden / approved
- [ ] Discovery messages on status pill → replaced / hidden / approved
- [ ] Reward screen (currently placeholder text) → replaced / hidden / approved
- [ ] Scene transition HuskyScene → RaceScene (hard cut) → replaced / hidden / approved
- [ ] Button system (all rectangle buttons) → replaced / hidden / approved
- [ ] "SNOWY PEAKS" title plaque → replaced / hidden / approved
- [ ] Race header text → replaced / hidden / approved
- [ ] Status pill → replaced / hidden / approved

### Sign-off
- [ ] Harrison: all environment/world items above resolved
- [ ] Ringo: all character/reward items above resolved
- [ ] Lennon: all UI/integration items above resolved
- [ ] Final playthrough pass (below) completed with zero "different version" sightings

## PLAYTHROUGH VISUAL QA CHECKLIST

At every stage, answer: **"Does anything look like it belongs to a different version of the game?"**

### 1. Trailhead
Look at: sky, mountains, pine band, terrain, trailhead sign, Kiki, title plaque, status pill.
Expected: illustrated environment + SVG sign + SVG Kiki. The brown title plaque and dark status pill are KNOWN OLD — flag anything else.

### 2. Bridge (broken → math → repaired)
Look at: broken bridge SVG, math prompt panel, answer buttons, repair swap + sparkle burst, fixed bridge SVG.
Expected: illustrated bridge states, sparkle FX. The math panel and buttons are KNOWN OLD — flag anything else (e.g. Kiki reverting to placeholder during the sequence).

### 3. Fork
Look at: fork sign, route lines (safe vs challenge styling), route arrows, Kiki anticipation.
Expected: illustrated sign, styled route curves. The triangle route arrows are KNOWN OLD — flag anything else.

### 4. Safe route (Shelter)
Look at: shelter landmark + glow idle, fog bank reveal, route traveled.
Expected: illustrated shelter, blowing-snow fog reveal. Flag any flat/primitive elements.

### 5. Challenge route (Ice Cave)
Look at: ice cave landmark + twinkle, challenge math panel (purple), gold-dot route.
Expected: illustrated cave. The purple math panel is the same KNOWN OLD panel in a different color — flag anything else.

### 6. Secrets (Secret Igloo)
Look at: igloo fade-in, sparkle burst on click, discovery message.
Expected: illustrated igloo. The discovery message on the status pill is KNOWN OLD — flag anything else.

### 7. Snow Pass → Summit Gate
Note: these nodes are NOT on main (PR #7 expansion, unmerged). When they land, audit: landmark art, route styling, reveal FX.

### 8. Race
Look at: race background, track, sleds, Kiki racer, rival Husky, pace buttons, race math panel, turbo bursts, finish flag, "KIKI WINS!" + reward text.
Expected: Kiki (SVG) is the only NEW item here — EVERYTHING else in this scene is KNOWN OLD (background, track, sleds, rival, buttons, panels, flag, header). This scene needs the most work. Flag anything that looks even older than the placeholder baseline.

### 9. Reward
Look at: the post-race screen.
Expected: currently just "Husky Adventure complete!" text — KNOWN placeholder. The real reward screen + sticker art (PR #10) goes here. Flag if the placeholder ships as final.

### 10. Full replay
Replay the whole adventure and watch for: stale revealed landmarks, Kiki art switching mid-game, fog banks not reforming, any element that appears in a different style the second time through.

