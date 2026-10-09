# Kiki & Husky Motion System

**Status:** production motion architecture — assets + semantic API + this spec.
**Branch:** `ringo/husky-character-motion-polish`
**Characters:** canonical Kiki (locked) and canonical Husky (locked) — this system
adds MOTION only. No redesign, no remarking, no new character art direction.

## The problem it solves

Kiki could feel like "an image moving from point A to point B." This system makes
her walk, run, stop, react, look, sniff, slip, climb, think and celebrate —
through a paper-doll rig + keyframed motion data + a semantic API that scenes
drive without touching asset filenames.

## Technique: puppet rigs from locked paintings

Each character pose was sliced into body parts (torso, head, ears, legs, tail)
from the LOCKED canonical paintings — the same pixels, zero redraw drift.
Parts live in small texture atlases; a deterministic keyframe engine poses them
every frame.

Why puppet instead of AI-painted frame cycles:
- **Consistency by construction** — the same dog in every frame, guaranteed.
- **Parameterized** — terrain (deep snow, ice, slopes) reshapes the SAME cycle
  live; no new art per terrain.
- **Tiny** — 5 rig atlases total (~470KB SVG-wrapped), vs. hundreds of frames.
- **Exact foot-contact data** — FX fires from authored contact phases.

All cycle keyframes were rendered offline and eyeballed before encoding
(`workspace/ringo-motion/render_cycle.py`; see `cycle-*.png`, `gamefeel-test.gif`).

### Rigs

| Rig | Source painting | Parts | Used for |
|---|---|---|---|
| `kiki-idle` | kiki-a-idle | torso, head, headClosed, ear×2, legFL, legFR | idle, all reactions, idle-life |
| `kiki-trot` | kiki-a-trot | torso, ear×2, 4 legs | trot |
| `kiki-run` | kiki-a-run | torso, ear×2, 4 legs | run, race |
| `husky-idle` | husky-idle | torso, head, headClosed, ear×2, tail, 4 legs | idle, reactions |
| `husky-race` | husky-race-fast | torso, ear×2, tail, 4 legs | race-steady/fast/turbo |

`headClosed` = the same head with AI-painted closed eyes (validated match);
blink = 120ms texture swap. Kiki has no tail part (tailless — by design).

Part pivots: legs rotate about the shoulder/hip (top of the part, tucked under
the torso); head about the neck; ears about their base; Husky tail about its base.
Draw order is back-to-front: far legs → near legs → torso → head → ears.

## Movement states & transitions

`MotionId`: `idle` | `trot` | `run` | `race-steady` | `race-fast` | `race-turbo`

- `transitionTo(id)` is the game-feel path — never `playMotion` for visible changes:
  - **idle → locomotion:** 200ms anticipation squash → rig swap hidden mid-squash →
    600ms acceleration ramp (cycle speed 0→1). Kiki never instantly slides.
  - **locomotion → idle:** 400ms deceleration ramp → settle rock (decaying ±3°) →
    idle breathing.
  - **locomotion → locomotion:** quick anticipate + swap + ramp.
- `playMotion(id)` = hard switch (cutscenes, teleports — Lennon, use sparingly).

## Cycle timing (foot-contact timing)

| Cycle | Period | Contacts (phase → paw) |
|---|---|---|
| kiki-trot | 600ms | 0.00: legFL+legBR · 0.50: legFR+legBL (diagonal pairs, real trot) |
| kiki-run | 440ms | 0.08: front pair · 0.55: back pair (gallop) |
| husky-steady | 560ms | same diagonal pattern as trot |
| husky-fast | 440ms | same gallop pattern as run |
| husky-turbo | 360ms | gallop + baked +8° forward lean, 1.2× amplitude |

Trot legs swing ±24° with −7px lift on the swing phase; body bobs twice per
cycle (−3.5px); ears flop on a lag. Run gathers/extends ±34° with a suspension
dip (−7px torso). `footstep` events fire at the exact phases above with the
paw's LIVE world position (computed from the part transform, not the rest pose).

## Idle life (she's alive when the player pauses)

`idle` is a 2.6s breathing loop (torso scaleY 1→1.03). On top, a scheduler fires
one behavior at a time from this cadence (never constantly):

| Behavior | Every | What |
|---|---|---|
| blink | 2.5–6s | 120ms head→headClosed swap |
| ear-twitch | 6–14s | one ear flicks (−14°, 350ms) |
| head-look | 8–16s | looks left/right (1.3s) |
| sniff | 14–24s | head down 1.5s |
| paw-adjust | 10–20s | front paw lifts 0.7s |
| shake-snow | 25–45s | body wiggle + snow burst FX |
| look-back | 18–32s | head turns toward the player 1.3s |

In `cave` terrain, head-look fires 2× as often. Behaviors never interrupt
locomotion — they only run in `idle`.

## Start / stop / turning

- **Anticipation:** squash (scaleY 0.93, scaleX 1.05, 200ms) before first step.
- **Acceleration:** cycle speed ramps 0→1 over 600ms.
- **Slowing:** ramp 1→0 over 400ms, then settle rock.
- **Turning:** `turnTo(dir)` = look first (head toward new dir, 300ms) → flip +
  squash to mask it → resume. The instant mirror-flip is gone; `setFacing(dir)`
  exists for cuts/teleports only.

