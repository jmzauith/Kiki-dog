import Phaser from "phaser";
import { MathEngine, MathQuestion } from "../systems/MathEngine";
import {
  AdventureEdgeDef,
  AdventureNodeDef,
  AdventureProgress,
  AdventureRoute,
  AdventureRouteKind,
} from "../systems/AdventureState";
import {
  HUSKY_ADVENTURE,
  HUSKY_SAVE_KEY,
  kikiTargetFor,
  LANDMARK_FOR,
} from "../systems/HuskyAdventure";
import {
  clearAdventure,
  loadAdventure,
  saveAdventure,
} from "../systems/AdventurePersistence";
import { AdventureEvents } from "../systems/AdventureEvents";
import { KikiCharacter } from "../systems/KikiCharacter";
import { KikiMover } from "../systems/KikiMover";
import { SnowyWorld } from "../visuals/SnowyWorld";
import { Landmarks, preloadLandmarks } from "../visuals/Landmarks";
import { AdventureMarkers } from "../visuals/AdventureMarkers";
import { DiscoveryFog, FogZone } from "../visuals/DiscoveryFog";

import { CAMERA, FOG_ZONES, SCENERY_SPOTS, WORLD_W, WORLD_H } from "../worlds/husky/HuskyWorldLayout";

type RouteVisual = {
  edge: AdventureEdgeDef;
  graphics: Phaser.GameObjects.Graphics;
};

/**
 * HuskyScene — renders the Snowy Peaks mini-adventure.
 *
 * Progression is driven by AdventureProgress (see systems/AdventureState.ts),
 * NOT hardcoded here: this scene asks the adventure what is unlocked, runs
 * the encounter for the node Kiki arrives at, records completion, and saves.
 * The same flow will drive future dog worlds with a different definition.
 *
 * Visual systems (Harrison's SnowyWorld/Landmarks/DiscoveryFog, Ringo's
 * KikiCharacter/KikiMover) are used as-is; new gameplay nodes that have no
 * dedicated art yet get lightweight placeholder markers (AdventureMarkers).
 */
