import { firstTrailTutorial } from "../visuals/FirstTrailTutorial";
import { TrailGuidance } from "../visuals/TrailGuidance";
import { HuskyGraduation } from "../systems/HuskyGraduation";
import { showHuskyGraduation } from "../visuals/HuskyGraduation";
import { showStickerAlbum } from "../visuals/Collectibles";
import { playGame } from "../visuals/PlayfulGames";
import { enterIgloo, offerIglooBonus, showGoldenBone, showCollectibleReward } from "../visuals/Collectibles";
import { awardGoldenBone, hasGoldenBone } from "../systems/TreasureCollection";
import { explainMath } from "../visuals/MathExplanation";
import { crossLakeInWorld } from "../visuals/LakeCrossing";
import { bridgePath, TERRAIN_PATHS } from "../visuals/HuskyTerrain";
import { repairBridgeInWorld } from "../visuals/BridgeRepair";
import { depth, advice } from "../visuals/HuskyDepth";
import { startPolishRun, record, complete, finishPolishRun, showPlaytestStats } from "../systems/PolishRun";
import { polishPosition, woodButton } from "../visuals/PolishArt";
import { HuskyCharacter } from "../systems/HuskyCharacter";
import { syncHuskyProgress } from "../systems/HuskyProgressBridge";
import { HUSKY_NARRATIVE } from "../systems/HuskyNarrative";
import { gameStore, HUSKY_GAME_SAVE_KEY } from "../systems/PlayContext";
import { preloadPreviewArt, previewBadge } from "../visuals/PreviewArt";
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
  kikiTargetFor,
  LANDMARK_FOR,
} from "../systems/HuskyAdventure";
import {
  clearAdventure,
  loadAdventure,
  saveAdventure,
} from "../systems/AdventurePersistence";
import { AdventureEvents } from "../systems/AdventureEvents";
import { CharacterMotion, preloadMotion, createMotionAssets } from "../motion/CharacterMotion";
import { FootFX } from "../motion/FootFX";

