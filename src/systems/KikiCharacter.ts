import Phaser from "phaser";

/**
 * KikiCharacter — Kiki the corgi as an independent, expressive game object.
 *
 * Renders Kiki from the hand-drawn SVG pose sheet (public/assets/kiki/kiki-poses.svg)
 * plus a separately-wagging tail. Exactly ONE KikiCharacter should exist per scene.
 *
 * Responsibilities:
 *  - pose management (idle / walk cycle / reactions / race)
 *  - clean left/right facing (texture flip, never negative scale)
 *  - idle life: breathing, tail wag, occasional ear-twitch wobble
 *  - reactions: happy / curious / surprised, always returning to idle
 *  - footprints + snow puffs + audio hooks (movement FX support)
 *
 * It does NOT move Kiki along routes — see KikiMover for curve-following movement.
 */

export type KikiPose =
  | "idle"
  | "walk1"
  | "walk2"
  | "walk3"
  | "walk4"
  | "happy"
  | "thinking"
  | "surprised"
  | "race";

export type KikiReaction = "happy" | "curious" | "surprised";
export type KikiFacing = "left" | "right";

/** Sound hooks — wire real audio later. Silent by default so nothing blocks. */
export interface KikiAudioHooks {
  pawstep(): void;
  crunch(): void;
  bark(): void;
  whoosh(): void;
}

export const SilentKikiAudio: KikiAudioHooks = {
  pawstep: () => undefined,
  crunch: () => undefined,
  bark: () => undefined,
  whoosh: () => undefined,
};

export interface KikiCharacterOptions {
  /** Display scale of the character (art is 160x120). Default 0.66. */
  scale?: number;
  /** Depth of Kiki's container. Default 15. */
  depth?: number;
  audio?: KikiAudioHooks;
  /** Footprints behind Kiki while walking. Default true. */
  footprints?: boolean;
  /** Snow puffs under paws. Default true. */
  puffs?: boolean;
}

const POSE_SHEET = "kiki-poses";
const TAIL_KEY = "kiki-tail";
const FRAME_W = 160;
const FRAME_H = 120;

const POSE_FRAMES: Record<KikiPose, string> = {
  idle: "pose-idle",
  walk1: "pose-walk-1",
  walk2: "pose-walk-2",
  walk3: "pose-walk-3",
  walk4: "pose-walk-4",
  happy: "pose-happy",
  thinking: "pose-thinking",
  surprised: "pose-surprised",
  race: "pose-race",
};

const WALK_CYCLE: KikiPose[] = ["walk1", "walk2", "walk3", "walk4"];

const MAX_PRINTS = 26;
const MAX_PUFFS = 14;

export class KikiCharacter {
  readonly container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private body: Phaser.GameObjects.Image;
  private tail: Phaser.GameObjects.Image;
  private audio: KikiAudioHooks;
  private facing: KikiFacing = "right";
  private pose: KikiPose = "idle";
  private idlePose: KikiPose = "idle";
  private walking = false;
  private reacting = false;

  private idleTweens: Phaser.Tweens.Tween[] = [];
  private twitchTimer?: Phaser.Time.TimerEvent;
  private reactionTimer?: Phaser.Time.TimerEvent;

  private printPool: Phaser.GameObjects.Ellipse[] = [];
  private printIndex = 0;
  private printSide: 1 | -1 = 1;
  private puffCount = 0;

  private wantFootprints: boolean;
  private wantPuffs: boolean;
  private destroyed = false;

  private static framesReady = false;

  /** Call from Scene.preload(). */
  static preload(scene: Phaser.Scene): void {
    scene.load.svg(POSE_SHEET, "assets/kiki/kiki-poses.svg", {
      width: FRAME_W * 9,
      height: FRAME_H,
    });
    scene.load.svg(TAIL_KEY, "assets/kiki/kiki-tail.svg", { width: 64, height: 64 });
  }

