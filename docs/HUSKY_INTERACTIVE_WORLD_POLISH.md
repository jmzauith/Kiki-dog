# Husky Interactive World Polish — Interaction Manifest

**Branch:** `harrison/husky-interactive-world-polish`
**Goal:** turn Snowy Peaks from a beautiful backdrop into a world the player can
DO THINGS IN. Target: 10–15 min natural playtime, ~5–6 required math problems,
10+ non-math interactions, 2+ optional secrets.

**Lane:** environment art + environmental interaction assets only.
No progression logic, no math rules, no scene-code changes (Lennon),
no character animation (Ringo), no interaction/content logic (McCartney).

All assets live under `public/assets/worlds/snowy-peaks/`, self-contained SVG
wrappers (embedded WebP). Interactables carry a soft golden shimmer painted in,
so McCartney's tap-targets read as touchable without extra art.

Success test: with every math question removed, this is still a fun adventure —
follow tracks, fix a bridge, choose a path, cross ice, search an igloo, dig up
bones, climb the pass, race a Husky.

---

## TRAILHEAD — first 30–45 seconds are NOT math

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-th-pawprints.svg` | Investigatable pawprint trail | idle (shimmer) → tapped (sparkle burst) → trail highlighted | Optional | Tap the glowing print; camera nudges along the trail | 20–30 | McCartney: tap-target → sparkle + hint arrow |
| `ip-th-signpost.svg` | 3-way choice moment | idle → arm wiggles on hover/tap | Required (choose) | Tap an arm to pick first direction | 15–20 | McCartney: 3 choices route to bridge/forest/lake intros |
| `ip-th-backpack.svg` | Inspectable camp prop | closed → open (glint) → peek inside | Optional | Tap to open; finds a trail snack / map scrap | 15–25 | McCartney: tap → inventory flavor / hint |

## BROKEN BRIDGE — a physical repair-and-crossing beat

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-br-planks.svg` | Show what is broken | idle → tap plank (it wobbles) | Required view | Tap loose planks; each wobbles comically | 15–20 | McCartney: 3 tappable planks before math unlocks |
| `ip-br-ropetools.svg` | Repair kit | idle → tools glow when math solved | Required | After math: tap rope → mallet → planks in order | 30–45 | McCartney: ordered tap sequence; wrong order = funny shake |
| `ip-br-wobble.svg` | Bridge shake state | triggered on wrong tap / during repair | Reactive | Bridge wobbles, snow puffs fall | 5–10 | Lennon: swap in during repair beat |
| `ip-br-crossing.svg` | Crossing POV reward | shown while Kiki crosses | Required beat | Hold-to-walk or auto-walk across; snow falls off rails | 20–30 | Ringo/Lennon: Kiki walk cycle over this plate |
| `ip-br-ravine.svg` | Ravine atmosphere | ambient (slow mist drift) | Ambient | — | — | Lennon: parallax layer behind bridge |

## WHISPER FOREST — a real exploration/choice space

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-wf-pawprints.svg` | Mystery trail | idle shimmer → follow (prints light up one by one) | Optional | Tap prints in order; they lead to the bush | 25–35 | McCartney: sequence tap → reveals bush |
| `ip-wf-bush.svg` | Rustling bush payoff | still → rustle (on approach/tap) → feather pops out | Optional | Tap/shake the bush; a feather + giggle, no animal | 15–20 | McCartney: tap → rustle anim + feather collectible |
| `ip-wf-sign-safe.svg` | Safe-path clue | idle | Required (read) | Inspect: sun symbol = warm/easy path | 10 | McCartney: tap → hint text |
| `ip-wf-sign-challenge.svg` | Challenge-path clue | idle | Required (read) | Inspect: crystal symbol = icy/exciting path | 10 | McCartney: tap → hint text |
| `ip-wf-falselead.svg` | Gentle red herring | idle → inspected (frosted, empty) | Optional | Tap: "just an old lantern!" — teaches not everything is a clue | 10–15 | McCartney: tap → flavor line |

## FROZEN LAKE — choose your path across

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-fl-safe.svg` | Trustworthy step | idle (gold shimmer) → stepped (ripple) | Required | Tap to hop; safe | 5/step | McCartney: path logic; Lennon: ripple FX |
| `ip-fl-risky.svg` | Risky step | idle → stepped (cracks spread, holds) | Required choice | Tap: cracks spread but holds — gasp moment | 5–8/step | McCartney: risk/reward; maybe faster route |
| `ip-fl-cracked.svg` | Broken step | idle → tapped (splash, Kiki hops back, safe) | Hazard | Tap: it gives way, Kiki hops back giggling — no fail state | 8–10 | McCartney: safe-fail, teaches reading ice |
| `ip-fl-ripplefx.svg` | Foot-contact ripple | on step | Reactive | — | — | Lennon: spawn on each step (ADD blend) |
| `ip-fl-detour.svg` | Optional island | hidden → discovered (sparkle) | Optional secret | Longer hop path → ice-flowers + warm spring | 30–45 | McCartney: detour route + small reward |

