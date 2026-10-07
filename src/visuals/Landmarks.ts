import Phaser from "phaser";
import { MapNodeId } from "../systems/MapGraph";
import { NODE_POSITIONS, SCENERY_SPOTS } from "../worlds/husky/HuskyWorldLayout";

const ASSET_DIR = "assets/worlds/husky";

export function preloadLandmarks(scene: Phaser.Scene): void {
  const svg = (key: string, file: string, w: number, h: number) =>
    scene.load.svg(key, `${ASSET_DIR}/${file}`, { width: w, height: h });
  // gameplay landmarks
  svg("wlm-trailhead", "trailhead-arch.svg", 220, 190);
  svg("wlm-bridge-broken", "bridge-broken.svg", 240, 150);
  svg("wlm-bridge-fixed", "bridge-fixed.svg", 240, 150);
  svg("wlm-cave", "cave-mouth.svg", 220, 200);
  svg("wlm-hut", "lake-hut.svg", 200, 170);
  svg("wlm-camp", "race-camp.svg", 320, 200);
  // scenery (visual-only, never interactive)
  svg("wlm-arch", "snowpass-arch.svg", 260, 220);
  svg("wlm-flag", "summit-flag.svg", 120, 200);
  svg("wlm-falls", "waterfall-frozen.svg", 180, 240);
  svg("wlm-shard", "star-shard.svg", 80, 100);
  svg("wlm-pine-tall", "pine-tall.svg", 160, 220);
  svg("wlm-pine-wide", "pine-wide.svg", 180, 200);
  svg("wlm-pine-snowy", "pine-snowy.svg", 170, 210);
  svg("wlm-rock-ice", "rock-ice.svg", 160, 120);
  svg("wlm-rock-snow", "rock-snow.svg", 170, 110);
  // legacy fork sign + igloo art (still good, kept from the first pass)
  scene.load.svg("lm-fork", "assets/landmarks/fork-sign.svg", { width: 150, height: 150 });
  scene.load.svg("lm-igloo", "assets/landmarks/igloo.svg", { width: 150, height: 130 });
}

type LandmarkDef = {
  key: string;
  scale: number;
  /** vertical nudge so the landmark's base sits on the terrain nicely */
  yOff: number;
  idle: "sway" | "glow" | "twinkle" | "none";
};

type SceneryDef = {
  key: string;
  x: number;
  y: number;
  scale: number;
  depth: number;
  alpha: number;
  idle: "sway" | "twinkle" | "float" | "none";
};

/**
 * Illustrated environmental landmarks, one per map node, plus visual-only
 * scenery for the wider world (Snow Pass arch, summit flag, frozen waterfall
 * overlook, secret igloo). Containers are centered on the MapGraph node
 * coordinates so the existing gameplay (targets, hit areas, reveal flow)
 * keeps working.
 *
 * Scenery pieces are NOT gameplay nodes: they are never interactive and never
 * enter nodeObjects. Their positions are documented in HuskyWorldLayout for
 * McCartney's future progression nodes.
 */
export class Landmarks {
  private map = new Map<MapNodeId | "igloo", Phaser.GameObjects.Container>();
  private bridgeRepaired = false;

  constructor(private scene: Phaser.Scene) {}

