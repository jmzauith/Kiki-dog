> **Documentation status — design proposal; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). Proposed behavior is not an implementation checklist; reconcile against current rules and remaining work.

# Husky Gameplay Depth & Pacing

**Problem:** an adult could play the complete Husky map in ~2 minutes.
**Solution:** more PLAY, not more math. Target: **10–15 minutes** for a child
playing naturally, ~5–8 minutes adult fast-play, **5–6 required math problems**
per run, **10+ non-math interactions**, **2+ optional discoveries**,
**2–3 moments where Kiki asks the player what to do**.

Product rule: *if we removed the numbers from an encounter, a small adventure
must remain.* Math is how Kiki solves the problem. Math is NOT the reason the
problem exists.

Success criteria: the player remembers **"what happened to Kiki"** more than
**"how many math questions they answered."**

---

## Minute-by-minute ideal flow (child-paced, safe route)

| Time | Beat | What happens |
|------|------|--------------|
| 0:00–0:38 | Trailhead | Arrival. Kiki looks up the mountain. Player taps the trail sign (inspect). Set off. |
| 0:38–1:06 | Walk | Trot to the bridge. |
| 1:06–2:56 | Broken Bridge | Boards missing! **Math #1** (rows of boards) repairs the bridge. Planks swing back. Cross. |
| 2:56–3:24 | Walk | Into Whisper Forest. |
| 3:24–4:49 | Whisper Forest | Sniff pawprints **or** inspect the carved sign (micro-decision). **Kiki asks:** *"I hear something behind the trees. Should we check it out?"* → CHECK IT OUT finds a bone-clue; KEEP GOING is fine too. Then the route choice: Safe Trail or Ice Shortcut. |
| 4:49–5:17 | Walk | Toward the lake. |
| 5:17–6:57 | Frozen Lake | **Math #2** lights the stepping stones. Player picks left or right stones — a wobbly pick gets a funny crack and a retry, never punishment. Cross. |
| 6:57–7:19 | Walk | To the fallen tree. |
| 7:19–7:54 | Fallen Tree | Tap 5 branches to clear them; Kiki reacts after each. No math — just helping. |
| 7:54–8:22 | Walk | Up to Snow Pass. |
| 8:22–9:17 | Snow Pass | Checkpoint rest. Wind briefly reveals glowing trail markers — tap them in order. Secrets branch here: funny mound → **Kiki asks:** *"Peek inside?"* (Secret Igloo, optional 45–90s); sparkling drift → Bone Cache (optional ~25s). |
| 9:17–9:43 | Walk | To the Summit Gate. |
| 9:43–10:38 | Summit Gate | **Math #3** (trail symbols) opens the gate. |
| 10:38–11:00 | Walk | Down to Race Camp. |
| 11:00–11:55 | Race Camp | Meet Bolt the Husky — confident, playful, friendly. Inspect the sled (optional; Kiki tightens a loose strap). **Kiki asks:** *"Ready to race, or should we look around first?"* |
| 11:55–14:15 | Great Husky Sled Race | 4 physical beats interleaved with **math #4, #5, #6**: downhill (time the tuck) → question → icy turn (pick a line) → question → deep snow (paddle through) → question → final sprint (pure celebration, no math). |
| 14:15–15:00 | Husky Reward | Finish moment → Bolt congratulates Kiki → Kiki's proud hop → player picks their favorite moment for the recap → sticker reveal → album (1 of 12) → golden glimmer teaser. |

**Totals (safe):** ~15:00 child-paced · ~6:50 adult fast-play · 6 required math.
**Challenge route:** ~13:50 child · ~6:15 adult · 6 required math (bridge, cave, summit + 3 race).

---

## Timing philosophy

- Time comes from **play**: choices, reactions, exploration, small physical
  tasks. Never from forced waits, unskippable text walls, or slow walking.
- Every beat has a child estimate and an adult estimate; the validator
  (`validatePacingPlan`) enforces the 10–15 min window, the ≤6 math cap, and
  a per-beat anti-padding ceiling (no beat over 3 minutes for a child).
