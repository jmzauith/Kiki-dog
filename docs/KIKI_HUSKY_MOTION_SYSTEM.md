# Kiki & Husky Production Motion System

**Status:** production motion system — assets + semantic API + this spec.
**Branch:** `ringo/kiki-husky-production-motion-system`
**Characters:** canonical Kiki (locked) and canonical Husky (locked). This system
adds MOTION only. No redesign, no remarking, no new character art direction.
**Extends:** the pass-1 motion sprint (`ringo/husky-character-motion-polish`,
PR #29) — same architecture, completed and hardened here.

---

## 1. Motion philosophy

Kiki on a blank background, with no camera movement, must still clearly read
as **walking, trotting, running, starting, stopping, turning, thinking,
slipping, climbing, carefully crossing, racing, and celebrating.** Motion is
never carried by translation alone.

How the system achieves it:

- **Paper-doll rigs from the locked paintings.** Each character is sliced into
  body parts (torso, head, ears, legs, tail) from the LOCKED canonical art —
  the same pixels in every frame, zero redraw drift. Motion = keyframed part
  transforms (angle/offset/scale) sampled by a tiny deterministic engine.
- **Real gait mechanics, not decoration.** Every locomotion cycle has diagonal
  leg alternation, body weight shift, shoulder/hip motion, authored
  paw-contact phases, head stabilization, and ear response. Trot and run are
  structurally different gaits (diagonal trot vs. rotary gallop with a gathered
  flight phase) — never one pose bounced faster.
- **Weight everywhere.** Starts anticipate (squash), acceleration ramps,
  stops decelerate and settle, turns look first and mask the flip in a squash,
  jumps crouch-launch-tuck-land. Nothing starts or stops instantly.
- **Secondary life.** Ears, head, breathing, blinks, and tail (Husky) move on
  their own cadences so the characters feel alive even standing still.
- **Terrain is visible in the body.** Deep snow high-steps, ice shortens steps
  and sometimes slips, slopes lean the torso, bridges shrink the stride. Same
  character, different effort — no gameplay-rule changes.
- **FX is contact-driven.** Pawprints, snow puffs, step sounds, ice sparkles,
  and shadow compression fire from authored foot-contact phases with the paw's
  LIVE world position — never on arbitrary timers.

Why puppet instead of AI-painted frame cycles:

- **Consistency by construction** — the same dog in every frame, guaranteed.
- **Parameterized** — terrain reshapes the SAME cycle live; no new art per terrain.
- **Tiny** — 5 rig atlases total, vs. hundreds of frames.
- **Exact foot-contact data** — FX fires from authored contact phases.

### Rigs

| Rig | Source painting | Parts | Used for |
|---|---|---|---|
| `kiki-idle` | kiki-a-idle | torso, head, headClosed, ear×2, legFL, legFR | idle, reactions, idle-life |
| `kiki-trot` | kiki-a-trot | torso, ear×2, 4 legs | trot + all walk variants |
| `kiki-run` | kiki-a-run | torso, ear×2, 4 legs | run |
| `husky-idle` | husky-idle | torso, head, headClosed, ear×2, tail, 4 legs | idle, reactions |
| `husky-race` | husky-race-fast | torso, ear×2, tail, 4 legs | race + husky walk |

`headClosed` = the same head with painted closed eyes (validated match);
blink = texture swap. **Kiki has no tail part — tailless, by design, in every
rig.** The Husky keeps his curled tail.

Part pivots: legs rotate about the shoulder/hip (top of the part, tucked under
the torso); head about the neck; ears about their base; Husky tail about its
base. Draw order is back-to-front: far legs → near legs → torso → head → ears.

---

## 2. Kiki animation list

20 locomotion states + reactions. `MotionId` is the only vocabulary scenes use.

| # | MotionId | Kind | Rig / cycle | What the player sees |
|---|---|---|---|---|
| 1 | `idle` | cycle | kiki-idle | breathing loop + scheduled idle behaviors |
| 2 | `trot` | cycle | kiki-trot | diagonal-pair trot, the default travel gait |
| 3 | `run` | cycle | kiki-run | rotary gallop, gathered flight phase |
| 4 | `careful` | cycle | kiki-careful | slow deliberate walk, short steps |
| 5 | `start` | command | — | anticipation squash → accelerate into trot |
| 6 | `stop` | command | — | decelerate ramp → settle rock → idle |
| 7 | `accelerate`¹ | command | — | ramps cycle speed 0→1 (600ms) |
| 8 | `turn-left` | command | — | look → weight shift → masked flip → recover |
| 9 | `turn-right` | command | — | mirror of turn-left |
| 10 | `look-back` | command | — | head turns toward the player (1.3s) |
| 11 | `sniff-walk` | cycle | kiki-sniff-walk | trot with nose held low |
| 12 | `deep-snow-walk` | cycle | kiki-deep-snow | high-step heaves, slower, effortful |
| 13 | `ice-walk` | cycle | kiki-ice-walk | 4 quick taps, low crouch, cautious |
| 14 | `slip` | command | — | legs splay, slide, sparkle FX (450ms) |
| 15 | `recover` | command | — | shake-off wiggle + snow burst (900ms) |
| 16 | `uphill-walk` | cycle | kiki-uphill | forward lean, shorter digging stride |
| 17 | `downhill-walk` | cycle | kiki-downhill | braking posture, long controlled stride |
| 18 | `bridge-walk` | cycle | kiki-bridge-walk | careful paw placement, balance sway |
| 19 | `jump` | command | — | crouch → launch → tucked flight → auto-land |
| 20 | `land` | command | — | compression squash, splay, ear flop (450ms) |

¹ `accelerate` is exposed as `accelerateTo()` on the API (see §12); the
`start`/`stop` commands cover the common cases.

**Reactions** (`react(id)`, one-shot, auto-returns): `curious` `happy`
`surprised` `think` `proud` `sniff` `celebrate` `confused` `ask` `listen`
`agree` `unsure` `brave` `lets-try` `alert` `focused` `excited` `slip`
`recover` `look-back`. No speech animation (by design).

---

## 3. Husky animation list

The Husky moves like the experienced mountain athlete he is — efficient,
confident, never frantic. Kiki is never made to look weak by comparison;
the Husky is simply smoother.

**Exploration:**

| MotionId | Kind | What the player sees |
|---|---|---|
| `husky-idle` | cycle | breathing, tail sway, occasional ear flicks |
| `husky-walk` | cycle | efficient experienced trot (700ms) |
| `greeting` (reaction) | one-shot | bounce + tail wag |
| `play-challenge` (reaction) | one-shot | play bow: front dips, rear up, tail wags |
| `look-kiki` (reaction) | one-shot | head turns toward Kiki |
| `encourage` (reaction) | one-shot | cheering bark bounce |

**Race** (see §10 for the full race-state model):

| MotionId | Kind | Period | Notes |
|---|---|---|---|
| `race-steady` | cycle | 560ms | working trot, spray ×1 per contact |
| `race-fast` | cycle | 440ms | gallop, spray ×1 |
| `race-turbo` | cycle | 360ms | gallop + baked lean, spray ×2 |
| `race-turn` | cycle | 622ms | steady gait at 0.9× with 14° banked lean |
| `race-slowdown` | cycle | 880ms | fast gait at 0.5× with −6° braking lean |
| `race-celebrate` | command | — | victory hop (via `celebrate`) |
| `race-bump` (one-shot) | overlay | 500ms | sideways jolt + recover, snow shake |

---

## 4. Frame counts

The engine is keyframed, not frame-based: a "frame" below = authored motion
beat. Cycles are sampled continuously (cosine easing), so motion is smooth at
any display refresh rate. Counts are given as keyframe beats per cycle.

**Kiki cycles:**

| Cycle | Period | Beats | Leg pattern |
|---|---|---|---|
| kiki-idle | 2600ms | breathe in/out | planted |
| kiki-trot | 600ms | 2 | diagonal pairs FL+BR / FR+BL |
| kiki-run | 440ms | 2 | front pair → gathered flight → rear pair |
| kiki-careful | 900ms | 2 | diagonal pairs, short |
| kiki-sniff-walk | 800ms | 2 | diagonal pairs, nose down |
| kiki-deep-snow | 950ms | 2 | diagonal heaves, front lift ×2.3 |
| kiki-ice-walk | 750ms | 4 | FL → BR → FR → BL quick taps |
| kiki-uphill | 700ms | 2 | diagonal, digging |
| kiki-downhill | 650ms | 2 | diagonal, braking |
| kiki-bridge-walk | 850ms | 2 | diagonal, careful plants |

**Husky cycles:** husky-idle 2800ms · husky-steady 560ms · husky-fast 440ms ·
husky-turbo 360ms · husky-walk 700ms.

**One-shots** (ms): turn 700 · jump 700 · land 450 · slip 450 · recover-shake
900 · race-bump 500 · play-challenge 900 · anticipate 200 · settle 700 ·
celebrate 650 · reactions 600–1500 (see §9).

---

## 5. Frame timing

Cycle periods are tuned so gaits read at 110px gameplay size:

- **Trot 600ms** — unhurried, readable leg alternation. The default travel gait.
- **Run 440ms** — 27% faster than trot AND structurally different (gallop):
  extended stride (±32–34°), gathered flight, torso extension/compression
  (±4° pitch, −7px dip). Never a sped-up trot.
- **Careful 900ms / bridge 850ms** — slow reads as cautious, not broken.
- **Ice-walk 750ms with 4 taps** — quick small steps read as tentative.
- **Deep-snow 950ms** — slow + high lift reads as effort.
- **Uphill 700ms / downhill 650ms** — lean direction sells the slope.

Transitions: anticipation 200ms → acceleration ramp 600ms (speed 0→1);
deceleration 400ms → settle rock 700ms (decaying ±3°). Turns: 700ms total
(look 0–200, shift 200–450, flip masked at 450, recover 450–700).

---

## 6. Paw-contact timing

Every cycle documents its contact phases in `contactNotes` (data) and here.
Lennon: subscribe to `footstep` — it fires at these exact phases with the
paw's **live** world position (computed from the part transform, not the rest
pose). Spawn prints/puffs/sounds there.

