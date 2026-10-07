import Phaser from "phaser";
import { MathEngine, MathQuestion } from "../systems/MathEngine";
import { edges, MapNodeId, nodes, RouteKind } from "../systems/MapGraph";
import { SnowyWorld } from "../visuals/SnowyWorld";
import { KikiSprite, preloadKiki } from "../visuals/KikiSprite";
import { Landmarks, preloadLandmarks } from "../visuals/Landmarks";
import { DiscoveryFog, FogZone } from "../visuals/DiscoveryFog";

type RouteVisual = {
  edge: (typeof edges)[number];
  graphics: Phaser.GameObjects.Graphics;
};

export class HuskyScene extends Phaser.Scene {
  private math = new MathEngine();
  private currentNode: MapNodeId = "start";
  private kiki!: Phaser.GameObjects.Container;
  private kikiSprite!: KikiSprite;
  private landmarks!: Landmarks;
  private fog!: DiscoveryFog;
  private routeVisuals: RouteVisual[] = [];
  private nodeObjects = new Map<MapNodeId, Phaser.GameObjects.Container>();
  private nodeBaseY = new Map<MapNodeId, number>();
  private busy = false;
  private prompt?: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;
  private discoveredIgloo = false;

  constructor() {
    super("HuskyScene");
  }

  preload(): void {
    preloadKiki(this);
    preloadLandmarks(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#9fd4f5");

    // layered illustrated world (purely decorative)
    new SnowyWorld(this).build();

    this.drawTitlePlaque();
    this.drawRoutes();
    this.buildLandmarks();
    this.buildFog();
    this.buildKiki();
    this.buildIglooOccluders();

    const pill = this.add.graphics().setDepth(20);
    pill.fillStyle(0x17324d, 0.82);
    pill.fillRoundedRect(640 - 190, 668, 380, 40, 20);
    this.status = this.add.text(640, 688, "Explore Snowy Peaks", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5).setDepth(21);

    this.time.delayedCall(450, () => this.highlightForwardChoices());
  }

  private drawTitlePlaque(): void {
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x8d5a32, 0.95);
    g.lineStyle(3, 0x5a3a1e, 1);
    g.fillRoundedRect(232, 18, 208, 58, 12);
    g.strokeRoundedRect(232, 18, 208, 58, 12);
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(240, 24, 192, 10, 5);
    this.add.text(336, 42, "SNOWY PEAKS", {
      fontFamily: "Arial Black, Arial",
      fontSize: "21px",
      color: "#fff6e3",
    }).setOrigin(0.5).setDepth(10);
    this.add.text(336, 63, "Husky Adventure", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#ffe9c4",
    }).setOrigin(0.5).setDepth(10);
  }

  /** Route paths (safe = packed snow, challenge = ice). Gameplay-neutral. */
  private drawRoutes(): void {
    for (const edge of edges) {
      const graphics = this.add.graphics().setDepth(4);
      this.routeVisuals.push({ edge, graphics });
      this.redrawEdge(edge.from, edge.to, edge.kind, graphics, false);
    }
  }

  private buildLandmarks(): void {
    this.landmarks = new Landmarks(this);
    this.landmarks.buildAll();
    (Object.keys(nodes) as MapNodeId[]).forEach((id) => {
      const c = this.landmarks.get(id);
      if (c) {
        this.nodeObjects.set(id, c);
        this.nodeBaseY.set(id, c.y);
      }
    });
  }

  private buildFog(): void {
    this.fog = new DiscoveryFog(this);
    this.fog.buildZone("middle", 760, 390, 500, 500);
    this.fog.buildZone("right", 1110, 390, 300, 500);
  }

  private buildKiki(): void {
    const start = this.getKikiTarget("start");
    this.kikiSprite = new KikiSprite(this, start.x, start.y);
    this.kiki = this.kikiSprite.container;
  }

  /** Pines that half-hide the secret igloo until the right side reveals. */
  private buildIglooOccluders(): void {
    const p1 = this.add.image(992, 218, "pine").setScale(1.15).setDepth(7);
    const p2 = this.add.image(1168, 206, "pine").setScale(1.32).setDepth(7);
    p1.setAlpha(0.98);
    p2.setAlpha(0.98);
  }

  private redrawEdge(
    fromId: MapNodeId,
    toId: MapNodeId,
    kind: RouteKind,
    graphics: Phaser.GameObjects.Graphics,
    highlighted: boolean,
  ): void {
    const from = nodes[fromId];
    const to = nodes[toId];
    const visible = from.revealed && to.revealed;

    graphics.clear();
    if (!visible) return;

    const cx = (from.x + to.x) / 2;
    const cy = Math.min(from.y, to.y) - (kind === "challenge" ? 70 : 24);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(from.x, from.y),
      new Phaser.Math.Vector2(cx, cy),
      new Phaser.Math.Vector2(to.x, to.y),
    );
    const points = curve.getPoints(30);

    if (kind === "challenge") {
      // icy shortcut: pale-blue ice ribbon with golden crystal flecks
      graphics.lineStyle(highlighted ? 22 : 16, 0xa8d8f8, highlighted ? 0.9 : 0.6);
      graphics.strokePoints(points, false, false);
      graphics.lineStyle(highlighted ? 12 : 9, 0xeaf7ff, highlighted ? 0.95 : 0.75);
      graphics.strokePoints(points, false, false);
      for (let i = 5; i < points.length - 2; i += 6) {
        const p = points[i];
        graphics.fillStyle(0xffd24d, highlighted ? 0.95 : 0.6);
        graphics.fillCircle(p.x, p.y - 7, highlighted ? 4 : 3);
      }
    } else {
      // safe trail: packed snow with a soft blue edge + paw footprints
      graphics.lineStyle(highlighted ? 32 : 26, 0xbcd9f2, highlighted ? 0.85 : 0.55);
      graphics.strokePoints(points, false, false);
      graphics.lineStyle(highlighted ? 22 : 17, 0xffffff, highlighted ? 0.95 : 0.8);
      graphics.strokePoints(points, false, false);
      for (let i = 4; i < points.length - 3; i += 4) {
        const p = points[i];
        const q = points[Math.min(i + 2, points.length - 1)];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const side = (i / 4) % 2 === 0 ? 1 : -1;
        graphics.fillStyle(0xcfe6f7, highlighted ? 0.9 : 0.55);
        graphics.fillEllipse(p.x + (-dy / len) * 8 * side, p.y + (dx / len) * 8 * side, 7, 5);
      }
    }
  }

  private highlightForwardChoices(): void {
    this.clearHighlights();
    if (this.busy) return;

    const forward = edges.filter((e) => e.from === this.currentNode && nodes[e.to].revealed);
    if (forward.length === 0) {
      if (this.currentNode === "goal") {
        this.status.setText("Race unlocked — get ready!");
        this.time.delayedCall(700, () => this.scene.start("RaceScene"));
      }
      return;
    }

    for (const choice of forward) {
      const visual = this.routeVisuals.find((v) => v.edge === choice);
      if (visual) this.redrawEdge(choice.from, choice.to, choice.kind, visual.graphics, true);
      const nodeObj = this.nodeObjects.get(choice.to);
      if (!nodeObj) continue;

      nodeObj.setAlpha(1);
      const arrow = this.add.triangle(
        nodeObj.x,
        nodeObj.y - 108,
        -11, 0,
        11, 0,
        0, 16,
        choice.kind === "challenge" ? 0xffd24d : 0xffffff,
        1,
      ).setStrokeStyle(3, choice.kind === "challenge" ? 0x7b55b2 : 0x2f78aa, 1)
        .setDepth(18)
        .setData("route-arrow", true);

      this.tweens.add({
        targets: [nodeObj, arrow],
        y: "-=7",
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });

      nodeObj.setSize(130, 130);
      // NOTE: Container.displayOrigin is width/2,height/2 and Phaser's hit
      // test adds it to the local point, so the circle must be centered at
      // (65,65) — a circle at (0,0) can never be hit.
      nodeObj.setInteractive(new Phaser.Geom.Circle(65, 65, 56), Phaser.Geom.Circle.Contains);
      nodeObj.once("pointerdown", () => this.takeRoute(choice.to, choice.kind));
    }

    if (forward.length > 1) {
      this.status.setText("Choose Kiki's path");
    } else {
      this.status.setText("Follow the arrow");
    }
  }

  private async takeRoute(to: MapNodeId, kind: RouteKind): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.disableAllNodes();
    this.clearHighlights();

    if (this.currentNode === "start" && to === "math1") {
      const ok = await this.runMathEncounter("normal", "A broken bridge blocks the trail.");
      if (!ok) {
        this.busy = false;
        this.highlightForwardChoices();
        return;
      }
      // math visibly repairs the world before Kiki crosses
      this.landmarks.repairBridge();
      this.kikiSprite.celebrate();
      this.status.setText("The bridge is fixed!");
      await this.delay(1000);
    }

    if (this.currentNode === "fork" && kind === "challenge") {
      const ok = await this.runMathEncounter("challenge", "Ice Shortcut Challenge");
      if (!ok) {
        this.busy = false;
        this.highlightForwardChoices();
        return;
      }
    }

    await this.walkKiki(to);

    this.currentNode = to;

    if (to === "math1") {
      this.revealFogZone("middle");
      this.revealNode("fork");
    } else if (to === "fork") {
      this.revealNode("safe");
      this.revealNode("challenge");
    } else if (to === "safe" || to === "challenge") {
      this.revealFogZone("right").then(() => this.revealIgloo());
      this.revealNode("goal");
    }

    this.busy = false;
    this.highlightForwardChoices();
  }

  private walkKiki(to: MapNodeId): Promise<void> {
    const target = this.getKikiTarget(to);
    this.status.setText("Kiki is walking…");
    this.kikiSprite.setWalking(true);

    return new Promise((resolve) => {
      const startX = this.kiki.x;
      const flip = target.x < startX;
      this.kiki.setScale(flip ? -1 : 1, 1);

      this.tweens.add({
        targets: this.kiki,
        x: target.x,
        y: target.y,
        duration: 2200,
        ease: "Sine.inOut",
        onComplete: () => {
          this.kiki.setScale(1, 1);
          this.kikiSprite.setWalking(false);
          this.tweens.add({
            targets: this.kiki,
            scaleX: 1.08,
            scaleY: 1.08,
            yoyo: true,
            duration: 180,
            repeat: 1,
            onComplete: () => {
              this.kiki.setScale(1, 1);
              resolve();
            },
          });
        },
      });

      const stepEvent = this.time.addEvent({
        delay: 320,
        repeat: 5,
        callback: () => {
          const puff = this.add.circle(this.kiki.x - 20, this.kiki.y + 34, 6, 0xffffff, 0.7).setDepth(13);
          this.tweens.add({
            targets: puff,
            alpha: 0,
            scale: 2,
            duration: 450,
            onComplete: () => puff.destroy(),
          });
        },
      });

      this.time.delayedCall(2250, () => stepEvent.remove(false));
    });
  }

  private getKikiTarget(id: MapNodeId): { x: number; y: number } {
    const node = nodes[id];
    // Kiki stands beside each landmark, never on top of it
    const offsets: Partial<Record<MapNodeId, { x: number; y: number }>> = {
      start: { x: -108, y: -2 },
      math1: { x: -118, y: -6 },
      fork: { x: -64, y: 24 },
      safe: { x: -98, y: 8 },
      challenge: { x: -92, y: 20 },
      goal: { x: -124, y: 12 },
    };
    const offset = offsets[id] ?? { x: 0, y: -26 };
    return { x: node.x + offset.x, y: node.y + offset.y };
  }

  private revealFogZone(zone: FogZone): Promise<void> {
    return this.fog.reveal(zone);
  }

  /** The secret igloo fades in quietly once the right side is discovered. */
  private revealIgloo(): void {
    const igloo = this.landmarks.get("igloo");
    if (!igloo || igloo.visible) return;
    igloo.setVisible(true).setAlpha(0);
    this.tweens.add({
      targets: igloo,
      alpha: 0.96,
      duration: 900,
      ease: "Sine.out",
      onComplete: () => {
        igloo.setInteractive(new Phaser.Geom.Circle(0, 0, 58), Phaser.Geom.Circle.Contains);
        igloo.on("pointerdown", () => this.onIglooClick());
      },
    });
  }

  private onIglooClick(): void {
    const igloo = this.landmarks.get("igloo");
    if (!igloo) return;
    for (let i = 0; i < 10; i++) {
      const s = this.add.image(
        igloo.x + Phaser.Math.Between(-50, 50),
        igloo.y + Phaser.Math.Between(-40, 40),
        "sparkle",
      ).setScale(0.45).setDepth(14);
      this.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(24, 60),
        alpha: 0,
        duration: Phaser.Math.Between(500, 900),
        onComplete: () => s.destroy(),
      });
    }
    if (!this.discoveredIgloo) {
      this.discoveredIgloo = true;
      this.status.setText("You found the secret igloo!");
      this.tweens.add({
        targets: igloo,
        scale: 1.07,
        duration: 220,
        yoyo: true,
        repeat: 1,
        ease: "Sine.inOut",
      });
    }
  }

  private revealNode(id: MapNodeId): void {
    if (nodes[id].revealed) return;
    nodes[id].revealed = true;

    const obj = this.nodeObjects.get(id);
    if (obj) {
      obj.setVisible(true).setAlpha(0).setScale(0.75);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        scale: 1,
        duration: 650,
        ease: "Back.out",
      });
    }

    for (const v of this.routeVisuals) {
      if (v.edge.from === id || v.edge.to === id) {
        this.redrawEdge(v.edge.from, v.edge.to, v.edge.kind, v.graphics, false);
      }
    }

    const fog = this.add.circle(nodes[id].x, nodes[id].y, 110, 0xffffff, 0.95).setDepth(14);
    this.tweens.add({
      targets: fog,
      alpha: 0,
      scale: 1.7,
      duration: 850,
      onComplete: () => fog.destroy(),
    });
  }

  private runMathEncounter(difficulty: "normal" | "challenge", title: string): Promise<boolean> {
    return new Promise((resolve) => {
      const q = this.math.nextQuestion(difficulty);
      this.showMathPrompt(q, title, resolve);
    });
  }

  private showMathPrompt(
    q: MathQuestion,
    title: string,
    resolve: (value: boolean) => void,
  ): void {
    this.prompt?.destroy(true);

    const c = this.add.container(640, 360).setDepth(100);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x0d2235, 0.58);
    const panelG = this.add.graphics();
    panelG.fillStyle(0xfffbef, 1);
    panelG.lineStyle(7, q.difficulty === "challenge" ? 0x7a4ab2 : 0x3f83b9, 1);
    panelG.fillRoundedRect(-310, -215, 620, 430, 30);
    panelG.strokeRoundedRect(-310, -215, 620, 430, 30);

    const header = this.add.text(0, -158, title, {
      fontFamily: "Arial Black, Arial",
      fontSize: "26px",
      color: q.difficulty === "challenge" ? "#64359a" : "#1b5d8b",
      align: "center",
      wordWrap: { width: 520 },
    }).setOrigin(0.5);

    const prompt = this.add.text(0, -80, q.prompt, {
      fontFamily: "Arial Black, Arial",
      fontSize: "58px",
      color: "#17324d",
    }).setOrigin(0.5);

    c.add([shade, panelG, header, prompt]);

    q.answers.forEach((answer, index) => {
      const x = index % 2 === 0 ? -150 : 150;
      const y = 40 + Math.floor(index / 2) * 110;
      const btn = this.add.rectangle(x, y, 240, 76, index % 2 === 0 ? 0x4ca7e6 : 0xf2bd43, 1)
        .setStrokeStyle(4, 0xffffff, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, String(answer), {
        fontFamily: "Arial Black, Arial",
        fontSize: "34px",
        color: "#ffffff",
        stroke: "#17324d",
        strokeThickness: 4,
      }).setOrigin(0.5);

      btn.on("pointerdown", () => {
        if (answer === q.correct) {
          this.status.setText("Correct!");
          c.destroy(true);
          this.prompt = undefined;
          resolve(true);
        } else {
          this.cameras.main.shake(120, 0.004);
          label.setColor("#ffdddd");
          this.time.delayedCall(280, () => label.setColor("#ffffff"));
        }
      });

      c.add([btn, label]);
    });

    this.prompt = c;
  }

  private clearHighlights(): void {
    for (const visual of this.routeVisuals) {
      this.redrawEdge(
        visual.edge.from,
        visual.edge.to,
        visual.edge.kind,
        visual.graphics,
        false,
      );
    }

    for (const [id, node] of this.nodeObjects) {
      this.tweens.killTweensOf(node);
      node.setScale(1);
      const baseY = this.nodeBaseY.get(id);
      if (baseY !== undefined) node.y = baseY;
      node.disableInteractive();
    }

    this.children.list
      .filter((child) => child.getData && child.getData("route-arrow"))
      .forEach((child) => child.destroy());
  }

  private disableAllNodes(): void {
    for (const node of this.nodeObjects.values()) {
      node.disableInteractive();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, () => resolve());
    });
  }
}
