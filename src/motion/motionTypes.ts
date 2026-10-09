/**
 * motionTypes.ts — shared types for the Kiki & Husky character motion system.
 *
 * Design: characters are paper-doll rigs. Each rig is ONE atlas texture whose
 * frames are body parts (torso, head, ears, legs, tail) sliced from the LOCKED
 * canonical paintings. Motion = keyframed part transforms (angle/offset/scale)
 * sampled by a tiny deterministic engine. No per-frame allocation, no filters,
 * no sprite sheets — Chromebook-safe by construction.
 *
 * Scenes never touch asset filenames: they use MotionId / ReactionId /
 * TerrainId below. Lennon: see docs/KIKI_HUSKY_MOTION_SYSTEM.md.
 */

/** Phase- or time-based key. Loops use phase 0..1; one-shots use ms. */
export interface Key {
  t: number;
  v: number;
}

export type Channel = 'angle' | 'x' | 'y' | 'scaleX' | 'scaleY';
/** 'frame' is discrete (texture swap, e.g. blink) — handled separately. */
export type DiscreteChannel = 'frame';

export interface Track {
  channel: Channel;
  /** Sorted by t. Cosine-eased between keys (matches validation renders). */
  keys: Key[];
}

export interface PartTrack {
  part: string;
  tracks: Track[];
}

/** A foot hitting the ground inside a looping cycle. */
export interface ContactEvent {
  /** Phase 0..1 within the cycle period. */
  phase: number;
  /** Part name of the paw, e.g. 'legFL'. */
  paw: string;
}

export interface CycleDef {
  kind: 'cycle';
  id: string;
  /** Rig this cycle is authored for. */
  rig: string;
  periodMs: number;
  tracks: PartTrack[];
  contacts: ContactEvent[];
}

export interface FrameSwap {
  part: string;
  frame: string;
  /** ms after one-shot start */
  atMs: number;
  /** ms duration */
  durMs: number;
}

export interface OneShotDef {
  kind: 'oneshot';
  id: string;
  rig: string;
  durationMs: number;
  tracks: PartTrack[];
  frameSwaps?: FrameSwap[];
  /** Event fired at this ms (e.g. 'shake' for snow-burst FX). */
  emitAt?: Array<{ ms: number; event: string }>;
}

/** Multipliers applied at sample time — terrain never needs new art. */
export interface TerrainMod {
  id: TerrainId;
  speedMul?: number;
  /** leg swing amplitude */
  strideMul?: number;
  /** leg lift (dy) amplitude */
  liftMul?: number;
  /** torso bob amplitude */
  bobMul?: number;
  /** additive torso pitch, degrees (+ = nose-down for right-facing rigs) */
  bodyPitch?: number;
  /** per-contact slip chance -> plays 'slip' overlay + emits 'slip' */
  slipChance?: number;
  /** while active, overlay a looping shiver jitter */
  shiver?: boolean;
  /** idle head-look cadence multiplier */
  lookFreqMul?: number;
}

/** One texture atlas inside a rig. Rigs with big torsos use two. */
export interface RigAtlas {
  key: string;
  file: string;
  width: number; height: number;
}

/** One body part inside a rig atlas. */
export interface PartDef {
  /** index into RigDef.atlases */
  atlas: number;
  frame: string;
  /** atlas rect */
  ax: number; ay: number; w: number; h: number;
  /** pivot as origin fractions */
  pivotX: number; pivotY: number;
  /** pivot rest position, rig-root px relative to ground origin */
  restX: number; restY: number;
}

export interface RigDef {
  atlases: RigAtlas[];
  order: string[];
  parts: Record<string, PartDef>;
}

/* ------------------------------------------------------------------ */
/* Semantic IDs — the ONLY vocabulary scenes use.                     */
/* ------------------------------------------------------------------ */

export type MotionId =
  | 'idle'
  | 'trot'
  | 'run'
  | 'race-steady'
  | 'race-fast'
  | 'race-turbo';

export type ReactionId =
  | 'curious' | 'happy' | 'surprised' | 'think' | 'proud'
  | 'sniff' | 'celebrate' | 'confused'
  | 'ask' | 'listen' | 'agree' | 'unsure' | 'brave' | 'lets-try'
  | 'greeting' | 'encourage' | 'look-kiki';

export type TerrainId =
  | 'normal-snow' | 'deep-snow' | 'ice' | 'uphill'
  | 'downhill' | 'bridge' | 'cave' | 'windy-pass';

export type IdleBehaviorId =
  | 'blink' | 'ear-twitch' | 'head-look' | 'sniff'
  | 'paw-adjust' | 'shake-snow' | 'look-back';

export type MotionEvent =
  | 'footstep'   // { paw, x, y } — paw touched ground; spawn print/puff here
  | 'slip'       // { x, y } — ice slip moment; sparkle FX hook
  | 'shake'      // { x, y } — snow shaken off; burst FX hook
  | 'hop';       // { x, y } — celebration hop apex

export interface FootstepData { paw: string; x: number; y: number }
export interface PointData { x: number; y: number }

export type CharacterId = 'kiki' | 'husky';