| Cycle | Contacts (phase → paw → beat) |
|---|---|
| kiki-trot | 0.00: FL+BR plant · 0.50: FR+BL plant |
| kiki-run | 0.08: FL+FR front plant · 0.55: BL+BR rear plant |
| kiki-careful | 0.00: FL+BR plant · 0.50: FR+BL plant (soft) |
| kiki-sniff-walk | 0.00: FL+BR plant · 0.50: FR+BL plant |
| kiki-deep-snow | 0.00: FL+BR heave-plant · 0.50: FR+BL heave-plant (deep puff + big print) |
| kiki-ice-walk | 0.00: FL tap · 0.25: BR tap · 0.50: FR tap · 0.75: BL tap (tiny sparkles) |
| kiki-uphill | 0.00: FL+BR dig-plant · 0.50: FR+BL dig-plant |
| kiki-downhill | 0.00: FL+BR brake-plant · 0.50: FR+BL brake-plant (scrape puff) |
| kiki-bridge-walk | 0.00: FL+BR careful-plant · 0.50: FR+BL careful-plant (hollow footfall) |
| kiki-idle / husky-idle | no contacts (feet planted) |
| husky-steady | 0.00: FL+BR plant · 0.50: FR+BL plant (spray ×1) |
| husky-fast | 0.08: FL+FR plant · 0.55: BL+BR plant (spray ×1) |
| husky-turbo | same as fast, 22% quicker (spray ×2) |
| husky-walk | 0.00: FL+BR plant · 0.50: FR+BL plant |

