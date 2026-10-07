/**
 * CorgiFacts — the Kiki/Corgi reference dataset for the Ultimate Corgi Quiz.
 *
 * Kiki is NOT a collectible breed: there is no corgi adventure, no corgi
 * album slot. These facts power the ENDGAME quiz — the final challenge a
 * child faces after completing all 12 breed adventures.
 *
 * The shapes below are STRUCTURALLY identical to the BreedQuiz engine's
 * BreedFact / BreedQuizQuestion (same field names and validation rules),
 * so Lennon can feed them straight into BreedQuizSession with zero
 * translation. This module stays zero-import so it compiles standalone.
 *
 * Wording rules followed (age ~9): one idea per fact, ≤30 words, concrete
 * nouns, playful but truthful, silly-but-plausible distractors.
 */

export type CorgiFactCategory =
  | "origin"
  | "size"
  | "temperament"
  | "job"
  | "trait"
  | "fun";

export interface CorgiFact {
  id: string;
  category: CorgiFactCategory;
  text: string;
}

export interface CorgiQuizQuestion {
  id: string;
  factId: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export const CORGI_BREED_ID = "corgi";
/** Storage key for the ultimate-quiz knowledge record (own slot). */
export const CORGI_QUIZ_KEY = "kiki-dog:quiz:corgi-ultimate:v1";

export const CORGI_FACTS: CorgiFact[] = [
  { id: "corgi-origin", category: "origin", text: "Corgis come from Wales, a country with green hills and lots of sheep farms." },
  { id: "corgi-name", category: "fun", text: "In the Welsh language, the name Corgi means dwarf dog. A perfect name for such short legs!" },
  { id: "corgi-job", category: "job", text: "Corgis were bred to herd cattle. They nip gently at the cows' heels to keep the herd moving." },
  { id: "corgi-queen", category: "fun", text: "Queen Elizabeth II loved corgis and had more than 30 of them during her life." },
  { id: "corgi-low", category: "trait", text: "Corgis are built low to the ground so they can duck under a cow's kick without getting hurt." },
  { id: "corgi-ears", category: "trait", text: "Corgis have big upright ears that work like satellite dishes for hearing every sound." },
  { id: "corgi-sploot", category: "fun", text: "Corgis love to sploot — that means lying flat on their bellies with their back legs stretched out behind them." },
  { id: "corgi-shedding", category: "trait", text: "Corgis shed a LOT. Fans joke that the fluffy fur left on the couch is called corgi glitter." },
  { id: "corgi-two-kinds", category: "fun", text: "There are two kinds of corgi: the Pembroke and the Cardigan. They look alike but are different breeds." },
  { id: "corgi-smart", category: "temperament", text: "Corgis are very smart and love learning tricks. They get bored if they have nothing fun to do." },
  { id: "corgi-bark", category: "trait", text: "Even though their legs are short, corgis have a big, loud bark like a much bigger dog." },
  { id: "corgi-herd-kids", category: "temperament", text: "A corgi's herding instinct is so strong it may try to herd children or other pets around the house." },
  { id: "corgi-fairy", category: "fun", text: "A Welsh legend says fairies rode corgis like tiny horses. The markings on a corgi's back are called the fairy saddle." },
  { id: "corgi-energy", category: "temperament", text: "Corgis are full of energy and need lots of play and exercise every single day to stay happy." },
];

export const CORGI_QUIZ_QUESTIONS: CorgiQuizQuestion[] = [
  {
    id: "corgi-q-origin", factId: "corgi-origin",
    prompt: "Where do corgis come from?",
    choices: ["Wales", "France", "Japan", "Brazil"], correctIndex: 0,
  },
  {
    id: "corgi-q-name", factId: "corgi-name",
    prompt: "What does the name Corgi mean in the Welsh language?",
    choices: ["Tiny horse", "Dwarf dog", "Fluffy cloud", "Happy pup"], correctIndex: 1,
  },
  {
    id: "corgi-q-job", factId: "corgi-job",
    prompt: "What job were corgis bred to do?",
    choices: ["Pull sleds", "Herd cattle", "Guard castles", "Catch fish"], correctIndex: 1,
  },
  {
    id: "corgi-q-queen", factId: "corgi-queen",
    prompt: "Who famously loved corgis and had more than 30 of them?",
    choices: ["A pirate captain", "An astronaut", "Queen Elizabeth II", "A race car driver"], correctIndex: 2,
  },
  {
    id: "corgi-q-low", factId: "corgi-low",
    prompt: "Why are corgis built so low to the ground?",
    choices: ["To hide in tall grass", "To swim faster", "To duck under a cow's kick", "To fit in small cars"], correctIndex: 2,
  },
  {
    id: "corgi-q-sploot", factId: "corgi-sploot",
    prompt: "What is a corgi sploot?",
    choices: ["A corgi dance", "A loud bark", "Lying flat with back legs stretched behind", "A crunchy treat"], correctIndex: 2,
  },
  {
    id: "corgi-q-shedding", factId: "corgi-shedding",
    prompt: "Corgis shed a lot. What do fans jokingly call the fur left on the couch?",
    choices: ["Corgi glitter", "Snow", "Magic dust", "Cotton candy"], correctIndex: 0,
  },
  {
    id: "corgi-q-two-kinds", factId: "corgi-two-kinds",
    prompt: "How many kinds of corgi are there?",
    choices: ["One", "Two: Pembroke and Cardigan", "Three", "Five"], correctIndex: 1,
  },
  {
    id: "corgi-q-herd-kids", factId: "corgi-herd-kids",
    prompt: "What might a corgi try to herd around the house?",
    choices: ["Clouds", "Children and other pets", "Cars", "Homework"], correctIndex: 1,
  },
  {
    id: "corgi-q-fairy", factId: "corgi-fairy",
    prompt: "Legend says fairies rode corgis. What is the fairy saddle?",
    choices: ["Markings on a corgi's back", "Their big ears", "Under their paws", "Their fluffy tail"], correctIndex: 0,
  },
  {
    id: "corgi-q-bark", factId: "corgi-bark",
    prompt: "How does a corgi's bark sound?",
    choices: ["Tiny and squeaky", "Big and loud, like a much bigger dog", "Silent — corgis never bark", "Like a cat's meow"], correctIndex: 1,
  },
];

// ------------------------------------------------------------ validation (mirrors BreedQuiz rules)

const KNOWN_CATEGORIES: CorgiFactCategory[] = ["origin", "size", "temperament", "job", "trait", "fun"];

export function validateCorgiDataset(): string[] {
  const problems: string[] = [];
  const factIds = new Set<string>();
  for (const f of CORGI_FACTS) {
    if (!f.id || factIds.has(f.id)) problems.push(`bad/duplicate fact id "${f.id}"`);
    factIds.add(f.id);
    if (!KNOWN_CATEGORIES.includes(f.category)) problems.push(`fact "${f.id}" unknown category`);
    if (!f.text || f.text.trim() === "") problems.push(`fact "${f.id}" empty text`);
    else if (f.text.split(/\s+/).length > 30) problems.push(`fact "${f.id}" over 30 words (age-9 guardrail)`);
  }
  const qIds = new Set<string>();
  for (const q of CORGI_QUIZ_QUESTIONS) {
    if (!q.id || qIds.has(q.id)) problems.push(`bad/duplicate question id "${q.id}"`);
    qIds.add(q.id);
    if (!factIds.has(q.factId)) problems.push(`question "${q.id}" unknown fact "${q.factId}"`);
    if (!Array.isArray(q.choices) || q.choices.length < 3 || q.choices.length > 4) {
      problems.push(`question "${q.id}" must have 3–4 choices`);
    }
    const seen = new Set<string>();
    for (const c of q.choices) {
      const k = c.trim().toLowerCase();
      if (seen.has(k)) problems.push(`question "${q.id}" duplicate choice "${c}"`);
      seen.add(k);
    }
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.choices.length) {
      problems.push(`question "${q.id}" correctIndex out of range`);
    }
  }
  return problems;
}

// Self-validating at import (dev-time fail fast), like the Husky dataset.
{
  const problems = validateCorgiDataset();
  if (problems.length > 0) {
    throw new Error(`Invalid Corgi dataset:\n- ${problems.join("\n- ")}`);
  }
}
