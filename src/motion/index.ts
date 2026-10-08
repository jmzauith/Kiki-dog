/**
 * src/motion — semantic character animation for Kiki & Husky.
 *
 * Scenes use: CharacterMotion (API), FootFX (ground FX), preloadMotion /
 * createMotionAssets (setup), and the semantic ID types. Everything else is
 * internal. Full guide: docs/KIKI_HUSKY_MOTION_SYSTEM.md.
 */
export { CharacterMotion, preloadMotion, createMotionAssets, ensureFxTextures, huskyHarnessWorld, RACE } from './CharacterMotion';
export { FootFX } from './FootFX';
export type {
  MotionId, ReactionId, TerrainId, IdleBehaviorId, MotionEvent,
  FootstepData, PointData, CharacterId, TerrainMod,
} from './motionTypes';
