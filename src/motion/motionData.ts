/**
 * motionData.ts — the semantic motion database for Kiki & Husky.
 *
 * Everything here is data. The KeyframeEngine (KeyframeEngine.ts) samples it;
 * CharacterMotion (CharacterMotion.ts) exposes the semantic API.
 *
 * Track keyframes were validated with an offline renderer before being
 * encoded here (see workspace/ringo-motion/render_cycle.py). Leg cycles use
 * cosine easing between keys — the same easing the engine applies.
 *
 * Conventions:
 * - Cycles: keys use phase 0..1, loop forever, foot contacts in `contacts`.
 * - One-shots: keys use milliseconds, play once, then the base motion resumes.
 * - Angles are degrees, clockwise-positive (Phaser convention).
 *   Rigs face RIGHT at scaleX=1; CharacterMotion mirrors for left.
 * - '@root' is a pseudo-part: the character's inner container (hop/slide).
 * - Terrain never needs new art: TerrainMod multipliers reshape cycles live.
 */
import type {
  Channel, CharacterId, CycleDef, IdleBehaviorId, MotionId,
  OneShotDef, PartTrack, ReactionId, TerrainId, TerrainMod,
} from './motionTypes';

/* ---------------------------------------------------------------- */

function trk(part: string, channel: Channel, keys: Array<[number, number]>): PartTrack {
  return { part, tracks: [{ channel, keys: keys.map(([t, v]) => ({ t, v })) }] };
}

/** Shift every key's phase by `phase` (for diagonal gait pairs). */
/** Cosine-interpolate the ORIGINAL (unshifted) keys at phase t. */
function sampleOrig(keys: Array<{ t: number; v: number }>, t: number): number {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  for (let i = 0; i < n - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      const u = span <= 0 ? 0 : (t - a.t) / span;
      const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
      return a.v + (b.v - a.v) * e;
    }
  }
  return keys[n - 1].v;
}

function phaseShift(tracks: PartTrack[], phase: number): PartTrack[] {
  return tracks.map((pt) => ({
    part: pt.part,
    tracks: pt.tracks.map((tr) => {
      const shifted = tr.keys
        .map((k) => ({ t: (k.t + phase) % 1, v: k.v }))
        .sort((a, b) => a.t - b.t);
      // Open the loop: a shifted cycle may not land a key exactly on t=0.
      // Sample the original track at the wrapped phase so the cycle starts
      // at the correct value instead of clamping.
      if (shifted[0].t > 1e-9) {
        shifted.unshift({ t: 0, v: sampleOrig(tr.keys, (1 - phase) % 1) });
      }
      // Close the loop: without a key at t=1 the sampler would hold the
      // last key's value flat across the wrap (a visible hitch). The closing
      // key carries the t=0 value so the cycle eases into the wrap.
      const last = shifted[shifted.length - 1];
      if (last.t < 1 - 1e-9) shifted.push({ t: 1, v: shifted[0].v });
      return { channel: tr.channel, keys: shifted };
    }),
  }));
}

const LEG_SWING: Array<[number, number]> =
  [[0, 20], [0.25, -2], [0.5, -24], [0.75, 12], [1, 20]];
const LEG_LIFT: Array<[number, number]> =
  [[0, 0], [0.5, 0], [0.75, -7], [1, 0]];

function trotLegs(aLegs: string[], bLegs: string[]): PartTrack[] {
  const out: PartTrack[] = [];
  for (const p of aLegs) {
    out.push(trk(p, 'angle', LEG_SWING), trk(p, 'y', LEG_LIFT));
  }
  for (const pt of phaseShift(
    [...bLegs.flatMap((p) => [trk(p, 'angle', LEG_SWING), trk(p, 'y', LEG_LIFT)])], 0.5)) {
    out.push(pt);
  }
  return out;
}

const GALLOP_SWING: Array<[number, number]> =
  [[0, 32], [0.3, -10], [0.55, -34], [0.8, 20], [1, 32]];
const GALLOP_LIFT: Array<[number, number]> =
  [[0, 0], [0.55, 0], [0.8, -9], [1, 0]];

function gallopLegs(front: string[], back: string[], ampF: number, ampB: number): PartTrack[] {
  const sc = (keys: Array<[number, number]>, amp: number): Array<[number, number]> =>
    keys.map(([t, v]) => [t, (v * amp) / 32] as [number, number]);
  const out: PartTrack[] = [];
  for (const p of front) out.push(trk(p, 'angle', sc(GALLOP_SWING, ampF)), trk(p, 'y', GALLOP_LIFT));
  for (const pt of phaseShift(
    [...back.flatMap((p) => [trk(p, 'angle', sc(GALLOP_SWING, ampB)), trk(p, 'y', GALLOP_LIFT)])], 0.45)) {
    out.push(pt);
  }
  return out;
}

/* ---------------------------------------------------------------- */
/* Cycles                                                            */
/* ---------------------------------------------------------------- */