Contact-event → FX mapping: `footstep` → print + puff (+ sound) ·
`slip` → sparkles · `shake` → snow burst · `hop` → apex marker ·
`landed` → heavy landing puff + thump · `turned` → facing changed.

---

## 7. Terrain variants

Two complementary mechanisms (no gameplay-rule changes, ever):

**A. Explicit gait cycles** — scenes pick the gait that matches the ground:
`careful`, `sniff-walk`, `deep-snow-walk`, `ice-walk`, `uphill-walk`,
`downhill-walk`, `bridge-walk`. Each is authored with its own leg pattern,
lift, lean, and contact timing (§6).

**B. Live terrain modifiers** — `setTerrain(id)` reshapes the CURRENT cycle
via multipliers (no new art):

| Terrain | Effect on the live cycle |
|---|---|
| `normal-snow` | base cycle |
| `deep-snow` | speed ×0.65, lift ×2.0 (high-step), bob ×1.4 |
| `ice` | stride ×1.1, 18% slip chance per plant → `slip` overlay + sparkles |
| `uphill` | speed ×0.85, stride ×0.85, torso −10° |
| `downhill` | speed ×1.15, stride ×1.15, torso +7° |
| `bridge` | speed ×0.7, stride ×0.7 |
| `cave` | speed ×0.8, head-look 2× as often |
| `windy-pass` | 240ms shiver jitter overlay + 5° lean (sits UNDER the cycle) |

