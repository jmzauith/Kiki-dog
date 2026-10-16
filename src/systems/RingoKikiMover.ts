import Phaser from "phaser";
import { CharacterMotion } from "../motion/CharacterMotion";
import { pathScale, type GroundPoint } from "../visuals/HuskyTerrain";
import { TERRAINS } from "../motion/motionData";
import type { MotionId, TerrainId } from "../motion/motionTypes";

/**
 * RingoKikiMover — curve-following movement for Ringo's CharacterMotion rig.
 *
 * Replaces KikiMover (which drove the old DogCharacter sprite-flipping).
 * This mover positions the CharacterMotion container along a curve while the
 * rig itself handles animation: anticipation, acceleration, terrain gaits,
 * turns, foot-contact FX (via FootFX), and settle-to-idle.
 *
 * Usage:
 *   const mover = new RingoKikiMover(scene, kikiMotion);
 *   await mover.walk({ curve, gait: "trot", terrain: "deep-snow" });
 *
 * The promise resolves when Kiki arrives and settles. While moving,
 * `isMoving` is true — scenes should keep input locked until it settles.
 */
export type RingoGait = "trot" | "run" | "careful" | "dash";

export interface WalkCurve {
  getLength(): number;
  getPoint<O extends Phaser.Math.Vector2>(t: number, out?: O): O;
  getTangent<O extends Phaser.Math.Vector2>(t: number, out?: O): O;
}

export interface RingoWalkSpec {
  curve: WalkCurve;
  gait?: RingoGait;
  /** TerrainId reshapes the gait live (deep-snow, ice, bridge, uphill...). */
  terrain?: TerrainId;
  durationMs?: number;
  fromT?: number;
  toT?: number;
  arrivalReaction?: string | "none";
  quiet?: boolean;
  scalePoints?: GroundPoint[];
}

const TROT_PX_PER_SEC = 150;
const GAIT_SPEED: Record<RingoGait, number> = {
  trot: 1,
  run: 1.6,
  careful: 0.6,
  dash: 1.5,
};
const GAIT_MOTION: Record<RingoGait, MotionId> = {
  trot: "trot",
  run: "run",
  careful: "trot", // careful movement is a slower trot on bridge terrain
  dash: "run",
};
const AUTO_MIN_MS = 900;
const AUTO_MAX_MS = 4000;

export class RingoKikiMover {
  private scene: Phaser.Scene;
  private motion: CharacterMotion;
  private moving = false;
  private activeTween?: Phaser.Tweens.Tween;
  private readonly tmpPoint = new Phaser.Math.Vector2();
  private readonly tmpTan = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, motion: CharacterMotion) {
    this.scene = scene;
    this.motion = motion;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  /** Face a world x-coordinate (multi-phase turn, never an instant flip). */
  lookAt(x: number): void {
    const dir = x >= this.motion.container.x ? 1 : -1;
    this.motion.turnTo(dir as 1 | -1);
  }

  walk(spec: RingoWalkSpec): Promise<void> {
    if (this.moving) return Promise.resolve();
    this.moving = true;

    const gait: RingoGait = spec.gait ?? "trot";
    if (spec.terrain) this.motion.setTerrain(spec.terrain);
    // Establish direction before acceleration; never travel backwards while a turn
    // waits behind a previous stop/reaction transition.
    const initialTangent=spec.curve.getTangent(spec.fromT??0);
    const startingDirection=initialTangent.x*((spec.toT??1)>=(spec.fromT??0)?1:-1)>=0?1:-1;
    this.motion.turnTo(startingDirection);
    // Anticipation squash, then accelerate into the gait.
    this.motion.transitionTo(GAIT_MOTION[gait]);

    const speed = TROT_PX_PER_SEC * GAIT_SPEED[gait] * (TERRAINS[spec.terrain ?? "normal-snow"].speedMul ?? 1);
    const length = Math.max(spec.curve.getLength(), 1);
    const fromT = spec.fromT ?? 0;
    const toT = spec.toT ?? 1;
    const dirSign = toT >= fromT ? 1 : -1;
    const travelLength = length * Math.abs(toT - fromT);
    const duration =
      spec.durationMs ??
      Phaser.Math.Clamp((travelLength / speed) * 1000, AUTO_MIN_MS, AUTO_MAX_MS);

    return new Promise((resolve) => {
      const finish = () => {
        const end=spec.curve.getPoint(toT);
        this.motion.container.setPosition(end.x,end.y);
        this.moving = false;
        this.activeTween = undefined;
        // Decelerate and settle to idle — the game-feel stop.
        this.motion.transitionTo("idle");
        const reaction = spec.arrivalReaction ?? "none";
        if (reaction !== "none") {
          // Small delay so the settle reads before the reaction.
          this.scene.time.delayedCall(750, () => {
            if(this.moving)return;
            // Arrival reactions must not resume the gait that just finished.
            this.motion.playMotion("idle");
            try {
              (this.motion.react as (id: string) => void)(reaction);
            } catch {
              /* unknown reaction id — ignore */
            }
          });
        }
        resolve();
      };

      const proxy = { t: fromT };
      this.activeTween = this.scene.tweens.add({
        targets: proxy,
        t: toT,
        duration,
        ease: "Sine.inOut",
        delay: 340,
        onStart:()=>this.motion.setFacing(startingDirection),
        onUpdate: () => {
          const t = proxy.t;
          const pos = spec.curve.getPoint(t, this.tmpPoint);
          const tan = spec.curve.getTangent(t, this.tmpTan);
          this.motion.container.setPosition(pos.x, pos.y);
          if(spec.scalePoints) { const s=pathScale(spec.scalePoints,t); this.motion.container.setScale(s*this.motion.getFacing(),s); }
          // Face along the direction of travel (turnTo is a no-op if same).
          const wantDir = tan.x * dirSign >= 0 ? 1 : -1;
          this.motion.turnTo(wantDir as 1 | -1);
        },
        onComplete: finish,
      });
    });
  }

  /** Emergency stop: kills the active walk and settles Kiki. */
  stop(): void {
    this.activeTween?.stop();
    this.activeTween = undefined;
    this.moving = false;
    this.motion.transitionTo("idle");
  }
}

