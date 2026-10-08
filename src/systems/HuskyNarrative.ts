/**
 * HuskyNarrative — complete narrative content for the Snowy Peaks Husky adventure.
 *
 * REFERENCE IMPLEMENTATION for the narrative content system. Every future
 * breed ships one file shaped exactly like this: an
 * AdventureNarrativeDefinition covering its nodes. The engine
 * (Narrative.ts) never changes per breed.
 *
 * Content rules followed here:
 * - Math is HOW Kiki solves the problem, never the reason it exists.
 * - Wrong answers are kind and funny, never punishing.
 * - Hints escalate: genuinely more useful each level, answer never given.
 * - ~Grade 4 reading level: short sentences, one idea at a time.
 * - Kiki reactions are semantic ids; the scene maps them to poses.
 * - factUnlock ids hook into the HuskyFacts dataset (PR #12) — they are
 *   surfaced as discoveries by the scene, never textbook popups.
 *
 * Node ids MUST match HuskyAdventure.ts exactly.
 */

import type {
  AdventureNarrativeDefinition,
  EncounterNarrative,
} from "./Narrative";
import { assertValidAdventureNarrative } from "./Narrative";

/**
 * Fact ids from the HuskyFacts dataset (PR #12). These hooks let the scene
 * surface a breed fact as a natural discovery. Mirrored here for validation;
 * the fact TEXT lives only in HuskyFacts.ts.
 */
export const KNOWN_HUSKY_FACT_IDS = [
  "husky-origin",
  "husky-job",
  "husky-coat",
  "husky-eyes",
  "husky-temperament",
  "husky-talking",
  "husky-serum-run",
  "husky-size",
  "husky-energy",
  "husky-shedding",
  "husky-tail",
  "husky-endurance",
] as const;

const E = (e: EncounterNarrative): EncounterNarrative => e;