Guidance: use explicit gaits for authored story beats (bridge crossing,
deep-snow field); use `setTerrain` for continuous ground variation under a
single gait. Both compose (e.g. `deep-snow-walk` + `windy-pass`).

---

## 8. Secondary motion rules

Secondary motion is layered UNDER or OVER the base cycle — it never replaces
gait mechanics.

| Channel | Rule |
|---|---|
| Ear bounce | ears lag the torso bob by ~quarter phase; amplitude scales with speed |
| Ear twitch | idle-only, 6–14s cadence, single ear, 350ms |
| Blink | 120ms head→headClosed swap, 2.5–6s cadence, idle rigs only |
| Breathing | the idle cycle itself (torso scaleY 1→1.03, 2.6s) |
| Head look / tilt | reactions + idle `head-look` (1.3s, mirrored randomly) |
| Body compression | anticipation squash, landing squash, jump crouch — scaleY 0.86–0.93 |
| Shoulder/hip | torso roll ±1.5–2° at 2× stride frequency in every gait |
| Chest | breathing scale + effort bob multiplier in deep snow |
| Snow shake | full-body wiggle (6 direction flips, 900ms) + `shake` burst event |
| Look-back-to-player | 1.3s head turn, idle cadence 18–32s + on-demand command |
| Husky tail | sways with gait (±5–8°), streams back at speed (−14°), wags in greeting/play |

**Kiki has no visible tail. Do not add tail animation to Kiki — in any rig,
any cycle, any reaction, ever.**

---

## 9. Expression states

Expressions are head/ear/posture poses (one-shots). On gait rigs (no separate
head part) they degrade gracefully to ear + torso cues — still readable.

