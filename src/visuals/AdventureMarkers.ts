/**
 * AdventureMarkers — lightweight placeholder markers for adventure nodes
 * that don't have dedicated landmark art yet (forest, frozen lake, fallen
 * tree, snow pass, bone cache).
 *
 * These are intentionally simple and style-consistent with the world's UI
 * (wooden plaque + snow cap, like the title plaque): functional placeholders
 * for Harrison to reskin with real art later. They are NOT environment art
 * redesigns — they only exist so new gameplay nodes are visible and tappable.
 *
 * API mirrors the subset of Landmarks that HuskyScene needs: build(id),
 * get(id), setCleared(id) for the fallen-tree after its discovery encounter.
 */
import Phaser from "phaser";
import { AdventureNodeDef } from "../systems/AdventureState";

const MARKER_STYLE: Record<string, { tint: number; glyph: string }> = {
  "forest": { tint: 0x2f6b3a, glyph: "🌲" },
  "frozen-lake": { tint: 0x3f83b9, glyph: "🧊" },
  "fallen-tree": { tint: 0x8d5a32, glyph: "🪵" },
  "snow-pass": { tint: 0x5a7a99, glyph: "⛰" },
  "snow-cache": { tint: 0xb98a2f, glyph: "🦴" },
};

export class AdventureMarkers {
  private map = new Map<string, Phaser.GameObjects.Container>();
  private cleared = new Set<string>();

  constructor(private scene: Phaser.Scene) {}

  /** Build markers for the given node defs (all start hidden). */
  build(nodes: AdventureNodeDef[]): void {
    for (const node of nodes) {
      const style = MARKER_STYLE[node.id] ?? { tint: 0x4a6b8a, glyph: "❄" };
      const c = this.scene.add.container(node.x, node.y).setDepth(6);

      const shadow = this.scene.add.ellipse(0, 46, 110, 20, 0x9db8d6, 0.35);
      const plaqueG = this.scene.add.graphics();
      plaqueG.fillStyle(0x8d5a32, 0.95);
      plaqueG.lineStyle(3, 0x5a3a1e, 1);
      plaqueG.fillRoundedRect(-70, -34, 140, 68, 14);
      plaqueG.strokeRoundedRect(-70, -34, 140, 68, 14);
      // snow cap
      plaqueG.fillStyle(0xffffff, 0.95);
      plaqueG.fillRoundedRect(-70, -34, 140, 16, { tl: 14, tr: 14, bl: 0, br: 0 });

      const glyph = this.scene.add.text(0, -2, style.glyph, {
        fontFamily: "Arial",
        fontSize: "34px",
      }).setOrigin(0.5);
      const ring = this.scene.add.graphics();
      ring.lineStyle(4, style.tint, 0.9);
      ring.strokeCircle(0, 0, 52);

      const label = this.scene.add.text(0, 62, node.label.toUpperCase(), {
        fontFamily: "Arial Black, Arial",
        fontSize: "15px",
        color: "#ffffff",
        stroke: "#17324d",
        strokeThickness: 4,
      }).setOrigin(0.5);

      c.add([shadow, plaqueG, glyph, ring, label]);
      c.setVisible(false);
      this.map.set(node.id, c);
    }
  }

  get(id: string): Phaser.GameObjects.Container | undefined {
    return this.map.get(id);
  }

  ids(): string[] {
    return [...this.map.keys()];
  }

  /** Fallen-tree cleared visual: the log is pushed aside, marker dims. */
  setCleared(id: string): void {
    const c = this.map.get(id);
    if (!c || this.cleared.has(id)) return;
    this.cleared.add(id);
    c.setAlpha(0.55);
    const check = this.scene.add.text(34, -34, "✓", {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: "#7dd87d",
      stroke: "#17324d",
      strokeThickness: 5,
    }).setOrigin(0.5);
    c.add(check);
  }

  isCleared(id: string): boolean {
    return this.cleared.has(id);
  }
}
