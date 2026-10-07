import Phaser from "phaser";
import { DogCharacter, DogReaction } from "./DogCharacter";

/**
 * KikiMover — reusable curve-following movement controller for Kiki.
 *
 * Tell Kiki "walk along this curve" and the mover handles:
 *  - progress along the actual path geometry (no straight-line sliding)
 *  - direction-based facing with clean texture flips
 *  - believable trot speed with acceleration and smooth arrival deceleration
 *  - stride-synchronized walk-cycle poses, body bob, and footstep FX
 *
 * Usage:
 *   const mover = new KikiMover(scene, kiki);            // moves kiki.container
 *   const mover = new KikiMover(scene, kiki, racerRoot);  // moves racerRoot (race sled)
 *   await mover.walk({ curve, gait: "trot", arrivalReaction: "happy" });
 *
 * The returned promise resolves when Kiki arrives and settles. While moving,
 * `isMoving` is true — scenes should keep input locked until the promise settles.
 * Re-entrant safe: a walk requested mid-walk resolves immediately (no glitches).
 */

export type KikiGait = "trot" | "dash";

/**
 * Minimal curve contract for movement. (Phaser 4's base `Curve` type does not
 * declare getPoint/getTangent, but QuadraticBezier and Line both provide them.)
 */
export interface WalkCurve {
  getLength(): number;
  getPoint<O extends Phaser.Math.Vector2>(t: number, out?: O): O;
  getTangent<O extends Phaser.Math.Vector2>(t: number, out?: O): O;
}

export interface KikiWalkSpec {
  /** The actual path to follow (e.g. the route's QuadraticBezier, or a Line). */
  curve: WalkCurve;
  /** "trot" for normal travel, "dash" for the challenge shortcut / turbo. */
  gait?: KikiGait;
  /**
   * Explicit duration in ms. When omitted, derived from the travelled portion
   * of the curve at a believable trot speed, clamped to 900–4000ms
   * (2.5–4s for full landmark travel).
   */
  durationMs?: number;
  /** Walk only part of the curve, e.g. stop before the broken bridge. */
  fromT?: number;
  toT?: number;
  /** Reaction to play on arrival ("none" = settle quietly). */
  arrivalReaction?: DogReaction | "none";
  /** Keep the current pose while moving (race) instead of the walk cycle. */
  keepPose?: boolean;
  /** Skip footstep FX (footprints / puffs / sound hooks). Default false. */
  quiet?: boolean;
}

const TROT_PX_PER_SEC = 150;
const DASH_MULT = 1.5;
const AUTO_MIN_MS = 900;
const AUTO_MAX_MS = 4000;
/** Pixels travelled per full 4-frame stride cycle. */
const STRIDE_PX_PER_CYCLE = 54;

export class KikiMover {
  private scene: Phaser.Scene;
  private kiki: DogCharacter;
  /** The object actually positioned along the curve (defaults to Kiki herself). */
  private root: Phaser.GameObjects.Container;
  private moving = false;
  private activeTween?: Phaser.Tweens.Tween;
  private readonly tmpPoint = new Phaser.Math.Vector2();
  private readonly tmpTan = new Phaser.Math.Vector2();

  constructor(
    scene: Phaser.Scene,
    kiki: DogCharacter,
    root?: Phaser.GameObjects.Container,
  ) {
    this.scene = scene;
    this.kiki = kiki;
    this.root = root ?? kiki.container;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  walk(spec: KikiWalkSpec): Promise<void> {
    if (this.moving) return Promise.resolve();
    this.moving = true;
    this.kiki.cancelReaction();
    this.kiki.setWalking(true);

    const gait: KikiGait = spec.gait ?? "trot";
    const speed = TROT_PX_PER_SEC * (gait === "dash" ? DASH_MULT : 1);
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
        this.moving = false;
        this.activeTween = undefined;
        this.kiki.rest();
        const reaction = spec.arrivalReaction ?? "none";
        if (reaction !== "none") this.kiki.react(reaction);
        resolve();
      };

      const proxy = { t: fromT };
      let lastT = fromT;
      let strideDist = 0;
      let lastStep = -1;

      this.activeTween = this.scene.tweens.add({
        targets: proxy,
        t: toT,
        duration,
        ease: "Sine.inOut", // gentle acceleration + smooth arrival deceleration
        onUpdate: () => {
          const t = proxy.t;
          const pos = spec.curve.getPoint(t, this.tmpPoint);
          const tan = spec.curve.getTangent(t, this.tmpTan);

          // Stride phase from REAL distance travelled, so easing affects the
          // walk cycle naturally (slower near the ends, lively mid-route).
          const dt = Math.abs(t - lastT);
          lastT = t;
          strideDist += dt * length;
          const cycle = (strideDist / STRIDE_PX_PER_CYCLE) % 1;

          if (!spec.keepPose) {
            this.kiki.playStride(Math.floor(cycle * 4) % 4);
          }
          if (!spec.quiet) {
            // Two footsteps per stride cycle, alternating.
            const stepIndex = Math.floor(cycle * 2);
            if (stepIndex !== lastStep) {
              lastStep = stepIndex;
              this.kiki.footstep(gait === "dash" ? 1.5 : 1);
            }
          }

          // Body bob: two soft bounces per stride cycle.
          const bob = -Math.abs(Math.sin(cycle * Math.PI * 2)) * 5;
          this.root.setPosition(pos.x, pos.y + bob);
          this.kiki.setFacing(tan.x * dirSign >= 0 ? "right" : "left");
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
    this.kiki.rest();
  }
}