export const HUSKY_NARRATIVE: AdventureNarrativeDefinition = {
  adventureId: "husky",
  breedId: "husky",

  encounters: [
    E({
      nodeId: "trailhead",
      locationName: "Trailhead",
      kind: "checkpoint",
      arrival: "Snowy Peaks! Kiki's tail is already wagging a mile a minute.",
      problem:
        "Somewhere up the mountain, a Husky is waiting to race. But first, Kiki has to get there — and the trail has other plans.",
      kikiReaction: "excited",
      completion: "Kiki trots onto the trail. Adventure on!",
      animationCue: "kiki-looks-up-mountain",
      soundCue: "sfx:mountain-wind",
      visualEvent: "vfx:trail-sparkle",
    }),

    E({
      nodeId: "broken-bridge",
      locationName: "Broken Bridge",
      kind: "math-normal",
      arrival: "Uh oh. The bridge over the Giggle Gap is missing half its boards!",
      problem:
        "The river below is way too cold for swimming. Kiki needs to fix the bridge before she can cross.",
      kikiReaction: "curious",
      math: {
        template:
          "The bridge needs {a} rows of {b} boards. How many boards does Kiki need?",
        flavor: "board-counting",
      },
      hints: {
        hints: [
          "Count the rows one at a time. Each row needs the same number of boards.",
          "Think of it as {a} groups of {b}. Try adding them up: {b} + {b} + …",
          "Here's a shortcut: half the rows need {b} times half of {a} boards, then double it.",
        ],
      },
      wrongResponses: [
        "Kiki tilts her head. That plank doesn't fit…",
        "The plank wobbles and pops back out. Try another number!",
        "Hmm. Count the rows again — slowly this time.",
        "Close! Look at how many boards go in each row.",
      ],
      correctResponse: "Click! The last board snaps into place.",
      success:
        "Board by board, the bridge knits itself back together. Kiki does a proud little hop all the way across.",
      completion: "Bridge fixed. Onward!",
      animationCue: "kiki-proud-hop",
      soundCue: "sfx:bridge-repair",
      visualEvent: "vfx:boards-fly-in",
    }),

    E({
      nodeId: "forest",
      locationName: "Whisper Forest",
      kind: "choice",
      arrival: "Whisper Forest. The pines are so tall they tickle the clouds.",
      problem:
        "The trail splits. Paw prints lead left, down the sunny Safe Trail. Something sparkly glints to the right, down the Ice Shortcut.",
      kikiReaction: "thinking",
      dialogue: [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Hey! I'm Bolt. I race these mountains every day!",
        },
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Shortcut's faster… if you're brave. Safe Trail's prettier. Your call, short-stack!",
        },
        { speaker: "kiki", line: "*happy bark* (Translation: challenge accepted.)" },
      ],
      choiceButtons: ["Safe Trail", "Ice Shortcut"],
      completion: "Kiki picks a trail and trots on, nose high.",
      animationCue: "bolt-waves-paw",
      soundCue: "sfx:bolt-hello",
    }),

    E({
      nodeId: "frozen-lake",
      locationName: "Frozen Lake",
      kind: "math-normal",
      arrival: "Frozen Lake. The ice shines like a giant mirror.",
      problem:
        "The ice is only safe in certain spots. Kiki needs to light up the safe stepping stones before crossing.",
      kikiReaction: "cautious",
      math: {
        template:
          "Kiki needs {a} safe stones in each of {b} rows. How many glowing stones is that?",
        flavor: "stepping-stones",
      },
      hints: {
        hints: [
          "Each row needs the same number of stones. Count row by row.",
          "It's {a} groups of {b}. Add them like stepping stones: hop, hop, hop…",
          "Try this: {b} stones, {a} times. That's the whole path!",
        ],
      },
      wrongResponses: [
        "The ice sparkles but doesn't form a path yet.",
        "Kiki taps the ice with one paw. Nope — not that number.",
        "Almost! Look at the groups of stones again.",
        "The stones flicker and fade. Count once more, carefully.",
      ],
      correctResponse: "Ding! The safe stones glow bright blue.",
      success:
        "Stone by stone, a glowing path stretches across the lake. Kiki tip-toes over it, ears straight up.",
      completion: "Across the lake without a single splash!",
      animationCue: "kiki-careful-steps",
      soundCue: "sfx:ice-chime",
      visualEvent: "vfx:stones-light-up",
    }),

    E({
      nodeId: "fallen-tree",
      locationName: "Fallen Tree",
      kind: "discovery",
      arrival: "A giant pine fell right across the trail! It was probably showing off.",
      problem:
        "It's way too big to jump. Kiki will have to push it aside — and she could use some help.",
      kikiReaction: "determined",
      discovery:
        "Kiki digs her paws in and PUSHES. The tree rolls aside with a very satisfying crunch!",
      completion: "Trail clear! Kiki shakes the snow off like a champion.",
      animationCue: "kiki-push",
      soundCue: "sfx:tree-crunch",
      visualEvent: "vfx:snow-burst",
    }),

    E({
      nodeId: "ice-cave",
      locationName: "Ice Cave",
      kind: "math-challenge",
      arrival: "The Ice Cave. It glitters. It echoes. It is VERY cool.",
      problem:
        "Humming crystals block the shortcut. Only the right pattern will quiet them down.",
      kikiReaction: "cautious",
      math: {
        template:
          "The crystals hum in {a} clusters of {b}. How many crystals are humming?",
        flavor: "crystal-patterns",
      },
      hints: {
        hints: [
          "Listen to the clusters. Each one hums the same count.",
          "It's {a} groups of {b}. Bigger numbers just mean more humming!",
          "Break it apart: {b} times half of {a}, then double it. You've got this.",
        ],
      },
      wrongResponses: [
        "The crystals hum louder. Kiki covers her ears. Try again!",
        "One crystal winks at Kiki. Wrong pattern — but funny.",
        "So close! The cave echoes your answer back… incorrectly.",
        "Kiki squints at the clusters. Count them one more time.",
      ],
      correctResponse: "The humming settles into a perfect chord.",
      success:
        "The crystals chime softly and melt aside like a curtain. Shortcut: unlocked!",
      factUnlock: "husky-coat",
      completion: "Kiki struts through the cave feeling extremely clever.",
      animationCue: "kiki-proud-hop",
      soundCue: "sfx:crystal-chime",
      visualEvent: "vfx:crystals-melt",
    }),

    E({
      nodeId: "snow-pass",
      locationName: "Snow Pass",
      kind: "checkpoint",
      arrival: "Snow Pass. A perfect spot for a snow-break.",
      problem:
        "Kiki catches her breath. Two secret spots twinkle nearby… if she's curious enough to look.",
      kikiReaction: "happy",
      completion: "Rested and ready. The summit is close!",
      animationCue: "kiki-shake-snow",
      soundCue: "sfx:wind-soft",
    }),

    E({
      nodeId: "summit-camp",
      locationName: "Summit Gate",
      kind: "math-normal",
      arrival: "The Summit Gate. Two tall flags mark the entrance to Race Camp.",
      problem:
        "The gatekeeper — a very serious snowman — will only open the gate for the right number.",
      kikiReaction: "determined",
      dialogue: [
        {
          speaker: "narrator",
          line: "The snowman adjusts his carrot nose importantly.",
        },
      ],
      math: {
        template:
          "The gate needs {a} groups of {b} snow-flags. How many flags is that?",
        flavor: "flag-groups",
      },
      hints: {
        hints: [
          "Groups again! Each group has the same number of flags.",
          "{a} groups of {b}… you know this dance by now.",
          "Add {b} to itself {a} times. The snowman is waiting.",
        ],
      },
      wrongResponses: [
        "The snowman shakes his head slowly. Carrot wobbles.",
        "The gate rattles but stays shut. Try another number!",
        "Kiki paws at the snow. Almost — count the groups again.",
      ],
      correctResponse: "The snowman tips his twig hat. Respect.",
      success:
        "The great gate swings open with a frosty creak. Race Camp glows just beyond!",
      completion: "Through the gate! The race is near.",
      animationCue: "kiki-excited-bark",
      soundCue: "sfx:gate-opens",
      visualEvent: "vfx:gate-swing",
    }),

    E({
      nodeId: "secret-igloo",
      locationName: "Secret Igloo",
      kind: "secret",
      arrival: "Wait… is that an igloo hiding behind the snowdrift?!",
      problem: "Someone knocked from INSIDE. Who lives in a secret igloo?!",
      kikiReaction: "surprised",
      discovery:
        "A tiny Husky puppy tumbles out! 'You found my hideout!' It does a happy spin and teaches Kiki the secret snow-spin.",
      secretText:
        "Secret Igloo discovered! Kiki learned the snow-spin AND earned Golden Husky mastery. I FOUND SOMETHING!",
      factUnlock: "husky-talking",
      completion: "Best. Secret. Ever.",
      animationCue: "kiki-happy-spin",
      soundCue: "sfx:puppy-woo",
      visualEvent: "vfx:snow-spin",
    }),

    E({
      nodeId: "snow-cache",
      locationName: "Bone Cache",
      kind: "secret",
      arrival: "Kiki's nose twitches. She smells… something suspicious.",
      problem: "Something is buried here. There is only one way to find out.",
      kikiReaction: "curious",
      discovery:
        "Kiki digs like crazy — and unearths a giant BONE! Where did THAT come from? She decides not to ask questions.",
      secretText:
        "Bone Cache discovered! Kiki is extremely pleased with herself. A small Golden Husky mastery bonus, and one very happy corgi.",
      completion: "Kiki trots on, bone held high like a trophy.",
      animationCue: "kiki-dig-zoomies",
      soundCue: "sfx:digging",
      visualEvent: "vfx:snow-explosion-small",
    }),

    E({
      nodeId: "sled-race",
      locationName: "Great Husky Sled Race",
      kind: "race",
      arrival: "Race Camp! Sleds lined up, snow flying, and Bolt is already warming up.",
      problem:
        "It's Kiki versus Bolt, down the mountain. Steady paws or turbo zoomies — Kiki decides turn by turn.",
      kikiReaction: "excited",
      dialogue: [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Ready, Kiki? May the fluffiest racer win!",
        },
      ],
      factUnlock: "husky-job",
      completion: "The race is on!",
      animationCue: "kiki-race-ready",
      soundCue: "sfx:race-horn",
    }),

    E({
      nodeId: "husky-reward",
      locationName: "Husky Reward",
      kind: "reward",
      arrival: "The finish line is behind them. The whole mountain is quiet and sparkly.",
      problem: "Kiki did it — the whole adventure. Time to celebrate properly.",
      kikiReaction: "proud",
      factUnlock: "husky-serum-run",
      completion: "Husky sticker: EARNED.",
      animationCue: "kiki-celebrate",
      soundCue: "sfx:sticker-shine",
      visualEvent: "vfx:sticker-reveal",
    }),
  ],

  routes: [
    {
      routeId: "safe",
      tagline: "The scenic way: longer, thoughtful, full of discoveries.",
      adjectives: ["exploratory", "thoughtful", "scenic", "gentle"],
      mathTone: "Normal math, wrapped in exploration.",
      lengthNote: "Slightly longer — more to see, more to find.",
    },
    {
      routeId: "challenge",
      tagline: "The thrilling way: shorter, mysterious, trickier math.",
      adjectives: ["mysterious", "exciting", "risky", "bold"],
      mathTone: "Harder math, bigger bragging rights.",
      lengthNote: "Slightly shorter — for pups who like a thrill.",
    },
  ],

  breedCharacter: {
    name: "Bolt",
    species: "Siberian Husky",
    personality: [
      "confident",
      "playful",
      "competitive",
      "friendly",
      "knows the mountains like the back of his paw",
    ],
    dialogue: {
      "first-meeting": [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Hey! I'm Bolt. I race these mountains every day!",
        },
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Shortcut's faster… if you're brave. Safe Trail's prettier. Your call, short-stack!",
        },
      ],
      "race-start": [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Ready, Kiki? May the fluffiest racer win!",
        },
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Try to keep up, tiny legs!",
        },
      ],
      "mid-race": [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Woo! You're fast for a short-legged pup!",
        },
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "This way! Follow my tail — it's very followable!",
        },
      ],
      "race-finish": [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "That was AMAZING! You're a real mountain racer now!",
        },
      ],
      reward: [
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "You did it! I knew you had it in you.",
        },
        {
          speaker: "husky",
          characterName: "Bolt",
          line: "Friends race each other. Best friends race again tomorrow.",
        },
      ],
    },
  },

  raceBeats: [
    {
      id: "race-downhill",
      situation: "Downhill stretch! The sled picks up speed.",
      detail: "The slope is steep and the snow is perfect.",
      steadyLabel: "Steady",
      turboLabel: "Turbo",
      steadyText: "Kiki keeps the sled smooth and controlled down the hill.",
      turboText: "Kiki leans in and FLIES down the hill!",
      kikiReaction: "excited",
    },
    {
      id: "race-icy-turn",
      situation: "Icy turn ahead — sharp left!",
      detail: "The track glitters. This turn needs respect.",
      steadyLabel: "Steady",
      turboLabel: "Turbo",
      steadyText: "Kiki eases through the turn like a pro.",
      turboText: "Kiki drifts the turn — snow everywhere!",
      kikiReaction: "determined",
    },
    {
      id: "race-deep-snow",
      situation: "Deep snow! The sled is slowing down.",
      detail: "Fluffy drifts pile up in front of the runners.",
      steadyLabel: "Steady",
      turboLabel: "Turbo",
      steadyText: "Kiki plows through steadily, one paw at a time.",
      turboText: "Kiki bursts through the drifts in a cloud of powder!",
      kikiReaction: "determined",
    },
    {
      id: "race-final-sprint",
      situation: "Final sprint! Bolt is right beside you!",
      detail: "The finish flags are in sight. Everything hurts. Everything is awesome.",
      steadyLabel: "Steady",
      turboLabel: "Turbo",
      steadyText: "Kiki holds her line, steady and strong.",
      turboText: "Kiki gives it EVERYTHING — turbo zoomies!",
      kikiReaction: "excited",
    },
  ],

  rewardSequence: [
    {
      id: "reward-finish",
      text: "Kiki crosses the finish line! Snow flies everywhere!",
      kikiReaction: "celebrate",
      soundCue: "sfx:cheering",
      visualEvent: "vfx:finish-confetti",
    },
    {
      id: "reward-bolt-congrats",
      text: "Bolt skids to a stop beside her, grinning his big Husky grin.",
      kikiReaction: "happy",
      huskyLine: {
        speaker: "husky",
        characterName: "Bolt",
        line: "You did it! I knew you had it in you.",
      },
      soundCue: "sfx:bolt-woo",
    },
    {
      id: "reward-recap",
      text: "Think about it: Kiki fixed the bridge, crossed the frozen lake, opened the Summit Gate — and raced a Husky down a mountain!",
      kikiReaction: "proud",
    },
    {
      id: "reward-fact-friendship",
      text: "Bolt nuzzles Kiki. Best friends race again tomorrow.",
      kikiReaction: "affectionate",
      huskyLine: {
        speaker: "husky",
        characterName: "Bolt",
        line: "Friends race each other. Best friends race again tomorrow.",
      },
      factUnlock: "husky-serum-run",
    },
    {
      id: "reward-sticker",
      text: "The Husky sticker appears in Kiki's album — shiny and brand new!",
      kikiReaction: "surprised",
      soundCue: "sfx:sticker-shine",
      visualEvent: "vfx:sticker-reveal",
    },
    {
      id: "reward-album",
      text: "Husky: collected! The album has room for so many more friends…",
      kikiReaction: "happy",
      visualEvent: "vfx:album-page",
    },
    {
      id: "reward-golden-tease",
      text: "Psst… finding secrets and acing quizzes earns Golden stickers. Just saying.",
      kikiReaction: "playful",
      soundCue: "sfx:mystery-twinkle",
    },
  ],
};

/** Validate the reference content at load — fail fast if it ever rots. */
assertValidAdventureNarrative(HUSKY_NARRATIVE);
