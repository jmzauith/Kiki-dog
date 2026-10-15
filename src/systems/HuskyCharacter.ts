import Phaser from "phaser";
import {
  DogAudioHooks,
  DogCharacter,
  DogCharacterOptions,
  DogFacing,
  DogReaction,
  DogSheetConfig,
  SilentDogAudio,
} from "./DogCharacter";

/** Ringo canonical painterly Husky. Its curled tail is included in each pose. */

export type HuskyPose =
  | "idle"
  | "race"
  | "turbo"
  | "happy"
  | "surprised"
  | "celebrate" | "greeting" | "curious" | "confident" | "sled-ready" | "race-fast" | "leaning-turn" | "deep-snow" | "recover" | "look-back" | "encouragement" | "finish-push" | "proud";

export type HuskyReaction = DogReaction;
export type HuskyFacing = DogFacing;
export type HuskyAudioHooks = DogAudioHooks;
export interface HuskyCharacterOptions extends DogCharacterOptions {}
export const SilentHuskyAudio: HuskyAudioHooks = SilentDogAudio;

const HUSKY_CONFIG: DogSheetConfig = {
  sheetKey: "husky-canonical",
  sheetUrl: "assets/polish/husky-canonical-atlas.svg",
  sheetW: 1200,
  sheetH: 480,
  frameW: 200,
  frameH: 160,
  cols: 6,
  frames: ["idle", "race", "turbo", "happy", "surprised", "celebrate", "greeting", "curious", "confident", "sled-ready", "race-fast", "leaning-turn", "deep-snow", "recover", "look-back", "encouragement", "finish-push", "proud"],
  embeddedTail: true,
  tailKey: "husky-tail",
  tailUrl: "assets/characters/husky/husky-tail.svg",
  tailW: 64,
  tailH: 64,
  walkCycle: ["race", "turbo"],
  defaultIdle: "idle",
  reactions: { happy: "happy", curious: "idle", surprised: "surprised" },
  tailX: -56,
  tailY: 12,
  feetY: 54,
};

export class HuskyCharacter extends DogCharacter {
  /** Call from Scene.preload(). */
  static preload(scene: Phaser.Scene): void {
    DogCharacter.preloadSheet(scene, HUSKY_CONFIG);
  }

  constructor(scene: Phaser.Scene, x: number, y: number, opts: HuskyCharacterOptions = {}) {
    super(scene, x, y, opts, HUSKY_CONFIG);
  }

  setPose(pose: HuskyPose): void {
    super.setPose(pose);
  }

  setIdlePose(pose: HuskyPose): void {
    super.setIdlePose(pose);
  }
}
