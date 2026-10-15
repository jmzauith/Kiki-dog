/**
 * KeyframeEngine.ts — deterministic, allocation-free sampling of motion tracks.
 *
 * One engine instance is shared. Sampling writes into caller-owned PartState
 * objects (reused every frame): zero per-frame allocation, Chromebook-safe.
 * Easing is cosine between keys — identical to the offline validation renders.
 */
import type { Channel, PartTrack } from './motionTypes';

/** Live transform offsets for one part (added to the part's rest pose). */
export interface PartState {
  angle: number;
  x: number; y: number;
  scaleX: number; scaleY: number;
}

export function newPartState(): PartState {
  return { angle: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 };
}

export function resetPartState(s: PartState): void {
  s.angle = 0; s.x = 0; s.y = 0; s.scaleX = 1; s.scaleY = 1;
}

/** Live terrain/locomotion modifiers applied at sample time. */
export interface SampleMods {
  strideMul: number;  // leg swing amplitude
  liftMul: number;    // leg lift amplitude
  bobMul: number;     // torso bob amplitude
  bodyPitch: number;  // additive torso degrees
  mirror: boolean;    // mirror angles/x (facing left, look direction)
}

export const NEUTRAL_MODS: SampleMods = {
  strideMul: 1, liftMul: 1, bobMul: 1, bodyPitch: 0, mirror: false,
};

function sampleKeys(keys: Array<{ t: number; v: number }>, t: number): number {
  const n = keys.length;
  if (n === 0) return 0;
  if (t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  for (let i = 0; i < n - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const u = span <= 0 ? 0 : (t - a.t) / span;
      const e = 0.5 - 0.5 * Math.cos(Math.PI * u); // cosine ease
      return a.v + (b.v - a.v) * e;
    }
  }
  return keys[n - 1].v;
}

function isLeg(part: string): boolean {
  return part === 'legFL' || part === 'legFR' || part === 'legBL' || part === 'legBR';
}

/**
 * Sample tracks at time `t` into `out` (Map part -> PartState, created by caller).
 * - Cycle: t is phase 0..1, periodMs scales phase->ms (keys already in phase).
 * - One-shot: t is milliseconds.
 * Parts not present in `out` are skipped (lets one-shots degrade gracefully
 * across rigs that lack a part, e.g. 'head' on the trot rig).
 */
export function sampleTracks(
  tracks: PartTrack[],
  t: number,
  out: Map<string, PartState>,
  mods: SampleMods,
): void {
  for (const pt of tracks) {
    const st = out.get(pt.part);
    if (!st) continue;
    for (const tr of pt.tracks) {
      let v = sampleKeys(tr.keys, t);
      const ch: Channel = tr.channel;
      if (mods.mirror && (ch === 'angle' || ch === 'x')) v = -v;
      if (ch === 'angle') {
        if (isLeg(pt.part)) v *= mods.strideMul;
        else if (pt.part === 'torso') v += mods.bodyPitch;
        st.angle = v;
      } else if (ch === 'x') {
        st.x = v;
      } else if (ch === 'y') {
        if (isLeg(pt.part)) v *= mods.liftMul;
        else if (pt.part === 'torso') v *= mods.bobMul;
        st.y = v;
      } else if (ch === 'scaleX') {
        st.scaleX = v;
      } else if (ch === 'scaleY') {
        st.scaleY = v;
      }
    }
  }
}