export const CYCLES: Record<string, CycleDef> = {
  'kiki-trot': {
    kind: 'cycle', id: 'kiki-trot', rig: 'kiki-trot', periodMs: 600,
    tracks: [
      ...trotLegs(['legFL', 'legBR'], ['legFR', 'legBL']),
      trk('torso', 'y', [[0, 0], [0.25, -3.5], [0.5, 0], [0.75, -3.5], [1, 0]]),
      trk('torso', 'angle', [[0, 1.5], [0.5, -1.5], [1, 1.5]]),
      trk('earNear', 'angle', [[0, 0], [0.25, 5], [0.5, 0], [0.75, 5], [1, 0]]),
      trk('earFar', 'angle', [[0, 0], [0.25, -5], [0.5, 0], [0.75, -5], [1, 0]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL' }, { phase: 0, paw: 'legBR' },
      { phase: 0.5, paw: 'legFR' }, { phase: 0.5, paw: 'legBL' },
    ],
  },

  'kiki-run': {
    kind: 'cycle', id: 'kiki-run', rig: 'kiki-run', periodMs: 440,
    tracks: [
      ...gallopLegs(['legFL', 'legFR'], ['legBL', 'legBR'], 32, 34),
      trk('torso', 'y', [[0, -2], [0.35, -7], [0.6, 0], [1, -2]]),
      trk('torso', 'angle', [[0, 4], [0.35, 0], [0.6, -4], [1, 4]]),
      trk('earNear', 'angle', [[0, -6], [0.5, 4], [1, -6]]),
      trk('earFar', 'angle', [[0, -6], [0.5, 4], [1, -6]]),
    ],
    contacts: [
      { phase: 0.08, paw: 'legFL' }, { phase: 0.08, paw: 'legFR' },
      { phase: 0.55, paw: 'legBL' }, { phase: 0.55, paw: 'legBR' },
    ],
  },

  'kiki-idle': {
    kind: 'cycle', id: 'kiki-idle', rig: 'kiki-idle', periodMs: 2600,
    tracks: [
      trk('torso', 'scaleY', [[0, 1], [0.5, 1.03], [1, 1]]),
      trk('torso', 'scaleX', [[0, 1], [0.5, 0.992], [1, 1]]),
      trk('head', 'y', [[0, 0], [0.5, -1.2], [1, 0]]),
      trk('earNear', 'angle', [[0, 0], [0.5, 2], [1, 0]]),
    ],
    contacts: [],
  },

  'husky-idle': {
    kind: 'cycle', id: 'husky-idle', rig: 'husky-idle', periodMs: 2800,
    tracks: [
      trk('torso', 'scaleY', [[0, 1], [0.5, 1.025], [1, 1]]),
      trk('tail', 'angle', [[0, -5], [0.5, 6], [1, -5]]),
      trk('head', 'y', [[0, 0], [0.5, -1], [1, 0]]),
    ],
    contacts: [],
  },

  'husky-steady': {
    kind: 'cycle', id: 'husky-steady', rig: 'husky-race', periodMs: 560,
    tracks: [
      ...trotLegs(['legFL', 'legBR'], ['legFR', 'legBL']),
      trk('torso', 'y', [[0, 0], [0.25, -4], [0.5, 0], [0.75, -4], [1, 0]]),
      trk('torso', 'angle', [[0, 2], [0.5, -2], [1, 2]]),
      trk('tail', 'angle', [[0, 0], [0.25, 8], [0.5, 0], [0.75, 8], [1, 0]]),
      trk('earNear', 'angle', [[0, -4], [0.5, 3], [1, -4]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL' }, { phase: 0, paw: 'legBR' },
      { phase: 0.5, paw: 'legFR' }, { phase: 0.5, paw: 'legBL' },
    ],
  },

  'husky-fast': {
    kind: 'cycle', id: 'husky-fast', rig: 'husky-race', periodMs: 440,
    tracks: [
      ...gallopLegs(['legFL', 'legFR'], ['legBL', 'legBR'], 32, 34),
      trk('torso', 'y', [[0, -2], [0.35, -7], [0.6, 0], [1, -2]]),
      trk('torso', 'angle', [[0, 4], [0.35, 0], [0.6, -4], [1, 4]]),
      trk('tail', 'angle', [[0, -8], [0.5, 8], [1, -8]]),
      trk('earNear', 'angle', [[0, -8], [0.5, 2], [1, -8]]),
      trk('earFar', 'angle', [[0, -8], [0.5, 2], [1, -8]]),
    ],
    contacts: [
      { phase: 0.08, paw: 'legFL' }, { phase: 0.08, paw: 'legFR' },
      { phase: 0.55, paw: 'legBL' }, { phase: 0.55, paw: 'legBR' },
    ],
  },

  'husky-turbo': {
    kind: 'cycle', id: 'husky-turbo', rig: 'husky-race', periodMs: 360,
    tracks: [
      ...gallopLegs(['legFL', 'legFR'], ['legBL', 'legBR'], 38, 40),
      trk('torso', 'y', [[0, -3], [0.35, -8], [0.6, -1], [1, -3]]),
      // baked-in forward lean (+8) + gallop pitch
      trk('torso', 'angle', [[0, 12], [0.35, 8], [0.6, 4], [1, 12]]),
      trk('tail', 'angle', [[0, -14], [0.5, -2], [1, -14]]),
      trk('earNear', 'angle', [[0, -12], [0.5, -4], [1, -12]]),
      trk('earFar', 'angle', [[0, -12], [0.5, -4], [1, -12]]),
    ],
    contacts: [
      { phase: 0.08, paw: 'legFL' }, { phase: 0.08, paw: 'legFR' },
      { phase: 0.55, paw: 'legBL' }, { phase: 0.55, paw: 'legBR' },
    ],
  },
};


/* ---------------------------------------------------------------- */
/* Gait variants (production motion pass)                            */
/* ---------------------------------------------------------------- */

/** Walk-cycle leg helper with explicit swing/lift per diagonal pair. */
function gaitLegs(pairs: Array<{ legs: string[]; swing: number; lift: number; shift: number }>): PartTrack[] {
  const out: PartTrack[] = [];
  for (const g of pairs) {
    const sw: Array<[number, number]> = [
      [0, g.swing], [0.25, -g.swing * 0.1], [0.5, -g.swing], [0.75, g.swing * 0.6], [1, g.swing],
    ];
    const lf: Array<[number, number]> = [[0, 0], [0.5, 0], [0.75, g.lift], [1, 0]];
    const pts = g.legs.flatMap((lp) => [trk(lp, 'angle', sw), trk(lp, 'y', lf)]);
    out.push(...(g.shift ? phaseShift(pts, g.shift) : pts));
  }
  return out;
}

const EXTRA_CYCLES: Record<string, CycleDef> = {
  'kiki-careful': {
    kind: 'cycle', id: 'kiki-careful', rig: 'kiki-trot', periodMs: 900,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 14, lift: -4, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 14, lift: -4, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 0], [0.25, -2], [0.5, 0], [0.75, -2], [1, 0]]),
      trk('torso', 'angle', [[0, 1], [0.5, -1], [1, 1]]),
      trk('earNear', 'angle', [[0, 0], [0.5, 3], [1, 0]]),
      trk('earFar', 'angle', [[0, 0], [0.5, -3], [1, 0]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'plant' }, { phase: 0, paw: 'legBR', beat: 'plant' },
      { phase: 0.5, paw: 'legFR', beat: 'plant' }, { phase: 0.5, paw: 'legBL', beat: 'plant' },
    ],
    contactNotes: 'CAREFUL WALK - 900ms/stride. Beat 1: FL+BR plant. Beat 2: FR+BL plant. Short deliberate steps; FX: small puffs, soft step sounds.',
  },

  'kiki-sniff-walk': {
    kind: 'cycle', id: 'kiki-sniff-walk', rig: 'kiki-trot', periodMs: 800,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 18, lift: -6, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 18, lift: -6, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 1], [0.25, -2], [0.5, 1], [0.75, -2], [1, 1]]),
      trk('torso', 'angle', [[0, 6], [0.5, 4], [1, 6]]),
      trk('earNear', 'angle', [[0, -4], [0.5, 2], [1, -4]]),
      trk('earFar', 'angle', [[0, -4], [0.5, 2], [1, -4]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'plant' }, { phase: 0, paw: 'legBR', beat: 'plant' },
      { phase: 0.5, paw: 'legFR', beat: 'plant' }, { phase: 0.5, paw: 'legBL', beat: 'plant' },
    ],
    contactNotes: 'SNIFF WALK - 800ms/stride. Diagonal pairs, nose held low (torso +6deg baked); normal prints/puffs.',
  },

  'kiki-deep-snow': {
    kind: 'cycle', id: 'kiki-deep-snow', rig: 'kiki-trot', periodMs: 950,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 20, lift: -16, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 18, lift: -11, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 0], [0.25, -6], [0.5, 0], [0.75, -6], [1, 0]]),
      trk('torso', 'angle', [[0, 2], [0.5, -2], [1, 2]]),
      trk('earNear', 'angle', [[0, 0], [0.25, 6], [0.5, 0], [0.75, 6], [1, 0]]),
      trk('earFar', 'angle', [[0, 0], [0.25, -6], [0.5, 0], [0.75, -6], [1, 0]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'heave-plant' }, { phase: 0, paw: 'legBR', beat: 'heave-plant' },
      { phase: 0.5, paw: 'legFR', beat: 'heave-plant' }, { phase: 0.5, paw: 'legBL', beat: 'heave-plant' },
    ],
    contactNotes: 'DEEP SNOW - 950ms/stride. High-step heaves (front lift x2.3); each plant = deep puff + larger print + effort sound.',
  },

  'kiki-ice-walk': {
    kind: 'cycle', id: 'kiki-ice-walk', rig: 'kiki-trot', periodMs: 750,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL'], swing: 10, lift: -3, shift: 0 },
        { legs: ['legBR'], swing: 10, lift: -3, shift: 0.25 },
        { legs: ['legFR'], swing: 10, lift: -3, shift: 0.5 },
        { legs: ['legBL'], swing: 10, lift: -3, shift: 0.75 },
      ]),
      trk('torso', 'y', [[0, 2], [1, 2]]),
      trk('torso', 'angle', [[0, 1], [0.5, -1], [1, 1]]),
      trk('earNear', 'angle', [[0, -5], [0.5, -2], [1, -5]]),
      trk('earFar', 'angle', [[0, -5], [0.5, -2], [1, -5]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'tap' },
      { phase: 0.25, paw: 'legBR', beat: 'tap' },
      { phase: 0.5, paw: 'legFR', beat: 'tap' },
      { phase: 0.75, paw: 'legBL', beat: 'tap' },
    ],
    contactNotes: 'ICE WALK - 750ms/stride. Four quick taps FL>BR>FR>BL, low crouch; tiny sparkles per tap; slip may interrupt (slipChance).',
  },

  'kiki-uphill': {
    kind: 'cycle', id: 'kiki-uphill', rig: 'kiki-trot', periodMs: 700,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 16, lift: -6, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 16, lift: -6, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 0], [0.25, -3], [0.5, 0], [0.75, -3], [1, 0]]),
      trk('torso', 'angle', [[0, 9], [0.5, 7], [1, 9]]),
      trk('earNear', 'angle', [[0, -3], [0.5, 3], [1, -3]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'dig-plant' }, { phase: 0, paw: 'legBR', beat: 'dig-plant' },
      { phase: 0.5, paw: 'legFR', beat: 'dig-plant' }, { phase: 0.5, paw: 'legBL', beat: 'dig-plant' },
    ],
    contactNotes: 'UPHILL - 700ms/stride. Forward lean (+8deg baked), shorter stride, digging plants; effort puffs.',
  },

  'kiki-downhill': {
    kind: 'cycle', id: 'kiki-downhill', rig: 'kiki-trot', periodMs: 650,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 24, lift: -5, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 24, lift: -5, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 0], [0.5, -2], [1, 0]]),
      trk('torso', 'angle', [[0, -6], [0.5, -4], [1, -6]]),
      trk('earNear', 'angle', [[0, 4], [0.5, -2], [1, 4]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'brake-plant' }, { phase: 0, paw: 'legBR', beat: 'brake-plant' },
      { phase: 0.5, paw: 'legFR', beat: 'brake-plant' }, { phase: 0.5, paw: 'legBL', beat: 'brake-plant' },
    ],
    contactNotes: 'DOWNHILL - 650ms/stride. Braking posture (lean back), long controlled stride; scrape puffs on plants.',
  },

  'kiki-bridge-walk': {
    kind: 'cycle', id: 'kiki-bridge-walk', rig: 'kiki-trot', periodMs: 850,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 12, lift: -5, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 12, lift: -5, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 0], [0.25, -1.5], [0.5, 0], [0.75, -1.5], [1, 0]]),
      trk('torso', 'angle', [[0, 2], [0.25, -2], [0.5, 2], [0.75, -2], [1, 2]]),
      trk('earNear', 'angle', [[0, -4], [0.5, 0], [1, -4]]),
      trk('earFar', 'angle', [[0, -4], [0.5, 0], [1, -4]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'careful-plant' }, { phase: 0, paw: 'legBR', beat: 'careful-plant' },
      { phase: 0.5, paw: 'legFR', beat: 'careful-plant' }, { phase: 0.5, paw: 'legBL', beat: 'careful-plant' },
    ],
    contactNotes: 'BRIDGE - 850ms/stride. Careful paw placement, small stride, subtle balance sway; hollow footfall sounds.',
  },

  'husky-walk': {
    kind: 'cycle', id: 'husky-walk', rig: 'husky-race', periodMs: 700,
    tracks: [
      ...gaitLegs([
        { legs: ['legFL', 'legBR'], swing: 18, lift: -6, shift: 0 },
        { legs: ['legFR', 'legBL'], swing: 18, lift: -6, shift: 0.5 },
      ]),
      trk('torso', 'y', [[0, 0], [0.25, -3], [0.5, 0], [0.75, -3], [1, 0]]),
      trk('torso', 'angle', [[0, 1.5], [0.5, -1.5], [1, 1.5]]),
      trk('tail', 'angle', [[0, -4], [0.5, 5], [1, -4]]),
      trk('earNear', 'angle', [[0, -2], [0.5, 2], [1, -2]]),
    ],
    contacts: [
      { phase: 0, paw: 'legFL', beat: 'plant' }, { phase: 0, paw: 'legBR', beat: 'plant' },
      { phase: 0.5, paw: 'legFR', beat: 'plant' }, { phase: 0.5, paw: 'legBL', beat: 'plant' },
    ],
    contactNotes: 'HUSKY WALK - 700ms/stride. Efficient, experienced trot; confident and unhurried - never frantic.',
  },
};