  buildAll(): void {
    const defs: Record<MapNodeId | "igloo", LandmarkDef> = {
      start: { key: "wlm-trailhead", scale: 1.0, yOff: -10, idle: "none" },
      math1: { key: "wlm-bridge-broken", scale: 1.15, yOff: -8, idle: "none" },
      fork: { key: "lm-fork", scale: 1.0, yOff: -10, idle: "sway" },
      safe: { key: "wlm-hut", scale: 1.05, yOff: -8, idle: "glow" },
      challenge: { key: "wlm-cave", scale: 1.2, yOff: -6, idle: "twinkle" },
      goal: { key: "wlm-camp", scale: 1.15, yOff: -10, idle: "sway" },
      igloo: { key: "lm-igloo", scale: 1.0, yOff: -4, idle: "twinkle" },
    };

    (Object.keys(defs) as Array<MapNodeId | "igloo">).forEach((id) => {
      const def = defs[id];
      const pos =
        id === "igloo"
          ? { x: SCENERY_SPOTS.igloo.x, y: SCENERY_SPOTS.igloo.y }
          : NODE_POSITIONS[id as MapNodeId];
      const c = this.scene.add.container(pos.x, pos.y + def.yOff).setDepth(6);

      // soft ground shadow anchors the landmark in the world
      const shadow = this.scene.add.ellipse(0, 52 * def.scale, 120 * def.scale, 22 * def.scale, 0x9db8d6, 0.35);
      const img = this.scene.add.image(0, 0, def.key).setScale(def.scale);
      img.setData("landmark-img", true);
      c.add([shadow, img]);

      this.applyIdle(c, img, def);

      // gameplay nodes start hidden until revealed; the igloo is handled separately
      if (id !== "igloo") {
        c.setVisible(false);
        c.setAlpha(0.96);
      } else {
        c.setVisible(false);
      }
      this.map.set(id, c);
    });

    // visibility is owned by HuskyScene (mapNodes reveal state)
    this.map.get("start")?.setAlpha(1);

    this.buildScenery();
  }

  private applyIdle(
    c: Phaser.GameObjects.Container,
    img: Phaser.GameObjects.Image,
    def: Pick<LandmarkDef, "idle" | "scale">,
  ): void {
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
  }

  /**
   * Visual-only scenery. Modular by design: each piece marks an intended
   * future location (see HuskyWorldLayout.FUTURE_NODE_SPOTS). Not interactive.
   */
  private buildScenery(): void {
    const defs: SceneryDef[] = [
      // Snow Pass: natural ice arch the trail threads through
      { key: "wlm-arch", x: SCENERY_SPOTS.snowPassArch.x, y: SCENERY_SPOTS.snowPassArch.y, scale: 1.0, depth: 5, alpha: 1, idle: "none" },
      // Summit checkpoint flag (future Summit Camp encounter site)
      { key: "wlm-flag", x: SCENERY_SPOTS.summitFlag.x, y: SCENERY_SPOTS.summitFlag.y, scale: 1.0, depth: 5, alpha: 1, idle: "sway" },
      // Optional discovery branch: frozen waterfall overlook (dead-end, bonus only)
      { key: "wlm-falls", x: SCENERY_SPOTS.waterfallOverlook.x, y: SCENERY_SPOTS.waterfallOverlook.y, scale: 1.0, depth: 4, alpha: 1, idle: "none" },
      // Bonus star shard hovering by the overlook — visual only, reward TBD
      { key: "wlm-shard", x: SCENERY_SPOTS.waterfallOverlook.x + 130, y: SCENERY_SPOTS.waterfallOverlook.y - 40, scale: 0.9, depth: 7, alpha: 1, idle: "float" },
    ];

    for (const def of defs) {
      const img = this.scene.add.image(def.x, def.y, def.key)
        .setScale(def.scale)
        .setDepth(def.depth)
        .setAlpha(def.alpha);
      if (def.idle === "sway") {
        this.scene.tweens.add({
          targets: img, angle: 1.4, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.inOut",
        });
      } else if (def.idle === "float") {
        this.scene.tweens.add({
          targets: img, y: def.y - 14, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.inOut",
        });
        this.scene.tweens.add({
          targets: img, angle: 8, duration: 2400, yoyo: true, repeat: -1, ease: "Sine.inOut",
        });
      }
    }
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
        const fixed = this.scene.add.image(0, 0, "wlm-bridge-fixed").setScale(0.6).setAlpha(0);
        c.add(fixed);
        this.scene.tweens.add({
          targets: fixed,
          scale: 1.15,
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
