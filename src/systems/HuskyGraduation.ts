import { HUSKY_QUESTIONS } from './HuskyFacts';
import type { StorageLike } from './ProfileStore';

// Facts checked against https://www.akc.org/dog-breeds/siberian-husky/
export const HUSKY_READING = [
  'Meet the Siberian Husky, Bolt’s breed! These medium-sized dogs come from Siberia. They were bred to work together in teams, pulling sleds over long, snowy distances. Their endurance helps them keep moving on long journeys.',
  'A Husky has a double coat: a soft undercoat beneath a layer of outer hairs. This thick coat helps keep the dog warm in cold weather. Huskies can have blue eyes, brown eyes, or one of each. Their upright ears and fluffy coats make them easy to recognise.',
  'Huskies are often friendly, playful and full of energy. They enjoy company and need plenty of exercise and things to do. Every dog has its own personality, but teamwork is an important part of the Husky’s story — just like racing with Bolt!'
];
export const GRADUATION_QUESTIONS = ['husky-q-job','husky-q-coat','husky-q-origin'].map(id=>HUSKY_QUESTIONS.find(q=>q.id===id)!);
const KEY='husky:breed-finale:v1';
export class HuskyGraduation {
  private correct = new Set<string>();
  constructor(private store:StorageLike){try{const ids=JSON.parse(store.getItem(KEY)??'[]');if(Array.isArray(ids))for(const id of ids)if(GRADUATION_QUESTIONS.some(q=>q.id===id))this.correct.add(id);}catch{/* restart only the damaged quiz */}}
  get count(){return this.correct.size;}
  get passed(){return this.count===3;}
  get question(){return GRADUATION_QUESTIONS.find(q=>!this.correct.has(q.id));}
  answer(index:number):boolean{const q=this.question;if(!q||index!==q.correctIndex)return false;this.correct.add(q.id);this.store.setItem(KEY,JSON.stringify([...this.correct]));return true;}
}