## FALLEN TREE — clear 3–5 things, don't just click continue

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-ft-branches.svg` | Draggable branch pile | idle (shimmer) → dragged aside | Required (1 of 4) | Drag the branch pile off the trail | 15–20 | McCartney: drag target |
| `ip-ft-logsection.svg` | Movable log chunk | idle → dragged → stacked | Required (2 of 4) | Drag log sections to the stack (2x) | 20–30 | McCartney: drag + snap |
| `ip-ft-progress.svg` | Half-cleared state | shown at 2/4 cleared | Progress | Visual payoff mid-task | — | Lennon: swap at halfway |

(Cleared final state already exists: `lm-fallentree-cleared.svg` from the visual migration.)

## ICE CAVE — the challenge route feels worth it

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-ic-crystals.svg` | Ambient cluster | idle (slow shimmer) | Ambient | — | — | Lennon: background dressing |
| `ip-ic-crystal-glow.svg` | Touch-the-crystal moment | dim → tapped (pulse + chime + light wash) | Optional | Tap 3 crystals to light the cave | 20–30 | McCartney: 3-tap sequence → cave brightens |
| `ip-ic-tunnel.svg` | Shortcut cue | dark → after crystals lit, warm glow appears | Optional secret | Discover the shortcut tunnel | 15–20 | McCartney: unlocks skip-ahead |
| `ip-ic-nook.svg` | Hidden alcove | idle (faint glint) → tapped (sparkle) | Optional secret | Spot the glint; tiny reward | 15–20 | McCartney: tap → collectible |

## SECRET IGLOO — the most memorable 60 seconds (optional)

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-ig-reveal.svg` | Discovery moment | mound → brushed → blocks + sparkles | Optional | Rub/tap snow away to reveal | 15–20 | McCartney: rub gesture |
| `ip-ig-entrance.svg` | Tunnel peek | idle | Optional | Tap to peek inside (warm light) | 10 | McCartney: tap → interior |
| `ip-ig-interior.svg` | Cozy interior view | idle (fire glow flicker) | Optional | Look around; 3 inspectables glow | 15–20 | Lennon: interior scene plate |
| `ip-ig-lantern.svg` | Expedition prop 1 | idle → tapped (lights up, history line) | Optional | Tap: old Husky expedition lantern | 10–15 | McCartney: lore line |
| `ip-ig-map.svg` | Expedition prop 2 | idle → tapped (unrolls slightly) | Optional | Tap: paw-stamped expedition map | 10–15 | McCartney: lore line |
| `ip-ig-reward.svg` | Hidden reward nook | dark → found (golden glow) | Optional secret | Find the glowing nook → treat | 10–15 | McCartney: tap → reward |

(Exterior states already exist: `lm-igloo-hidden/discovered/glow.svg` from the visual migration.)

## BONE CACHE — small and funny

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-bc-sniff.svg` | Scent trail cue | idle (drifting wisps) | Optional | Follow the swirls to the mound | 10–15 | Lennon: drifting overlay |
| `ip-bc-halfburied.svg` | The tease | idle (glint) | Optional | Tap the bone tip; it wiggles | 10 | McCartney: tap → wiggle |
| `ip-bc-dig.svg` | Dig burst | on dig taps | Optional | Tap 3x: snow flies, stash revealed | 15–20 | McCartney: 3-tap → `lm-bonecache-revealed.svg` |

