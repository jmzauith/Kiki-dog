/**
 * CharacterMotion.ts — the semantic character animation API.
 *
 * Scenes talk to Kiki & Husky ONLY through this class:
 *
 *   const kiki = new CharacterMotion(scene, 'kiki', x, y);
 *   kiki.transitionTo('trot');
 *   kiki.react('curious');
 *   kiki.setTerrain('deep-snow');
 *   kiki.turnTo(-1);
 *
 * No asset filenames, no frame indices, no tween juggling in scenes.
 * Lennon: integration guide is in docs/KIKI_HUSKY_MOTION_SYSTEM.md.
 *
 * How it works: each character is a paper-doll rig (atlas of body parts
 * sliced from the LOCKED canonical paintings). A tiny keyframe engine samples
 * authored tracks into part transforms every frame. Locomotion, one-shot
 * reactions, idle-life behaviors, terrain modifiers and the start/stop
 * state machine all compose here. Foot-contact events drive FX via FootFX.
 */
import Phaser from 'phaser';
import { RIGS } from './rigManifests';
import {
  CHAR_IDLE_RIG, CYCLES, IDLE_CADENCE, MOTIONS, ONESHOTS, RACE, REACTIONS, TERRAINS,
} from './motionData';
import {
  NEUTRAL_MODS, newPartState, resetPartState, sampleTracks,
} from './KeyframeEngine';
import type { PartState, SampleMods } from './KeyframeEngine';
import type {
  CharacterId, CycleDef, IdleBehaviorId, MotionEvent, MotionId,
  OneShotDef, ReactionId, TerrainId, TurnedData,
} from './motionTypes';
import type { CommandMotionId } from './motionData';
import type { RigDef } from './motionTypes';

/* ------------------------------------------------------------------ */
/* Asset setup (call once per scene)                                   */
/* ---------------------------------------------------------------- */

const framesAdded = new Set<string>();

/** Queue every rig atlas for load. Call from the scene's preload(). */
export function preloadMotion(scene: Phaser.Scene): void {
  for (const rig of Object.values(RIGS)) {
    for (const a of rig.atlases) {
      scene.load.svg(a.key, a.file, { width: a.width, height: a.height });
    }
  }
}

/** Slice atlas frames + build FX canvas textures. Call once in create(). Idempotent. */
export function createMotionAssets(scene: Phaser.Scene): void {
  for (const rig of Object.values(RIGS)) {
    for (const a of rig.atlases) {
      const tex = scene.textures.get(a.key);
      for (const [name, p] of Object.entries(rig.parts)) {
        if (p.atlas !== rig.atlases.indexOf(a)) continue;
        const k = `${a.key}:${name}`;
        if (!framesAdded.has(k)) {
          tex.add(name, 0, p.ax, p.ay, p.w, p.h);
          framesAdded.add(k);
        }
      }
    }
  }
  ensureFxTextures(scene);
}