for (const [k, v] of Object.entries(EXTRA_CYCLES)) CYCLES[k] = v;

/** Paw-contact timing for the pass-1 cycles (pass-2 cycles carry contactNotes inline). */
const CONTACT_NOTES: Record<string, string> = {
  'kiki-trot': 'TROT - 600ms/stride. Beat 1 (phase 0): FL+BR plant. Beat 2 (phase 0.5): FR+BL plant. Diagonal pairs; FX: puff + print per plant.',
  'kiki-run': 'RUN (GALLOP) - 440ms/stride. Phase 0.08: FL+FR front plant. Phase 0.55: BL+BR rear plant. Gathered flight between; FX: bigger puffs.',
  'kiki-idle': 'IDLE - 2600ms breathing loop. No foot contacts (feet planted).',
  'husky-idle': 'IDLE - 2800ms breathing loop. No foot contacts.',
  'husky-steady': 'RACE STEADY - 560ms/stride. Beat 1: FL+BR plant. Beat 2: FR+BL plant. Spray per contact x1.',
  'husky-fast': 'RACE FAST - 440ms/stride. Phase 0.08: FL+FR plant. Phase 0.55: BL+BR plant. Spray per contact x1.',
  'husky-turbo': 'RACE TURBO - 360ms/stride. Same gallop contacts as fast, 22% quicker + baked lean. Spray per contact x2.',
};
for (const [k, v] of Object.entries(CONTACT_NOTES)) {
  const c = CYCLES[k];
  if (c && !c.contactNotes) c.contactNotes = v;
}

