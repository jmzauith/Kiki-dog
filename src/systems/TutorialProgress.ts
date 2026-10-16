import type { StorageLike } from './BreedRewards';
export const TUTORIAL_KEY='tutorial:trail:v1';
export function tutorialComplete(store:StorageLike):boolean {return store.getItem(TUTORIAL_KEY)==='complete';}
export function completeTutorial(store:StorageLike):void {store.setItem(TUTORIAL_KEY,'complete');}
