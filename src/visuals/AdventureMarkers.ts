import Phaser from "phaser";
import { AdventureNodeDef } from "../systems/AdventureState";
const ART: Record<string, [string, string, number, number]> = {
  "fallen-tree": ["lm-fallentree-blocked", "lm-fallentree-cleared", 340, 191],
  "snow-pass": ["lm-snowpass-blocked", "lm-snowpass-cleared", 350, 197],
  "summit-camp": ["ip-sg-locked", "ip-sg-open", 300, 169],
  "snow-cache": ["lm-bonecache-hidden", "lm-bonecache-revealed", 235, 157],
};
/** Existing encounter state rendered with Harrison's before/after art. */
export class AdventureMarkers {
  private map = new Map<string, Phaser.GameObjects.Container>();
  private cleared = new Set<string>();
  constructor(private scene: Phaser.Scene) {}
  build(nodes: AdventureNodeDef[]): void {
    for (const node of nodes) {
      const [key, , w, h] = ART[node.id] ?? ["lm-fork-sign", "lm-fork-sign", 120, 125];
      const c = this.scene.add.container(node.x, node.y).setDepth(11).setVisible(false);
      const image = this.scene.add.image(0, 14, "premium-props",key).setDisplaySize(w, h).setOrigin(.5,1).setData("art", true);
      const label = this.scene.add.text(0, 34, node.label, {
        fontFamily: "Georgia", fontSize: "14px", color: "#fff1ce", stroke: "#213c4b", strokeThickness: 4,
      }).setOrigin(0.5);
      c.add([image, label]); this.map.set(node.id, c);
    }
  }
  get(id: string): Phaser.GameObjects.Container | undefined { return this.map.get(id); }
  ids(): string[] { return [...this.map.keys()]; }
  setCleared(id: string): void {
    const c = this.map.get(id);
    if (!c || this.cleared.has(id) || !ART[id]) return;
    this.cleared.add(id);
    const art = c.list.find(o => o.getData?.("art")) as Phaser.GameObjects.Image;
    if(id === "fallen-tree" || id === "snow-pass") { art.setVisible(false); return; }
    const [, key, w, h] = ART[id]; art.setTexture("premium-props",key).setDisplaySize(w, h);
  }
  isCleared(id: string): boolean { return this.cleared.has(id); }
}