function canvasTex(
  scene: Phaser.Scene, key: string, w: number, h: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

/** Painterly-matched FX sprites; runtime-generated like the world's textures. */
export function ensureFxTextures(scene: Phaser.Scene): void {
  // soft irregular snow puff
  canvasTex(scene, 'fx-puff', 48, 32, (ctx) => {
    const blobs: Array<[number, number, number, number]> = [
      [24, 20, 15, 0.8], [15, 22, 10, 0.65], [33, 22, 10, 0.65], [24, 14, 9, 0.55],
    ];
    for (const [cx, cy, r, a] of blobs) {
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    }
  });
  // paw print: pad + three toes, cool snow-shadow blue
  canvasTex(scene, 'fx-paw', 28, 28, (ctx) => {
    ctx.fillStyle = 'rgba(168,193,220,0.85)';
    ctx.beginPath(); ctx.ellipse(14, 19, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
    for (const [tx, ty] of [[7, 9], [14, 6], [21, 10]] as Array<[number, number]>) {
      ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
    }
  });
  // soft ground shadow
  canvasTex(scene, 'fx-shadow', 96, 24, (ctx) => {
    const g = ctx.createRadialGradient(48, 12, 2, 48, 12, 44);
    g.addColorStop(0, 'rgba(30,40,60,0.35)');
    g.addColorStop(1, 'rgba(30,40,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(48, 12, 44, 11, 0, 0, Math.PI * 2); ctx.fill();
  });
  // ice sparkle
  canvasTex(scene, 'fx-sparkle', 24, 24, (ctx) => {
    ctx.fillStyle = 'rgba(220,240,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(12, 2); ctx.lineTo(14, 10); ctx.lineTo(22, 12); ctx.lineTo(14, 14);
    ctx.lineTo(12, 22); ctx.lineTo(10, 14); ctx.lineTo(2, 12); ctx.lineTo(10, 10);
    ctx.closePath(); ctx.fill();
  });
}

/* ------------------------------------------------------------------ */
/* CharacterMotion                                                     */
/* ---------------------------------------------------------------- */

type TransState = 'steady' | 'anticipating' | 'speeding' | 'slowing' | 'settling' | 'turning';

interface Overlay {
  def: OneShotDef;
  t: number;
  mirror: boolean;
  onDone?: () => void;
  fired: Set<number>;
  /** first-class turn flip: run onFlip once when t passes flipAtMs */
  flipAtMs?: number;
  flipped?: boolean;
  onFlip?: () => void;
}

const LOCOMOTION: MotionId[] = [
  'trot', 'run', 'careful', 'sniff-walk', 'deep-snow-walk', 'ice-walk',
  'uphill-walk', 'downhill-walk', 'bridge-walk',
  'race-steady', 'race-fast', 'race-turbo', 'race-turn', 'race-slowdown',
  'husky-walk',
];
const isLocomotion = (m: MotionId): boolean => LOCOMOTION.includes(m);

export class CharacterMotion {
  /** Outer container: the scene positions this (feet at x/y). */
  readonly container: Phaser.GameObjects.Container;
  readonly events = new Phaser.Events.EventEmitter();

  private scene: Phaser.Scene;
  private charId: CharacterId;
  /** Inner container: hop/squash offsets ('@root'). */
  private body: Phaser.GameObjects.Container;

  private rigId = '';
  private rig!: RigDef;
  private partImgs = new Map<string, Phaser.GameObjects.Image>();
  private states = new Map<string, PartState>();
  private rootState: PartState = newPartState();
  /** states + '@root' (inner container) so overlays can hop/squash */
  private sampleMap = new Map<string, PartState>();

  private motion: Exclude<MotionId, CommandMotionId> = 'idle';
  private cycle!: CycleDef;
  private cycleId = '';
  private phase = 0;
  private lastPhase = 0;
  private speedScale = 1;
  private trans: TransState = 'steady';
  private transT = 0;
  private pendingMotion: Exclude<MotionId, CommandMotionId> | null = null;

  private overlay: Overlay | null = null;
  private terrain: TerrainId = 'normal-snow';
  private facing: 1 | -1 = 1;
  private shiverPhase = 0;

  private idleNext = new Map<IdleBehaviorId, number>();
  private mods: SampleMods = { ...NEUTRAL_MODS };

  constructor(scene: Phaser.Scene, charId: CharacterId, x: number, y: number) {
    this.scene = scene;
    this.charId = charId;
    this.container = scene.add.container(x, y);
    this.body = scene.add.container(0, 0);
    this.container.add(this.body);
    this.buildRig(CHAR_IDLE_RIG[charId]);
    // schedule first idle behaviors with jitter so two characters don't sync
    const now = scene.time.now;
    (Object.keys(IDLE_CADENCE) as IdleBehaviorId[]).forEach((b, i) => {
      const [lo, hi] = IDLE_CADENCE[b];
      this.idleNext.set(b, now + lo * 0.5 + Math.random() * (hi - lo) * 0.5 + i * 400);
    });
    this.applyMotion('idle');
  }

  /* ---------------- public API ---------------- */

  /** Hard switch of locomotion (Lennon: prefer transitionTo for game feel). */
  playMotion(id: MotionId): void {
    if (this.runCommand(id)) return;
    this.pendingMotion = null;
    this.trans = 'steady';
    this.applyMotion(id);
    this.speedScale = 1;
  }

  /**
   * Command motions are overlays/transitions, not steady states — scenes
   * call them exactly like cycles ('jump', 'slip', 'turn-left', ...).
   * Returns true when the id was a command (handled), false otherwise.
   */
  private runCommand(id: MotionId): id is CommandMotionId {
    switch (id) {
      case 'start': this.start(); return true;
      case 'stop': this.stopMoving(); return true;
      case 'jump': this.jump(); return true;
      case 'land': this.land(); return true;
      case 'slip': this.slipNow(); return true;
      case 'recover': this.recoverNow(); return true;
      case 'turn-left': this.turnTo(-1); return true;
      case 'turn-right': this.turnTo(1); return true;
      case 'look-back': this.react('look-back'); return true;
      case 'race-celebrate': this.react('celebrate'); return true;
      default: return false;
    }
  }

  /** Anticipation squash, then accelerate into `target` (default trot). */
  start(target: Exclude<MotionId, CommandMotionId> = 'trot'): void {
    if (isLocomotion(this.motion)) { this.transitionTo(target); return; }
    this.pendingMotion = target;
    this.startOverlay('anticipate', { onDone: () => this.beginSpeeding() });
    this.trans = 'anticipating';
  }

  /** Decelerate and settle to idle — the game-feel stop. */
  stopMoving(): void {
    if (!isLocomotion(this.motion)) return;
    this.pendingMotion = 'idle';
    this.trans = 'slowing';
    this.transT = 0;
  }

  /**
   * Ramp cycle speed back to full (e.g. after a slowdown, or a race start).
   * If given a different target, transitions to it instead.
   */
  accelerateTo(target?: Exclude<MotionId, CommandMotionId>): void {
    if (target && target !== this.motion) { this.transitionTo(target); return; }
    if (!isLocomotion(this.motion)) { this.start(); return; }
    this.trans = 'speeding';
    this.transT = this.speedScale * 600;
  }

  /** Jump one-shot; auto-chains into landing compression. */
  jump(): void {
    this.startOverlay('jump', { onDone: () => this.startOverlay('land') });
  }

  /** Landing compression one-shot (also auto-plays after jump()). */
  land(): void {
    this.startOverlay('land');
  }

  /** Ice slip one-shot, plays in place over any rig. */
  slipNow(): void {
    this.startOverlay('slip');
  }

  /** Recovery shake one-shot, plays in place over any rig. */
  recoverNow(): void {
    this.startOverlay('recover-shake');
  }

  /**
   * Eased motion change with real game feel:
   * idle->locomotion: anticipation squash, rig swap hidden mid-squash, acceleration ramp.
   * locomotion->idle: deceleration ramp, settle rock, then idle breathing.
   * locomotion->locomotion: quick anticipate + swap + ramp.
   */
  transitionTo(id: MotionId): void {
    if (this.runCommand(id)) return;
    if (id === this.motion && this.trans === 'steady') return;
    const fromLoc = isLocomotion(this.motion);
    const toLoc = isLocomotion(id);
    this.pendingMotion = id;
    if (!fromLoc && toLoc) {
      this.startOverlay('anticipate', { onDone: () => this.beginSpeeding() });
      this.trans = 'anticipating';
    } else if (fromLoc && !toLoc) {
      this.trans = 'slowing';
      this.transT = 0;
    } else if (fromLoc && toLoc) {
      this.startOverlay('anticipate', { onDone: () => this.beginSpeeding() });
      this.trans = 'anticipating';
    } else {
      this.applyMotion(id);
    }
  }

  /** One-shot reaction; safe anytime (pauses locomotion briefly for big ones). */
  react(id: ReactionId, opts?: { onDone?: () => void; mirror?: boolean }): void {
    const osId = REACTIONS[id];
    if (!osId) return;
    // Locomotion-safe one-shots play in place (no stop-to-idle): they only
    // touch parts every rig has (legs/torso/@root).
    const inPlace = osId === 'slip' || osId === 'recover-shake'
      || osId === 'jump' || osId === 'land' || osId === 'turn';
    // Big reactions read best from the idle rig: stop, react, resume.
    const needsIdle = !inPlace && this.rigId !== CHAR_IDLE_RIG[this.charId];
    if (needsIdle && isLocomotion(this.motion)) {
      const resume = this.motion;
      this.playMotion('idle');
      this.startOverlay(osId, {
        mirror: opts?.mirror ?? false,
        onDone: () => { this.transitionTo(resume); opts?.onDone?.(); },
      });
    } else {
      this.startOverlay(osId, opts);
    }
  }

  /** Terrain reshapes the CURRENT cycle live (no new art, no rule changes). */
  setTerrain(id: TerrainId): void {
    this.terrain = id;
    this.refreshMods();
  }

  getTerrain(): TerrainId {
    return this.terrain;
  }

  /**
   * Face left/right as a real multi-phase turn: look -> weight shift ->
   * squash -> flip masked at the squash bottom -> recover. The flip itself
   * is first-class (flipAtMs/onFlip), never an instant mirror-flip.
   */
  turnTo(dir: 1 | -1): void {
    if (dir === this.facing || this.trans !== 'steady') return;
    this.trans = 'turning';
    this.startOverlay('turn', {
      mirror: dir === -1,
      flipAtMs: 450,
      onFlip: () => this.setFacing(dir),
      onDone: () => {
        this.trans = 'steady';
        this.events.emit('turned', { facing: dir });
      },
    });
  }

  setFacing(dir: 1 | -1): void {
    this.facing = dir;
    this.container.setScale(dir, 1);
  }

  getFacing(): 1 | -1 {
    return this.facing;
  }

  /** Current hop offset (for shadow scaling). Negative = airborne. */
  get hopY(): number {
    return this.body.y;
  }

  get currentMotion(): Exclude<MotionId, CommandMotionId> {
    return this.motion;
  }

  on(event: MotionEvent, cb: (...args: never[]) => void, ctx?: object): this {
    this.events.on(event, cb, ctx);
    return this;
  }

  /** Advance the motion system. Call from the scene's update(). */
  update(_time: number, delta: number): void {
    const dt = Math.min(delta, 100);
    this.updateTransition(dt);
    this.updateBase(dt);
    this.updateOverlay(dt);
    this.updateIdle(dt);
    this.writeParts();
  }

  destroy(): void {
    this.events.removeAllListeners();
    this.container.destroy(true);
  }

  /* ---------------- internals ---------------- */

  private buildRig(rigId: string): void {
    for (const img of this.partImgs.values()) img.destroy();
    this.partImgs.clear();
    this.states.clear();
    this.rigId = rigId;
    this.rig = RIGS[rigId];
    for (const name of this.rig.order) {
      const def = this.rig.parts[name];
      const atlas = this.rig.atlases[def.atlas];
      const img = this.scene.add.image(def.restX, def.restY, atlas.key, def.frame);
      img.setOrigin(def.pivotX, def.pivotY);
      this.body.add(img);
      this.partImgs.set(name, img);
      this.states.set(name, newPartState());
    }
    resetPartState(this.rootState);
    this.sampleMap = new Map(this.states);
    this.sampleMap.set('@root', this.rootState);
    this.refreshMods();
  }

  private refreshMods(): void {
    const t = TERRAINS[this.terrain];
    const binding = this.binding();
    this.mods = {
      strideMul: t.strideMul ?? 1,
      liftMul: t.liftMul ?? 1,
      bobMul: t.bobMul ?? 1,
      bodyPitch: (t.bodyPitch ?? 0) + (binding?.lean ?? 0),
      mirror: false, // facing is handled by container.scaleX
    };
  }

  private binding() {
    return MOTIONS[this.motion];
  }

  private applyMotion(id: Exclude<MotionId, CommandMotionId>): void {
    const b = MOTIONS[id];
    this.motion = id;
    if (b.rig !== this.rigId) this.buildRig(b.rig);
    this.cycle = CYCLES[b.cycle];
    this.cycleId = b.cycle;
    this.refreshMods();
  }

  private beginSpeeding(): void {
    if (!this.pendingMotion) return;
    const id = this.pendingMotion;
    this.pendingMotion = null;
    this.applyMotion(id);
    this.speedScale = 0;
    this.trans = 'speeding';
    this.transT = 0;
  }

  private updateTransition(dt: number): void {
    if (this.trans === 'speeding') {
      this.transT += dt;
      this.speedScale = Math.min(1, this.transT / 600); // acceleration ramp
      if (this.speedScale >= 1) this.trans = 'steady';
    } else if (this.trans === 'slowing') {
      this.transT += dt;
      this.speedScale = Math.max(0, 1 - this.transT / 400); // deceleration ramp
      if (this.speedScale <= 0 && this.pendingMotion) {
        const id = this.pendingMotion;
        this.pendingMotion = null;
        this.startOverlay('settle', { onDone: () => this.applyMotion(id) });
        this.trans = 'settling';
      }
    } else if (this.trans === 'settling' && !this.overlay) {
      this.trans = 'steady';
      this.speedScale = 1;
    }
  }

  private updateBase(dt: number): void {
    const b = this.binding();
    const t = TERRAINS[this.terrain];
    const speed = this.speedScale * (t.speedMul ?? 1) * b.speedMul;
    this.lastPhase = this.phase;
    this.phase = (this.phase + (dt * speed) / this.cycle.periodMs) % 1;
    for (const st of this.states.values()) resetPartState(st);
    resetPartState(this.rootState);
    // shiver sits UNDER the cycle so wind never stops the walk
    if (t.shiver) {
      this.shiverPhase = (this.shiverPhase + dt / 240) % 1;
      const sh = ONESHOTS['shiver-loop'];
      sampleTracks(sh.tracks, this.shiverPhase, this.states, this.mods);
    }
    sampleTracks(this.cycle.tracks, this.phase, this.states, this.mods);
    this.fireContacts();
  }

  private fireContacts(): void {
    const from = this.lastPhase;
    const to = this.phase;
    const crossed = (p: number): boolean =>
      from <= to ? p > from && p <= to : p > from || p <= to;
    for (const c of this.cycle.contacts) {
      if (!crossed(c.phase)) continue;
      const pos = this.pawWorld(c.paw);
      if (!pos) continue;
      this.events.emit('footstep', { paw: c.paw, x: pos.x, y: pos.y });
      // ice: sometimes the plant foot slips
      const t = TERRAINS[this.terrain];
      if (t.slipChance && Math.random() < t.slipChance && !this.overlay) {
        this.startOverlay('slip');
      }
    }
  }

  /** Paw world position from the part's live transform (for FX placement). */
  private pawWorld(paw: string): { x: number; y: number } | null {
    const entry = this.partImgs.get(paw);
    const def = this.rig.parts[paw];
    const st = this.states.get(paw);
    if (!entry || !def || !st) return null;
    // paw tip in part-local coords, relative to pivot
    const ox = (0.5 - def.pivotX) * def.w * st.scaleX;
    const oy = (1 - def.pivotY) * def.h * st.scaleY;
    const rad = (st.angle * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const lx = def.restX + st.x + ox * cos - oy * sin;
    const ly = def.restY + st.y + ox * sin + oy * cos;
    return {
      x: this.container.x + lx * this.facing + this.body.x * this.facing,
      y: this.container.y + ly + this.body.y,
    };
  }

  /** Restore texture frames an overlay swapped (e.g. blink's headClosed). */
  private restoreOverlayFrames(ov: Overlay): void {
    if (!ov.def.frameSwaps) return;
    for (const fs of ov.def.frameSwaps) {
      const img = this.partImgs.get(fs.part);
      if (img && img.frame.name !== fs.part) img.setFrame(fs.part);
    }
  }

  private startOverlay(
    osId: string,
    opts?: { onDone?: () => void; mirror?: boolean; flipAtMs?: number; onFlip?: () => void },
  ): void {
    const def = ONESHOTS[osId];
    if (!def) return;
    // An overlay interrupted mid-flight must not leave transient state
    // behind: restore its frames and release 'turning' so it can't stick.
    // (The interrupted overlay's onDone is intentionally NOT fired —
    // firing it here could reenter startOverlay and recurse.)
    const prev = this.overlay;
    if (prev) {
      this.restoreOverlayFrames(prev);
      if (this.trans === 'turning') this.trans = 'steady';
    }
    this.overlay = {
      def, t: 0, mirror: opts?.mirror ?? false, onDone: opts?.onDone, fired: new Set(),
      flipAtMs: opts?.flipAtMs, flipped: false, onFlip: opts?.onFlip,
    };
  }

  private updateOverlay(dt: number): void {
    const ov = this.overlay;
    if (!ov) return;
    ov.t += dt;
    const mods: SampleMods = { ...this.mods, mirror: ov.mirror };
    sampleTracks(ov.def.tracks, ov.t, this.sampleMap, mods);
    // first-class turn flip: masked at the squash bottom
    if (ov.flipAtMs !== undefined && !ov.flipped && ov.t >= ov.flipAtMs) {
      ov.flipped = true;
      ov.onFlip?.();
    }
    // discrete frame swaps (blink)
    if (ov.def.frameSwaps) {
      for (const fs of ov.def.frameSwaps) {
        const img = this.partImgs.get(fs.part);
        if (!img) continue;
        const active = ov.t >= fs.atMs && ov.t < fs.atMs + fs.durMs;
        const want = active ? fs.frame : fs.part;
        if (img.frame.name !== want && this.rig.parts[want]) img.setFrame(want);
      }
    }
    if (ov.def.emitAt) {
      ov.def.emitAt.forEach((e, i) => {
        if (ov.t >= e.ms && !ov.fired.has(i)) {
          ov.fired.add(i);
          this.events.emit(e.event, { x: this.container.x, y: this.container.y });
        }
      });
    }
    if (ov.t >= ov.def.durationMs) {
      this.restoreOverlayFrames(ov);
      const cb = ov.onDone;
      this.overlay = null;
      cb?.();
    }
  }

  private updateIdle(dt: number): void {
    if (this.motion !== 'idle' || this.overlay || this.trans !== 'steady') return;
    const now = this.scene.time.now;
    const t = TERRAINS[this.terrain];
    for (const [b, next] of this.idleNext) {
      if (now < next) continue;
      const [lo, hi] = IDLE_CADENCE[b];
      const span = hi - lo;
      const mul = b === 'head-look' ? 1 / (t.lookFreqMul ?? 1) : 1;
      this.idleNext.set(b, now + (lo + Math.random() * span) * mul);
      this.startOverlay(b, { mirror: b === 'head-look' && Math.random() < 0.5 });
      break; // one behavior per frame max
    }
    void dt;
  }

  private writeParts(): void {
    for (const [name, img] of this.partImgs) {
      const def = this.rig.parts[name];
      const st = this.states.get(name);
      if (!def || !st) continue;
      img.setPosition(def.restX + st.x, def.restY + st.y);
      img.setAngle(st.angle);
      img.setScale(st.scaleX, st.scaleY);
    }
    this.body.setPosition(this.rootState.x, this.rootState.y);
    this.body.setAngle(this.rootState.angle);
  }
}

/* ------------------------------------------------------------------ */
/* Race helpers                                                        */
/* ---------------------------------------------------------------- */

/** Sled harness anchor in world px (Lennon: draw traces from here to the sled). */
export function huskyHarnessWorld(m: CharacterMotion): { x: number; y: number } {
  const a = RACE.huskyHarnessAnchor;
  return { x: m.container.x + a.x * m.getFacing(), y: m.container.y + a.y + m.hopY };
}

export { RACE };
