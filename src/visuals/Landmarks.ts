import Phaser from "phaser";
import { clippedForeground } from "./ClippedForeground";
import { createPremiumProps } from "./PremiumProps";
import { MapNodeId } from "../systems/MapGraph";
import { NODE_POSITIONS, FUTURE_NODE_SPOTS, SCENERY_SPOTS } from "../worlds/husky/HuskyWorldLayout";
import { polishPosition, preloadPolishProps } from "./PolishArt";
export function preloadLandmarks(scene:Phaser.Scene):void {
  preloadPolishProps(scene);
  scene.load.image("snowy-panorama","assets/premium/snowy-panorama.png");
  scene.load.image("premium-props","assets/premium/snowy-props.png");
}
type Id = MapNodeId | "igloo";
/** Painterly landmarks: no legacy vector scenery is loaded by this renderer. */
export class Landmarks {
  private map = new Map<Id, Phaser.GameObjects.Container>();
  private bridgeRepaired = false;
  constructor(private scene: Phaser.Scene) {}
  buildAll(): void {
    createPremiumProps(this.scene);
    const defs: Array<[Id, string, number, number, string]> = [
      ["start", "lm-trailhead", 260, 245, "Trailhead"], ["math1", "lm-bridge-broken", 360, 285, "Broken bridge"],
      ["fork", "lm-fork-sign", 180, 191, "Whisper Forest"], ["safe", "ip-fl-safe", 500, 242, "Frozen Lake"],
      ["challenge", "lm-ice-cave", 320, 248, "Ice Cave"], ["goal", "lm-race-gate", 280, 273, "Race Camp"],
      ["igloo", "lm-igloo-hidden", 300, 214, ""],
    ];
    for (const [id, key, w, h, title] of defs) {
      const raw = id === "igloo" ? SCENERY_SPOTS.igloo : id === "fork" ? FUTURE_NODE_SPOTS.forest : NODE_POSITIONS[id];
      const pos = polishPosition({ ...raw, id: id === "challenge" ? "ice-cave" : id === "igloo" ? "secret-igloo" : id });
      const c = this.scene.add.container(pos.x, pos.y).setDepth(11).setVisible(false);
      const image = this.scene.add.image(0, id === "math1" ? 26 : id === "safe" ? 35 : 14, "premium-props",key).setDisplaySize(w,h).setOrigin(.5,id === "math1" || id === "safe" ? .5 : 1).setData("landmark-img",true);
      c.add(image);
      if (title) c.add(this.scene.add.text(0, id === "math1" ? 140 : 34, title, {
        fontFamily: "Georgia", fontSize: "14px", color: "#fff1ce", stroke: "#213c4b", strokeThickness: 4,
      }).setOrigin(0.5));
      this.map.set(id, c);
    }
  }
  get(id: Id): Phaser.GameObjects.Container | undefined { return this.map.get(id); }
  setIglooState(state: "hidden" | "discovered" | "glow"): void {
    const img = this.map.get("igloo")?.list.find(o => o.getData?.("landmark-img")) as Phaser.GameObjects.Image | undefined;
    img?.setTexture("premium-props",`lm-igloo-${state}`).setDisplaySize(300,214);
  }
  repairBridge(animate = true): void {
    if (this.bridgeRepaired) return;
    this.bridgeRepaired = true;
    const img = this.map.get("math1")?.list.find(o => o.getData?.("landmark-img")) as Phaser.GameObjects.Image | undefined;
    if (!img) return;
    if (!animate) { img.setTexture("premium-props","lm-bridge-fixed").setDisplaySize(360,285); return; }
    img.setTexture("premium-props","lm-bridge-repairing").setDisplaySize(360,285);
    this.scene.tweens.add({ targets: img, alpha: 0.7, duration: 300, yoyo: true, repeat: 1 });
    this.scene.time.delayedCall(1150, () => {
      if (img.active) img.setTexture("premium-props","lm-bridge-fixed").setDisplaySize(360,285).setAlpha(1);
    });
  }
  addBridgeForeground():void {
    if(this.scene.children.getByName("bridge-front-edge"))return;
    clippedForeground(this.scene,"bridge-front-edge","premium-props","lm-bridge-fixed",640,413.5,360,285,
      [[640,640],[690,618],[760,598],[820,582],[880,562],[950,540],[1000,550],[1000,700],[640,700]]).setName("bridge-front-edge");
  }

  get repaired(): boolean { return this.bridgeRepaired; }
}
