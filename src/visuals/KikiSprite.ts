import Phaser from "phaser";

export const KIKI_BODY_KEY = "kiki-body";
export const KIKI_LEG_KEY = "kiki-leg";

export function preloadKiki(scene: Phaser.Scene): void {
  scene.load.svg(KIKI_BODY_KEY, "assets/kiki/body.svg", { width: 150, height: 104 });
  scene.load.svg(KIKI_LEG_KEY, "assets/kiki/leg.svg", { width: 24, height: 38 });
}

/**
 * Kiki the corgi as an independent, articulated game object.
 * Body is one SVG; four legs are separate SVGs pivoted at the hip
 * so she gets a real walk cycle instead of sliding.
 */
export class KikiSprite {
  readonly container: Phaser.GameObjects.Container;
  private legs: Phaser.GameObjects.Image[] = [];
  private body!: Phaser.GameObjects.Image;
  private legTweens: Phaser.Tweens.Tween[] = [];
  private bobTween?: Phaser.Tweens.Tween;
  private walking = false;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y).setDepth(15);

    this.body = scene.add.image(0, 0, KIKI_BODY_KEY);

    // leg anchors in body-local coords (body is 150x104, origin center)
    // far-side legs sit slightly higher/smaller/darker for depth
    const defs: Array<{ x: number; y: number; far: boolean }> = [
      { x: -36, y: 20, far: true },
      { x: -18, y: 23, far: false },
      { x: 12, y: 23, far: false },
      { x: 30, y: 20, far: true },
    ];
    for (const def of defs) {
      const leg = scene.add.image(def.x, def.y, KIKI_LEG_KEY).setOrigin(0.5, 0.06);
      if (def.far) {
        leg.setScale(0.9).setTint(0xcdb79f);
        leg.y -= 2;
      }
      this.legs.push(leg);
    }

    this.container.add([...this.legs, this.body]);
    this.startIdle();
  }

  /** Begin/stop the walk cycle. Safe to call repeatedly. */
  setWalking(walking: boolean): void {
    if (walking === this.walking) return;
    this.walking = walking;
    this.stopLegTweens();
    if (walking) {
      this.bobTween?.stop();
      // diagonal pairs move together, like a real trot
      const pairs: Array<[number, number]> = [[0, 3], [1, 2]];
      pairs.forEach(([a, b], pairIndex) => {
        for (const legIndex of [a, b]) {
          const leg = this.legs[legIndex];
          const tween = this.scene.tweens.add({
            targets: leg,
            angle: pairIndex === 0 ? 26 : -26,
            duration: 165,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
            delay: pairIndex === 0 ? 0 : 165,
          });
          this.legTweens.push(tween);
        }
      });
      this.bobTween = this.scene.tweens.add({
        targets: this.body,
        y: -3,
        duration: 165,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    } else {
      this.legs.forEach((leg) => leg.setAngle(0));
      this.body.setY(0);
      this.startIdle();
    }
  }

  private startIdle(): void {
    this.bobTween = this.scene.tweens.add({
      targets: this.body,
      scaleY: 1.025,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  private stopLegTweens(): void {
    for (const t of this.legTweens) t.stop();
    this.legTweens = [];
    this.bobTween?.stop();
    this.bobTween = undefined;
  }

  /** Happy bounce, e.g. after solving math or reaching the goal. */
  celebrate(): void {
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 26,
      duration: 260,
      yoyo: true,
      repeat: 1,
      ease: "Quad.out",
    });
  }

  destroy(): void {
    this.stopLegTweens();
    this.container.destroy(true);
  }
}
