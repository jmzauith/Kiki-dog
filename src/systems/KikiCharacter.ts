import Phaser from "phaser";
import { DogCharacter, DogCharacterOptions, DogSheetConfig, DogReaction, DogFacing, DogAudioHooks, SilentDogAudio } from "./DogCharacter";
const POSES = ["idle", "walk1", "walk2", "walk3", "walk4", "run1", "run2", "curious", "surprised", "happy", "thinking", "look-left", "look-right", "sniff", "jump", "shiver", "secret", "success", "confused", "sled-ready", "race-steady", "race-turbo", "race-lean", "race-hit", "race-celebrate", "proud", "sticker"] as const;
export type KikiPose = typeof POSES[number];
export type KikiReaction = DogReaction;
export type KikiFacing = DogFacing;
export type KikiAudioHooks = DogAudioHooks;
export type KikiCharacterOptions = DogCharacterOptions;
export const SilentKikiAudio = SilentDogAudio;
const CONFIG: DogSheetConfig = {
  sheetKey: "kiki-canonical", sheetUrl: "assets/polish/kiki-canonical-atlas.svg",
  sheetW: 1200, sheetH: 800, frameW: 200, frameH: 160, cols: 6,
  frames: [...POSES], walkCycle: ["walk1", "walk2", "walk3", "walk4"],
  defaultIdle: "idle", reactions: { happy: "happy", curious: "curious", surprised: "surprised" },
  embeddedTail: true, tailKey: "kiki-tail", tailUrl: "assets/characters/kiki/kiki-tail.svg", tailW: 64, tailH: 64,
  tailX: -56, tailY: 12, feetY: 54,
};
/** Kiki uses Ringo's final direction-A painterly pose sheet and the shared dog animation system. */
export class KikiCharacter extends DogCharacter {
  static preload(scene: Phaser.Scene): void { DogCharacter.preloadSheet(scene, CONFIG); }
  constructor(scene: Phaser.Scene, x: number, y: number, opts: KikiCharacterOptions = {}) {
    super(scene, x, y, opts, CONFIG);
    this.tail.setVisible(false); // Canonical Kiki is tailless in every pose.
  }
  setPose(pose: KikiPose): void { super.setPose(pose); }
  setIdlePose(pose: KikiPose): void { super.setIdlePose(pose); }
}
