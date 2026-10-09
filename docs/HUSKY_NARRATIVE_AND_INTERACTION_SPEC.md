# Husky Narrative & Interaction Spec — Snowy Peaks

**System:** `src/systems/Narrative.ts` (reusable content engine, zero imports)
**Content:** `src/systems/HuskyNarrative.ts` (Husky reference implementation)
**Tests:** 43 Vitest (engine validation + content QA)

This document is the complete story/content layer for the Husky adventure. It is
DATA, not implementation. Harrison and Ringo own the visuals; Lennon owns scene
integration. Nothing here renders anything.

---

## The product rule

**At any point, if we removed the numbers from an encounter, there should still
be a small adventure happening. Math is how Kiki solves the problem. Math is
NOT the reason the problem exists.**

Success sounds like this: *"Kiki fixed the bridge, found the secret igloo and
raced the Husky."* Failure sounds like: *"We did some math questions."*

---

## Tone rules

Target: ~9 years old (Aurora and Olivia's age).

- Adventurous, funny, clever, warm.
- NOT babyish. NOT classroom-like.
- Concise enough to keep play moving: short sentences, one idea at a time.
- No giant paragraphs. Buttons are 1–4 words.
- The world is playful; the math is serious underneath.

Enforced by tests: max 140 chars per copy line, banned failure language
("WRONG!", "try harder", "stupid", …), button word limits, required fields.

---

## Kiki personality

Kiki rarely speaks full human dialogue. She communicates through a semantic
reaction vocabulary — the scene maps these ids to Ringo's poses:

| Reaction id | Meaning |
|---|---|
| `excited` | Tail wagging fast, bouncing on front paws |
| `curious` | Head tilt, nose forward, sniffing the air |
| `thinking` | One ear up, one ear down, looking side to side |
| `determined` | Low stance, eyes locked on the goal |
| `cautious` | Slow careful steps, ears slightly back |
| `happy` | Relaxed wag, soft eyes, tongue out |
| `surprised` | Ears straight up, eyes wide |
| `proud` | Chest out, chin up, slow dignified wag |
| `celebrate` | Happy spin, little hop |
| `affectionate` | Nuzzles, leans in close |
| `playful` | Play-bow, butt in the air, ready to zoom |
| `worried` | Ears droop slightly, looks back at the player |

Occasional translated barks are fine ("*happy bark* (Translation: challenge
accepted.)") — used sparingly, always funny.

---

## Husky personality: Bolt

The rival is **Bolt**, a Siberian Husky. He is confident, playful, competitive,
friendly, and knows the mountains like the back of his paw. **He is not a
villain.** By the end, Kiki and Bolt feel like friends.

Dialogue moments (all in `HUSKY_NARRATIVE.breedCharacter.dialogue`):

- **First meeting** (Whisper Forest): Bolt pops out, introduces himself, frames
  the route choice without pushing. Calls Kiki "short-stack" — affectionately.
- **Race start**: "May the fluffiest racer win!"
- **Mid-race**: encouragement, never taunting. "Woo! You're fast for a
  short-legged pup!"
- **Race finish**: genuine admiration. "You're a real mountain racer now!"
- **Reward**: friendship beat. "Friends race each other. Best friends race
  again tomorrow."

---

## Adventure story flow

1. **Trailhead** — Kiki arrives at Snowy Peaks, tail wagging. A Husky is waiting
   somewhere up the mountain.
2. **Broken Bridge** — the bridge over the Giggle Gap lost its boards. Kiki
   counts boards in rows (multiplication with a purpose) and the bridge knits
   itself back together.
3. **Whisper Forest** — the trail splits. Bolt appears and frames the choice:
   sunny Safe Trail (paw prints) vs. sparkly Ice Shortcut. Neither is wrong.
4. **SAFE: Frozen Lake** — Kiki lights safe stepping stones across the ice
   (math as pathfinding).
   **SAFE: Fallen Tree** — no math at all: a tap-and-push discovery moment.
   Pure play.
5. **CHALLENGE: Ice Cave** — humming crystals block the shortcut; the right
   pattern quiets them. Harder math, bigger bragging rights.
6. **Snow Pass** — rest stop. Two secret spots twinkle nearby for the curious.
7. **Summit Gate** — a very serious snowman gatekeeper demands the right
   number of snow-flag groups. Gate swings open.
8. **Race Camp → Great Husky Sled Race** — 4 situational decisions (downhill,
   icy turn, deep snow, final sprint). Steady vs. Turbo means something
   different each time.
9. **Husky Reward** — the 7-beat celebration sequence (below).
10. **Optional: Secret Igloo** — a hidden igloo, a knock from inside, a tiny
    Husky puppy, the secret snow-spin. "I FOUND SOMETHING!"
11. **Optional: Bone Cache** — Kiki smells something suspicious, digs like
    crazy, unearths a giant bone. Smaller, funnier, pure joy.

---

## Encounter-by-encounter content

Every encounter defines: arrival, environmental problem, Kiki reaction,
optional dialogue, math framing (math encounters), 2–3 level hint ladder,
3+ kind wrong-answer responses, correct response, environmental success
description, optional discovery/secret/factUnlock, completion line, plus
`animationCue`, `soundCue`, `visualEvent` hooks the scene consumes.

See `HuskyNarrative.ts` for the full copy. Highlights:

- **Broken Bridge:** "The bridge needs {a} rows of {b} boards. How many boards
  does Kiki need?" Wrong: "The plank wobbles and pops back out. Try another
  number!" Success: boards fly in, Kiki proud-hops across.
- **Frozen Lake:** "{a} safe stones in each of {b} rows." Wrong: "The ice
  sparkles but doesn't form a path yet."
- **Ice Cave:** "{a} clusters of {b}" humming crystals. Fact unlock:
  `husky-coat` (thick double coats) surfaces here as a discovery.
- **Summit Gate:** "{a} groups of {b} snow-flags" for the snowman.
- **Secret Igloo:** discovery beat + puppy + snow-spin + `husky-talking` fact +
  Golden Husky mastery hook.
- **Bone Cache:** smell → dig → giant bone. Funny, small, joyful.

---

## Environmental math philosophy

Never: "Solve 8 × 7."
Always: "The bridge needs 8 rows of 7 boards. How many boards does Kiki need?"

The math engine still generates equivalent problems. The content layer wraps
generated operands in world-purpose templates (`{a}`/`{b}` placeholders —
validated by tests). Each encounter has a `flavor` label (board-counting,
stepping-stones, crystal-patterns, flag-groups) so future curriculum (division,
fractions, word problems…) can plug into the same narrative slots.

---

## Hint philosophy

2–3 levels per math encounter. Each level is genuinely more useful than the
last. The answer is never given.

Example (8 groups of 7):
- Hint 1: "Count the rows one at a time. Each row needs the same number."
- Hint 2: "Think of it as 8 groups of 7. Try adding them up."
- Hint 3: "Here's a shortcut: half the rows need 7 times half of 8 boards, then double it."

Hints escalate toward strategy, not toward the answer.

---

## Wrong-answer philosophy

Wrong answers must never make the player feel punished or stupid.

- Varied responses (3+ per encounter, rotated).
- Kiki reacts with character: head tilts, wobbling planks, sparkling-but-not-
  yet ice.
- "Almost!" is allowed. "WRONG!" is banned (enforced by tests).
- No red failure language, no lost progress, no negative scoring.
- After repeated mistakes, hints become genuinely useful — the ladder is the
  safety net.

---

## Secrets

**Secret Igloo** — the big optional discovery. Discovery beat, Kiki's surprised
reaction, a tiny Husky puppy, the secret snow-spin, a Husky fact, and a Golden
Husky mastery hook. The player should feel "I FOUND SOMETHING!"

**Bone Cache** — deliberately smaller emotional scale. Smell → dig → bone.
Funny. A small mastery bonus and one very happy corgi.

Neither is required for anything except Golden Husky mastery flavor.

---

## Race narrative

4 situational beats (downhill stretch, icy turn, deep snow, final sprint).
Each beat gives Steady and Turbo situational meaning:

- Deep snow: STEADY "plows through steadily" (normal problem, safer response)
  vs. TURBO "bursts through the drifts" (harder problem, bigger payoff).

Mechanics unchanged — content hooks only. Bolt's mid-race lines keep it
friendly-competitive.

---

## Reward sequence (7 beats)

1. Race finish — snow flies, Kiki celebrates.
2. Bolt congratulates Kiki — genuine admiration.
3. Adventure recap — "Kiki fixed the bridge, crossed the frozen lake, opened
   the Summit Gate — and raced a Husky down a mountain!" (The whole-adventure
   framing. Never "you answered questions.")
