import Phaser from "phaser";

/**
 * DogCharacter — shared base class for the game's dog characters
 * (Kiki the corgi and the Husky rival).
 *
 * Renders a dog from a hand-built SVG pose sheet plus a separately-wagging
 * tail sprite. Exactly ONE character instance should own each role per scene.
 *
 * Responsibilities (shared):
 *  - pose management (named frames sliced from the sheet at runtime)
 *  - clean left/right facing (texture flip, never negative scale)
 *  - idle life: breathing, tail wag, occasional ear-twitch wobble
 *  - reactions: happy / curious / surprised, always returning to idle
 *  - footprints + snow puffs + audio hooks (movement FX support)
 *
 * It does NOT move the character along routes — see KikiMover for
 * curve-following movement.
 */

export type DogReaction = "happy" | "curious" | "surprised";
export type DogFacing = "left" | "right";

/** Sound hooks — wire real audio later. Silent by default so nothing blocks. */
export interface DogAudioHooks {
  pawstep(): void;
  crunch(): void;
  bark(): void;
  whoosh(): void;
}

export const SilentDogAudio: DogAudioHooks = {
  pawstep: () => undefined,
  crunch: () => undefined,
  bark: () => undefined,
  whoosh: () => undefined,
};

export interface DogCharacterOptions {
  /** Display scale of the character. Default 0.8. */
  scale?: number;
  /** Depth of the character's container. Default 15. */
  depth?: number;
  audio?: DogAudioHooks;
  /** Footprints behind the character while walking. Default true. */
  footprints?: boolean;
  /** Snow puffs under paws. Default true. */
  puffs?: boolean;
}

/** Everything the base class needs to know about a character's art. */
export interface DogSheetConfig {
  sheetKey: string;
  sheetUrl: string;
  /** Rasterized sheet size (cols*frameW, rows*frameH). */
  sheetW: number;
  sheetH: number;
  frameW: number;
  frameH: number;
  cols: number;
  /** Pose names in sheet order (row-major). */
  frames: string[];
  tailKey: string;
  tailUrl: string;
  tailW: number;
  tailH: number;
  /** Poses cycled by playStride(). */
  walkCycle: string[];
  defaultIdle: string;
  /** Reaction -> pose mapping. */
  reactions: Record<DogReaction, string>;
  /** Tail anchor offset from character center. */
  tailX: number;
  tailY: number;
  /** Feet offset from character center (footprints / puffs). */
  feetY: number;
}

const MAX_PRINTS = 26;
const MAX_PUFFS = 14;

export abstract class DogCharacter {
  readonly container: Phaser.GameObjects.Container;

  protected readonly config: DogSheetConfig;

  protected scene: Phaser.Scene;
  protected body!: Phaser.GameObjects.Image;
  protected tail!: Phaser.GameObjects.Image;
  protected audio: DogAudioHooks;
  protected facing: DogFacing = "right";
  protected pose = "";
  protected idlePose: string;
  protected walking = false;
  protected reacting = false;

  protected idleTweens: Phaser.Tweens.Tween[] = [];
  protected twitchTimer?: Phaser.Time.TimerEvent;
  protected reactionTimer?: Phaser.Time.TimerEvent;

  protected printPool: Phaser.GameObjects.Ellipse[] = [];
  protected printIndex = 0;
  protected printSide: 1 | -1 = 1;
  protected puffCount = 0;

  protected wantFootprints: boolean;
  protected wantPuffs: boolean;
  protected destroyed = false;

  private static framesReady = new Set<string>();

  /** Slice a pose sheet into named frames (once per sheet per game). */
  protected static preloadSheet(scene: Phaser.Scene, config: DogSheetConfig): void {
    scene.load.svg(config.sheetKey, config.sheetUrl, {
      width: config.sheetW,
      height: config.sheetH,
    });
    scene.load.svg(config.tailKey, config.tailUrl, {
      width: config.tailW,
      height: config.tailH,
    });
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    opts: DogCharacterOptions,
    config: DogSheetConfig,
  ) {
    this.config = config;
    this.scene = scene;
    this.audio = opts.audio ?? SilentDogAudio;
    this.wantFootprints = opts.footprints ?? true;
    this.wantPuffs = opts.puffs ?? true;
    this.idlePose = this.config.defaultIdle;
    this.pose = this.idlePose;

    DogCharacter.ensureFrames(scene, this.config);

    this.container = scene.add.container(x, y);
    this.container.setDepth(opts.depth ?? 15);
    this.container.setScale(opts.scale ?? 0.8);

    // Tail sits behind the body, anchored at its base so it can wag.
    this.tail = scene.add.image(this.config.tailX, this.config.tailY, this.config.tailKey);
    this.tail.setOrigin(0.5, 0.9);
    this.body = scene.add.image(0, 0, this.config.sheetKey, this.frameName(this.pose));
    this.container.add([this.tail, this.body]);

    if (this.wantFootprints) {
      for (let i = 0; i < MAX_PRINTS; i++) {
        this.printPool.push(scene.add.ellipse(0, 0, 11, 7, 0xffffff, 0).setDepth(5));
      }
    }

    this.startIdle();
  }