## Terrain reactions (semantic — no gameplay rule changes)

`setTerrain(id)` reshapes the live cycle via multipliers:

| Terrain | Effect |
|---|---|
| `normal-snow` | base cycle |
| `deep-snow` | speed ×0.65, leg lift ×2.0 (high-step), bob ×1.4, bigger puffs |
| `ice` | stride ×1.1, 18% slip chance per plant → `slip` overlay (legs splay, slide) + sparkle FX |
| `uphill` | speed ×0.85, stride ×0.85, torso −10° (nose-up lean) |
| `downhill` | speed ×1.15, stride ×1.15, torso +7° |
| `bridge` | speed ×0.7, stride ×0.7 (careful steps) |
| `cave` | speed ×0.8, head-look 2× |
| `windy-pass` | shiver jitter overlay (240ms loop) + 5° lean |

## Player-advice reactions

`react(id)` — one-shot, returns to the base motion after. Big reactions from
locomotion auto-stop → react → resume. No speech animation (by design).

`curious` (head tilt) · `happy` (bounce) · `surprised` (head up, ears perk) ·
`think` (tilt other way) · `proud` (chest out) · `sniff` · `celebrate` (hop) ·
`confused` (tilt + paw lift) · `ask` (lean + tilt toward player) · `listen`
(ears up, still) · `agree` (double nod) · `unsure` (tilt + paw + lean back) ·
`brave` (chest out, head up) · `lets-try` (nod + hop) · Husky: `greeting`
(bounce + tail wag) · `encourage` · `look-kiki`.

## Race (Great Husky Sled Race)

- Husky: `race-steady` (560ms) → `race-fast` (440ms) → `race-turbo` (360ms +
  lean). Ears stream back, tail streams, contacts fire spray puffs (turbo ×2).
- `deep-snow-bound` one-shot: 34px bound arc, legs tuck, landing burst.
- `recover-shake`: wiggle + burst. `slip` on ice with sparkle.
- Sled contact: `huskyHarnessWorld(motion)` returns the harness chest anchor in
  world px — draw traces from there to the sled front with ~10px sag (RACE data).
  The Husky's painted red/black harness lives on the race-rig torso; it rides
  the body automatically.
- Kiki races on her `run` cycle (same data, `race-turbo` lean available).

## Foot contact & FX

- `footstep` events carry the paw's live world position → `FootFX` spawns a
  pawprint (fades over 9s, pool of 48) + snow puff (450ms, pool of 24).
- `slip` → ice sparkles. `shake` → snow burst. `hop` → apex marker.
- Ground shadow: soft ellipse following the character, shrinking as she hops
  (`motion.hopY`). Prints/puffs are plain images — no particle system.

## Semantic API (for Lennon)

```ts
import { CharacterMotion, FootFX, preloadMotion, createMotionAssets }
  from '../motion';

// preload(): preloadMotion(scene)
// create():
createMotionAssets(scene);
const kiki = new CharacterMotion(scene, 'kiki', x, y);
const fx = new FootFX(scene, kiki, { shadow: true });

kiki.transitionTo('trot');   // eased start
kiki.setTerrain('deep-snow'); // high-step, slower
kiki.react('ask');            // she asks the player
kiki.turnTo(-1);              // look-first turn
kiki.on('footstep', ({x, y}) => { /* custom FX */ });

// update():
kiki.update(time, delta);
fx.update(time, delta);
```

Rules: call `update` every frame; never position parts directly; never use
asset filenames (they live in `rigManifests.ts`, generated); `setTerrain`
doesn't change rules — it only reshapes motion. Rig swaps happen inside
`transitionTo` — scenes don't manage rigs.

## Performance (Chromebook budget)

- 5 atlases, ~470KB total on disk; ≤10 live part images per character.
- No runtime filters, no masks, no particle systems; FX = ≤84 small images.
- Keyframe engine: cosine sampling into preallocated state — zero per-frame
  allocation in the hot loop; `delta` clamped at 100ms.
- SVG wrappers rasterize once at load; frames are sliced from the texture.
- Motion was NOT achieved by adding frames: trot = 7 parts, run = 7 parts.

## What was validated

- Reassembly: all 5 rigs recomposite pixel-identical to the locked paintings.
- 110px gameplay check: no visible seams.
- Cycle strips: trot/run/steady read clearly (legs, bob, ear flop, tail wag).
- Idle behavior strip: look/tilt/sniff/ear-twitch/paw-lift all read.
- Game-feel sequence (idle → anticipate → trot + contact puffs): the transition
  reads; puffs fire at real contacts.
- `tsc --noEmit` clean; data integrity test (every track/contact/reaction/
  motion reference resolves) passes.
- Diff is purely additive: `public/assets/motion/*`, `src/motion/*`, this doc.

## Known limits (honest)

- Puppet legs swing rigidly (no knee flexion) — reads well at 110px, the
  target size; not feature-film articulation.
- Blink only exists on idle rigs (trot/run heads are baked into the torso).
  Blinking mid-sprint is not supported — acceptable, barely visible at speed.
- `turnTo` still ends in a scaleX flip, but it's masked by look-first + squash;
  a true 3/4 turn-around would need new paintings (future work, not this sprint).
- The offline validation renders approximate the engine (same easing, same
  keyframes); final judgment belongs to the game running on device.
