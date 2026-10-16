import { describe,it,expect } from 'vitest';
import { HuskyGraduation, GRADUATION_QUESTIONS } from '../HuskyGraduation';
import { memoryStore, ProfileScopedStore } from '../ProfileStore';
import { BreedRewardState } from '../BreedRewards';
import { HUSKY_REWARD_DEF } from '../HuskyRewards';
describe('post-race Husky quiz',()=>{
 it('wrong answers do not advance; correct answers persist across reload per player',()=>{
  const base=memoryStore(),store=new ProfileScopedStore(base,'quiz-a');
  let quiz=new HuskyGraduation(store);
  expect(quiz.answer((quiz.question!.correctIndex+1)%4)).toBe(false);
  expect(quiz.count).toBe(0);
  for(const q of GRADUATION_QUESTIONS){expect(quiz.answer(q.correctIndex)).toBe(true);quiz=new HuskyGraduation(store);}
  expect(quiz.passed).toBe(true);expect(quiz.question).toBeUndefined();
  expect(new HuskyGraduation(new ProfileScopedStore(base,'quiz-b')).passed).toBe(false);
 });
 it('three correct answers earn gold on either route without optional points',()=>{
  for(const route of ['safe','challenge'] as const){
   const rewards=new BreedRewardState(HUSKY_REWARD_DEF);rewards.setRoute(route);
   for(const id of [...HUSKY_REWARD_DEF.requiredAlways,...HUSKY_REWARD_DEF.requiredByRoute[route]])rewards.recordRequired(id);
   rewards.recordRaceWon();expect(rewards.goldenStickerUnlocked).toBe(false);
   rewards.recordQuizMastery(2/3);expect(rewards.goldenStickerUnlocked).toBe(false);
   rewards.recordQuizMastery(1);expect(rewards.goldenStickerUnlocked).toBe(true);
   expect(BreedRewardState.fromJSON(HUSKY_REWARD_DEF,rewards.toJSON()).goldenStickerUnlocked).toBe(true);
  }
 });
 it('quiz completion cannot bypass the adventure or race',()=>{
  const rewards=new BreedRewardState(HUSKY_REWARD_DEF);rewards.recordQuizMastery(1);expect(rewards.goldenStickerUnlocked).toBe(false);
 });
});
