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

/**
 * HuskyCharacter — the Husky rival/guide as an independent game object.
 *
 * Production art (round 2): 6 hand-built vector poses under
 * public/assets/characters/husky/ — idle, race, turbo, happy, surprised,
 * celebrate — plus a separately-wagging curled tail. Gray/white coat, facial
 * mask, and blue eyes; visually equal in quality to Kiki.
 *
 * Shares all machinery (facing, idle life, reactions, FX) with Kiki via
 * DogCharacter. Used by RaceScene for the rival sled racer.
 */

export type HuskyPose =
  | "idle"
  | "race"
  | "turbo"
  | "happy"
  | "surprised"
  | "celebrate";

export type HuskyReaction = DogReaction;
export type HuskyFacing = DogFacing;
export type HuskyAudioHooks = DogAudioHooks;
export interface HuskyCharacterOptions extends DogCharacterOptions {}
export const SilentHuskyAudio: HuskyAudioHooks = SilentDogAudio;

const HUSKY_CONFIG: DogSheetConfig = {
  sheetKey: "husky-poses",
  sheetUrl: "assets/characters/husky/husky-poses.svg",
  sheetW: 1200,
  sheetH: 160,
  frameW: 200,
  frameH: 160,
  cols: 6,
  frames: ["idle", "race", "turbo", "happy", "surprised", "celebrate"],
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