| Reaction | Duration | Pose |
|---|---|---|
| `curious` | 800ms | head tilt +14° |
| `happy` | 600ms | bounce hop + head lift |
| `excited` | 600ms | double hop + ears up |
| `surprised` | 800ms | head up, ears perked |
| `think` | 1000ms | tilt −13° (other way), held |
| `proud` | 900ms | chest out, head up |
| `confused` | 900ms | tilt + paw lift |
| `alert` | 700ms | ears −10°, torso up |
| `focused` | 900ms | ears forward, torso level, still |
| `sniff` | 1500ms | head down, nose toward ground |
| Advice: `ask` | 1000ms | lean + tilt toward player |
| `listen` | 1200ms | ears up, body still |
| `agree` | 720ms | double nod |
| `unsure` | 1000ms | tilt + paw + lean back |
| `brave` | 900ms | chest out, head high |
| `lets-try` | 700ms | nod + small hop |
| `celebrate` | 650ms | high hop, head up |
| Husky `greeting` | 900ms | bounce + tail wag |
| Husky `encourage` | 800ms | bark bounce toward Kiki |
| Husky `look-kiki` | 900ms | head turn toward Kiki |
| Husky `play-challenge` | 900ms | play bow + tail wag |

---

## 10. Race states

The Great Husky Sled Race runs on this state model (Husky; Kiki races on
her `run` cycle with the same overlay vocabulary):

```
standstill → ACCELERATION (anticipate + speed ramp)
  → RACE-STEADY ⇄ RACE-FAST ⇄ RACE-TURBO   (escalation ladder)
  → RACE-TURN (banked 14° lean, 0.9×) → back to ladder
  → DEEP-SNOW (bound one-shot + resistance) → RECOVER (shake)
  → BUMP (race-bump one-shot) → RECOVER
  → LOOK (look-kiki / look toward opponent — overlay, speed kept)
  → FINAL PUSH (race-turbo + encourage) → FINISH (race-slowdown 0.5×, −6° lean)
  → RACE-CELEBRATE (victory hop)
```

- **Sled contact:** `huskyHarnessWorld(motion)` returns the harness chest
  anchor in world px — draw traces from there to the sled front with ~10px sag
  (RACE data). The Husky's painted red/black harness lives on the race-rig
  torso; it rides the body automatically. Character posture is what this
  system owns; the sled itself is untouched.
- **Snow spray** emits from `footstep` contacts; turbo doubles the rate.
- **Harness motion:** the harness is painted on the torso, so it follows
  torso pitch/lean exactly — no separate harness rig needed.

---

## 11. Animation transition graph

```
                    ┌─────────────┐
                    │    idle     │◄────────────────────┐
                    └──────┬──────┘                     │
         anticipate │      │ decelerate+settle          │
         + ramp     │      │                            │
                    ▼      ▼                            │
   ┌────────┐   ┌────────┐   ┌────────┐   ┌──────────┐  │
   │ careful│◄─►│  trot  │◄─►│  run   │   │ terrain  │  │
   └────────┘   └───┬────┘   └────────┘   │ variants │  │
        ▲           │ turn (700ms,        │ (any of  │  │
        │           │ masked flip)        │ the walk │  │
        └───────────┴─────────────────────┤ cycles)  │──┘
                                          └──────────┘

Overlays (never break the base cycle):
  reactions · idle behaviors · slip/recover · jump→land · race-bump
  deep-snow-bound · shiver (windy-pass) · turn flip event
```

Rules: `transitionTo()` is the game-feel path (anticipation + ramps +
masked rig swaps). `playMotion()` is a hard switch — cutscenes/teleports
only. Commands (`start stop jump land slip recover turn-left turn-right
look-back race-celebrate`) are overlays: they play and the previous state
resumes. `turnTo(dir)` is the only legal facing change during gameplay;
`setFacing(dir)` is for cuts/teleports.

---

## 12. Semantic animation API