import type { TerrainId } from "../motion/motionTypes";
import { RingoKikiMover } from "../systems/RingoKikiMover";
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
  private kiki!: CharacterMotion;
  private footfx!: FootFX;
  private mover!: RingoKikiMover;
  private guidance?: TrailGuidance;
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
    preloadPreviewArt(this);
    HuskyCharacter.preload(this);
    preloadMotion(this);
    this.load.svg("dl-ice-cracks","assets/worlds/snowy-peaks/dl-ice-cracks.svg",{width:500,height:300});
    preloadLandmarks(this);
  }

  create(data?: { fresh?: boolean }): void {
    // Phaser reuses Scene instances, so reset every mutable run-specific field.
    this.busy = false;
    this.prompt = undefined;
    this.routeVisuals = [];
    this.nodeObjects.clear();
    this.nodeBaseY.clear();
    this.nodeDefs = new Map(HUSKY_ADVENTURE.nodes.map((n) => [n.id, polishPosition(n)]));

    if(import.meta.env.DEV && new URLSearchParams(location.search).has("composition")) {
      this.createCompositionInspection();
      return;
    }

    startPolishRun(!!data?.fresh);
    // Progress: restore the saved run, or start fresh.
    if (data?.fresh) clearAdventure(HUSKY_GAME_SAVE_KEY, gameStore());
    this.adventure =
      loadAdventure(HUSKY_GAME_SAVE_KEY, HUSKY_ADVENTURE, gameStore()) ?? new AdventureProgress(HUSKY_ADVENTURE);
    // The trailhead checkpoint is where every run begins.
    if (!this.adventure.isComplete("trailhead")) {
      this.adventure.completeEncounter("trailhead");
      this.saveProgress();
    }

    this.cameras.main.setBackgroundColor("#9fd4f5");
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H).setScroll(0, 0);
    new SnowyWorld(this).build();
    previewBadge(this);

    this.drawTitlePlaque();
    this.drawRoutes();
    this.buildLandmarks();
    this.buildMarkers();
    this.buildFog();
    this.buildKiki();
    this.guidance = new TrailGuidance(this);
    this.events.once("shutdown",()=>this.guidance?.clear());
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
    this.time.delayedCall(450, async () => {
      this.busy = true;
      await firstTrailTutorial(this.events);
      if (!this.scene.isActive()) return;
      await depth("inspect-trail-sign","trailhead","A mountain adventure","Explore the trail sign. Bolt is waiting at Race Camp!",[{id:"paw-map",label:"Read the paw map"},{id:"kiki-sniff",label:"Let Kiki sniff"}],"lm-trailhead");
      this.busy = false; this.highlightForwardChoices();
    });
  }

  /** Developer-only inspection uses the production renderer and never reads/writes saves. */
  private createCompositionInspection(): void {
    const views: Record<string,{x:number;y:number;camera:number;repaired?:boolean}>={
      trailhead:{x:410,y:570,camera:0},
      "bridge-approach":{x:650,y:570,camera:220},
      "bridge-standing":{x:820,y:578,camera:220,repaired:true},
      "bridge-exit":{x:1040,y:565,camera:520,repaired:true},
      lake:{x:1780,y:570,camera:1190},
      igloo:{x:2110,y:410,camera:1510},
      "race-camp":{x:3030,y:510,camera:2080},
    };
    const view=views[new URLSearchParams(location.search).get("composition")??""]??views.trailhead;
    this.cameras.main.setBounds(0,0,WORLD_W,WORLD_H).setScroll(view.camera,0);
    new SnowyWorld(this).build();
    this.buildLandmarks();this.buildMarkers();this.buildKiki();
    for(const obj of this.nodeObjects.values())obj.setVisible(true);
    this.landmarks.setIglooState("discovered");
    if(view.repaired){this.landmarks.repairBridge(false);this.landmarks.addBridgeForeground();}
    this.kiki.container.setPosition(view.x,view.y);
    const nav=document.createElement("nav");nav.className="composition-inspector";
    nav.setAttribute("aria-label","Composition inspection — saves untouched");
    nav.style.cssText="position:fixed;top:12px;left:12px;z-index:1000;display:flex;gap:6px;flex-wrap:wrap;padding:10px;background:#173544ed;border-radius:12px;color:white;font:14px Georgia;max-width:94vw";
    for(const key of Object.keys(views)) {
      const link=document.createElement("a");link.href="?composition="+key;link.textContent=key;
      link.style.cssText="color:#fff4dd;padding:8px;text-decoration:none";nav.append(link);
    }
    const walk=document.createElement("button");walk.textContent="Preview walk / turn";
    walk.onclick=async()=>{
      if(this.mover.isMoving)return;
      walk.disabled=true;
      const x=this.kiki.x,y=this.kiki.y;
      await this.mover.walk({curve:new Phaser.Curves.Line(new Phaser.Math.Vector2(x,y),new Phaser.Math.Vector2(x+190,y)),arrivalReaction:"none"});
      await this.mover.walk({curve:new Phaser.Curves.Line(new Phaser.Math.Vector2(x+190,y),new Phaser.Math.Vector2(x,y)),arrivalReaction:"none"});
      walk.disabled=false;
    };nav.append(walk);document.body.append(nav);
    this.events.once("shutdown",()=>nav.remove());
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
      cam.pan((this.kiki.x + obj.x) / 2, 360, 850, Phaser.Math.Easing.Sine.InOut, true);
    }
  }

  private pinOverlay(c: Phaser.GameObjects.Container): void {
    c.setScrollFactor(0);
    c.iterate((child: Phaser.GameObjects.GameObject) => {
      (child as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0);
    });
  }

  private saveProgress(): void {
    saveAdventure(HUSKY_GAME_SAVE_KEY, this.adventure, gameStore());
    syncHuskyProgress(this.adventure, gameStore());
  }

  // ------------------------------------------------------------------ visuals

  private drawTitlePlaque(): void {
    this.add.image(336, 49, "wood-panel").setDisplaySize(235, 64).setTint(0xb7a080).setDepth(9).setScrollFactor(0);
    this.add.text(336, 42, "SNOWY PEAKS", {
      fontFamily: "Georgia",
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
    const defs = [...this.nodeDefs.values()].filter((n) => LANDMARK_FOR[n.id] == null && n.encounter !== "race" && n.encounter !== "reward");
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
    createMotionAssets(this);
    this.kiki = new CharacterMotion(this, "kiki", start.x, start.y, {intact:true});
    this.kiki.container.setScale(0.8).setDepth(15);
    this.footfx = new FootFX(this, this.kiki, {shadow:true, shadowScale:0.75});
    this.mover = new RingoKikiMover(this, this.kiki);
    this.events.once("shutdown", () => { this.mover.stop(); this.footfx.destroy(); });
  }

  update(time: number, delta: number): void {
    this.kiki?.update(time, delta);
    this.guidance?.update(delta);
    if(this.mover?.isMoving){
      const camera=this.cameras.main,target=-this.kiki.getFacing()*85;
      camera.followOffset.x=Phaser.Math.Linear(camera.followOffset.x,target,Math.min(1,delta/450));
    }
    this.footfx?.update(time, delta);
  }

  private buildIglooOccluders(): void {
    // Rejected foreground sources contained backdrop pixels and a baked-in dog.
    // Add only atlas-aligned foregrounds after their world alignment is verified.
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
      this.landmarks.repairBridge(false);
      void this.fog.reveal("valleyGate");
    }
    if (this.adventure.isComplete("fallen-tree")) this.markers.setCleared("fallen-tree");
    if (this.adventure.isComplete("fallen-tree") || this.adventure.isComplete("ice-cave")) {
      void this.fog.reveal("summitVeil");
    }
    for (const id of ["snow-pass", "summit-camp", "snow-cache"]) {
      if (this.adventure.isComplete(id)) this.markers.setCleared(id);
    }
    if (this.adventure.isComplete("secret-igloo")) this.landmarks.setIglooState("glow");
    // Secrets whose parents are complete are always re-revealed here, so a
    // refresh can never lose them (revealSecretNode is idempotent).
    for (const n of HUSKY_ADVENTURE.nodes) {
      if (n.secret) this.revealSecretNode(n.id);
    }
    // Kiki resumes where the save left her.
    const here = this.nodeDefs.get(this.adventure.currentNodeId);
    if (here && here.encounter !== "race" && here.encounter !== "reward") {
      const t = here.id === "broken-bridge" && this.adventure.isComplete(here.id) ? bridgePath().at(-1)! : here.id === "frozen-lake" && this.adventure.isComplete(here.id) ? TERRAIN_PATHS.lake.walkPath.points.at(-1)! : kikiTargetFor(here);
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
    const target = toId === "frozen-lake" ? TERRAIN_PATHS.lake.walkPath.points[0] : kikiTargetFor(this.nodeById(toId));
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
      graphics.lineStyle(highlighted ? 8 : 6, 0xc4d9dd, highlighted ? 0.35 : 0.12);
      graphics.strokePoints(points, false, false);
      graphics.lineStyle(3, 0xf6eddb, highlighted ? 0.45 : 0.2);
      graphics.strokePoints(points, false, false);
      for (let i = 5; i < points.length - 2; i += 6) {
        const p = points[i];
        graphics.fillStyle(0xffd24d, highlighted ? 0.95 : 0.6);
        graphics.fillCircle(p.x, p.y - 7, highlighted ? 4 : 3);
      }
    } else {
      graphics.lineStyle(highlighted ? 10 : 7, 0xc4d9dd, highlighted ? 0.25 : 0.12);
      graphics.strokePoints(points, false, false);
      graphics.lineStyle(4, 0xfff6e5, highlighted ? 0.38 : 0.18);
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
    this.guidance?.clear();
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
      this.enableLandmark(nodeObj,()=>this.travelTo(choice.to));
      this.guidance?.add(this.kiki,nodeObj,new HuskyGraduation(gameStore()).passed);
      for(const hint of this.children.list.filter(o=>o.getData("route-arrow") && (o as Phaser.GameObjects.Image).x === nodeObj.x)) {
        hint.setInteractive({useHandCursor:true}).once("pointerdown",()=>this.travelTo(choice.to));
      }
    }

    // Discovered secrets shimmer until tapped (they don't move Kiki).
    for (const [id, obj] of this.nodeObjects) {
      const def = this.nodeDefs.get(id);
      if (!def?.secret || (this.adventure.isComplete(id) && id !== "secret-igloo") || !obj.visible) continue;
      if (!this.adventure.isUnlocked(id)) continue;
      this.bounceNode(obj, 0xffd24d);
      this.enableLandmark(obj,()=>this.discoverSecret(id));
      this.guidance?.add(this.kiki,obj,new HuskyGraduation(gameStore()).passed,true);
    }

    const first = forward.find((c) => this.nodeById(c.to).encounter !== "race");
    if (first) {
      this.kiki.lookAt(this.nodeById(first.to).x);
      const dest = this.nodeObjects.get(first.to);
      if (dest) this.showDestination(dest);
    }

    if (!raceOffered && forward.length > 0) {
      this.status.setText(forward.length > 1 ? "Choose Kiki's path" : "Tap a place to explore");
    }
    if (forward.length === 0) {
      const secret = [...this.nodeObjects].find(([id, obj]) =>
        this.nodeDefs.get(id)?.secret && obj.visible && !this.adventure.isComplete(id));
      if (secret) this.showDestination(secret[1]);
    }
  }

  private enableLandmark(node:Phaser.GameObjects.Container,action:()=>unknown):void {
    // Hit targets follow the visible art, including tall signs and tent roofs.
    // The former fixed circle sat below the repackaged, foot-anchored props.
    for(const child of node.list) {
      if(child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Text) {
        child.setInteractive({useHandCursor:true}).once("pointerdown",action);
      }
    }
  }

  private bounceNode(nodeObj: Phaser.GameObjects.Container, color: number): void {
    nodeObj.setAlpha(1);
    const cue=this.add.ellipse(nodeObj.x,nodeObj.y+16,65,12,0xffdf9a,.25)
      .setDepth(12).setData("route-arrow",true);
    this.tweens.add({targets:cue,alpha:.5,duration:1800,yoyo:true,repeat:1});
  }

  /** The Summit Gate becomes the race launcher once its encounter is done. */
  private offerRaceChoice(): void {
    const gateObj = this.nodeObjects.get("sled-race");
    if (!gateObj) return;
    gateObj.setVisible(true);
    this.showDestination(gateObj);
    this.bounceNode(gateObj, 0xffd24d);
    this.enableLandmark(gateObj,()=>this.launchRace());
    this.status.setText("The sled race is ready — tap Race Camp!");
  }

  private async launchRace(): Promise<void> {
    if (this.busy) return;
    if (!this.adventure.isUnlocked("sled-race")) return;
    this.busy = true;
    this.disableAllNodes();
    this.clearHighlights();
    await depth("greet-bolt","race-camp","Meet Bolt","Bolt bows beside his sled. How should Kiki say hello?",[{id:"wave",label:"Wave a paw"},{id:"bark",label:"Friendly bark"},{id:"snack",label:"Offer a snack"}],"lm-race-gate");
    const ready = await advice("advice-race-ready","race-camp","Ready to race, or should we look around first?",[{id:"race-now",label:"Race now"},{id:"look-around",label:"Look around"}]);
    if(ready === "look-around") await depth("inspect-sled","race-camp","Check the sled","Tap the runners, harness and loose strap. Now our sled is ready!",[{id:"runners",label:"Runners"},{id:"harness",label:"Harness"},{id:"strap",label:"Tighten strap"}],"lm-race-gate","search");
    this.saveProgress();
    this.cameras.main.fadeOut(350, 22, 45, 60);
    this.time.delayedCall(350, () => this.scene.start("RaceScene"));
  }

  private async travelTo(toId: string): Promise<void> {
    if (this.busy) return;
    this.guidance?.clear();
    this.busy = true;
    this.setupCamera();
    this.disableAllNodes();
    this.clearHighlights();

    const node = this.nodeById(toId);
    record("encounter-entered",toId);
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
    if (["snow-pass", "summit-camp"].includes(toId)) this.markers.setCleared(toId);
    record("encounter-exited",toId);
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
    if (this.busy || (this.adventure.isComplete(id) && id !== "secret-igloo")) return;
    if (id === "secret-igloo" && this.adventure.isComplete(id)) {
      this.busy=true;this.disableAllNodes();this.clearHighlights();
      const leave = await enterIgloo();
      await playGame("search-igloo-objects");
      await leave();this.busy=false;this.highlightForwardChoices();return;
    }
    this.busy = true;
    this.disableAllNodes();
    this.clearHighlights();

    const node = this.nodeById(id);
    this.kiki.lookAt(node.x);
    this.kiki.react("curious");

    if (id === "secret-igloo") {
      this.landmarks.setIglooState("discovered");
      this.status.setText("You found the Secret Igloo!");
      this.sparkleBurst(node.x, node.y);
      await this.delay(900);
      const leaveIgloo = await enterIgloo();
      await depth("search-igloo-objects",id,"Inside the secret igloo","An explorer left three treasures. Find them all to earn an expedition badge.",[{id:"lantern",label:"Expedition lantern"},{id:"map",label:"Paw-stamped map"},{id:"nook",label:"Hidden reward nook"}],"lm-igloo-glow","search");
      await depth("igloo-fact",id,"Expedition badge earned","Huskies have a thick double coat that helps keep them warm. The old map points toward Race Camp.",[{id:"continue",label:"Pack the badge"}],"lm-igloo-glow");
      const accepted = await offerIglooBonus();
      if (accepted) {
        await depth("igloo-bonus-game", id, "Bolt’s rematch", "A friendly strategy challenge.", [], "lm-igloo-glow");
        this.adventure.recordBonusChallenge();
        this.status.setText("Bonus challenge complete! Another friendly victory");
      }
      await leaveIgloo();
    } else {
      this.status.setText("You found Kiki's hidden bone cache!");
      this.sparkleBurst(node.x, node.y);
      await depth("uncover-bone-cache",id,"A buried surprise","Brush away the snow to uncover Kiki’s hidden bone cache.",[{id:"sniff",label:"Follow the scent"},{id:"bone",label:"Wiggle the bone"},{id:"dig",label:"Dig up the stash"}],"lm-bonecache-hidden","search");
      awardGoldenBone(gameStore());
      this.adventure.completeEncounter(id);
      this.saveProgress();
      await showGoldenBone();
    }
    record("discovery-found",id,{discoveryId:id});
    if (id === "secret-igloo") this.landmarks.setIglooState("glow");
    else this.markers.setCleared(id);
    this.adventure.completeEncounter(id);
    this.saveProgress();
    this.busy = false;
    this.highlightForwardChoices();
  }

  private async runEncounter(node: AdventureNodeDef): Promise<void> {
    switch (node.encounter) {
      case "checkpoint":
        if(node.id === "snow-pass") {
          await depth("follow-trail-markers",node.id,"Follow the mountain markers","Trace the marked trail in order. A wrong turn never takes away progress.",[{id:"1",label:"1 · Paw print"},{id:"2",label:"2 · Pine"},{id:"3",label:"3 · Peak"},{id:"4",label:"4 · Camp"}],"lm-snowpass-blocked","ordered");
          const choice = await advice("advice-igloo-mound",node.id,"That snow mound looks funny. Peek inside?",[{id:"peek",label:"Peek inside"},{id:"later",label:"Keep going"}]);
          if(choice === "peek") { this.revealSecretNode("secret-igloo"); this.status.setText("The igloo is nearby — tap it after this trail marker."); }
        }
        this.status.setText(node.hint ?? "Kiki takes a breather.");
        this.kiki.react("happy");
        await this.delay(1100);
        break;

      case "math-normal":
      case "math-challenge": {
        if(node.id === "ice-cave") await depth("cave-crystals",node.id,"Listen to the ice cave","Tap the three crystals to hear the trail echo through the mountain.",[{id:"low",label:"Low crystal"},{id:"mid",label:"Middle crystal"},{id:"high",label:"High crystal"}],"lm-ice-cave","search");
        const difficulty = node.mathDifficulty ?? "normal";
        const titles: Record<string, string> = {
          "frozen-lake": "Which stones are safe? Solve to light the way!",
          "ice-cave": "Ice Cave Challenge",
          "summit-camp": "The Summit Gatekeeper asks…",
        };
        await this.runMathEncounter(difficulty, titles[node.id] ?? node.label, node.id);
        if (node.id === "frozen-lake") {
          await crossLakeInWorld(this,this.kiki,this.mover,this.status);
          this.status.setText("The safe stepping stones glimmer across the ice!");
          this.sparkleBurst(node.x, node.y);
          await this.delay(900);
        } else if (node.id === "summit-camp") {
          await depth("summit-ice",node.id,"Crack the frozen seal","The answer loosens the ice. Tap each frozen lock to free the gate.",[{id:"left",label:"Left ice lock"},{id:"top",label:"Top ice lock"},{id:"right",label:"Right ice lock"}],"ip-sg-cracking","search");
          this.markers.setCleared(node.id);
          await depth("summit-view",node.id,"You reached the summit!","Look down the mountain — Bolt and the sleds are waiting at Race Camp.",[{id:"camp",label:"Head to Race Camp"}],"ip-sg-view");
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
  private async runForestChoice(_node: AdventureNodeDef): Promise<void> {
    await depth("sniff-pawprints","forest","Two trails in the snow","What should Kiki investigate?",[{id:"pawprints",label:"Sniff paw prints"},{id:"carved-sign",label:"Read carved sign"}]);
    const choice=await advice("advice-forest-noise","forest","I hear something behind the trees. Should we check it out?",[{id:"check-it-out",label:"Check it out"},{id:"keep-going",label:"Keep going"}]);
    if(choice === "check-it-out") await depth("forest-hare","forest","A rustle in the snow!","A feather flutters from the bush. Kiki spots a clue: look for a bone-shaped mound near the pass.",[{id:"clue",label:"Remember the clue"}],"lm-bonecache-hidden");
    return new Promise((resolve) => {
      const c = this.add.container(640, 360).setDepth(100);
      const shade = this.add.rectangle(0, 0, 1280, 720, 0x0d2235, 0.58);
      const panelG = this.add.graphics();
      panelG.fillStyle(0x163648, 0.96);
      panelG.lineStyle(3, 0xd3b777, 1);
      panelG.fillRoundedRect(-330, -215, 660, 430, 30);
      panelG.strokeRoundedRect(-330, -215, 660, 430, 30);

      const header = this.add.text(0, -160, "The trail splits…", {
        fontFamily: "Georgia", fontSize: "30px", color: "#ffe1a3",
      }).setOrigin(0.5);
      const body = this.add.text(
        0, -95,
        "Kiki sniffs both trails.\nPaw prints wander left toward the Safe Trail.\nThe icy shortcut glitters right — faster, but trickier!",
        { fontFamily: "Arial", fontSize: "21px", color: "#d9e7ec", align: "center", lineSpacing: 8 },
      ).setOrigin(0.5);
      c.add([shade, panelG, header, body]);

      const mkButton = (
        y: number, title: string, sub: string, color: number, route: AdventureRoute,
      ) => {
        const bg = woodButton(this, 0, y, 460, 84);
        const t = this.add.text(0, y - 14, title, {
          fontFamily: "Georgia", fontSize: "24px", color: "#ffffff",
        }).setOrigin(0.5);
        const s = this.add.text(0, y + 18, sub, {
          fontFamily: "Arial", fontSize: "16px", color: "#ffffff",
        }).setOrigin(0.5);
        bg.once("pointerdown", () => {
          this.adventure.setRoute(route);
          complete("choose-route","forest",route);
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
  private async runFallenTree(node: AdventureNodeDef): Promise<void> {
    await depth("clear-fallen-tree",node.id,"Clear the fallen tree","Help Kiki pull five branches off the trail.",Array.from({length:5},(_,i)=>({id:String(i),label:`Branch ${i+1}`})),"lm-fallentree-blocked","search");
    this.markers.setCleared(node.id); this.kiki.react("happy");
  }

  private offerBonusChallenge(title: string, body: string): Promise<boolean> {
    return new Promise((resolve) => {
      const c = this.add.container(640, 360).setDepth(100);
      const shade = this.add.rectangle(0, 0, 1280, 720, 0x0d2235, 0.58);
      const panelG = this.add.graphics();
      panelG.fillStyle(0x163648, 0.96);
      panelG.lineStyle(3, 0xd3b777, 1);
      panelG.fillRoundedRect(-300, -180, 600, 360, 30);
      panelG.strokeRoundedRect(-300, -180, 600, 360, 30);
      const header = this.add.text(0, -120, title, {
        fontFamily: "Georgia", fontSize: "26px", color: "#ffe1a3", align: "center",
        wordWrap: { width: 500 },
      }).setOrigin(0.5);
      const text = this.add.text(0, -40, body, {
        fontFamily: "Arial", fontSize: "21px", color: "#d9e7ec", align: "center",
      }).setOrigin(0.5);
      const yes = woodButton(this, -140, 90, 220, 70);
      const yesT = this.add.text(-140, 90, "Let's go!", {
        fontFamily: "Georgia", fontSize: "22px", color: "#ffffff",
      }).setOrigin(0.5);
      const no = woodButton(this, 140, 90, 220, 70);
      const noT = this.add.text(140, 90, "Later", {
        fontFamily: "Georgia", fontSize: "22px", color: "#ffffff",
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
    const points=bridgePath();
    const start=points[0];
    this.status.setText("Kiki spots the missing boards…");
    await this.mover.walk({curve:new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(this.kiki.x,this.kiki.y),new Phaser.Math.Vector2(430,550),new Phaser.Math.Vector2(start.x,start.y)),gait:"trot",terrain:"normal-snow",arrivalReaction:"surprised"});
    await this.runMathEncounter("normal", "Count the repair supplies with Kiki. Then fit the three missing bridge boards.", "broken-bridge");
    await repairBridgeInWorld(this,this.status);
    this.landmarks.repairBridge(false);
    this.status.setText("The bridge is fixed — careful paws across the deck!");
    this.landmarks.addBridgeForeground();
    this.tweens.add({targets:this.cameras.main,zoom:1.04,duration:700,ease:"Sine.inOut"});
    await this.mover.walk({curve:new Phaser.Curves.Spline(points.map(p=>new Phaser.Math.Vector2(p.x,p.y))),scalePoints:points,gait:"careful",terrain:"bridge",arrivalReaction:"proud"});
    this.tweens.add({targets:this.cameras.main,zoom:1,duration:850,ease:"Sine.inOut"});
    this.adventure.currentNodeId = "broken-bridge";
    this.adventure.completeEncounter("broken-bridge");

  }

  private terrainFor(id: string): TerrainId {
    return ({"broken-bridge":"bridge", "frozen-lake":"ice", "fallen-tree":"deep-snow", "ice-cave":"cave", "snow-pass":"windy-pass", "summit-camp":"uphill"} as Record<string,TerrainId>)[id] ?? "normal-snow";
  }

  private async walkKiki(toId: string, kind: AdventureRouteKind): Promise<void> {
    this.status.setText("Kiki is walking…");
    await this.mover.walk({
      curve: this.routeCurve(this.adventure.currentNodeId, toId, kind),
      gait: kind === "challenge" ? "dash" : "trot",
      terrain: this.terrainFor(toId),
      arrivalReaction: "happy",
    });
    this.status.setText("Kiki is ready to explore");
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
    for(const o of this.children.list) if(o.getData("terrain-node") === id) (o as Phaser.GameObjects.Image).setVisible(true);
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

  private runMathEncounter(difficulty: "normal" | "challenge", title: string, nodeId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      const q = this.math.nextQuestion(difficulty);
      record("math-asked",nodeId,{required:nodeId !== "secret-igloo"});
      const story = HUSKY_NARRATIVE.encounters.find(e => e.nodeId === nodeId);
      const operands = q.prompt.match(/(\d+) × (\d+)/);
      const fill = (text: string) => text.replaceAll("{a}", operands?.[1] ?? "").replaceAll("{b}", operands?.[2] ?? "");
      const heading = story?.math ? fill(story.math.template) : title;
      if (story?.hints?.hints[0]) q.hint = fill(story.hints.hints[0]);
      this.showMathPrompt(q, heading, resolve);
    });
  }

  private showMathPrompt(q: MathQuestion, title: string, resolve: (value: boolean) => void): void {
    this.prompt?.destroy(true);

    const c = this.add.container(950, 355).setDepth(100);
    const shade = this.add.rectangle(-310, 5, 1280, 720, 0x0d2235, 0.08);
    const panelG = this.add.graphics();
    const grain = this.add.image(0, 25, "wood-panel").setDisplaySize(530, 480);
    panelG.fillStyle(0x382716, 0.75);
    panelG.lineStyle(7, q.difficulty === "challenge" ? 0xbda2e0 : 0xdab878, 1);
    panelG.fillRoundedRect(-265, -215, 530, 480, 20);
    panelG.strokeRoundedRect(-265, -215, 530, 480, 20);

    const header = this.add.text(0, -158, title, {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: q.difficulty === "challenge" ? "#e1cbff" : "#fff1d4",
      align: "center",
      wordWrap: { width: 450 },
    }).setOrigin(0.5);
    const prompt = this.add.text(0, -80, q.prompt, {
      fontFamily: "Georgia",
      fontSize: "58px",
      color: "#fff1d4",
    }).setOrigin(0.5);
    const hintLabel = this.add.text(0, 230, "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#fff1d4",
      align: "center", wordWrap: { width: 470 },
    }).setOrigin(0.5);
    c.add([shade, grain, panelG, header, prompt, hintLabel]);

    let resolved = false;
    let wrongCount = 0;
    q.answers.forEach((answer, index) => {
      const x = index % 2 === 0 ? -126 : 126;
      const y = 40 + Math.floor(index / 2) * 110;
      const btn = woodButton(this, x, y, 210, 76);
      const label = this.add.text(x, y, String(answer), {
        fontFamily: "Georgia",
        fontSize: "34px",
        color: "#ffffff",
        stroke: "#17324d",
        strokeThickness: 4,
      }).setOrigin(0.5);

      btn.on("pointerdown", () => {
        if (resolved) return;
        record("math-answered",undefined,{correct:answer === q.correct});
        if (answer === q.correct) {
          resolved = true;
          this.status.setText("Correct!");
          c.destroy(true);
          this.prompt = undefined;
          resolve(true);
        } else {
          wrongCount += 1;
          hintLabel.setText("Not quite — try once more. " + q.hint);
          this.status.setText("Not quite — you have one more try.");
          label.setColor("#ffdddd");
          if (wrongCount >= 2) {
            resolved = true;
            record("hint-shown");
            c.destroy(true); this.prompt = undefined;
            void explainMath(q, "Your adventure progress is safe. Let’s try a different problem.", "Try a new problem").then(() => {
              this.status.setText("A fresh problem — take your time.");
              const next = this.math.nextQuestion(q.difficulty, q.prompt);
              record("math-asked", undefined, {required:true});
              this.showMathPrompt(next, "A fresh problem — you can do this!", resolve);
            });
          }
        }
      });
      c.add([btn, label]);
    });

    this.pinOverlay(c);
    this.prompt = c;
  }

  // ------------------------------------------------------------------- reward

  private async showRewardOverlay(): Promise<void> {
    this.busy = true;
    this.clearHighlights();
    const unlocked = this.adventure.tryUnlockSticker();
    this.saveProgress();
    if (unlocked) {
      AdventureEvents.emitStickerUnlocked({
        adventureId: HUSKY_ADVENTURE.id,
        stickerName: HUSKY_ADVENTURE.stickerName,
        secretsFound: [...this.adventure.secretsFound].filter((id) => !id.startsWith("revealed:")).length,
        bonusChallengesCompleted: this.adventure.bonusChallengesCompleted,
      });
    }

    await depth("pick-favorite-moment","husky-reward","What an adventure!","Bolt gives Kiki a friendly nuzzle. What was your favorite moment?",[{id:"bridge",label:"Mending the bridge"},{id:"exploring",label:"Exploring the mountain"},{id:"race",label:"Racing with Bolt"}],"race-backdrop");
    finishPolishRun(); showPlaytestStats();
    const quiz = new HuskyGraduation(gameStore());
    const newGold = !quiz.passed;
    if (newGold) await showHuskyGraduation(quiz);
    const rewards = syncHuskyProgress(this.adventure, gameStore());
    if (this.adventure.isComplete("snow-cache")) awardGoldenBone(gameStore());
    this.kiki.container.setVisible(false);
    const presentation = {unlocked:this.adventure.stickerUnlocked,
      golden:rewards.goldenStickerUnlocked,bone:hasGoldenBone(gameStore()),mastery:rewards.masteryPoints(),
      turns:this.adventure.raceTurns,secrets:[...this.adventure.secretsFound].filter(s=>!s.startsWith("revealed:")).length};
    if (newGold) await showStickerAlbum(presentation,true);
    const choice = await showCollectibleReward(presentation);
    if(choice === "replay") { this.scene.restart({fresh:true}); return; }
    this.kiki.container.setVisible(true);
    this.prompt=undefined; this.busy=false; this.highlightForwardChoices();
  }

  // ------------------------------------------------------------------- cleanup

  private clearHighlights(): void {
    this.guidance?.clear();
    this.redrawAllEdges();

    for (const [id, node] of this.nodeObjects) {
      this.tweens.killTweensOf(node);
      node.setScale(1);
      const baseY = this.nodeBaseY.get(id);
      if (baseY !== undefined) node.y = baseY;
      node.disableInteractive();
      node.off("pointerdown");
      for(const child of node.list)if(child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Text){child.disableInteractive();child.off("pointerdown");}
    }

    this.children.list
      .filter((child) => child.getData && child.getData("route-arrow"))
      .forEach((child) => child.destroy());
  }

  private disableAllNodes(): void {
    for (const node of this.nodeObjects.values()) {
      node.disableInteractive();
      for(const child of node.list)if(child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Text)child.disableInteractive();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
