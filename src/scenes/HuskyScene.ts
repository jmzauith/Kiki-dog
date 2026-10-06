import Phaser from "phaser";
import { MathEngine, MathQuestion } from "../systems/MathEngine";
import { edges, MapNodeId, nodes, RouteKind } from "../systems/MapGraph";

type RouteVisual = {
  edge: (typeof edges)[number];
  graphics: Phaser.GameObjects.Graphics;
};

export class HuskyScene extends Phaser.Scene {
  private math = new MathEngine();
  private currentNode: MapNodeId = "start";
  private kiki!: Phaser.GameObjects.Container;
  private routeVisuals: RouteVisual[] = [];
  private nodeObjects = new Map<MapNodeId, Phaser.GameObjects.Container>();
  private busy = false;
  private prompt?: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super("HuskyScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#dff3ff");
    this.drawEnvironment();
    this.drawTitle();
    this.drawGraph();
    this.createKiki();
    this.status = this.add.text(28, 676, "Explore Snowy Peaks", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#17324d",
      backgroundColor: "#ffffffcc",
      padding: { x: 14, y: 8 },
    }).setDepth(20);

    this.time.delayedCall(450, () => this.highlightForwardChoices());
  }

  private drawEnvironment(): void {
    const g = this.add.graphics();
    g.fillStyle(0xcaf0ff, 1);
    g.fillRect(0, 0, 1280, 720);

    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(50, 115, 1180, 520, 36);

    g.fillStyle(0xe6f7ff, 1);
    g.fillEllipse(260, 215, 500, 230);
    g.fillEllipse(780, 170, 620, 250);
    g.fillEllipse(1080, 260, 400, 230);

    g.fillStyle(0x9bd7ef, 1);
    g.fillTriangle(120, 360, 320, 120, 500, 360);
    g.fillTriangle(430, 365, 720, 85, 970, 365);
    g.fillTriangle(790, 380, 1050, 135, 1220, 380);

    g.fillStyle(0xf7fcff, 1);
    g.fillTriangle(188, 278, 320, 120, 398, 278);
    g.fillTriangle(570, 232, 720, 85, 840, 232);
    g.fillTriangle(932, 252, 1050, 135, 1130, 252);

    for (let i = 0; i < 24; i++) {
      const x = 90 + (i * 47) % 1100;
      const y = 240 + ((i * 83) % 330);
      this.drawPine(x, y, 0.75 + ((i % 4) * 0.08));
    }

    this.add.rectangle(640, 70, 1280, 140, 0x59b9ef, 0.28);
  }

  private drawPine(x: number, y: number, s: number): void {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x285a4a, 1);
    g.fillTriangle(x, y - 34 * s, x - 24 * s, y + 10 * s, x + 24 * s, y + 10 * s);
    g.fillStyle(0x2f775e, 1);
    g.fillTriangle(x, y - 18 * s, x - 30 * s, y + 28 * s, x + 30 * s, y + 28 * s);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(x, y - 32 * s, x - 10 * s, y - 12 * s, x + 10 * s, y - 12 * s);
  }

  private drawTitle(): void {
    const banner = this.add.rectangle(250, 62, 430, 84, 0x2d76a8, 0.93)
      .setStrokeStyle(4, 0xffffff, 0.9)
      .setDepth(9);
    this.add.text(48, 34, "SNOWY PEAKS", {
      fontFamily: "Arial Black, Arial",
      fontSize: "40px",
      color: "#ffffff",
      stroke: "#164b71",
      strokeThickness: 6,
    }).setDepth(10);
    this.add.text(50, 81, "Husky Adventure", {
      fontFamily: "Arial",
      fontSize: "19px",
      color: "#eaf8ff",
    }).setDepth(10);
  }

  private drawGraph(): void {
    for (const edge of edges) {
      const graphics = this.add.graphics().setDepth(4);
      this.routeVisuals.push({ edge, graphics });
      this.redrawEdge(edge.from, edge.to, edge.kind, graphics, false);
    }

    for (const node of Object.values(nodes)) {
      const container = this.add.container(node.x, node.y).setDepth(8);

      if (node.id === "start") {
        const paw = this.add.text(0, 18, "PAW TRAILHEAD", {
          fontFamily: "Arial Black, Arial",
          fontSize: "15px",
          color: "#315a77",
          backgroundColor: "#ffffffb8",
          padding: { x: 8, y: 4 },
        }).setOrigin(0.5);
        container.add(paw);
      } else if (node.id === "math1") {
        const postL = this.add.rectangle(-28, 4, 8, 42, 0x8d5a32, 1);
        const postR = this.add.rectangle(28, 4, 8, 42, 0x8d5a32, 1);
        const plank1 = this.add.rectangle(0, -7, 66, 10, 0xb97940, 1).setAngle(-8);
        const plank2 = this.add.rectangle(3, 7, 60, 10, 0xb97940, 1).setAngle(6);
        const gap = this.add.rectangle(0, 1, 12, 34, 0xffffff, 0.85);
        const label = this.add.text(0, 42, "Broken Bridge", {
          fontFamily: "Arial Black, Arial",
          fontSize: "16px",
          color: "#3a5265",
          backgroundColor: "#ffffffcc",
          padding: { x: 8, y: 4 },
        }).setOrigin(0.5);
        container.add([postL, postR, plank1, plank2, gap, label]);
      } else if (node.id === "fork") {
        const pole = this.add.rectangle(0, 0, 9, 56, 0x8d5a32, 1);
        const signL = this.add.rectangle(-34, -12, 58, 20, 0xb97940, 1).setAngle(-8);
        const signR = this.add.rectangle(34, 5, 58, 20, 0xb97940, 1).setAngle(8);
        const cap = this.add.circle(0, -31, 7, 0x6b4325, 1);
        container.add([pole, signL, signR, cap]);
      } else if (node.id === "safe") {
        const trail = this.add.ellipse(0, 0, 74, 40, 0xeaf8ff, 1).setStrokeStyle(4, 0x4a8db8, 0.7);
        const sign = this.add.text(0, 0, "SNOW TRAIL", {
          fontFamily: "Arial Black, Arial",
          fontSize: "15px",
          color: "#2c5d7b",
        }).setOrigin(0.5);
        container.add([trail, sign]);
      } else if (node.id === "challenge") {
        const ice = this.add.ellipse(0, 0, 84, 46, 0xd9f4ff, 1).setStrokeStyle(4, 0x7751b5, 0.85);
        const star = this.add.star(-29, -2, 5, 5, 12, 0xffd24d, 1);
        const sign = this.add.text(12, 0, "SHORTCUT", {
          fontFamily: "Arial Black, Arial",
          fontSize: "14px",
          color: "#65449b",
        }).setOrigin(0.5);
        container.add([ice, star, sign]);
      } else if (node.id === "goal") {
        const flagPole = this.add.rectangle(0, -7, 6, 62, 0x6d8493, 1);
        const flag = this.add.triangle(20, -31, 0, -41, 0, -10, 42, -25, 0xf4c542, 1);
        const label = this.add.text(0, 38, "Sled Race", {
          fontFamily: "Arial Black, Arial",
          fontSize: "16px",
          color: "#5a4a14",
          backgroundColor: "#fff6c8cc",
          padding: { x: 8, y: 4 },
        }).setOrigin(0.5);
        container.add([flagPole, flag, label]);
      }

      container.setVisible(node.revealed);
      container.setAlpha(node.id === "start" ? 1 : 0.92);
      this.nodeObjects.set(node.id, container);
    }
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

    const color = kind === "challenge" ? 0x8e5bda : 0x84b7d6;
    graphics.lineStyle(highlighted ? 10 : 6, color, highlighted ? 0.98 : 0.48);
    const cx = (from.x + to.x) / 2;
    const cy = Math.min(from.y, to.y) - (kind === "challenge" ? 65 : 18);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(from.x, from.y),
      new Phaser.Math.Vector2(cx, cy),
      new Phaser.Math.Vector2(to.x, to.y),
    );
    graphics.strokePoints(curve.getPoints(24), false, false);
  }

  private createKiki(): void {
    this.kiki = this.add.container(nodes.start.x, nodes.start.y - 26).setDepth(15);
    const body = this.add.ellipse(0, 0, 58, 38, 0xd88936, 1).setStrokeStyle(3, 0x8e5227, 1);
    const chest = this.add.ellipse(17, 2, 23, 30, 0xffffff, 1);
    const head = this.add.circle(24, -18, 23, 0xd88936, 1).setStrokeStyle(3, 0x8e5227, 1);
    const blaze = this.add.triangle(25, -26, 18, -39, 31, -39, 25, -10, 0xffffff, 1);
    const ear1 = this.add.triangle(9, -36, 3, -57, 18, -40, 0xd88936, 1);
    const ear2 = this.add.triangle(37, -36, 45, -58, 31, -40, 0xd88936, 1);
    const eye = this.add.circle(31, -20, 3, 0x15202c, 1);
    const nose = this.add.circle(45, -12, 4, 0x15202c, 1);
    this.kiki.add([body, chest, head, blaze, ear1, ear2, eye, nose]);

    const backpack = this.add.rectangle(-15, -17, 24, 24, 0x315c9a, 1).setStrokeStyle(2, 0x1d365e, 1);
    this.kiki.add(backpack);
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
        nodeObj.y - 68,
        -14, 0,
        14, 0,
        0, 20,
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

      nodeObj.setSize(110, 100);
      nodeObj.setInteractive(new Phaser.Geom.Circle(0, 0, 42), Phaser.Geom.Circle.Contains);
      nodeObj.once("pointerdown", () => this.takeRoute(choice.to, choice.kind));
    }

    if (forward.length > 1) {
      this.status.setText("Choose your path");
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
      this.revealNode("fork");
    } else if (to === "fork") {
      this.revealNode("safe");
      this.revealNode("challenge");
    } else if (to === "safe" || to === "challenge") {
      this.revealNode("goal");
    }

    this.busy = false;
    this.highlightForwardChoices();
  }

  private walkKiki(to: MapNodeId): Promise<void> {
    const destination = nodes[to];
    this.status.setText("Kiki is walking…");

    return new Promise((resolve) => {
      const startX = this.kiki.x;
      const startY = this.kiki.y;
      const flip = destination.x < startX;
      this.kiki.setScale(flip ? -1 : 1, 1);

      this.tweens.add({
        targets: this.kiki,
        x: destination.x,
        y: destination.y - 26,
        duration: 2200,
        ease: "Sine.inOut",
        onUpdate: (_tween, target) => {
          const phase = (this.time.now / 120) % Math.PI;
          target.y = Phaser.Math.Linear(startY, destination.y - 26, _tween.progress) + Math.sin(phase) * 4;
        },
        onComplete: () => {
          this.kiki.setScale(1);
          this.tweens.add({
            targets: this.kiki,
            scaleX: 1.08,
            scaleY: 1.08,
            yoyo: true,
            duration: 180,
            repeat: 1,
            onComplete: () => resolve(),
          });
        },
      });

      const stepEvent = this.time.addEvent({
        delay: 320,
        repeat: 5,
        callback: () => {
          const puff = this.add.circle(this.kiki.x - 20, this.kiki.y + 18, 6, 0xffffff, 0.7).setDepth(13);
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
    const panel = this.add.rectangle(0, 0, 620, 430, 0xfffbef, 1).setStrokeStyle(7, q.difficulty === "challenge" ? 0x7a4ab2 : 0x3f83b9, 1);

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

    c.add([shade, panel, header, prompt]);

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

    for (const node of this.nodeObjects.values()) {
      this.tweens.killTweensOf(node);
      node.setScale(1);
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
}