/* ---------------------------------------------------------------- */
/* One-shots                                                         */
/* ---------------------------------------------------------------- */

function os(id: string, rig: string, durationMs: number,
  tracks: PartTrack[], extra?: Partial<OneShotDef>): OneShotDef {
  return { kind: 'oneshot', id, rig, durationMs, tracks, ...extra };
}

export const ONESHOTS: Record<string, OneShotDef> = {
  /* --- locomotion transitions --- */
  'anticipate': os('anticipate', '*', 200, [
    trk('torso', 'scaleY', [[0, 1], [200, 0.93]]),
    trk('torso', 'scaleX', [[0, 1], [200, 1.05]]),
    trk('torso', 'y', [[0, 0], [200, 3]]),
  ]),
  'settle': os('settle', '*', 700, [
    trk('torso', 'angle', [[0, 3], [200, -2], [450, 1], [700, 0]]),
    trk('torso', 'y', [[0, -2], [700, 0]]),
  ]),
  /* --- idle life --- */
  'blink': os('blink', '*', 150, [], {
    frameSwaps: [{ part: 'head', frame: 'headClosed', atMs: 20, durMs: 100 }],
  }),
  'ear-twitch': os('ear-twitch', '*', 350, [
    trk('earNear', 'angle', [[0, 0], [80, -14], [180, 6], [350, 0]]),
  ]),
  'head-look': os('head-look', '*', 1300, [
    trk('head', 'angle', [[0, 0], [400, 14], [900, 14], [1300, 0]]),
  ]),
  'sniff': os('sniff', '*', 1500, [
    trk('head', 'angle', [[0, 0], [400, -16], [1100, -16], [1500, 0]]),
    trk('head', 'y', [[0, 0], [400, 6], [1100, 6], [1500, 0]]),
    trk('torso', 'angle', [[0, 0], [400, 4], [1100, 4], [1500, 0]]),
  ]),
  'paw-adjust': os('paw-adjust', '*', 700, [
    trk('legFL', 'angle', [[0, 0], [250, 24], [500, 0], [700, 0]]),
    trk('legFL', 'y', [[0, 0], [250, -6], [500, 0], [700, 0]]),
  ]),
  'shake-snow': os('shake-snow', '*', 900, [
    trk('torso', 'angle', [[0, 0], [150, 6], [300, -6], [450, 6], [600, -6], [750, 3], [900, 0]]),
    trk('head', 'angle', [[0, 0], [150, -4], [300, 4], [450, -4], [600, 4], [900, 0]]),
  ], { emitAt: [{ ms: 300, event: 'shake' }] }),
  'look-back': os('look-back', '*', 1300, [
    trk('head', 'angle', [[0, 0], [400, -18], [900, -18], [1300, 0]]),
  ]),
  /* --- reactions --- */
  'curious': os('curious', '*', 800, [
    trk('head', 'angle', [[0, 0], [300, 14], [650, 14], [800, 0]]),
  ]),
  'happy': os('happy', '*', 600, [
    trk('@root', 'y', [[0, 0], [200, -12], [600, 0]]),
    trk('head', 'angle', [[0, 0], [200, -8], [600, 0]]),
  ], { emitAt: [{ ms: 200, event: 'hop' }] }),
  'surprised': os('surprised', '*', 800, [
    trk('head', 'angle', [[0, 0], [150, -10], [600, -10], [800, 0]]),
    trk('earNear', 'angle', [[0, 0], [150, -6], [600, -6], [800, 0]]),
    trk('earFar', 'angle', [[0, 0], [150, -6], [600, -6], [800, 0]]),
  ]),
  'think': os('think', '*', 1000, [
    trk('head', 'angle', [[0, 0], [350, -13], [800, -13], [1000, 0]]),
  ]),
  'proud': os('proud', '*', 900, [
    trk('torso', 'angle', [[0, 0], [300, -5], [700, -5], [900, 0]]),
    trk('head', 'angle', [[0, 0], [300, -8], [700, -8], [900, 0]]),
  ]),
  'celebrate': os('celebrate', '*', 650, [
    trk('@root', 'y', [[0, 0], [250, -26], [650, 0]]),
    trk('head', 'angle', [[0, 0], [250, -8], [650, 0]]),
  ], { emitAt: [{ ms: 250, event: 'hop' }] }),
  'confused': os('confused', '*', 900, [
    trk('head', 'angle', [[0, 0], [300, 12], [700, 12], [900, 0]]),
    trk('legFL', 'angle', [[0, 0], [300, 18], [700, 18], [900, 0]]),
  ]),
  'ask': os('ask', '*', 1000, [
    trk('torso', 'angle', [[0, 0], [350, 6], [800, 6], [1000, 0]]),
    trk('head', 'angle', [[0, 0], [350, 12], [800, 12], [1000, 0]]),
  ]),
  'listen': os('listen', '*', 1200, [
    trk('earNear', 'angle', [[0, 0], [300, -6], [900, -6], [1200, 0]]),
    trk('earFar', 'angle', [[0, 0], [300, -6], [900, -6], [1200, 0]]),
  ]),
  'agree': os('agree', '*', 720, [
    trk('head', 'y', [[0, 0], [180, -5], [360, 0], [540, -5], [720, 0]]),
  ]),
  'unsure': os('unsure', '*', 1000, [
    trk('head', 'angle', [[0, 0], [350, 12], [750, 12], [1000, 0]]),
    trk('legFL', 'angle', [[0, 0], [350, 16], [750, 16], [1000, 0]]),
    trk('@root', 'x', [[0, 0], [350, -6], [750, -6], [1000, 0]]),
  ]),
  'brave': os('brave', '*', 900, [
    trk('torso', 'angle', [[0, 0], [300, -6], [700, -6], [900, 0]]),
    trk('head', 'angle', [[0, 0], [300, -10], [700, -10], [900, 0]]),
    trk('earNear', 'angle', [[0, 0], [300, -6], [700, -6], [900, 0]]),
  ]),
  'lets-try': os('lets-try', '*', 700, [
    trk('head', 'y', [[0, 0], [200, -5], [400, 0], [700, 0]]),
    trk('@root', 'y', [[0, 0], [250, -10], [700, 0]]),
  ], { emitAt: [{ ms: 250, event: 'hop' }] }),
  'greeting': os('greeting', '*', 900, [
    trk('@root', 'y', [[0, 0], [200, -10], [450, 0], [650, -10], [900, 0]]),
    trk('tail', 'angle', [[0, 0], [150, 14], [300, -14], [450, 14], [600, -14], [750, 0], [900, 0]]),
  ]),
  'encourage': os('encourage', '*', 800, [
    trk('head', 'angle', [[0, 0], [250, 14], [600, 14], [800, 0]]),
    trk('@root', 'y', [[0, 0], [250, -8], [800, 0]]),
  ]),
  'look-kiki': os('look-kiki', '*', 900, [
    trk('head', 'angle', [[0, 0], [300, 16], [700, 16], [900, 0]]),
  ]),
  /* --- race --- */
  'deep-snow-bound': os('deep-snow-bound', '*', 850, [
    trk('@root', 'y', [[0, 0], [350, -34], [850, 0]]),
    trk('legFL', 'angle', [[0, 0], [350, -20], [850, 0]]),
    trk('legFR', 'angle', [[0, 0], [350, -20], [850, 0]]),
    trk('legBL', 'angle', [[0, 0], [350, 18], [850, 0]]),
    trk('legBR', 'angle', [[0, 0], [350, 18], [850, 0]]),
  ], { emitAt: [{ ms: 700, event: 'shake' }] }),
  'recover-shake': os('recover-shake', '*', 900, [
    trk('torso', 'angle', [[0, 0], [150, 8], [300, -8], [450, 8], [600, -8], [750, 4], [900, 0]]),
    trk('@root', 'y', [[0, 0], [200, -8], [500, 0], [900, 0]]),
  ], { emitAt: [{ ms: 250, event: 'shake' }] }),
  'slip': os('slip', '*', 450, [
    trk('legFL', 'angle', [[0, 0], [150, 30], [450, 0]]),
    trk('legBL', 'angle', [[0, 0], [150, -30], [450, 0]]),
    trk('legFR', 'angle', [[0, 0], [150, 20], [450, 0]]),
    trk('legBR', 'angle', [[0, 0], [150, -20], [450, 0]]),
    trk('torso', 'angle', [[0, 0], [150, 8], [450, 0]]),
    trk('@root', 'x', [[0, 0], [150, 14], [450, 0]]),
  ], { emitAt: [{ ms: 150, event: 'slip' }] }),
  /* looping shiver overlay for windy-pass (played as overlay loop) */
  'shiver-loop': os('shiver-loop', '*', 240, [
    trk('torso', 'angle', [[0, -1.5], [120, 1.5], [240, -1.5]]),
    trk('head', 'angle', [[0, 1], [120, -1], [240, 1]]),
  ]),
  /* --- production pass: turns, jumps, race, expressions --- */
  'turn': os('turn', '*', 700, [
    // look -> weight shift -> squash (flip masked at 450ms) -> recover
    trk('torso', 'x', [[0, 0], [200, -8], [450, -4], [700, 0]]),
    trk('torso', 'angle', [[0, 0], [200, 6], [450, -6], [700, 0]]),
    trk('torso', 'scaleY', [[0, 1], [450, 0.9], [700, 1]]),
    trk('torso', 'scaleX', [[0, 1], [450, 1.04], [700, 1]]),
    trk('legFL', 'angle', [[0, 0], [300, 16], [700, 0]]),
    trk('legFR', 'angle', [[0, 0], [300, 16], [700, 0]]),
    trk('earNear', 'angle', [[0, 0], [200, -8], [700, 0]]),
    trk('earFar', 'angle', [[0, 0], [200, -8], [700, 0]]),
  ]),
  'jump': os('jump', '*', 700, [
    // crouch -> launch -> tucked airborne -> (auto-chains into 'land')
    trk('torso', 'scaleY', [[0, 1], [150, 0.9], [300, 1.02], [700, 1]]),
    trk('torso', 'y', [[0, 0], [150, 4], [300, 2], [700, 0]]),
    trk('torso', 'angle', [[0, 0], [300, -6], [500, -6], [700, 0]]),
    trk('legFL', 'angle', [[0, 0], [150, 18], [300, -14], [500, -14], [700, 0]]),
    trk('legFR', 'angle', [[0, 0], [150, 18], [300, -14], [500, -14], [700, 0]]),
    trk('legBL', 'angle', [[0, 0], [150, -14], [300, 12], [500, 12], [700, 0]]),
    trk('legBR', 'angle', [[0, 0], [150, -14], [300, 12], [500, 12], [700, 0]]),
    trk('earNear', 'angle', [[0, 0], [300, -8], [700, 0]]),
    trk('earFar', 'angle', [[0, 0], [300, -8], [700, 0]]),
    trk('@root', 'y', [[0, 0], [150, 0], [300, -30], [500, -30], [700, 0]]),
  ], { emitAt: [{ ms: 150, event: 'hop' }] }),
  'land': os('land', '*', 450, [
    // landing compression: squash, splay, ear flop, recover
    trk('torso', 'scaleY', [[0, 1.02], [100, 0.86], [300, 0.97], [450, 1]]),
    trk('torso', 'scaleX', [[0, 1], [100, 1.06], [450, 1]]),
    trk('torso', 'y', [[0, 0], [100, 5], [450, 0]]),
    trk('torso', 'angle', [[0, -4], [100, 3], [450, 0]]),
    trk('legFL', 'angle', [[0, 0], [100, 22], [450, 0]]),
    trk('legFR', 'angle', [[0, 0], [100, 22], [450, 0]]),
    trk('legBL', 'angle', [[0, 0], [100, -20], [450, 0]]),
    trk('legBR', 'angle', [[0, 0], [100, -20], [450, 0]]),
    trk('earNear', 'angle', [[0, 0], [100, 8], [450, 0]]),
    trk('earFar', 'angle', [[0, 0], [100, 8], [450, 0]]),
  ], { emitAt: [{ ms: 100, event: 'landed' }] }),
  'race-bump': os('race-bump', '*', 500, [
    trk('torso', 'x', [[0, 0], [150, 12], [500, 0]]),
    trk('torso', 'angle', [[0, 0], [150, 10], [350, -6], [500, 0]]),
    trk('tail', 'angle', [[0, 0], [150, 16], [500, 0]]),
    trk('earNear', 'angle', [[0, 0], [150, -10], [500, 0]]),
    trk('earFar', 'angle', [[0, 0], [150, -10], [500, 0]]),
    trk('legFL', 'angle', [[0, 0], [150, 14], [500, 0]]),
    trk('legBL', 'angle', [[0, 0], [150, -14], [500, 0]]),
  ], { emitAt: [{ ms: 200, event: 'shake' }] }),
  'play-challenge': os('play-challenge', '*', 900, [
    // husky play bow: front dips, rear stays up, tail wags
    trk('torso', 'angle', [[0, 0], [300, 14], [700, 14], [900, 0]]),
    trk('torso', 'y', [[0, 0], [300, 6], [700, 6], [900, 0]]),
    trk('legFL', 'angle', [[0, 0], [300, 20], [700, 20], [900, 0]]),
    trk('legFR', 'angle', [[0, 0], [300, 20], [700, 20], [900, 0]]),
    trk('tail', 'angle', [[0, 0], [200, 14], [350, -14], [500, 14], [650, -14], [800, 0], [900, 0]]),
    trk('earNear', 'angle', [[0, 0], [300, -6], [900, 0]]),
  ]),
  'alert': os('alert', '*', 700, [
    trk('earNear', 'angle', [[0, 0], [200, -10], [600, -10], [700, 0]]),
    trk('earFar', 'angle', [[0, 0], [200, -10], [600, -10], [700, 0]]),
    trk('torso', 'angle', [[0, 0], [200, -3], [600, -3], [700, 0]]),
    trk('torso', 'y', [[0, 0], [200, -2], [600, -2], [700, 0]]),
  ]),
  'focused': os('focused', '*', 900, [
    trk('earNear', 'angle', [[0, 0], [250, -6], [750, -6], [900, 0]]),
    trk('earFar', 'angle', [[0, 0], [250, -6], [750, -6], [900, 0]]),
    trk('torso', 'y', [[0, 0], [250, -2], [750, -2], [900, 0]]),
  ]),
  'excited': os('excited', '*', 600, [
    trk('@root', 'y', [[0, 0], [200, -16], [400, 0], [500, -10], [600, 0]]),
    trk('earNear', 'angle', [[0, 0], [200, -8], [600, 0]]),
    trk('earFar', 'angle', [[0, 0], [200, -8], [600, 0]]),
    trk('torso', 'angle', [[0, 0], [200, -4], [600, 0]]),
  ], { emitAt: [{ ms: 200, event: 'hop' }] }),

};