## SNOW PASS — non-math traversal

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-sp-gust.svg` | Wind gust cue | idle → gust sweeps (telegraphed) | Required timing | Wait for gust to pass / time movement | 15–25 | McCartney: timing gate; Lennon: scrolling overlay |
| `ip-sp-drift.svg` | Drift obstacle | idle | Required | Tap/rub to clear a path through | 15–20 | McCartney: rub gesture |
| `ip-sp-flags.svg` | Directional guide | idle (flags stream in wind) | Guide | Follow the flags; wrong way = gust | 10 | McCartney: path hint |
| `ip-sp-shelter.svg` | Rest nook | idle | Optional | Duck in during gust; cozy breather | 10–15 | McCartney: safe spot |

## SUMMIT GATE — the unlocking ceremony

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-sg-locked.svg` | Frozen gate | idle | Required view | — | — | Lennon: gate plate |
| `ip-sg-cracking.svg` | Ice breaking | on unlock (ice falls, sparkles) | Required beat | Tap the ice / auto after math | 15–20 | McCartney: tap-ice mini-beat |
| `ip-sg-open.svg` | Gates open, flags unfurl | after cracking | Required beat | Watch the reveal; pawprints lead through | 10–15 | Lennon: crossfade |
| `ip-sg-view.svg` | Summit panorama payoff | reveal (slow pan) | Required reward | Take in the view; race camp visible below | 15–20 | Lennon: slow pan + race-camp teaser |

## RACE CAMP — life before the race (no instant start)

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-rc-overview.svg` | Camp establishing plate | idle (tent glow, flag flutter) | Required view | Arrive; look around | 10–15 | Lennon: camp scene plate |
| `ip-rc-sled.svg` | Inspectable sled | idle (shimmer) → tapped (details) | Optional | Tap: check the sled, blanket, runners | 15–20 | McCartney: tap → flavor |
| `ip-rc-meetspot.svg` | Husky meet staging | empty → Husky arrives (Ringo) | Required beat | Wait/greet moment | 15–25 | Ringo: Husky animation placed here by Lennon |
| `ip-rc-flags.svg` | Camp dressing | idle | Ambient | — | — | Lennon: dressing |

## RACE — every decision is a visually distinct situation

| Asset | Purpose | State sequence | Optional? | Child interaction | ~Seconds | Integration hook |
|---|---|---|---|---|---|---|
| `ip-re-downhill.svg` | Downhill section | — | Required | Choose: tuck (fast) or brake (safe) | per race | McCartney: race decision |
| `ip-re-icyturn.svg` | Banked icy turn | — | Required | Choose: wide (safe) or tight (fast) | per race | McCartney: race decision |
| `ip-re-deepsnow.svg` | Deep powder section | — | Required | Choose: power through or pick line | per race | McCartney: race decision |
| `ip-re-narrowpass.svg` | Narrow cliff pass | — | Required | Choose: steady or sprint | per race | McCartney: race decision |
| `ip-re-finish.svg` | Finish straight + crowd | pre-finish → confetti/sparkle | Required | Final sprint; crowd reacts | per race | McCartney: finish; Lennon: crowd FX |

(Existing race assets from the visual migration: `race-backdrop.svg`,
`race-checkpoint.svg`, `fx-snowspray.svg`.)

## WORLD DEPTH — parallax layers (no flat-prop feel)

| Asset | Purpose | Layer / speed | Integration hook |
|---|---|---|---|
| `ip-px-far.svg` | Distant mountain ranges | far, 0.15× | Lennon: slowest parallax strip |
| `ip-px-mid.svg` | Snow-laden pine forest band | mid, 0.4× | Lennon: mid parallax strip |
| `ip-px-fore.svg` | Foreground snowbanks + branch framing | fore, 1.0×+ (occlusion) | Lennon: foreground occlusion strip |

Use behind HuskyScene travel beats and the race for camera depth, speed feel,
and natural movement through space.

---

## Gameplay-time estimate

| Location | Added seconds |
|---|---|
| Trailhead | 50–75 |
| Bridge (repair + crossing beat) | 70–105 |
| Whisper Forest | 60–80 |
| Frozen Lake | 40–70 |
| Fallen Tree | 35–50 |
| Ice Cave | 50–70 |
| Secret Igloo (optional) | 45–60 |
| Bone Cache (optional) | 35–45 |
| Snow Pass | 50–60 |
| Summit Gate | 40–55 |
| Race Camp | 40–60 |
| **Total** | **~8.5–12 min of play, of which ~5–8 min is active interaction** |

Plus the race itself with visually distinct decision sections. Math stays at
~5–6 required problems; everything above is touch/choose/inspect/discover.
