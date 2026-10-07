/**
 * AdventureEvents — tiny typed event bus for cross-scene adventure signals.
 *
 * Phaser scenes are started/stopped imperatively; this bus lets RaceScene
 * announce a clean completion state ("husky:race-complete" with stats) that
 * any listener — HuskyScene, a future reward screen, analytics — can react
 * to without scene-to-scene coupling. Persistence remains the source of
 * truth; events are notifications, not state.
 */
import Phaser from "phaser";

export const RACE_COMPLETE_EVENT = "adventure:race-complete";
export const STICKER_UNLOCKED_EVENT = "adventure:sticker-unlocked";

export interface RaceCompletePayload {
  adventureId: string;
  turns: number;
  turbos: number;
}

export interface StickerUnlockedPayload {
  adventureId: string;
  stickerName: string;
  secretsFound: number;
  bonusChallengesCompleted: number;
}

class AdventureEventBus extends Phaser.Events.EventEmitter {
  emitRaceComplete(payload: RaceCompletePayload): void {
    this.emit(RACE_COMPLETE_EVENT, payload);
  }

  emitStickerUnlocked(payload: StickerUnlockedPayload): void {
    this.emit(STICKER_UNLOCKED_EVENT, payload);
  }
}

export const AdventureEvents = new AdventureEventBus();
