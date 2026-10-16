> **Documentation status — design proposal; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Proposed behavior is not an implementation checklist; reconcile against current rules and remaining work.

# Husky Microgame & Interaction Redesign (McCartney)

Design + logic spec pass for the 13 Husky adventure encounters. No Phaser scene
implementation, no art changes, no character/UI redesign. This document is the
implementable reference for Lennon (scene/integration); the machine-readable
models live in `src/systems/Microgames.ts` (generic `MicrogameDef` type +
pacing auditors) and `src/systems/HuskyMicrogames.ts` (the 21 recommended
microgame definitions with budgeted durations), validated by
`src/systems/__tests__/Microgames.test.ts`.

Baseline studied: `integration/husky-verified-slice` (the named baseline branch
`integration/husky-final-polish` @ `757819a` does not exist in the repo).

---

## 1. Current interaction problems

Studying the baseline `HuskyScene`/`RaceScene`, the interactions fall into
recurring anti-patterns:

1. **Modal math cards everywhere.** Bridge, lake, cave, summit gate, and race
   all resolve through the same "question card appears over the world" moment.
   Math is the interaction, not a tool inside one.
2. **Magic fixes.** The bridge is "repaired" by a tween after a card; the
   summit gate opens by script. The player never performs the physical act the
   story is about.
3. **Choices as text cards.** The forest route choice and the igloo yes/no are
   buttons on a panel. Nothing in the world differs before the click except the
   label.
4. **Counters as gameplay.** The fallen tree is "tap 5 times." Tapping is
   exercise, not a decision.
5. **Reward as stats dump.** The post-race moment is a panel of numbers — the
   emotional peak of the adventure is a spreadsheet.
6. **Race as loop.** Pace buttons → math card → move, repeated 3–5x. The race
   has no terrain in it; downhill, ice, and deep snow are scenery, not events.
7. **Kiki narrates, rarely acts.** Kiki has dialogue lines and idle bounces,
   but in most encounters the world changes without her visibly doing anything.

The net effect: a child describing her run says "I clicked and answered
questions," not "I repaired the bridge and cleared the trail."

## 2. Interaction design principles

1. **The player describes what she DID.** Every required encounter must produce
   a sentence a 9-year-old can say about a physical act in the world.
2. **Math solves a world problem.** Math appears only where the world has a
   genuine quantity/pattern question; the answer feeds a physical action the
   player then performs. Never a card followed by a magic fix.
3. **Kiki is present and reactive.** Every microgame names Kiki's visible
   reaction per phase (curious / happy / cautious / thinking / celebrate /
   sad). She acts in the world: sniffing, digging, pulling, pointing.
4. **No punishment, quick retry.** Required interactions are always retryable;
   failure costs nothing but a second attempt. No fail screens, no fake
   waiting, no timers that steal the win.
5. **Readable without reading.** A 9-year-old understands the goal from the
   scene, Kiki's behavior, and at most a short voice-style prompt. No
   worksheets, no "click the words in order."
6. **One mechanic, one encounter.** 10 distinct mechanics across the adventure,
   none used more than twice in required content. Mini-games must feel
   different from each other.
7. **Optionals are playgrounds.** Secret Igloo and Bone Cache are playful,
   reward curiosity with breed facts and funny Kiki moments, and never gate
   the Husky sticker.
8. **Time comes from play.** 15–60 seconds per microgame; total runtime comes
   from exploration, decisions, and physical play — never artificial delays.

## 3. Encounter-by-encounter concepts

Format: core mechanic, what the child physically does, what Kiki does, what
changes in the world, estimated duration, cognitive skill, math?, replayability,
implementation complexity.

### Encounter 1 — Trailhead

**CONCEPT A — Inspect & choose (sign vs pawprints).**
Core mechanic: inspect-choose. Child taps glowing hotspots (old sign, fresh
pawprints) to inspect each, then picks one. Kiki sniffs the chosen lead and
trots ahead. World: the chosen trail visibly clears and brightens; the other
stays snow-covered. Duration 20–30s. Skill: observation, decision-making.
Math: no. Replayability: medium (both leads worth trying). Complexity: low.