```ts
import { CharacterMotion, FootFX, preloadMotion, createMotionAssets }
  from '../motion';

// preload(): preloadMotion(scene)
// create():
createMotionAssets(scene);
const kiki = new CharacterMotion(scene, 'kiki', x, y);
const fx = new FootFX(scene, kiki, { prints: true, puffs: true, shadow: true });

// locomotion (eased)
kiki.transitionTo('trot');
kiki.transitionTo('deep-snow-walk');
kiki.transitionTo('ice-walk');

// commands (play-and-resume)
kiki.transitionTo('jump');        // auto-lands
kiki.transitionTo('slip');
kiki.transitionTo('turn-left');   // or kiki.turnTo(-1)

// explicit feel controls
kiki.start();                     // anticipate → trot
kiki.start('run');
kiki.stopMoving();                // decelerate → settle → idle
kiki.accelerateTo();              // ramp speed back to full
kiki.accelerateTo('race-turbo');

// reactions & advice
kiki.react('ask');
kiki.react('brave');

// terrain (reshapes the live cycle; no rule changes)
kiki.setTerrain('deep-snow');
kiki.setTerrain('ice');           // occasional auto-slip via slipChance

// facing (never an instant flip)
kiki.turnTo(1);

// FX hooks (contact-driven)
kiki.on('footstep', ({ paw, x, y }) => { /* print/puff/sound */ });
kiki.on('slip', ({ x, y }) => { /* sparkles */ });
kiki.on('landed', ({ x, y }) => { /* heavy puff + thump */ });
kiki.on('shake', ({ x, y }) => { /* snow burst */ });
kiki.on('turned', ({ facing }) => { /* direction changed */ });

// update() every frame:
kiki.update(time, delta);
fx.update(time, delta);
```

