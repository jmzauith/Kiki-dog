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
function phaseShift(tracks: PartTrack[], phase: number): PartTrack[] {
  return tracks.map((pt) => ({
    part: pt.part,
    tracks: pt.tracks.map((tr) => ({
      channel: tr.channel,
      keys: tr.keys.map((k) => ({ t: (k.t + phase) % 1, v: k.v }))
        .sort((a, b) => a.t - b.t),
    })),
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

export const MOTIONS: Record<MotionId, MotionBinding> = {
  'idle':        { char: 'kiki',  rig: 'kiki-idle',  cycle: 'kiki-idle',   speedMul: 1, lean: 0 },
  'trot':        { char: 'kiki',  rig: 'kiki-trot',  cycle: 'kiki-trot',   speedMul: 1, lean: 0 },
  'run':         { char: 'kiki',  rig: 'kiki-run',   cycle: 'kiki-run',    speedMul: 1, lean: 0 },
  'race-steady': { char: 'husky', rig: 'husky-race', cycle: 'husky-steady', speedMul: 1, lean: 0 },
  'race-fast':   { char: 'husky', rig: 'husky-race', cycle: 'husky-fast',  speedMul: 1, lean: 0 },
  'race-turbo':  { char: 'husky', rig: 'husky-race', cycle: 'husky-turbo', speedMul: 1, lean: 0 },
};

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