**CONCEPT B — Follow-the-leader trail walk.**
Core mechanic: exploration-beat. Child simply walks the path; hotspots auto-
trigger Kiki sniffing and short narration. Kiki leads, tail wagging. World:
footprints appear behind the party. Duration 15–20s. Skill: none (pure mood).
Math: no. Replayability: low. Complexity: low.

**RECOMMENDED: A.** The trailhead is the adventure's first decision and the
template for Kiki "asking the player." Inspecting two real leads in the world
(costs nothing, both interesting) teaches the game's language: look, ask Kiki,
choose. B is a fine mood beat but wastes the only decision the trailhead can
offer.

### Encounter 2 — Broken Bridge

**CONCEPT A — Count the missing boards, then drag-and-place repairs.**
Core mechanic: count-and-collect → drag-to-target. Child counts the gaps in
the bridge deck (a real Grade 3 counting/grouping question), taps the
corresponding number of spare boards from a pile, then drags each board into
its gap; Kiki carries the last one in her mouth. World: bridge visibly
completes plank by plank; Kiki test-trots across. Duration 70–90s. Skill:
counting, one-to-one correspondence, dragging. Math: yes — 1 problem, "how
many boards are missing," and the count IS the repair plan. Replayability:
medium (gap count can vary 4–7). Complexity: medium (drag targets + count
validation).

**CONCEPT B — Rope-pull physics repair.**
Child and Kiki each grab a rope (multi-touch/drag) to hoist the fallen bridge
section back up. Kiki strains, paws slipping comically. World: bridge swings
up and locks. Duration 40–60s. Skill: coordination, timing. Math: no natural
fit (bolted on). Replayability: low. Complexity: high (rope physics).

**CONCEPT C — Find the missing boards first.**
Hidden-object prelude: boards scattered/half-buried in snow around the site;
child finds them (Kiki digs at hint spots), then simple tap-to-place. Duration
60–80s. Skill: observation, searching. Math: no. Replayability: medium.
Complexity: medium.

**RECOMMENDED: A.** It is the brief's own example because it is the correct
shape: the world has a quantity problem, math determines what's needed, the
player physically completes the solution. B is charming but mathless and
physics-heavy; C is a good optional-tier game but the bridge deserves the math
moment. A also reuses the drag-to-target pattern the fallen tree needs,
keeping the mechanic vocabulary tight.

### Encounter 3 — Whisper Forest

**CONCEPT A — Inspect clues, then advice choice.**
Core mechanic: inspect-choose → advice-choice. Child inspects 3 clue hotspots
(broken twigs, deep prints, a dropped mitten — Kiki sniffs each, reacts), then
Kiki asks: follow the pawprints or the old sign? Both routes are valid (safe
vs challenge flavor); clues hint at which is which but neither is "wrong."
Kiki takes the chosen path. World: chosen trail brightens, fireflies/motes
gather. Duration 45–60s. Skill: observation, evidence-based choice. Math: no.
Replayability: high (the other path next run). Complexity: low.

**CONCEPT B — Sound-following.**
Whispers pan left/right in audio; child taps the side the "forest voice" comes
from three times to find the path. Kiki's ears swivel as feedback. Duration
30–45s. Skill: listening. Math: no. Replayability: low. Complexity: medium
(audio design + no-visual-fallback risk for hearing-impaired players).

**CONCEPT C — Seven-differences grove.**
Two nearly identical forest views; child spots 3 differences to reveal the
hidden path. Kiki barks at each find. Duration 45–60s. Skill: visual
observation. Math: no. Replayability: low (memorizable). Complexity: low.

**RECOMMENDED: A.** It preserves and improves the "Kiki asks the player"
friendship decision, makes the forest choice a real branch (safe vs challenge
route starts here), and costs no math budget. C is a fine optional puzzle
elsewhere; B risks accessibility problems.

### Encounter 4 — Frozen Lake