  constructor(scene: Phaser.Scene, x: number, y: number, opts: KikiCharacterOptions = {}) {
    this.scene = scene;
    this.audio = opts.audio ?? SilentKikiAudio;
    this.wantFootprints = opts.footprints ?? true;
    this.wantPuffs = opts.puffs ?? true;

    KikiCharacter.ensureFrames(scene);

    this.container = scene.add.container(x, y);
    this.container.setDepth(opts.depth ?? 15);
    this.container.setScale(opts.scale ?? 0.66);

    // Tail sits behind the body, anchored at its base so it can wag.
    this.tail = scene.add.image(-51, 2, TAIL_KEY);
    this.tail.setOrigin(0.5, 0.9);
    this.body = scene.add.image(0, 0, POSE_SHEET, POSE_FRAMES.idle);
    this.container.add([this.tail, this.body]);

    if (this.wantFootprints) {
      for (let i = 0; i < MAX_PRINTS; i++) {
        this.printPool.push(scene.add.ellipse(0, 0, 11, 7, 0xffffff, 0).setDepth(5));
      }
    }

    this.startIdle();
  }

  /** Slice the pose sheet into named frames (once per game). */
  private static ensureFrames(scene: Phaser.Scene): void {
    if (KikiCharacter.framesReady || !scene.textures.exists(POSE_SHEET)) return;
    const tex = scene.textures.get(POSE_SHEET);
    let i = 0;
    for (const frame of Object.values(POSE_FRAMES)) {
      if (!tex.has(frame)) {
        tex.add(frame, 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
      }
      i++;
    }
    KikiCharacter.framesReady = true;
  }

  // ---------------------------------------------------------------- position

  setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  get x(): number {
    return this.container.x;
  }

  get y(): number {
    return this.container.y;
  }

  /** World-space position (correct even when nested in another container). */
  get worldX(): number {
    return this.container.getWorldTransformMatrix().tx;
  }

  get worldY(): number {
    return this.container.getWorldTransformMatrix().ty;
  }

  // ------------------------------------------------------------------ facing

  /** Clean left/right facing via texture flip — never negative scale. */
  setFacing(f: KikiFacing): void {
    if (this.destroyed || this.facing === f) return;
    this.facing = f;
    const flip = f === "left";
    this.body.setFlipX(flip);
    this.tail.setFlipX(flip);
    this.tail.x = flip ? 51 : -51;
  }

  /** Turn Kiki toward a world x position (player guidance / anticipation). */
  lookAt(worldX: number): void {
    this.setFacing(worldX < this.worldX ? "left" : "right");
  }

  // -------------------------------------------------------------------- pose

  setPose(pose: KikiPose): void {
    if (this.destroyed || this.pose === pose) return;
    this.pose = pose;
    this.body.setFrame(POSE_FRAMES[pose]);
  }

  /** Pose Kiki returns to after reactions / movement. Default "idle". */
  setIdlePose(pose: KikiPose): void {
    this.idlePose = pose;
    if (!this.walking && !this.reacting) {
      this.setPose(pose);
    }
  }

  /** Advance the walk cycle (0..3). Called by KikiMover from stride phase. */
  playStride(frame: number): void {
    this.setPose(WALK_CYCLE[frame % WALK_CYCLE.length]);
  }

  // -------------------------------------------------------------------- idle

  /** Tell Kiki whether she is currently travelling (pauses idle life). */
  setWalking(walking: boolean): void {
    if (this.destroyed || this.walking === walking) return;
    this.walking = walking;
    if (walking) {
      this.cancelReaction();
      this.stopIdle();
      // Tail streams back while moving.
      this.scene.tweens.add({ targets: this.tail, angle: -22, duration: 350, ease: "Sine.out" });
    } else {
      this.startIdle();
    }
  }

  /** Settle Kiki after movement: leave walk state, return to the idle pose. */
  rest(): void {
    this.setWalking(false);
    this.setPose(this.idlePose);
  }

  private startIdle(): void {
    this.stopIdle();
    if (this.destroyed || this.walking) return;

    // Breathing.
    this.idleTweens.push(
      this.scene.tweens.add({
        targets: this.body,
        scaleY: 1.035,
        scaleX: 0.99,
        duration: 1350,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
      // Gentle tail wag.
      this.scene.tweens.add({
        targets: this.tail,
        angle: 16,
        duration: 430,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      }),
    );

    // Occasional ear-twitch wobble — subtle, never jittery.
    this.twitchTimer = this.scene.time.addEvent({
      delay: 4200,
      loop: true,
      callback: () => {
        if (this.destroyed || this.walking || this.reacting || this.pose !== this.idlePose) return;
        if (Math.random() > 0.45) return;
        this.scene.tweens.add({
          targets: this.body,
          angle: -5,
          duration: 130,
          yoyo: true,
          repeat: 1,
          ease: "Sine.inOut",
        });
      },
    });
  }

  private stopIdle(): void {
    for (const t of this.idleTweens) t.stop();
    this.idleTweens = [];
    this.twitchTimer?.remove(false);
    this.twitchTimer = undefined;
    if (!this.destroyed) {
      this.body.setScale(1, 1);
      this.body.setAngle(0);
      this.tail.setAngle(0);
    }
  }

  // --------------------------------------------------------------- reactions

  /**
   * Play a short expressive reaction, then settle back to the idle pose.
   * Safe to call during movement — the mover cancels reactions when walking.
   */
  react(reaction: KikiReaction, ms = 1200): void {
    if (this.destroyed) return;
    this.cancelReaction();
    this.reacting = true;
    this.stopIdle();

    if (reaction === "happy") {
      this.setPose("happy");
      this.audio.bark();
      // Joyful little hop.
      const baseY = this.container.y;
      this.scene.tweens.add({
        targets: this.container,
        y: baseY - 15,
        duration: 200,
        yoyo: true,
        ease: "Quad.out",
      });
      // Fast excited wag.
      this.scene.tweens.add({
        targets: this.tail,
        angle: 26,
        duration: 160,
        yoyo: true,
        repeat: 5,
        ease: "Sine.inOut",
      });
    } else if (reaction === "curious") {
      this.setPose("thinking");
    } else {
      this.setPose("surprised");
      // Tiny startle.
      this.scene.tweens.add({
        targets: this.body,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 160,
        yoyo: true,
        ease: "Quad.out",
      });
    }

    this.reactionTimer = this.scene.time.delayedCall(ms, () => {
      this.reacting = false;
      this.reactionTimer = undefined;
      if (this.destroyed || this.walking) return;
      this.setPose(this.idlePose);
      this.startIdle();
    });
  }

  cancelReaction(): void {
    this.reactionTimer?.remove(false);
    this.reactionTimer = undefined;
    this.reacting = false;
  }

  // ------------------------------------------------------------ movement FX

  /** One footstep: footprint + snow puff + sound hook. Called by KikiMover. */
  footstep(strength = 1): void {
    if (this.destroyed) return;
    this.stampFootprint();
    this.puff(strength);
    this.audio.pawstep();
  }

  private stampFootprint(): void {
    if (!this.wantFootprints || this.printPool.length === 0) return;
    const p = this.printPool[this.printIndex];
    this.printIndex = (this.printIndex + 1) % this.printPool.length;
    this.scene.tweens.killTweensOf(p);

    this.printSide = (this.printSide * -1) as 1 | -1;
    const dir = this.facing === "right" ? 1 : -1;
    p.setPosition(
      this.worldX - dir * 8 + Phaser.Math.Between(-4, 4),
      this.worldY + 30 + (this.printSide > 0 ? -5 : 5),
    );
    p.setScale(0.7);
    p.setAlpha(0.5);
    this.scene.tweens.add({
      targets: p,
      alpha: 0,
      scale: 1.05,
      duration: 5500,
      ease: "Sine.out",
    });
  }

  /** Small snow puff under the paws. Subtle by design — never hides Kiki. */
  puff(strength = 1): void {
    if (!this.wantPuffs || this.puffCount >= MAX_PUFFS) return;
    const dir = this.facing === "right" ? 1 : -1;
    const n = strength > 1.2 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      this.puffCount++;
      const c = this.scene.add.circle(
        this.worldX - dir * 26 + Phaser.Math.Between(-8, 8),
        this.worldY + 28 + Phaser.Math.Between(-4, 4),
        Phaser.Math.Between(3, 6) * strength,
        0xffffff,
        0.75,
      ).setDepth(13);
      this.scene.tweens.add({
        targets: c,
        alpha: 0,
        scale: 2.1,
        x: c.x - dir * 10,
        duration: 480,
        onComplete: () => {
          c.destroy();
          this.puffCount--;
        },
      });
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopIdle();
    this.cancelReaction();
    for (const p of this.printPool) p.destroy();
    this.printPool = [];
    this.container.destroy(true);
  }
}
