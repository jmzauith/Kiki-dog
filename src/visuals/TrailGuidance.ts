import Phaser from 'phaser';
import { TrailGuidanceSystem } from '../systems/TrailGuidanceSystem';

/** Snow renderer for the world-neutral guidance schedule. */
export class TrailGuidance {
  private cues: { prints: Phaser.GameObjects.Graphics[]; clock: TrailGuidanceSystem }[] = [];
  constructor(private scene: Phaser.Scene) {}

  add(from: { x: number; y: number }, to: { x: number; y: number }, experienced: boolean, optional = false): void {
    const prints: Phaser.GameObjects.Graphics[] = [];
    const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
    // A short suggestion near Kiki, above the ground but below her paws.
    for (let i = 1; i <= 6; i++) {
      const t = Math.min(.65, (i * 25 + 25) / length), side = i % 2 ? 6 : -6;
      const print = this.scene.add.graphics({ x: from.x + dx * t - dy / length * side, y: from.y + dy * t + dx / length * side });
      print.fillStyle(0x547891, 1);
      print.fillEllipse(0, 4, 10, 9);
      print.fillEllipse(-7, -5, 5, 6);
      print.fillEllipse(0, -9, 5, 6);
      print.fillEllipse(7, -5, 5, 6);
      print.setRotation(Math.atan2(dy, dx) + Math.PI / 2).setAlpha(0).setDepth(14);
      prints.push(print);
    }
    this.cues.push({ prints, clock: new TrailGuidanceSystem(experienced, optional) });
  }

  update(delta: number): void {
    for (const cue of this.cues) {
      const alpha = cue.clock.advance(delta);
      cue.prints.forEach((print, i) => print.setAlpha(alpha * (1 - i * .07)));
    }
  }

  clear(): void {
    for (const cue of this.cues) cue.prints.forEach(print => print.destroy());
    this.cues = [];
  }
}