  private static ensureFrames(scene: Phaser.Scene, config: DogSheetConfig): void {
    if (DogCharacter.framesReady.has(config.sheetKey)) return;
    if (!scene.textures.exists(config.sheetKey)) return;
    const tex = scene.textures.get(config.sheetKey);
    config.frames.forEach((pose, i) => {
      const name = `pose-${pose}`;
      if (!tex.has(name)) {
        const fx = (i % config.cols) * config.frameW;
        const fy = Math.floor(i / config.cols) * config.frameH;
        tex.add(name, 0, fx, fy, config.frameW, config.frameH);
      }
    });
    DogCharacter.framesReady.add(config.sheetKey);
  }

  protected frameName(pose: string): string {
    return `pose-${pose}`;
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
  setFacing(f: DogFacing): void {
    if (this.destroyed || this.facing === f) return;
    this.facing = f;
    const flip = f === "left";
    this.body.setFlipX(flip);
    this.tail.setFlipX(flip);
    this.tail.x = flip ? -this.config.tailX : this.config.tailX;
  }

  /** Turn toward a world x position (player guidance / anticipation). */
  lookAt(worldX: number): void {
    this.setFacing(worldX < this.worldX ? "left" : "right");
  }

  // -------------------------------------------------------------------- pose

  setPose(pose: string): void {
    if (this.destroyed || this.pose === pose) return;
    this.pose = pose;
    this.body.setFrame(this.frameName(pose));
  }

  /** Pose the character returns to after reactions / movement. */
  setIdlePose(pose: string): void {
    this.idlePose = pose;
    if (!this.walking && !this.reacting) {
      this.setPose(pose);
    }
  }

  /** Advance the walk cycle. Called by KikiMover from stride phase. */
  playStride(frame: number): void {
    const cycle = this.config.walkCycle;
    this.setPose(cycle[frame % cycle.length]);
  }

  // -------------------------------------------------------------------- idle

  /** Tell the character whether it is currently travelling (pauses idle life). */
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

  /** Settle after movement: leave walk state, return to the idle pose. */
  rest(): void {
    this.setWalking(false);
    this.setPose(this.idlePose);
  }

  protected startIdle(): void {
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

  protected stopIdle(): void {
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
  react(reaction: DogReaction, ms = 1200): void {
    if (this.destroyed) return;
    this.cancelReaction();
    this.reacting = true;
    this.stopIdle();

    const pose = this.config.reactions[reaction];
    if (reaction === "happy") {
      this.setPose(pose);
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
      this.setPose(pose);
    } else {
      this.setPose(pose);
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

  protected stampFootprint(): void {
    if (!this.wantFootprints || this.printPool.length === 0) return;
    const p = this.printPool[this.printIndex];
    this.printIndex = (this.printIndex + 1) % this.printPool.length;
    this.scene.tweens.killTweensOf(p);

    this.printSide = (this.printSide * -1) as 1 | -1;
    const dir = this.facing === "right" ? 1 : -1;
    p.setPosition(
      this.worldX - dir * 8 + Phaser.Math.Between(-4, 4),
      this.worldY + this.config.feetY - 24 + (this.printSide > 0 ? -5 : 5),
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

  /** Small snow puff under the paws. Subtle by design — never hides the dog. */
  puff(strength = 1): void {
    if (!this.wantPuffs || this.puffCount >= MAX_PUFFS) return;
    const dir = this.facing === "right" ? 1 : -1;
    const n = strength > 1.2 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      this.puffCount++;
      const c = this.scene.add.circle(
        this.worldX - dir * 26 + Phaser.Math.Between(-8, 8),
        this.worldY + this.config.feetY - 26 + Phaser.Math.Between(-4, 4),
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