`isCommandMotion(id)` tells scenes whether an id is a command or a steady
state. `currentMotion` reports the steady state (commands don't disturb it).

---

## 13. Asset-loading recommendations

- **Preload once per scene:** `preloadMotion(scene)` queues the 5 rig atlases
  as SVG (rasterized once at load, then sliced into part frames).
- **Create once:** `createMotionAssets(scene)` slices atlas frames + builds
  the 4 runtime FX canvas textures (puff, paw, shadow, sparkle). Idempotent.
- **Atlases:** 5 total (~470KB on disk as SVG wrappers). ≤10 live part
  `Image` objects per character — parts are re-posed, never re-created.
- **No frame sequences ship.** Cycles are data (a few KB of keyframes), not
  images. Adding a gait = authoring keyframes on an existing rig.
- **FX textures** are runtime-generated canvases (like the world's textures),
  pooled and faded manually — no particle systems, no sprite sheets.
- **New art only when identity demands it** (e.g. a true 3/4 turn-around
  would need new paintings). Everything else is rig + data.

---

## 14. Phaser integration guidance (for Lennon)

1. One `CharacterMotion` + one `FootFX` per character per scene. Positions go
   to `motion.container` (feet at x/y).
2. Drive everything through `transitionTo` / `react` / `setTerrain` /
   `turnTo`. Never touch part images, never use asset filenames (they live in
   generated `rigManifests.ts`).
3. Call `update(time, delta)` on both objects every frame, before rendering.
4. Rig swaps happen inside `transitionTo` (masked by the anticipation
   squash) — scenes never manage rigs.
5. `footstep` gives live paw world positions — spawn prints/puffs/sounds
   there. `landed` = heavy landing; `slip` = ice moment; `shake` = snow burst.
6. Sled traces: `huskyHarnessWorld(motion)` → draw to sled front, ~10px sag.
7. Ground shadow: `FootFX` with `{ shadow: true }`; call `setShadowGround(y)`
   when terrain height changes. It auto-shrinks on hop (`motion.hopY`).
8. `turnTo` emits `turned` when the flip completes — sync AI/direction there.
9. `setTerrain` never changes gameplay rules — only motion shaping.
10. Cleanup: `motion.destroy()` + `fx.destroy()` on scene shutdown.

---

## 15. Performance notes (Chromebook budget)

- ≤10 part images per character; parts re-posed, never allocated per frame.
- Keyframe engine: cosine sampling into preallocated `PartState` — **zero
  per-frame allocation** in the hot loop (the `@root` overlay path reuses a
  persistent combined map). `delta` clamped at 100ms.
- FX budgets: ≤48 prints (9s fade, recycled), ≤24 puffs, ≤12 sparkles,
  1 shadow. All plain images with manual fades — no particle system.
- No runtime filters, no masks, no per-frame texture uploads.
- SVG atlases rasterize once at load; total ~470KB on disk.
- Motion was NOT achieved by adding frames: trot = 7 parts, run = 7 parts,
  every gait variant reuses the same 7 parts with different keyframes.

---

## 16. Forbidden shortcuts

Documented explicitly so they never regress:

1. **No static sprite sliding** — every locomotion state has leg alternation,
   weight shift, and contact phases. Translation without gait is a bug.
2. **No whole-character bob as a gait substitute** — bob is a layered
   component (torso y at 2× stride frequency), never the whole motion.
3. **No instant 180° flip without transition** — facing changes go through
   `turnTo` (look → shift → masked flip → recover). `setFacing` is for
   cuts/teleports only.
4. **No visible Kiki tail** — Kiki has no tail part in any rig. Do not add
   one, do not animate one, do not imply one.
5. **No movement without foot-contact rhythm** — every cycle documents its
   contact phases (§6); FX fires from contacts, not timers.
6. **No same gait for every terrain** — deep snow, ice, slopes, and bridges
   each change the body visibly (§7). Same-gait-everywhere is a bug.
7. **No redesign of canonical identity** — markings, proportions, faces,
   Kiki's taillessness, and the Husky's build are locked. New art only
   extends the rigs; it never restyles the characters.
8. **No faked running** — run is a structurally different gallop (extended
   stride, gathered flight, torso extension/compression). Not one pose,
   not a bounce, not a stretch, not faster translation.

---

## What was validated

- `tsc --noEmit --strict` clean.
- Data-integrity test: every cycle/one-shot/motion/reaction/terrain/idle
  reference resolves; all parts exist in their rigs; all contacts reference
  real legs with phases in [0,1); all key tracks sorted and spanning their
  domain; every cycle documents `contactNotes`. (15 cycles, 37 one-shots,
  17 steady motions, 24 reactions.)
- Reassembly: all 5 rigs recomposite pixel-identical to the locked paintings.
- 110px gameplay checks: no visible seams; all 8 new gait variants read
  clearly (deep-snow high-step, ice taps, uphill/downhill lean, bridge
  caution, sniff-walk, husky-walk).
- Cycle strips: careful/deep-snow/ice/uphill/downhill/bridge/sniff/husky-walk
  show correct leg alternation, weight shift, and ear response; jump shows
  crouch → launch → tuck; land shows compression; turn shows shift → squash.
- Loop-closure fix: phase-shifted leg pairs now carry opening/closing keys so
  sampling eases through the cycle wrap (previously the last quarter-phase
  held flat — a subtle hitch in every diagonal gait).
- Overlay `@root` fix: one-shot hop/squash tracks (`happy`, `celebrate`,
  `jump`, `excited`, `greeting`, `deep-snow-bound`…) now actually move the
  inner container — previously they were silently dropped.
- Diff is purely additive: `src/motion/*`, this doc. No scenes, logic, UI,
  environment, or character art touched.

## Known limits (honest)

- Puppet legs swing rigidly (no knee flexion) — reads well at 110px, the
  target size; not feature-film articulation.
- Blink only exists on idle rigs (gait-rig heads are baked into the torso).
  Blinking mid-sprint is not supported — acceptable, barely visible at speed.
- `turnTo` still ends in a scaleX flip, but it is now first-class: look-first
  (200ms) → weight shift → squash → flip masked at the squash bottom (450ms)
  → recover, with a `turned` event. A true 3/4 turn-around would need new
  paintings (future work, not this sprint).
- Ear-base highlight: the locked paintings have a light fur highlight at the
  ear base; large ear rotations can reveal it briefly. Invisible at 110px
  gameplay size; the art is locked, so this is documented, not "fixed."
- The offline validation renders approximate the engine (same easing, same
  keyframes); final judgment belongs to the game running on device.