**CONCEPT A — Probe and choose the safe path.**
Core mechanic: choose-path. Child taps ice patches; Kiki taps each with her
paw — thick ice thunks (blue, solid), thin ice cracks (white veins). A small
grouping question sets the rule ("step only on ice showing groups of 4
cracks" — hmm, simpler: "how many safe blue patches in a row?"). Child then
taps the safe sequence to cross; Kiki hops patch to patch ahead. World: safe
path glows faintly after crossing; thin patches visibly crack if tested.
Duration 60–80s. Skill: observation, simple grouping, sequencing. Math: yes —
1 problem, determines the safe-crossing rule. Replayability: medium (layouts
shuffle). Complexity: medium.

**CONCEPT B — Slide the ice floes.**
Sliding-block puzzle: drag floating ice sheets to build a bridge. Kiki rides
each placed sheet. Duration 60–90s. Skill: spatial reasoning. Math: no.
Replayability: medium. Complexity: high (collision/snap logic).

**CONCEPT C — Skate the pattern.**
Trace-path: child traces a winding safe route revealed by Kiki's sniff trail.
Duration 30–45s. Skill: dragging, path-following. Math: no. Replayability:
low. Complexity: low.

**RECOMMENDED: A.** Lake math should determine safe grouping/route — A does
exactly that, and the probe-then-cross structure is physical: the child tests
the world, learns its rule, then acts. B is a lovely spatial puzzle but
mathless and expensive; C is better spent on the race's icy turn where tracing
fits the speed fantasy.

### Encounter 5 — Fallen Tree

**CONCEPT A — Find sticks, drag branches clear.**
Core mechanic: drag-to-target. Branches block the trail; child drags each
branch to a clear pile (4–6 drags, satisfying snap/settle). Kiki grabs the
last small branch herself and drops it proudly. World: trail visibly clears.
Duration 40–55s. Skill: dragging, spatial planning. Math: no. Replayability:
low-medium. Complexity: low-medium.

**CONCEPT B — Kiki tug-of-war.**
Timing-tap: tap in rhythm with Kiki's pulls to drag the trunk aside together.
Kiki strains, slips, shakes snow off. Duration 30–40s. Skill: rhythm/timing.
Math: no. Replayability: low. Complexity: low.

**CONCEPT C — Lever puzzle.**
Find a sturdy stick (hidden-object), wedge it under the trunk, tap to lever
branches up one by one. Duration 50–70s. Skill: searching + simple machines
intuition. Math: no. Replayability: medium. Complexity: medium.

**RECOMMENDED: A.** The brief's "drag branches away" is the honest version of
this encounter: a physical clearing task, quick, legible, and Kiki's proud
last-branch carry is the memorable beat. B is fun but rhythm-taps repeat the
race's timing mechanic; C is nice but over-engineers a 45-second obstacle.

### Encounter 6 — Ice Cave

**CONCEPT A — Crystal pattern completion.**
Core mechanic: spot-pattern. A crystal formation has a repeating color/shape
sequence with one missing; child taps the matching crystal from the cave wall
(Kiki's nose glows near the right cluster as a hint after two misses — never
punishing). Placing it lights the path. Duration 45–65s. Skill: pattern
recognition, early algebraic thinking. Math: yes — 1 problem, "what comes
next," and the answer physically lights the way. Replayability: medium
(patterns shuffle). Complexity: low-medium.

**CONCEPT B — Echo counting.**
Child taps the cave wall; echoes return. Count the echoes to find the deep
chamber (3 echoes = deep). Kiki tilts her head, ears tracking. Duration 30–
40s. Skill: counting, listening. Math: light. Replayability: low. Complexity:
low (audio).

**CONCEPT C — Choose the crossing.**
Inside the cave a chasm: two crystal bridges, one stable (inspectable: Kiki
tests with a paw, it holds), one shaky. Child chooses; Kiki crosses first,
looking back encouragingly. Duration 30–40s. Skill: observation, risk
judgment. Math: no. Replayability: medium. Complexity: low.

**RECOMMENDED: A + C combined.** The cave earns two beats: A gives the cave
its math moment (pattern → light the path is the "small number puzzles
integrated into physical objects" the brief asks for), and C gives it a
physical crossing with Kiki leading. Together they make the cave feel like a
place, not a question.

### Encounter 7 — Secret Igloo (optional)

**CONCEPT A — Snow-mound search + optional sequence puzzle.**
Core mechanic: hidden-object → sequence-order. Child taps snow mounds; Kiki
digs, revealing silly/interesting finds (old boot, fish skeleton, a frozen
berry). Under the last mound: a small ice-keypad with 3 colored stones — an
optional sequence puzzle for a bonus breed fact + "Igloo Explorer" credit.
Kiki sneezes from snow, shakes it off triumphantly. World: igloo interior
reveals coziness; finds stay visible. Duration 60–90s. Skill: searching,
memory/sequencing. Math: no. Replayability: medium. Complexity: low-medium.

**CONCEPT B — Igloo decorating.**
Place found objects around the igloo to "make it cozy" (free placement, Kiki
approves each with a happy bark). Duration 40–60s. Skill: creativity. Math:
no. Replayability: high. Complexity: medium (free placement state).

**RECOMMENDED: A.** Optional content should feel playful and reward curiosity;
A delivers the "what do you think is under that snow mound?" moment plus a
bonus puzzle that never blocks. B is sweet but placement state is complexity
without payoff.

### Encounter 8 — Bone Cache (optional)

**CONCEPT A — Scent-trail search.**
Core mechanic: hidden-object. Kiki catches a scent; child follows her
sight-line/sniff direction to tap half-buried bones (3). Each bone: a Husky
breed fact + funny Kiki reaction (prances, tries to bury it again).
Duration 45–60s. Skill: observation, following cues. Math: no. Replayability:
low-medium. Complexity: low.

**CONCEPT B — Dig-where-she-digs.**
Kiki paws at spots; child taps within a beat to "help dig" (timing-tap).
Duration 30–45s. Skill: timing. Math: no. Replayability: low. Complexity: low.

**RECOMMENDED: A.** The cache is a reward for explorers; the fantasy is
*discovery*, not reflexes. Breed facts land naturally here, and Kiki leading
with her nose is peak Kiki.

### Encounter 9 — Snow Pass

**CONCEPT A — Watch, then remember the markers.**
Core mechanic: memory-sequence. Three trail markers poke from the snow; wind
visibly starts covering them. Child watches (markers glow in order), snow
covers them, child taps them back in order; Kiki digs at each correct one,
confirming. Wrong tap: gentle shake, retry free. Duration 40–55s. Skill:
memory, sequencing. Math: no. Replayability: high (orders shuffle). Complexity:
low.

**CONCEPT B — Wind-timing crossing.**
Time gusts: tap to dash between shelters when the wind drops; Kiki flattens
her ears as the tell. Duration 30–45s. Skill: timing. Math: no. Replayability:
medium. Complexity: low-medium.

**RECOMMENDED: A.** This is the brief's own example ("watched the trail
markers before the snow covered them and remembered the path") because the
memory mechanic exists nowhere else in the adventure, and the covering-snow
timer is diegetic urgency, not a fake countdown.

### Encounter 10 — Summit Gate

**CONCEPT A — Dial combination from counting.**
Core mechanic: ordered-tap. The gate has 3 stone dials; each dial's target
number comes from counting something in the world (carved pawprints, icicles,
stars on the gate). One math problem sets the combination ("the dials need
the number of pawprints plus icicles" — Grade 3/4 addition). Child taps dials
in order; the gate rumbles and swings visibly. Kiki pushes with her nose on
the last inch. Duration 55–75s. Skill: counting, addition, sequencing. Math:
yes — 1 problem, unlocks the mechanism. Replayability: medium (counts vary).
Complexity: medium.

**CONCEPT B — Weight-balance gate.**
Drag snow blocks onto a scale to balance the gate mechanism. Kiki sits on one
side as a counterweight (comedy). Duration 50–70s. Skill: estimation, balance
intuition. Math: light. Replayability: medium. Complexity: medium-high
(physics feel).

**RECOMMENDED: A.** "Math unlocks the mechanism, gate visibly responds" — A is
that sentence. Counting real things in the world keeps it anti-worksheet;
ordered-tap is a fresh mechanic.

### Encounter 11 — Race Camp

**CONCEPT A — Inspect the sled, then advice choice.**
Core mechanic: advice-choice. Kiki asks: "Ready to race, or inspect the sled
first?" Inspecting shows 2–3 hotspots (tighten harness — Kiki wiggles; wax
runners — she sniffs approvingly); racing now skips to the start with Kiki
bouncing impatiently. Neither blocks; inspecting gives a tiny starting boost
flavor. Duration 25–35s. Skill: decision-making. Math: no. Replayability:
medium. Complexity: low.

**CONCEPT B — Sled repair quick-fix.**
One loose strap: drag it tight before the race. Duration 15–20s. Skill:
dragging. Math: no. Replayability: none. Complexity: low.

**RECOMMENDED: A.** The camp's job is emotional staging, not another puzzle.
The "ready or inspect first" question is the brief's own example of a Kiki-
asks-the-player friendship beat, and the tiny boost rewards curiosity without
punishing eagerness.

### Encounter 12 — Great Husky Sled Race

**CONCEPT A — Four physical beats with tactical math between.**
Core mechanic: physical-sequence (timing-tap → trace-path → timing-tap →
celebration). Downhill: timing-tap leans for speed. Icy turn: trace-path
steering through the curve. Deep snow: rhythmic paddle taps. Final sprint:
celebration taps — no math, just joy. Between beats 1–3, one Steady/Turbo
tactical math decision each (3 total): the answer visibly changes Kiki's speed
on the next beat. Kiki: leans, sprays snow, strains playfully, then pure
celebration; Bolt cheers genuinely at the finish. World: progress markers pass,
crowd reacts, finish-line moment. Duration ~150–210s total (each beat 40–
65s). Skill: timing, dragging, tactics. Math: yes — 3, all tactical.
Replayability: high (beat order/weather can vary). Complexity: medium (timing
windows, trace tolerance, beat chaining).

**CONCEPT B — Keep the loop, add terrain flavor.**
Pace buttons remain, but each round the track shows a terrain event
(downhill/ice/snow) as a short animation before the math card. Child still
picks pace → answers → watches. Duration ~150–200s. Skill: tactics only.
Math: yes — 3–5, still the core loop. Replayability: low. Complexity: low.

**CONCEPT C — One continuous steer.**
Child steers the whole race by dragging (trace-path), with 3 math gates that
pause the action for a Steady/Turbo choice. Duration ~150–200s. Skill:
dragging, tactics. Math: yes — 3 tactical. Replayability: medium. Complexity:
high (continuous steering + camera).

**RECOMMENDED: A.** The brief demands physical race situations *between* math
decisions, and a final sprint that is celebration, not worksheet. A delivers
exactly that with four distinct-feeling beats (each its own microgame
definition: race-downhill, race-icy-turn, race-deep-snow, race-sprint), keeps
math at 3 tactical decisions, and gives Kiki/Bolt a real performance. B keeps
the loop the brief condemns; C is one long drag — tiring and risky on
trackpads.

### Encounter 13 — Reward / post-race moment

**CONCEPT A — Kiki-led celebration sequence.**
Core mechanic: exploration-beat. No card: Kiki runs to the player, spins,
presents the Husky sticker herself; the pack gathers, aurora brightens, the
sticker flies into the album in-world. Child taps Kiki for pets (she melts
happily); optional "relive best moments" snapshots. Duration 30–40s. Skill:
none — pure emotional payoff. Math: no. Replayability: high (savor it).
Complexity: low.

**CONCEPT B — Stats panel, then celebration.**
Keep the current stats dump, then play a short celebration. Duration 40–60s.
Complexity: low. But the panel still frames the peak as numbers.

**RECOMMENDED: A.** The reward must be the emotional climax, not a
spreadsheet. Stats (if wanted) can live in a quiet corner after the
celebration or on the album screen — never as the peak moment.

## 4. Recommended concept per encounter (summary)

| Encounter | Recommended | Mechanic | Math |
|-----------|-------------|----------|------|
| 1. Trailhead | A — inspect sign vs pawprints, then choose | inspect-choose | no |
| 2. Broken Bridge | A — count missing boards, drag-and-place repair | count-and-collect → drag-to-target | 1 |
| 3. Whisper Forest | A — inspect clues, Kiki asks which lead | inspect-choose → advice-choice | no |
| 4. Frozen Lake | A — probe ice, learn rule, cross safe path | choose-path | 1 |
| 5. Fallen Tree | A — drag branches clear, Kiki carries last | drag-to-target | no |
| 6. Ice Cave | A + C — crystal pattern lights path, then choose crossing | spot-pattern → choose-path | 1 |
| 7. Secret Igloo (opt) | A — snow-mound search + bonus sequence | hidden-object → sequence-order | no |
| 8. Bone Cache (opt) | A — follow Kiki's nose to buried bones | hidden-object | no |
| 9. Snow Pass | A — watch markers, remember before snow covers | memory-sequence | no |
| 10. Summit Gate | A — count world objects, set dial combo | ordered-tap | 1 |
| 11. Race Camp | A — inspect sled or race now | advice-choice | no |
| 12. Sled Race | A — 4 physical beats, tactical math between | timing-tap/trace-path/celebration | 3 |
| 13. Reward | A — Kiki-led celebration, sticker in-world | exploration-beat | no |

## 5. Required vs optional interactions

**Required (13 microgames + race beats + reward):** trailhead-sign,
bridge-count, bridge-repair, forest-clues, forest-choice, lake-stones,
tree-clear, cave-crystals, cave-crossing, pass-markers, gate-dials, camp-meet,
race-downhill, race-icy-turn, race-deep-snow, race-sprint, reward-sequence.
These form the critical path: every one is retryable, none blocks on math
mastery (wrong math answers get a hint and a retry, never a fail state).

**Optional (4 microgames, never block the Husky sticker):** igloo-approach,
igloo-search, igloo-challenge, cache-sniff. The Secret Igloo and Bone Cache
are off the critical path; skipping them loses only bonus breed facts, funny
Kiki moments, and mastery credits. The audit enforces: all optionals have
`required: false` and zero math problems.

## 6. Math placement map

| # | Microgame | Encounter | Math role | What the math decides |
|---|-----------|-----------|-----------|----------------------|
| 1 | bridge-count | Broken Bridge | determines-plan | How many boards are missing → how many to place |
| 2 | lake-stones | Frozen Lake | determines-plan | The safe-crossing grouping rule |
| 3 | cave-crystals | Ice Cave | determines-plan | Which crystal completes the pattern → lights the path |
| 4 | gate-dials | Summit Gate | unlocks | The dial combination → gate opens |
| 5 | race-downhill | Sled Race | tactical-choice | Steady/Turbo → speed on next beat |
| 6 | race-icy-turn | Sled Race | tactical-choice | Steady/Turbo → speed on next beat |
| 7 | race-deep-snow | Sled Race | tactical-choice | Steady/Turbo → speed on next beat |

Total required math per route: **6** (safe and challenge routes independently
verified by `checkRouteMath`). Challenge route adds no extra math — its
"challenge" is richer clues and tighter timing, not more worksheets. Math is
absent from: trailhead, forest, fallen tree, snow pass, race camp, sprint,
reward, and all optional content.

## 7. Input/mechanic variety map

Required microgames use 10 distinct mechanics (audit-enforced: ≥8 distinct,
no mechanic more than 2×):

| Mechanic | Used by | Input |
|----------|---------|-------|
| inspect-choose | trailhead-sign, forest-clues | tap hotspots |
| count-and-collect | bridge-count | tap to count/collect |
| drag-to-target | bridge-repair, tree-clear | drag |
| choose-path | lake-stones, cave-crossing | tap sequence |
| spot-pattern | cave-crystals | tap match |
| memory-sequence | pass-markers | tap in order |
| ordered-tap | gate-dials | tap dials in order |
| timing-tap | race-downhill, race-deep-snow | rhythmic tap |
| trace-path | race-icy-turn | drag along path |
| physical-sequence | race-sprint | celebration taps |

Deliberately NOT reused as a primary mechanic: "click the words in order,"
worksheet-style cards, repetitive button clicking, timers-as-gameplay.

## 8. Estimated duration per interaction

Child-paced seconds (min–max), from the budgeted `childSec` ranges in
`HuskyMicrogames.ts`:

| Microgame | Child | Adult |
|-----------|-------|-------|
| trailhead-sign | 20–30 | 10–15 |
| bridge-count | 30–38 | 14–18 |
| bridge-repair | 40–52 | 18–24 |
| forest-clues | 25–32 | 12–16 |
| forest-choice | 20–28 | 10–14 |
| lake-stones | 60–80 | 28–38 |
| tree-clear | 40–55 | 18–26 |
| cave-crystals | 45–65 | 20–30 |
| cave-crossing | 30–40 | 14–18 |
| pass-markers | 40–55 | 18–26 |
| gate-dials | 55–75 | 26–36 |
| camp-meet | 25–35 | 12–16 |
| race-downhill | 41–57 | 18–26 |
| race-icy-turn | 43–61 | 19–28 |
| race-deep-snow | 43–59 | 19–27 |
| race-sprint | 24–30 | 11–14 |
| reward-sequence | 30–40 | 14–18 |
| travel between nodes | 70–100 | 35–50 |
| igloo-approach (opt) | 20–25 | 10–12 |
| igloo-search (opt) | 40–55 | 18–26 |
| igloo-challenge (opt) | 35–45 | 16–20 |
| cache-sniff (opt) | 45–60 | 20–28 |

No single microgame exceeds 23% of route child runtime (audit-enforced ≤30%).

## 9. Estimated total child/adult runtime

Audited totals (required path + travel; optionals add on top):

| Route | Child | Adult fast-play | Required math |
|-------|-------|-----------------|---------------|
| Safe (via Frozen Lake) | **627–896s (~10.5–15 min)** | **285–417s (~5–7 min)** | 6 |
| Challenge (via Ice Cave) | **624–891s (~10.5–15 min)** | **285–414s (~5–7 min)** | 6 |

Both routes sit inside the 10–15 min child / 5–8 min adult targets. Runtime
comes from play phases (act/resolve), not math cards: 14 non-math interactions
vs 6 math problems per route.

## 10. Kiki reaction hooks

Every microgame phase declares a `kikiReaction`. The reaction vocabulary for
Lennon's animation/state hooks:

- `curious` — head tilt, sniffing toward the hotspot (inspection beats)
- `sniffing` — active nose-led searching (hidden-object beats)
- `happy` — wag, bounce (successful acts, discoveries)
- `thinking` — paw-tap, look at player (math/choice moments)
- `cautious` — ears back, slow steps (ice, cave crossing)
- `proud` — chest out, parading a find (carrying the last board/branch)
- `celebrate` — jumping, spinning (sprint, reward)
- `sad` — brief, soft (only in the reward beat's goodbye; never a fail state)

Rule: Kiki reacts to the *world event*, not to the UI. She never reacts to a
card opening; she reacts to ice cracking, a board slotting in, snow covering a
marker.

## 11. World-state changes

Each microgame declares `worldStateChanges` (key=value strings Lennon can map
to scene flags):

- `trailhead.chosen=<sign|pawprints>` — chosen trail clears
- `bridge.boardsPlaced=<n>` → `bridge.repaired=true` — bridge completes plank by plank
- `forest.cluesFound=<n>`, `route.chosen=<safe|challenge>` — branch taken
- `lake.safePathRevealed=true`, `lake.crossed=true`
- `tree.branchesCleared=<n>` → `trail.clear=true`
- `cave.patternSolved=true` → `cave.lit=true`, `cave.crossed=true`
- `igloo.searched=true`, `igloo.puzzleSolved=true` (optional)
- `cache.bonesFound=<n>` (optional)
- `pass.markersRemembered=true`
- `gate.dialsSet=true` → `gate.open=true`
- `camp.inspected=<bool>`, `race.ready=true`
- `race.progress=<1..3>` → `race.won=true`
- `reward.stickerEarned=true`, `reward.bondLevel=<n>`

## 12. Suggested telemetry events

Per microgame, from the `telemetry` field on each phase (dot-namespaced):

- Interaction lifecycle: `<id>.started`, `<id>.completed`, `<id>.retried`
  (retry counts are the key difficulty signal — no fail events by design)
- Math: `<id>.math.answered` (with `correct: bool`, `attempts: n`)
- Choices: `trailhead.chosen`, `forest.route.chosen`, `camp.ready` (with the
  chosen option)
- Optionals: `igloo.searched`, `cache.bone.found` (per bone), breed-fact views
- Race: `race.beat.*`, `race.math.*`, `race.finished` (with final placement)
- Pacing: phase durations (compare against budgeted `childSec` ranges to spot
  padding or confusion), total route time

These let the team verify the design goals empirically: retry rates stay low,
math attempts stay near 1, optional uptake is healthy, and no phase
systematically exceeds its budget.

## 13. Implementation complexity/risk

| Item | Complexity | Risk notes |
|------|-----------|------------|
| bridge-count + bridge-repair | Medium | Drag targets + count validation; gap count varies 4–7 — keep hit areas generous on Chromebook trackpads |
| lake-stones | Medium | Probe feedback (thunk vs crack) must read without text; layouts shuffle — test all generated layouts are solvable |
| cave-crystals | Low-Medium | Pattern generator must guarantee exactly one valid match; Kiki hint after 2 misses |
| gate-dials | Medium | Counting sources (pawprints, icicles) must be unambiguous; dial tap order state |
| race beats (4) | Medium | Timing-tap windows need Chromebook-friendly tolerance; trace-path needs forgiving hit slop; sprint must feel celebratory, not demanding |
| pass-markers | Low | Snow-cover animation timing; order shuffle |
| tree-clear | Low-Medium | Drag physics feel (snap + settle); Kiki's last-branch carry |
| trailhead/forest/camp/reward | Low | Hotspot inspection + choice UI in-world, not modal cards |
| igloo/cache optionals | Low-Medium | Hidden-object placement; must never block sticker (audit-enforced) |

**Highest-risk items:** (1) the race beats — four mechanics in sequence with
timing sensitivity on low-end hardware; playtest tap tolerance early.
(2) lake-stones — the probe-then-cross rule must be legible with zero reading;
if playtesting shows confusion, fall back to Concept C (trace the sniff
trail). (3) drag interactions generally — pointer events must work identically
for mouse, trackpad, and touch.

## 14. Implementation priority order

1. **bridge-count + bridge-repair** — the template microgame (math → physical
   fix); proves the pattern everything else follows.
2. **race beats (downhill, icy-turn, deep-snow, sprint)** — the biggest
   structural change; de-risks timing/trace mechanics early.
3. **lake-stones** — highest legibility risk; needs playtest iteration.
4. **gate-dials** — summit gate is the progression climax.
5. **tree-clear + pass-markers** — quick wins, distinct mechanics.
6. **cave-crystals + cave-crossing** — challenge-route depth.
7. **trailhead-sign + forest-clues + forest-choice** — choice infrastructure
   (route branching starts here).
8. **camp-meet + reward-sequence** — emotional bookends, low risk.
9. **igloo + cache optionals** — last; purely additive.

## 15. Old prompt-style interactions to remove

- ❌ Math modal cards at bridge, lake, cave, summit, race (replaced by
  in-world math phases inside microgames)
- ❌ "Magic fix" tweens: bridge auto-repair, gate auto-open (replaced by
  player-performed repair/opening)
- ❌ Forest route text card (replaced by inspect-clues → in-world choice)
- ❌ Fallen tree tap-5-times counter (replaced by drag-branches-clear)
- ❌ Igloo yes/no card → math card chain (replaced by optional search + bonus
  puzzle)
- ❌ Race pace-buttons → math card → move loop (replaced by 4 physical beats
  with tactical math between)
- ❌ Reward stats-dump panel as the emotional peak (replaced by Kiki-led
  celebration sequence; stats move to a subdued corner or post-beat screen)
- ❌ Any "click the words in order" or worksheet-presented interaction

---

*Machine-readable companion: `src/systems/HuskyMicrogames.ts` (21
definitions, budgeted durations) + `src/systems/Microgames.ts` (validators and
pacing auditors). All budgets, math counts, variety, and route constraints are
covered by `src/systems/__tests__/Microgames.test.ts` (29 tests).*