4. Fact + friendship beat — Bolt nuzzles Kiki; `husky-serum-run` fact surfaces
   as a discovery.
5. Sticker reveal — shiny and new.
6. Album progress — "Husky: collected!"
7. Golden Husky tease — "Psst… finding secrets and acing quizzes earns Golden
   stickers. Just saying."

---

## Fact integration

`factUnlock` fields reference HuskyFacts dataset ids (PR #12) — the TEXT lives
only there. Placement is deliberate:

- Ice Cave → `husky-coat` (cold-weather discovery, in the coldest place)
- Race Camp → `husky-job` (sled-pulling, at the sled race)
- Secret Igloo → `husky-talking` (the puppy woo-woos)
- Reward → `husky-serum-run` (heroic Huskies, at the heroic moment)

Facts feel like discoveries, never textbook popups. Tests verify every
`factUnlock` id exists in the dataset.

---

## Wiring instructions for Lennon

1. Import `HUSKY_NARRATIVE` from `src/systems/HuskyNarrative.ts`.
2. Look up the encounter by node id when Kiki arrives: `encounters.find(e =>
   e.nodeId === nodeId)`.
3. Render `arrival` + `problem` in your own UI; play `kikiReaction` via Ringo's
   poses (map semantic ids yourself — do NOT expect pose names here).
4. For math encounters: take the engine-generated operands, fill `{a}`/`{b}`
   in `math.template`. Show `hints.hints[i]` escalating after wrong answers;
   rotate `wrongResponses`; on correct, play `correctResponse` then `success`
   plus `visualEvent`/`soundCue`.
5. For choice encounters: render `choiceButtons` (1–4 words, validated).
6. Secrets: play `discovery`, then `secretText`; report the mastery event to
   the reward system per `HUSKY_REWARD_RULES.md`.
7. Race: iterate `raceBeats` in order; each beat's `steadyText`/`turboText`
   narrate the outcome of the player's Steady/Turbo choice.
8. Reward: play `rewardSequence` in order; surface `factUnlock` via the facts
   system; the sticker reveal is a `visualEvent` hook.
9. `animationCue` / `soundCue` / `visualEvent` are string hooks — your scene
   decides the assets. Unknown hooks should be ignored gracefully.

---

## Template: narrative content for the next breed

1. Copy `HuskyNarrative.ts` → `<Breed>Narrative.ts`.
2. Replace the `encounters` array — one entry per node id in the breed's
   adventure definition. Keep every required field.
3. Write `routes` (2+ personalities), `breedCharacter` (name + 5 dialogue
   moments), `raceBeats` (3–5), `rewardSequence` (the whole-adventure arc).
4. Hook `factUnlock` ids to that breed's facts dataset.
5. Run the engine validator: `assertValidAdventureNarrative` throws on any
   content problem. Add a content test file mirroring `HuskyNarrative.test.ts`
   (node coverage, banned phrases, reading level, route difference).
6. Engine code (`Narrative.ts`) never changes per breed.