export class HuskyScene extends Phaser.Scene {
  private math = new MathEngine();
  private adventure!: AdventureProgress;
  private nodeDefs = new Map<string, AdventureNodeDef>();
  private kiki!: KikiCharacter;
  private mover!: KikiMover;
  private landmarks!: Landmarks;
  private markers!: AdventureMarkers;
  private fog!: DiscoveryFog;
  private routeVisuals: RouteVisual[] = [];
  private nodeObjects = new Map<string, Phaser.GameObjects.Container>();
  private nodeBaseY = new Map<string, number>();
  private busy = false;
  private prompt?: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super("HuskyScene");
  }

  preload(): void {
    KikiCharacter.preload(this);
    preloadLandmarks(this);
  }

  create(data?: { fresh?: boolean }): void {
    // Phaser reuses Scene instances, so reset every mutable run-specific field.
    this.busy = false;
    this.prompt = undefined;
    this.routeVisuals = [];
    this.nodeObjects.clear();
    this.nodeBaseY.clear();
    this.nodeDefs = new Map(HUSKY_ADVENTURE.nodes.map((n) => [n.id, n]));

    // Progress: restore the saved run, or start fresh.
    if (data?.fresh) clearAdventure(HUSKY_SAVE_KEY);
    this.adventure =
      loadAdventure(HUSKY_SAVE_KEY, HUSKY_ADVENTURE) ?? new AdventureProgress(HUSKY_ADVENTURE);
    // The trailhead checkpoint is where every run begins.
    if (!this.adventure.isComplete("trailhead")) {
      this.adventure.completeEncounter("trailhead");
      this.saveProgress();
    }

    this.cameras.main.setBackgroundColor("#9fd4f5");
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H).setScroll(0, 0);
    new SnowyWorld(this).build();

    this.drawTitlePlaque();
    this.drawRoutes();
    this.buildLandmarks();
    this.buildMarkers();
    this.buildFog();
    this.buildKiki();
    this.buildIglooOccluders();
    this.buildResetButton();

    const pill = this.add.graphics().setDepth(20).setScrollFactor(0);
    pill.fillStyle(0x17324d, 0.82);
    pill.fillRoundedRect(450, 668, 380, 40, 20);
    this.status = this.add.text(640, 688, "Explore Snowy Peaks", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

    this.applyProgressToVisuals();
    this.setupCamera();

    // Returning from a won race: time for the sticker reward.
    if (this.adventure.canUnlockSticker()) {
      this.time.delayedCall(700, () => this.showRewardOverlay());
      return;
    }
    this.time.delayedCall(450, () => this.highlightForwardChoices());
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.panEffect.reset();
    cam.startFollow(this.kiki.container, false, CAMERA.followLerpX, CAMERA.followLerpY);
    cam.setFollowOffset(CAMERA.lookAheadX, CAMERA.lookAheadY);
  }

  private showDestination(obj: Phaser.GameObjects.Container): void {
    const cam = this.cameras.main;
    const x = obj.x - cam.scrollX;
    if (x < 100 || x > 1150) {
      cam.stopFollow();
      cam.pan(obj.x - 200, 360, 850, Phaser.Math.Easing.Sine.InOut, true);
    }
  }

  private pinOverlay(c: Phaser.GameObjects.Container): void {
    c.setScrollFactor(0);
    c.iterate((child: Phaser.GameObjects.GameObject) => {
      (child as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0);
    });
  }

  private saveProgress(): void {
    saveAdventure(HUSKY_SAVE_KEY, this.adventure);
  }

  // ------------------------------------------------------------------ visuals

  private drawTitlePlaque(): void {
    const g = this.add.graphics().setDepth(9).setScrollFactor(0);
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
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
    this.add.text(336, 63, "Husky Adventure", {
      fontFamily: "Arial",
      fontSize: "13px",
      color: "#ffe9c4",
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  private drawRoutes(): void {
    for (const edge of HUSKY_ADVENTURE.edges) {
      // Secret edges are hidden paths; race/reward are virtual nodes.
      if (edge.kind === "secret") continue;
      const to = this.nodeDefs.get(edge.to);
      if (!to || to.encounter === "race" || to.encounter === "reward") continue;
      const graphics = this.add.graphics().setDepth(4);
      this.routeVisuals.push({ edge, graphics });
      this.redrawEdge(edge, graphics, false);
    }
  }

  private buildLandmarks(): void {
    this.landmarks = new Landmarks(this);
    this.landmarks.buildAll();
    // Map adventure nodes onto Harrison's existing landmark art. Unused
    // legacy landmarks (fork sign, shelter) stay hidden; the adventure
    // never reveals them.
    for (const [nodeId, landmarkKey] of Object.entries(LANDMARK_FOR)) {
      if (!landmarkKey) continue;
      const c = this.landmarks.get(landmarkKey);
      if (!c) continue;
      c.setVisible(false);
      this.nodeObjects.set(nodeId, c);
      this.nodeBaseY.set(nodeId, c.y);
    }
  }

  private buildMarkers(): void {
    this.markers = new AdventureMarkers(this);
    const defs = HUSKY_ADVENTURE.nodes.filter((n) => LANDMARK_FOR[n.id] == null && n.encounter !== "race" && n.encounter !== "reward");
    this.markers.build(defs);
    for (const id of this.markers.ids()) {
      const c = this.markers.get(id);
      if (!c) continue;
      this.nodeObjects.set(id, c);
      this.nodeBaseY.set(id, c.y);
    }
  }

  private buildFog(): void {
    this.fog = new DiscoveryFog(this);
    const v = FOG_ZONES.valleyGate;
    this.fog.buildZone("valleyGate", v.x, v.y, v.w, v.h);
    const s = FOG_ZONES.summitVeil;
    this.fog.buildZone("summitVeil", s.x, s.y, s.w, s.h);
  }

  private buildKiki(): void {
    const start = kikiTargetFor(this.nodeDefs.get("trailhead")!);
    this.kiki = new KikiCharacter(this, start.x, start.y, {
      scale: 0.8,
      depth: 15,
      footprints: true,
      puffs: true,
    });
    this.mover = new KikiMover(this, this.kiki);
  }

  private buildIglooOccluders(): void {
    this.add.image(SCENERY_SPOTS.igloo.x - 82, SCENERY_SPOTS.igloo.y + 12, "wlm-rock-ice").setScale(1.15).setDepth(7).setAlpha(0.98);
    this.add.image(SCENERY_SPOTS.igloo.x + 88, SCENERY_SPOTS.igloo.y + 8, "wlm-rock-snow").setScale(1.32).setDepth(7).setAlpha(0.98);
  }

  private buildResetButton(): void {
    // Player-safe reset for testing: wipes the save and starts a fresh run.
    const btn = this.add.text(1244, 36, "↺", {
      fontFamily: "Arial",
      fontSize: "26px",
      color: "#ffffff",
      backgroundColor: "#17324dcc",
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(30).setScrollFactor(0).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      if (this.busy) return;
      this.scene.restart({ fresh: true });
    });
  }

  /** Restore revealed nodes / repaired bridge / cleared tree from the save. */
  private applyProgressToVisuals(): void {
    for (const [id, obj] of this.nodeObjects) {
      const done = this.adventure.isComplete(id);
      const unlocked = this.adventure.isUnlocked(id);
      obj.setVisible(done || unlocked);
      if (id === "trailhead" || id === "broken-bridge") obj.setVisible(true);
    }
    if (this.adventure.isComplete("broken-bridge")) {
      this.landmarks.repairBridge();
      void this.fog.reveal("valleyGate");
    }
    if (this.adventure.isComplete("fallen-tree")) this.markers.setCleared("fallen-tree");
    if (this.adventure.isComplete("fallen-tree") || this.adventure.isComplete("ice-cave")) {
      void this.fog.reveal("summitVeil");
    }
    // Secrets whose parents are complete are always re-revealed here, so a
    // refresh can never lose them (revealSecretNode is idempotent).
    for (const n of HUSKY_ADVENTURE.nodes) {
      if (n.secret) this.revealSecretNode(n.id);
    }
    // Kiki resumes where the save left her.
    const here = this.nodeDefs.get(this.adventure.currentNodeId);
    if (here && here.encounter !== "race" && here.encounter !== "reward") {
      const t = kikiTargetFor(here);
      this.kiki.container.setPosition(t.x, t.y);
    }
    this.redrawAllEdges();
  }

  private nodeById(id: string): AdventureNodeDef {
    const n = this.nodeDefs.get(id);
    if (!n) throw new Error(`Unknown adventure node: ${id}`);
    return n;
  }

  private routeControl(fromId: string, toId: string, kind: AdventureRouteKind): Phaser.Math.Vector2 {
    const from = this.nodeById(fromId);
    const to = this.nodeById(toId);
    return new Phaser.Math.Vector2(
      (from.x + to.x) / 2,
      Math.min(from.y, to.y) - (kind === "challenge" ? 70 : 24),
    );
  }

  private routeCurve(fromId: string, toId: string, kind: AdventureRouteKind): Phaser.Curves.QuadraticBezier {
    const start = fromId === this.adventure.currentNodeId
      ? new Phaser.Math.Vector2(this.kiki.x, this.kiki.y)
      : new Phaser.Math.Vector2(kikiTargetFor(this.nodeById(fromId)).x, kikiTargetFor(this.nodeById(fromId)).y);
    const target = kikiTargetFor(this.nodeById(toId));
    return new Phaser.Curves.QuadraticBezier(
      start,
      this.routeControl(fromId, toId, kind),
      new Phaser.Math.Vector2(target.x, target.y),
    );
  }

  private redrawEdge(
    edge: AdventureEdgeDef,
    graphics: Phaser.GameObjects.Graphics,
    highlighted: boolean,
  ): void {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    const fromObj = this.nodeObjects.get(edge.from);
    const toObj = this.nodeObjects.get(edge.to);
    if (!fromObj?.visible || !toObj?.visible) {
      graphics.clear();
      return;
    }

    graphics.clear();
    const control = this.routeControl(edge.from, edge.to, edge.kind);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(from.x, from.y),
      control,
      new Phaser.Math.Vector2(to.x, to.y),
    );
    const points = curve.getPoints(30);

    if (edge.kind === "challenge") {
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

  private redrawAllEdges(): void {
    for (const v of this.routeVisuals) this.redrawEdge(v.edge, v.graphics, false);
  }

  // ------------------------------------------------------------- progression

  private highlightForwardChoices(): void {
    this.clearHighlights();
    if (this.busy) return;

    const here = this.adventure.currentNodeId;
    const forward = this.adventure.availableFrom(here);
    if (forward.length === 0) {
      this.status.setText(
        this.adventure.stickerUnlocked
          ? "Husky sticker earned! Tap ↺ for a new adventure"
          : "Explore Snowy Peaks",
      );
      return;
    }

    let raceOffered = false;
    for (const choice of forward) {
      const to = this.nodeById(choice.to);
      if (to.encounter === "race") {
        this.offerRaceChoice();
        raceOffered = true;
        continue;
      }
      // Secret edges are discoveries, not travel: handled by the secret loop
      // below. (Traveling to a secret would strand Kiki — secrets have no
      // outgoing edges.)
      if (choice.kind === "secret") continue;
      const visual = this.routeVisuals.find((v) => v.edge === choice);
      if (visual) this.redrawEdge(choice, visual.graphics, true);

      const nodeObj = this.nodeObjects.get(choice.to);
      if (!nodeObj) continue;
      this.bounceNode(nodeObj, choice.kind === "challenge" ? 0xffd24d : 0xffffff);
      nodeObj.setSize(130, 130);
      nodeObj.setInteractive(new Phaser.Geom.Circle(65, 65, 56), Phaser.Geom.Circle.Contains);
      nodeObj.once("pointerdown", () => this.travelTo(choice.to));
    }

    // Discovered secrets shimmer until tapped (they don't move Kiki).
    for (const [id, obj] of this.nodeObjects) {
      const def = this.nodeDefs.get(id);
      if (!def?.secret || this.adventure.isComplete(id) || !obj.visible) continue;
      if (!this.adventure.isUnlocked(id)) continue;
      this.bounceNode(obj, 0xffd24d);
      obj.setSize(130, 130);
      obj.setInteractive(new Phaser.Geom.Circle(65, 65, 56), Phaser.Geom.Circle.Contains);
      obj.once("pointerdown", () => this.discoverSecret(id));
    }

    const first = forward.find((c) => this.nodeById(c.to).encounter !== "race");
    if (first) {
      this.kiki.lookAt(this.nodeById(first.to).x);
      const dest = this.nodeObjects.get(first.to);
      if (dest) this.showDestination(dest);
    }

    if (!raceOffered) {
      this.status.setText(forward.length > 1 ? "Choose Kiki's path" : "Follow the arrow");
    }
  }

  private bounceNode(nodeObj: Phaser.GameObjects.Container, color: number): void {
    nodeObj.setAlpha(1);
    const arrow = this.add.triangle(
      nodeObj.x,
      nodeObj.y - 108,
      -11, 0,
      11, 0,
      0, 16,
      color,
      1,
    ).setStrokeStyle(3, color === 0xffd24d ? 0x7b55b2 : 0x2f78aa, 1)
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
  }

  /** The Summit Gate becomes the race launcher once its encounter is done. */
  private offerRaceChoice(): void {
    const gateObj = this.nodeObjects.get("sled-race");
    if (!gateObj) return;
    gateObj.setVisible(true);
    this.showDestination(gateObj);
    this.bounceNode(gateObj, 0xffd24d);
    gateObj.setSize(150, 130);
    gateObj.setInteractive(new Phaser.Geom.Circle(75, 65, 58), Phaser.Geom.Circle.Contains);
    gateObj.once("pointerdown", () => this.launchRace());
    this.status.setText("The sled race is ready — tap Race Camp!");
  }

  private launchRace(): void {
    if (this.busy) return;
    if (!this.adventure.isUnlocked("sled-race")) return;
    this.busy = true;
    this.disableAllNodes();
    this.clearHighlights();
    this.saveProgress();
    this.scene.start("RaceScene");
  }

  private async travelTo(toId: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.setupCamera();
    this.disableAllNodes();
    this.clearHighlights();

    const node = this.nodeById(toId);
    const edge = HUSKY_ADVENTURE.edges.find(
      (e) => e.from === this.adventure.currentNodeId && e.to === toId,
    );

    if (toId === "broken-bridge") {
      await this.bridgeEncounter();
    } else {
      if (edge) await this.walkKiki(toId, edge.kind);
      this.adventure.currentNodeId = toId;
      await this.runEncounter(node);
      this.adventure.completeEncounter(toId);
    }
    this.afterEncounter(toId);
    for (const e of this.adventure.availableFrom(toId)) {
      if (e.kind !== "secret") this.revealNode(e.to);
    }
    this.saveProgress();

    this.busy = false;
    this.highlightForwardChoices();
  }

  /** A secret discovery doesn't move Kiki — she investigates in place. */
  private async discoverSecret(id: string): Promise<void> {
    if (this.busy || this.adventure.isComplete(id)) return;
    this.busy = true;
    this.disableAllNodes();
    this.clearHighlights();

    const node = this.nodeById(id);
    this.kiki.lookAt(node.x);
    this.kiki.react("curious", 1400);

    if (id === "secret-igloo") {
      this.status.setText("You found the Secret Igloo!");
      this.sparkleBurst(node.x, node.y);
      await this.delay(900);
      const accepted = await this.offerBonusChallenge(
        "Someone left a bonus challenge inside!",
        "Try the bonus math for Golden Husky progress?",
      );
      if (accepted) {
        await this.runMathEncounter("challenge", "Igloo Bonus Challenge ★");
        this.adventure.recordBonusChallenge();
        this.status.setText("Bonus challenge complete! Golden progress +1");
      }
    } else {
      this.status.setText("You found Kiki's hidden bone cache!");
      this.sparkleBurst(node.x, node.y);
      await this.delay(900);
    }

    this.adventure.completeEncounter(id);
    this.saveProgress();
    this.busy = false;
    this.highlightForwardChoices();
  }

  private async runEncounter(node: AdventureNodeDef): Promise<void> {
    switch (node.encounter) {
      case "checkpoint":
        this.status.setText(node.hint ?? "Kiki takes a breather.");
        this.kiki.react("happy", 1100);
        await this.delay(1100);
        break;

      case "math-normal":
      case "math-challenge": {
        const difficulty = node.mathDifficulty ?? "normal";
        const titles: Record<string, string> = {
          "frozen-lake": "Which stones are safe? Solve to light the way!",
          "ice-cave": "Ice Cave Challenge",
          "summit-camp": "The Summit Gatekeeper asks…",
        };
        await this.runMathEncounter(difficulty, titles[node.id] ?? node.label);
        if (node.id === "frozen-lake") {
          this.status.setText("The safe stepping stones glimmer across the ice!");
          this.sparkleBurst(node.x, node.y);
          await this.delay(900);
        } else if (node.id === "summit-camp") {
          this.status.setText("The Summit Gate swings open!");
          const gate = this.nodeObjects.get("summit-camp");
          if (gate) {
            this.tweens.add({
              targets: gate,
              scale: 1.12,
              duration: 260,
              yoyo: true,
              repeat: 1,
              ease: "Sine.inOut",
            });
          }
          await this.delay(800);
        }
        break;
      }

      case "choice":
        await this.runForestChoice(node);
        break;

      case "discovery":
        if (node.id === "fallen-tree") await this.runFallenTree(node);
        else {
          this.sparkleBurst(node.x, node.y);
          await this.delay(800);
        }
        break;

      default:
        break;
    }
  }

  /** Forest Navigation: choose the route by reading the clues. No wrong answer — both paths are real adventures. */
  private runForestChoice(_node: AdventureNodeDef): Promise<void> {
    return new Promise((resolve) => {
      const c = this.add.container(640, 360).setDepth(100);
      const shade = this.add.rectangle(0, 0, 1280, 720, 0x0d2235, 0.58);
      const panelG = this.add.graphics();
      panelG.fillStyle(0xfffbef, 1);
      panelG.lineStyle(7, 0x3f83b9, 1);
      panelG.fillRoundedRect(-330, -215, 660, 430, 30);
      panelG.strokeRoundedRect(-330, -215, 660, 430, 30);

      const header = this.add.text(0, -160, "The trail splits…", {
        fontFamily: "Arial Black, Arial", fontSize: "30px", color: "#1b5d8b",
      }).setOrigin(0.5);
      const body = this.add.text(
        0, -95,
        "Kiki sniffs both trails.\nPaw prints wander left toward the Safe Trail.\nThe icy shortcut glitters right — faster, but trickier!",
        { fontFamily: "Arial", fontSize: "21px", color: "#33475c", align: "center", lineSpacing: 8 },
      ).setOrigin(0.5);
      c.add([shade, panelG, header, body]);

      const mkButton = (
        y: number, title: string, sub: string, color: number, route: AdventureRoute,
      ) => {
        const bg = this.add.rectangle(0, y, 460, 84, color, 1)
          .setStrokeStyle(4, 0xffffff, 1)
          .setInteractive({ useHandCursor: true });
        const t = this.add.text(0, y - 14, title, {
          fontFamily: "Arial Black, Arial", fontSize: "24px", color: "#ffffff",
        }).setOrigin(0.5);
        const s = this.add.text(0, y + 18, sub, {
          fontFamily: "Arial", fontSize: "16px", color: "#ffffff",
        }).setOrigin(0.5);
        bg.once("pointerdown", () => {
          this.adventure.setRoute(route);
          this.status.setText(route === "safe" ? "Kiki follows the paw prints!" : "Kiki dashes for the icy shortcut!");
          c.destroy(true);
          this.prompt = undefined;
          resolve();
        });
        c.add([bg, t, s]);
      };

      mkButton(40, "🐾  SAFE TRAIL", "Frozen Lake • normal math", 0x2f84b8, "safe");
      mkButton(150, "★  ICE SHORTCUT", "Ice Cave • harder math", 0x7651b3, "challenge");
      this.pinOverlay(c);
    this.prompt = c;
    });
  }

  /** Fallen Tree: a gameplay clearing interaction — tap 5 times, no fail state. */
  private runFallenTree(node: AdventureNodeDef): Promise<void> {
    return new Promise((resolve) => {
      this.status.setText("A fallen tree blocks the path! Tap it 5 times to clear it!");
      const marker = this.markers.get(node.id);
      const target = marker ?? this.nodeObjects.get(node.id);
      if (!target) {
        resolve();
        return;
      }
      let taps = 0;
      const counter = this.add.text(node.x, node.y - 120, "0 / 5", {
        fontFamily: "Arial Black, Arial", fontSize: "26px", color: "#ffffff",
        stroke: "#17324d", strokeThickness: 6,
      }).setOrigin(0.5).setDepth(25);

      target.setSize(150, 130);
      target.setInteractive(new Phaser.Geom.Circle(75, 65, 58), Phaser.Geom.Circle.Contains);
      const onTap = () => {
        taps += 1;
        counter.setText(`${taps} / 5`);
        this.tweens.add({
          targets: target, angle: 4, duration: 90, yoyo: true, ease: "Sine.inOut",
          onComplete: () => target.setAngle(0),
        });
        this.sparkleBurst(target.x, target.y - 20);
        if (taps >= 5) {
          target.off("pointerdown", onTap);
          target.disableInteractive();
          counter.destroy();
          this.markers.setCleared(node.id);
          this.kiki.react("happy", 1200);
          this.status.setText("The path is clear!");
          this.time.delayedCall(900, () => resolve());
        }
      };
      target.on("pointerdown", onTap);
    });
  }

  private offerBonusChallenge(title: string, body: string): Promise<boolean> {
    return new Promise((resolve) => {
      const c = this.add.container(640, 360).setDepth(100);
      const shade = this.add.rectangle(0, 0, 1280, 720, 0x0d2235, 0.58);
      const panelG = this.add.graphics();
      panelG.fillStyle(0xfffbef, 1);
      panelG.lineStyle(7, 0x7a4ab2, 1);
      panelG.fillRoundedRect(-300, -180, 600, 360, 30);
      panelG.strokeRoundedRect(-300, -180, 600, 360, 30);
      const header = this.add.text(0, -120, title, {
        fontFamily: "Arial Black, Arial", fontSize: "26px", color: "#64359a", align: "center",
        wordWrap: { width: 500 },
      }).setOrigin(0.5);
      const text = this.add.text(0, -40, body, {
        fontFamily: "Arial", fontSize: "21px", color: "#33475c", align: "center",
      }).setOrigin(0.5);
      const yes = this.add.rectangle(-140, 90, 220, 70, 0x7651b3, 1)
        .setStrokeStyle(4, 0xffffff, 1).setInteractive({ useHandCursor: true });
      const yesT = this.add.text(-140, 90, "Let's go!", {
        fontFamily: "Arial Black, Arial", fontSize: "22px", color: "#ffffff",
      }).setOrigin(0.5);
      const no = this.add.rectangle(140, 90, 220, 70, 0x8aa0b5, 1)
        .setStrokeStyle(4, 0xffffff, 1).setInteractive({ useHandCursor: true });
      const noT = this.add.text(140, 90, "Later", {
        fontFamily: "Arial Black, Arial", fontSize: "22px", color: "#ffffff",
      }).setOrigin(0.5);
      const done = (v: boolean) => {
        c.destroy(true);
        this.prompt = undefined;
        resolve(v);
      };
      yes.once("pointerdown", () => done(true));
      no.once("pointerdown", () => done(false));
      c.add([shade, panelG, header, text, yes, yesT, no, noT]);
      this.pinOverlay(c);
    this.prompt = c;
    });
  }

  /** Broken Bridge: walk up, math repairs the bridge, Kiki crosses. */
  private async bridgeEncounter(): Promise<void> {
    const curve = this.routeCurve("trailhead", "broken-bridge", "safe");
    const stopT = 0.68;

    this.status.setText("Kiki spots a broken bridge…");
    await this.mover.walk({
      curve,
      fromT: 0,
      toT: stopT,
      gait: "trot",
      arrivalReaction: "surprised",
    });

    await this.runMathEncounter("normal", "A broken bridge blocks the trail.");

    this.landmarks.repairBridge();
    this.kiki.react("happy", 1000);
    this.status.setText("The bridge is fixed!");
    await this.delay(950);

    await this.mover.walk({
      curve,
      fromT: stopT,
      toT: 1,
      gait: "trot",
      arrivalReaction: "curious",
    });
    this.adventure.currentNodeId = "broken-bridge";
    this.adventure.completeEncounter("broken-bridge");
  }

  private walkKiki(toId: string, kind: AdventureRouteKind): Promise<void> {
    this.status.setText("Kiki is walking…");
    return this.mover.walk({
      curve: this.routeCurve(this.adventure.currentNodeId, toId, kind),
      gait: kind === "challenge" ? "dash" : "trot",
      arrivalReaction: "happy",
    });
  }

  /** World reactions after an encounter completes: fog, reveals, secrets. */
  private afterEncounter(toId: string): void {
    if (toId === "snow-pass") {
      this.revealSecretNode("secret-igloo");
      this.revealSecretNode("snow-cache");
    }
    if (toId === "broken-bridge") {
      void this.fog.reveal("valleyGate").then(() => this.revealNode("forest"));
    } else if (toId === "forest") {
      const route = this.adventure.chosenRoute;
      this.revealNode(route === "challenge" ? "ice-cave" : "frozen-lake");
    } else if (toId === "frozen-lake") {
      this.revealNode("fallen-tree");
    } else if (toId === "fallen-tree" || toId === "ice-cave") {
      // Secrets reveal immediately (not after the fog tween) so a refresh
      // during the reveal animation can't lose them.
      this.revealSecretNode("secret-igloo");
      this.revealSecretNode("snow-cache");
      void this.fog.reveal("summitVeil").then(() => {
        this.revealNode("snow-pass");
        this.revealNode("summit-camp");
      });
    }
    this.redrawAllEdges();
  }

  private revealSecretNode(id: string): void {
    if (!this.adventure.revealSecret(id)) return;
    const obj = this.nodeObjects.get(id);
    if (!obj || obj.visible) return;
    obj.setVisible(true).setAlpha(0).setScale(0.75);
    this.sparkleBurst(this.nodeById(id).x, this.nodeById(id).y);
    this.tweens.add({
      targets: obj, alpha: 1, scale: 1, duration: 650, ease: "Back.out",
    });
  }

  private revealNode(id: string): void {
    const obj = this.nodeObjects.get(id);
    if (!obj || obj.visible) return;
    const n = this.nodeById(id);
    obj.setVisible(true).setAlpha(0).setScale(0.75);
    this.tweens.add({
      targets: obj, alpha: 1, scale: 1, duration: 650, ease: "Back.out",
    });
    this.redrawAllEdges();

    const reveal = this.add.circle(n.x, n.y, 110, 0xffffff, 0.95).setDepth(14);
    this.tweens.add({
      targets: reveal, alpha: 0, scale: 1.7, duration: 850,
      onComplete: () => reveal.destroy(),
    });
  }

  private sparkleBurst(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const s = this.add.image(
        x + Phaser.Math.Between(-50, 50),
        y + Phaser.Math.Between(-40, 40),
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
  }

  private runMathEncounter(difficulty: "normal" | "challenge", title: string): Promise<boolean> {
    return new Promise((resolve) => {
      const q = this.math.nextQuestion(difficulty);
      this.showMathPrompt(q, title, resolve);
    });
  }

  private showMathPrompt(q: MathQuestion, title: string, resolve: (value: boolean) => void): void {
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
    const hintLabel = this.add.text(0, 200, "", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#5a6b7d",
      align: "center",
    }).setOrigin(0.5);
    c.add([shade, panelG, header, prompt, hintLabel]);

    let resolved = false;
    let wrongCount = 0;
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
        if (resolved) return;
        if (answer === q.correct) {
          resolved = true;
          this.status.setText("Correct!");
          c.destroy(true);
          this.prompt = undefined;
          resolve(true);
        } else {
          // Wrong answers never remove progress: a shake, a retry, and
          // after two misses a small hint. No punishment loops.
          wrongCount += 1;
          this.cameras.main.shake(120, 0.004);
          label.setColor("#ffdddd");
          this.time.delayedCall(280, () => label.setColor("#ffffff"));
          if (wrongCount >= 2 && q.hint) hintLabel.setText(`💡 ${q.hint}`);
        }
      });
      c.add([btn, label]);
    });

    this.pinOverlay(c);
    this.prompt = c;
  }

  // ------------------------------------------------------------------- reward

  private showRewardOverlay(): void {
    this.busy = true;
    this.clearHighlights();
    const unlocked = this.adventure.tryUnlockSticker();
    this.saveProgress();
    if (unlocked) {
      AdventureEvents.emitStickerUnlocked({
        adventureId: HUSKY_ADVENTURE.id,
        stickerName: HUSKY_ADVENTURE.stickerName,
        secretsFound: this.adventure.secretsFound.size,
        bonusChallengesCompleted: this.adventure.bonusChallengesCompleted,
      });
    }

    const c = this.add.container(640, 360).setDepth(100);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x0d2235, 0.62);
    const panelG = this.add.graphics();
    panelG.fillStyle(0xfffbef, 1);
    panelG.lineStyle(8, 0xf2bd43, 1);
    panelG.fillRoundedRect(-330, -230, 660, 460, 30);
    panelG.strokeRoundedRect(-330, -230, 660, 430, 30);

    const title = this.add.text(
      0, -170,
      unlocked ? "🏅 HUSKY STICKER EARNED!" : "Race complete!",
      { fontFamily: "Arial Black, Arial", fontSize: "34px", color: "#8a5a00", align: "center" },
    ).setOrigin(0.5);
    const stats = this.add.text(
      0, -60,
      unlocked
        ? `Kiki finished the whole Snowy Peaks adventure!\n\nEncounters: ${this.adventure.completed.size}\nSecrets found: ${[...this.adventure.secretsFound].filter((s) => !s.startsWith("revealed:")).length}\nBonus challenges: ${this.adventure.bonusChallengesCompleted}\nRace: ${this.adventure.raceTurns} turns (${this.adventure.raceTurbos} turbo!)`
        : "Finish the adventure's encounters to earn the Husky sticker!",
      { fontFamily: "Arial", fontSize: "22px", color: "#33475c", align: "center", lineSpacing: 8 },
    ).setOrigin(0.5);
    c.add([shade, panelG, title, stats]);

    if (unlocked) {
      for (let i = 0; i < 24; i++) {
        const star = this.add.star(
          Phaser.Math.Between(-280, 280), Phaser.Math.Between(-180, 180),
          5, 5, 12, i % 2 === 0 ? 0xffd64f : 0x7ed6ff, 1,
        );
        c.add(star);
        this.tweens.add({
          targets: star, angle: 180, alpha: 0.4, duration: 1200,
          yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 800),
        });
      }
      this.kiki.react("happy", 3000);
    }

    const mkBtn = (y: number, label: string, cb: () => void) => {
      const bg = this.add.rectangle(0, y, 300, 64, 0x2f84b8, 1)
        .setStrokeStyle(4, 0xffffff, 1).setInteractive({ useHandCursor: true });
      const t = this.add.text(0, y, label, {
        fontFamily: "Arial Black, Arial", fontSize: "22px", color: "#ffffff",
      }).setOrigin(0.5);
      bg.once("pointerdown", cb);
      c.add([bg, t]);
    };
    mkBtn(120, "↺  Play again", () => this.scene.restart({ fresh: true }));
    mkBtn(200, "Keep exploring", () => {
      c.destroy(true);
      this.prompt = undefined;
      this.busy = false;
      this.highlightForwardChoices();
    });
    this.pinOverlay(c);
    this.prompt = c;
  }

  // ------------------------------------------------------------------- cleanup

  private clearHighlights(): void {
    this.redrawAllEdges();

    for (const [id, node] of this.nodeObjects) {
      this.tweens.killTweensOf(node);
      node.setScale(1);
      const baseY = this.nodeBaseY.get(id);
      if (baseY !== undefined) node.y = baseY;
      node.disableInteractive();
      node.off("pointerdown");
    }

    this.children.list
      .filter((child) => child.getData && child.getData("route-arrow"))
      .forEach((child) => child.destroy());
  }

  private disableAllNodes(): void {
    for (const node of this.nodeObjects.values()) node.disableInteractive();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
