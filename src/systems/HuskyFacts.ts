/**
 * HuskyFacts — the Husky breed profile + quiz question bank.
 *
 * REFERENCE IMPLEMENTATION for the breed facts/quiz system. Every future
 * breed ships one file shaped exactly like this: a BreedProfile (8–12
 * facts, ~age 9 wording) and a question bank (6–10 questions). The engine
 * (BreedFacts.ts / BreedQuiz.ts) never changes per breed.
 *
 * Wording rules followed here: short sentences, concrete words, no jargon,
 * one idea per fact. Read each fact aloud — if a 9-year-old would stumble,
 * rewrite it.
 */

import type { BreedProfile } from "./BreedFacts";
import { assertValidBreedProfile } from "./BreedFacts";
import type { BreedQuizQuestion } from "./BreedQuiz";
import { assertValidQuestionBank } from "./BreedQuiz";

export const HUSKY_QUIZ_KEY = "kiki-dog-quiz-husky-v1";

export const HUSKY_PROFILE: BreedProfile = {
  breedId: "husky",
  breedName: "Siberian Husky",
  tagline: "The friendly sled dog with the big smile and bigger energy!",
  facts: [
    {
      id: "husky-origin",
      category: "origin",
      text: "Huskies come from Siberia, a very cold part of Russia.",
    },
    {
      id: "husky-job",
      category: "job",
      text: "Huskies were bred to pull sleds across long, snowy distances.",
    },
    {
      id: "husky-coat",
      category: "trait",
      text: "A Husky's super-thick double coat keeps it warm in freezing weather.",
    },
    {
      id: "husky-eyes",
      category: "trait",
      text: "Many Huskies have bright blue eyes. Some have brown eyes — or one of each!",
    },
    {
      id: "husky-temperament",
      category: "temperament",
      text: "Huskies are friendly, playful, and love being part of a pack.",
    },
    {
      id: "husky-talking",
      category: "trait",
      text: "Huskies are famous talkers! They howl and woo-woo instead of barking much.",
    },
    {
      id: "husky-serum-run",
      category: "job",
      text: "In 1925, a Husky sled team helped rush life-saving medicine to Alaska.",
    },
    {
      id: "husky-size",
      category: "size",
      text: "Huskies are medium-sized dogs. All that fluff makes them look bigger!",
    },
    {
      id: "husky-energy",
      category: "temperament",
      text: "Huskies have TONS of energy and need lots of play and exercise every day.",
    },
    {
      id: "husky-shedding",
      category: "fun",
      text: "In spring, Huskies shed their fluffy undercoat in big tufts. Floof everywhere!",
    },
    {
      id: "husky-tail",
      category: "trait",
      text: "A Husky's bushy tail curls over its back like a scarf to warm its nose in the snow.",
    },
    {
      id: "husky-endurance",
      category: "fun",
      text: "Huskies can run for miles and miles — and still want to play at the end!",
    },
  ],
};

/** 8 questions; a normal session asks 4 (configurable 3–5). */
export const HUSKY_QUESTIONS: BreedQuizQuestion[] = [
  {
    id: "husky-q-origin",
    factId: "husky-origin",
    prompt: "Where do Huskies come from?",
    choices: ["Siberia, a very cold part of Russia", "A hot desert", "A tropical jungle", "The beach"],
    correctIndex: 0,
  },
  {
    id: "husky-q-job",
    factId: "husky-job",
    prompt: "What job were Huskies bred to do?",
    choices: ["Guard sheep", "Pull sleds across the snow", "Catch fish", "Deliver pizza"],
    correctIndex: 1,
  },
  {
    id: "husky-q-coat",
    factId: "husky-coat",
    prompt: "How do Huskies stay warm in freezing weather?",
    choices: ["They wear little sweaters", "They stay inside all winter", "Their super-thick double coat", "They never feel cold at all"],
    correctIndex: 2,
  },
  {
    id: "husky-q-eyes",
    factId: "husky-eyes",
    prompt: "What is special about many Huskies' eyes?",
    choices: ["They glow in the dark", "Many are bright blue", "They are always closed", "They change color every hour"],
    correctIndex: 1,
  },
  {
    id: "husky-q-talking",
    factId: "husky-talking",
    prompt: "How do Huskies like to 'talk'?",
    choices: ["They whisper quietly", "They howl and woo-woo", "They clap their paws", "They write letters"],
    correctIndex: 1,
  },
  {
    id: "husky-q-serum-run",
    factId: "husky-serum-run",
    prompt: "In 1925, a Husky sled team rushed what to Alaska?",
    choices: ["Life-saving medicine", "A mountain of toys", "Birthday cakes", "New sleds"],
    correctIndex: 0,
  },
  {
    id: "husky-q-size",
    factId: "husky-size",
    prompt: "How big is a Husky?",
    choices: ["Tiny, like a teacup", "Medium-sized", "Huge, like a horse", "As big as a car"],
    correctIndex: 1,
  },
  {
    id: "husky-q-tail",
    factId: "husky-tail",
    prompt: "What does a Husky's bushy tail do in the snow?",
    choices: [
      "Curls over like a scarf to warm its nose",
      "Turns into a pillow",
      "Wags so fast it melts the snow",
      "Disappears until spring",
    ],
    correctIndex: 0,
  },
];

/** Validate the reference dataset at load — fail fast if it ever rots. */
assertValidBreedProfile(HUSKY_PROFILE);
assertValidQuestionBank("husky", HUSKY_QUESTIONS, HUSKY_PROFILE.facts);