/* ---------------------------------------------------------------- */
/* Motion bindings: semantic MotionId -> rig + cycle + params         */
/* ---------------------------------------------------------------- */

export interface MotionBinding {
  char: CharacterId;
  rig: string;
  cycle: string;
  /** cycle speed multiplier (turbo runs the same gallop faster) */
  speedMul: number;
  /** static forward lean, degrees */
  lean: number;
}

export const MOTIONS: Record<Exclude<MotionId, CommandMotionId>, MotionBinding> = {
  'idle':           { char: 'kiki',  rig: 'kiki-idle',  cycle: 'kiki-idle',       speedMul: 1,    lean: 0 },
  'trot':           { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-trot',       speedMul: 1,    lean: 0 },
  'run':            { char: 'kiki',  rig: 'kiki-run',   cycle: 'kiki-run',        speedMul: 1,    lean: 0 },
  'careful':        { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-careful',    speedMul: 1,    lean: 0 },
  'sniff-walk':     { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-sniff-walk', speedMul: 1,    lean: 0 },
  'deep-snow-walk': { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-deep-snow',  speedMul: 1,    lean: 0 },
  'ice-walk':       { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-ice-walk',   speedMul: 1,    lean: 0 },
  'uphill-walk':    { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-uphill',     speedMul: 1,    lean: 0 },
  'downhill-walk':  { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-downhill',   speedMul: 1,    lean: 0 },
  'bridge-walk':    { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-bridge-walk',speedMul: 1,    lean: 0 },
  'race-steady':    { char: 'husky', rig: 'husky-race', cycle: 'husky-steady',    speedMul: 1,    lean: 0 },
  'race-fast':      { char: 'husky', rig: 'husky-race', cycle: 'husky-fast',      speedMul: 1,    lean: 0 },
  'race-turbo':     { char: 'husky', rig: 'husky-race', cycle: 'husky-turbo',     speedMul: 1,    lean: 0 },
  'race-turn':      { char: 'husky', rig: 'husky-race', cycle: 'husky-steady',    speedMul: 0.9,  lean: 14 },
  'race-slowdown':  { char: 'husky', rig: 'husky-race', cycle: 'husky-fast',      speedMul: 0.5,  lean: -6 },
  'husky-idle':     { char: 'husky', rig: 'husky-idle', cycle: 'husky-idle',      speedMul: 1,    lean: 0 },
  'husky-walk':     { char: 'husky', rig: 'husky-race', cycle: 'husky-walk',      speedMul: 1,    lean: 0 },
};

/**
 * Command motions: not steady states — CharacterMotion routes them to
 * overlays/transitions (jump, land, slip, recover, start, stop, turns,
 * look-back, race-celebrate). Scenes call them exactly like cycles.
 */
export type CommandMotionId =
  | 'start' | 'stop' | 'jump' | 'land' | 'slip' | 'recover'
  | 'turn-left' | 'turn-right' | 'look-back' | 'race-celebrate';

export function isCommandMotion(id: MotionId): id is CommandMotionId {
  return ([
    'start', 'stop', 'jump', 'land', 'slip', 'recover',
    'turn-left', 'turn-right', 'look-back', 'race-celebrate',
  ] as string[]).includes(id);
}

/** Which rig a character uses for reactions / idle behaviors. */
export const CHAR_IDLE_RIG: Record<CharacterId, string> = {
  kiki: 'kiki-idle',
  husky: 'husky-idle',
};

/** Reaction -> one-shot id (1:1 today; indirection lets art vary later). */
export const REACTIONS: Record<ReactionId, string> = {
  curious: 'curious', happy: 'happy', surprised: 'surprised', think: 'think',
  proud: 'proud', sniff: 'sniff', celebrate: 'celebrate', confused: 'confused',
  ask: 'ask', listen: 'listen', agree: 'agree', unsure: 'unsure',
  brave: 'brave', 'lets-try': 'lets-try',
  greeting: 'greeting', encourage: 'encourage', 'look-kiki': 'look-kiki',
  'play-challenge': 'play-challenge', alert: 'alert', focused: 'focused',
  excited: 'excited', slip: 'slip', recover: 'recover-shake', 'look-back': 'look-back',
};

/* ---------------------------------------------------------------- */
/* Terrain                                                           */
/* ---------------------------------------------------------------- */

export const TERRAINS: Record<TerrainId, TerrainMod> = {
  'normal-snow': { id: 'normal-snow' },
  'deep-snow':   { id: 'deep-snow', speedMul: 0.65, strideMul: 0.85, liftMul: 2.0, bobMul: 1.4 },
  'ice':         { id: 'ice', speedMul: 1.0, strideMul: 1.1, slipChance: 0.18 },
  'uphill':      { id: 'uphill', speedMul: 0.85, strideMul: 0.85, bodyPitch: -10 },
  'downhill':    { id: 'downhill', speedMul: 1.15, strideMul: 1.15, bodyPitch: 7 },
  'bridge':      { id: 'bridge', speedMul: 0.7, strideMul: 0.7 },
  'cave':        { id: 'cave', speedMul: 0.8, lookFreqMul: 2 },
  'windy-pass':  { id: 'windy-pass', bodyPitch: 5, shiver: true },
};

/* ---------------------------------------------------------------- */
/* Idle-life cadence: [minMs, maxMs] between triggers.               */
/* Breathe is the idle cycle itself; blink is the most frequent.     */
/* ---------------------------------------------------------------- */

export const IDLE_CADENCE: Record<IdleBehaviorId, [number, number]> = {
  'blink': [2500, 6000],
  'ear-twitch': [6000, 14000],
  'head-look': [8000, 16000],
  'sniff': [14000, 24000],
  'paw-adjust': [10000, 20000],
  'shake-snow': [25000, 45000],
  'look-back': [18000, 32000],
};

/* ---------------------------------------------------------------- */
/* Race                                                              */
/* ---------------------------------------------------------------- */

export const RACE = {
  /** Harness chest anchor on the husky-race rig, rig-root px rel. ground. */
  huskyHarnessAnchor: { x: 25, y: -82 },
  /** Trace line sags ~10px between anchor and sled front (Lennon draws). */
  traceSagPx: 10,
  /** Snow-spray is emitted from footstep events; turbo doubles the rate. */
  sprayPerContact: { 'race-steady': 1, 'race-fast': 1, 'race-turbo': 2 } as Record<string, number>,
};