- Adult fast-play exists so parents/testers can verify quickly — it is not
  the design target. The design target is a 9-year-old.

## Interaction inventory (12 non-math interactions)

1. **Inspect trail sign** (Trailhead, required) — orient via paw-print map.
2. **Sniff pawprints / inspect sign** (Forest, required) — investigate like a dog.
3. **Choose route** (Forest, required) — the run's big agency moment.
4. **Clear fallen tree** (Fallen Tree, required) — 5 taps, Kiki reacts each time.
5. **Choose stepping stones** (Frozen Lake, required) — left/right, funny retry.
6. **Follow trail markers** (Snow Pass, required) — wind reveals, tap in order.
7. **Search igloo objects** (Secret Igloo, optional) — 3 objects, tiny stories.
8. **Uncover bone cache** (Snow Cache, optional) — smell → dig → funny payoff.
9. **Greet Bolt** (Race Camp, required) — the rival becomes a character.
10. **Inspect sled** (Race Camp, optional) — preparation matters.
11. **Race beat events** (Sled Race, required ×4) — tuck, line choice, paddling, sprint.
12. **Pick favorite moment** (Reward, required) — the recap becomes *their* story.

## Kiki asks the player (3 advisory moments)

1. Forest: *"I hear something behind the trees. Should we check it out?"*
   → reveals the bone-cache clue, or nothing lost.
2. Snow Pass: *"That snow mound looks funny. Peek inside?"*
   → reveals the Secret Igloo, or it stays for later.
3. Race Camp: *"Ready to race, or should we look around first?"*
   → race now, or camp exploration.

No correct answer. No punishment. Sometimes reveals optional content.

## Micro-decisions (flavor, never map-branching)

- Sniff tracks vs inspect sign (Forest)
- Left stones vs right stones (Frozen Lake)
- Search backpack vs follow prints (Snow Pass)
- Explore igloo now vs later (Snow Pass)

## Wrong answers & hints

- Wrong answers are **kind and funny**, never punishing: the plank wobbles,
  the ice sparkles but doesn't form a path yet, Kiki tilts her head.
- **Hint ladder** (2–3 levels): each level genuinely more useful, the answer
  never given outright. Wrong answers never subtract progress or lock anything.

## Telemetry (for testing, no external analytics)

`PlaythroughLog` records structured local events: run start/end, encounter
enter/exit, math asked/answered, hints shown, interactions completed, advice
choices, micro-decisions, discoveries, race turns/beats, idle periods.
`summarize()` reports totals with **idle time excluded** from active playtime.
Lennon can surface this in a dev overlay or export it as JSON to verify the
pacing targets against real play sessions.

## QA gates (automated)

- `validatePacingPlan`: child total 10–15 min, adult ≤ 8 min, required math
  ≤ 6 per route, every required node has a beat, per-beat anti-padding ceiling.
- `validateInteractionPlan`: ≥10 interactions, ≥2 optional discoveries,
  ≥2 advice choices, no required secrets, required interactions all retryable,
  advice buttons 1–4 words and kind, known node ids, unique ids.

## Wiring notes for Lennon

- `HUSKY_TIMING_PLAN` is the source of truth for expected durations; compare
  `PlaythroughLog.summarize()` against it in playtests.
- Render each `InteractionDef.kind` with the `params` provided
  (counts, options, reveal windows). All required interactions are retryable —
  no fail states on the critical path.
- `PlayerAdviceChoice.options` always has exactly 2 entries; neither is wrong.
- Race beats interleave with math: beat → question → beat → question →
  beat → question → final sprint beat (no question).
- The reward sequence is 7 short beats (finish → friendship → Kiki →
  recap → sticker → album → golden teaser), ~45s, mostly visual/interactive.

## Forbidden pacing tricks

Forced 10-second waits · long unskippable dialogue · repetitive tapping with
no reaction · artificially slow walking · duplicated math questions ·
giant text walls. Time comes from PLAY.
