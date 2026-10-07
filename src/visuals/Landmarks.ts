import Phaser from "phaser";
import { MapNodeId, nodes } from "../systems/MapGraph";

export function preloadLandmarks(scene: Phaser.Scene): void {
  const svg = (key: string, file: string, w: number, h: number) =>
    scene.load.svg(key, `assets/landmarks/${file}`, { width: w, height: h });
  svg("lm-trailhead", "trailhead.svg", 160, 150);
  svg("lm-bridge-broken", "bridge-broken.svg", 180, 130);
  svg("lm-bridge-fixed", "bridge-fixed.svg", 180, 130);
  svg("lm-fork", "fork-sign.svg", 150, 150);
  svg("lm-shelter", "shelter.svg", 170, 150);
  svg("lm-ice", "ice-cave.svg", 160, 160);
  svg("lm-gate", "race-gate.svg", 200, 150);
  svg("lm-igloo", "igloo.svg", 150, 130);
}

type LandmarkDef = {
  key: string;
  scale: number;
  /** vertical nudge so the landmark's base sits on the terrain nicely */
  yOff: number;
  idle: "sway" | "glow" | "twinkle" | "none";
};

/**
 * Illustrated environmental landmarks, one per map node.
 * Containers are centered on the MapGraph node coordinates so the
 * existing gameplay (targets, hit areas, reveal flow) keeps working.
 */
export class Landmarks {
  private map = new Map<MapNodeId | "igloo", Phaser.GameObjects.Container>();
  private bridgeRepaired = false;

  constructor(private scene: Phaser.Scene) {}

  buildAll(): void {
    const defs: Record<MapNodeId | "igloo", LandmarkDef> = {
      start: { key: "lm-trailhead", scale: 0.95, yOff: -8, idle: "none" },
      math1: { key: "lm-bridge-broken", scale: 1.05, yOff: -6, idle: "none" },
      fork: { key: "lm-fork", scale: 0.95, yOff: -10, idle: "sway" },
      safe: { key: "lm-shelter", scale: 1.0, yOff: -8, idle: "glow" },
      challenge: { key: "lm-ice", scale: 0.95, yOff: -6, idle: "twinkle" },
      goal: { key: "lm-gate", scale: 1.05, yOff: -8, idle: "sway" },
      igloo: { key: "lm-igloo", scale: 0.9, yOff: -4, idle: "twinkle" },
    };

    (Object.keys(defs) as Array<MapNodeId | "igloo">).forEach((id) => {
      const def = defs[id];
      const pos = id === "igloo" ? { x: 1080, y: 196 } : nodes[id as MapNodeId];
      const c = this.scene.add.container(pos.x, pos.y + def.yOff).setDepth(6);

      // soft ground shadow anchors the landmark in the world
      const shadow = this.scene.add.ellipse(0, 52 * def.scale, 120 * def.scale, 22 * def.scale, 0x9db8d6, 0.35);
      const img = this.scene.add.image(0, 0, def.key).setScale(def.scale);
      img.setData("landmark-img", true);
      c.add([shadow, img]);

      if (def.idle === "sway") {
        this.scene.tweens.add({
          targets: img,
          angle: 1.6,
          duration: 2400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      } else if (def.idle === "glow") {
        const glow = this.scene.add.image(0, 6, "soft-blob").setTint(0xffd97a).setScale(1.6).setAlpha(0.35);
        c.add(glow);
        c.sendToBack(glow);
        this.scene.tweens.add({
          targets: glow,
          alpha: { from: 0.28, to: 0.45 },
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      } else if (def.idle === "twinkle") {
        const tw = this.scene.add.image(30 * def.scale, -58 * def.scale, "sparkle").setScale(0.5).setAlpha(0);
        c.add(tw);
        this.scene.tweens.add({
          targets: tw,
          alpha: { from: 0, to: 0.9 },
          scale: { from: 0.35, to: 0.65 },
          duration: 1400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
          delay: Phaser.Math.Between(0, 1200),
        });
      }

      // gameplay nodes start hidden until revealed; the igloo is handled separately
      if (id !== "igloo") {
        const node = nodes[id as MapNodeId];
        c.setVisible(node.revealed);
        c.setAlpha(node.id === "start" ? 1 : 0.96);
      } else {
        c.setVisible(false);
      }
      this.map.set(id, c);
    });
  }

  get(id: MapNodeId | "igloo"): Phaser.GameObjects.Container | undefined {
    return this.map.get(id);
  }

  /** Math solved at the bridge: swap broken -> fixed with a celebration. */
  repairBridge(): void {
    if (this.bridgeRepaired) return;
    this.bridgeRepaired = true;
    const c = this.map.get("math1");
    if (!c) return;

    const broken = c.list.find((o) => o.getData?.("landmark-img") === true) as
      | Phaser.GameObjects.Image
      | undefined;
    const oldImg = broken ?? (c.list[1] as Phaser.GameObjects.Image);

    // sparkle burst over the bridge
    for (let i = 0; i < 14; i++) {
      const s = this.scene.add.image(
        c.x + Phaser.Math.Between(-80, 80),
        c.y + Phaser.Math.Between(-60, 30),
        "sparkle",
      ).setScale(0.4).setDepth(14);
      this.scene.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(30, 70),
        alpha: 0,
        scale: 0.9,
        duration: Phaser.Math.Between(600, 1000),
        delay: Phaser.Math.Between(0, 300),
        onComplete: () => s.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: oldImg,
      alpha: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 420,
      ease: "Sine.in",
      onComplete: () => {
        oldImg.destroy();
        const fixed = this.scene.add.image(0, 0, "lm-bridge-fixed").setScale(0.6).setAlpha(0);
        c.add(fixed);
        this.scene.tweens.add({
          targets: fixed,
          scale: 1.05,
          alpha: 1,
          duration: 650,
          ease: "Back.out",
        });
      },
    });
  }

  get repaired(): boolean {
    return this.bridgeRepaired;
  }
}
