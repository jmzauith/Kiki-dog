import { depth } from "../visuals/HuskyDepth";
import { record } from "../systems/PolishRun";
import { preloadPolishProps, woodButton } from "../visuals/PolishArt";
import { gameStore, HUSKY_GAME_SAVE_KEY } from "../systems/PlayContext";
import { preloadPreviewArt, previewBadge } from "../visuals/PreviewArt";
import Phaser from "phaser";
import { MathEngine, MathQuestion } from "../systems/MathEngine";
import { RaceProgressState } from "../systems/RaceProgress";
import { KikiCharacter } from "../systems/KikiCharacter";
import { HuskyCharacter } from "../systems/HuskyCharacter";
import { RACE_TERRAIN } from "../visuals/RaceTerrain";
import { HUSKY_ADVENTURE } from "../systems/HuskyAdventure";
import { markRaceComplete } from "../systems/AdventurePersistence";
import { AdventureEvents } from "../systems/AdventureEvents";

type MoveMode = "steady" | "turbo";

/** Three math decisions; a physical final sprint fills any remaining spaces. */
const HUSKY_RACE_FINISH = 5;

export class RaceScene extends Phaser.Scene {
  private math = new MathEngine();
  private race = new RaceProgressState(HUSKY_RACE_FINISH);
  private busy = false;
  private turns = 0;
  private turbos = 0;
  private kiki!: Phaser.GameObjects.Container;
  private kikiChar!: KikiCharacter;
  private shot = 0;
  private rivalChar!: HuskyCharacter;
  private rival!: Phaser.GameObjects.Container;
  private backdrop!: Phaser.GameObjects.Image;
  private status!: Phaser.GameObjects.Text;
  private prompt?: Phaser.GameObjects.Container;
  private choiceGroup!: Phaser.GameObjects.Container;

  constructor() {
    super("RaceScene");
  }

  preload(): void {
    preloadPreviewArt(this);
    preloadPolishProps(this);
    this.load.image("wooden-sled", "assets/polish/wooden-sled.png");
    KikiCharacter.preload(this);
    HuskyCharacter.preload(this);
  }

  create(): void {
    this.race.reset();
    this.busy = false;
    this.turns = 0;
    this.turbos = 0;
    this.prompt = undefined;

    this.cameras.main.setBackgroundColor("#bde8ff");
    this.cameras.main.fadeIn(400, 22, 45, 60);
    this.drawTrack();
    this.drawHeader();
    previewBadge(this);
    this.createKikiRacer();
    this.rival = this.createHuskyRacer();
    this.status = this.add.text(640, 688, "Choose your pace", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#fff0cc",
      backgroundColor: "#183747dd",
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setDepth(20);

    const inspection = import.meta.env.DEV && new URLSearchParams(location.search).get("composition")?.match(/^race-shot-([0-3])$/);
    if (inspection) {
      this.setRaceShot(Number(inspection[1]));
      this.status.setText("Visual inspection · no adventure saves");
      const preview = woodButton(this,640,615,300,60);
      this.add.text(640,615,"Preview sled motion",{fontSize:"22px",color:"#ffffff"}).setOrigin(0.5).setDepth(30);
      preview.setDepth(29).on("pointerdown",async()=>{
        if(this.busy)return;
        this.busy=true;this.setRaceShot(this.shot);
        await Promise.all([this.moveKiki(0,false),this.moveRacer(this.rival,0,false)]);
        this.busy=false;
      });
      return;
    }
    this.setRaceShot(0);
    try {
      const checkpoint = JSON.parse(gameStore().getItem("husky:race-checkpoint") ?? "null");
      if(checkpoint && Number.isInteger(checkpoint.turns) && checkpoint.turns >= 0 && checkpoint.turns <= 3 && Number.isInteger(checkpoint.kiki) && checkpoint.kiki >= 0 && checkpoint.kiki <= this.race.finish && Number.isInteger(checkpoint.rival) && checkpoint.rival >= 0 && checkpoint.rival < this.race.finish) {
        this.turns=checkpoint.turns; this.turbos=checkpoint.turbos;
        this.race.kiki=checkpoint.kiki; this.race.rival=checkpoint.rival;
        this.setRaceShot(Math.min(this.turns,3));
      }
    } catch { /* Optional checkpoint corruption must not block play. */ }
    if(this.turns >= 3) { this.busy=true; void this.finalSprint(); }
    else this.showPaceChoices();
  }

  private createKikiRacer(): void {
    this.kiki = this.add.container(155, 480).setDepth(12);
    const sled = this.add.image(-6, 45, "wooden-sled").setDisplaySize(180, 60);

    this.kikiChar = new KikiCharacter(this, 0, 12, {
      depth: 0,
      scale: 0.72,
      footprints: false,
      puffs: true,
    });
    this.kikiChar.setIdlePose("sled-ready");
    this.kikiChar.setPose("sled-ready");
    this.kiki.add([sled, this.kikiChar.container]);

  }

  private drawHeader(): void {
    this.add.text(640, 55, "THE GREAT HUSKY SLED RACE", {
      fontFamily: "Georgia",
      fontSize: "30px",
      color: "#ffffff",
      stroke: "#193d50",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(640, 105, "Steady Math = 1 space  •  Turbo Math = 2 spaces", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ffffff", stroke: "#17324d", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);
  }

  private setRaceShot(shot: number): void {
    this.shot = shot;
    this.backdrop.setTexture(["ip-re-downhill","ip-re-icyturn","ip-re-deepsnow","ip-re-finish"][shot]).setDisplaySize(1280,720);
    const start=RACE_TERRAIN[shot][0];
    this.kiki.setPosition(start.x,start.y).setScale(start.scale);
    this.rival.setPosition(start.x-75,start.y+35).setScale(start.scale*0.9);
    this.kikiChar.setFacing("right");this.rivalChar.setFacing("right");
    (this.kiki.list[0] as Phaser.GameObjects.Image).setFlipX(false);
    (this.rival.list[0] as Phaser.GameObjects.Image).setFlipX(false);
  }

  private drawTrack(): void {
    this.backdrop = this.add.image(0, 0, "ip-re-downhill").setOrigin(0).setDisplaySize(1280, 720).setDepth(-10);
  }

  private createHuskyRacer(): Phaser.GameObjects.Container {
    const c = this.add.container(155, 390).setDepth(11);
    const sled = this.add.image(-6, 45, "wooden-sled").setDisplaySize(200, 67);
    this.rivalChar = new HuskyCharacter(this, 0, 12, { scale: 0.92, depth: 0, footprints: false, puffs: true });
    this.rivalChar.setIdlePose("race");
    this.rivalChar.setPose("race");
    c.add([sled, this.rivalChar.container]);
    return c;
  }

  private showPaceChoices(): void {
    if (this.busy || this.race.over) return;
    this.choiceGroup?.destroy(true);

    const c = this.add.container(640, 615).setDepth(30);
    const steady = this.createChoiceButton(-180, "STEADY", "Current math • +1", 0x2f84b8, () =>
      this.beginTurn("steady"),
    );
    const turbo = this.createChoiceButton(180, "TURBO ★", "Harder math • +2", 0x7651b3, () =>
      this.beginTurn("turbo"),
    );
    c.add([steady, turbo]);
    this.choiceGroup = c;
  }

  private createChoiceButton(
    x: number,
    title: string,
    subtitle: string,
    color: number,
    callback: () => void,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, 0);
    const bg = woodButton(this, 0, 0, 300, 74);
    const titleText = this.add.text(0, -12, title, {
      fontFamily: "Georgia",
      fontSize: "23px",
      color: "#ffffff",
    }).setOrigin(0.5);
    const sub = this.add.text(0, 18, subtitle, {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#ffffff",
    }).setOrigin(0.5);
    bg.on("pointerdown", callback);
    c.add([bg, titleText, sub]);
    return c;
  }

  private async beginTurn(mode: MoveMode): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.choiceGroup?.setVisible(false);

    const beats = [
      {id:"downhill",title:"The downhill dash",body:"Tap when the paw reaches the gold snow. Kiki tucks into the downhill dash!",options:[{id:"push",label:"Push off!"}],mode:"timing" as const},
      {id:"icy-turn",title:"An icy bend",body:"Which line should Kiki take? Both paths lead safely around the bend.",options:[{id:"inside",label:"Lean inside"},{id:"outside",label:"Sweep outside"}],mode:"choice" as const},
      {id:"deep-snow",title:"Deep powder",body:"Help Kiki paddle through the soft snow!",options:[{id:"1",label:"Paddle left"},{id:"2",label:"Paddle right"},{id:"3",label:"Push through"}],mode:"ordered" as const},
    ];
    const beat = beats[this.turns];
    this.setRaceShot(this.turns);
    this.rivalChar.setPose(this.turns === 1 ? "leaning-turn" : this.turns === 2 ? "deep-snow" : "race-fast");
    this.kikiChar.setPose(this.turns === 1 ? "race-lean" : this.turns === 2 ? "race-hit" : "race-steady");
    await depth(`race-${beat.id}`,"sled-race",beat.title,beat.body,beat.options,"race-backdrop",beat.mode);
    record("race-beat","sled-race",{beatId:beat.id});
    const success = await this.askMath(mode === "turbo" ? "challenge" : "normal", mode);
    if (success) {
      this.turns += 1;
      record("race-turn","sled-race",{turn:this.turns,mode});
      if (mode === "turbo") this.turbos += 1;
      this.race.playerMove(mode);
      this.saveCheckpoint();
      await this.moveKiki(this.race.kiki, mode === "turbo");
    }

    if (this.turns >= 3) {
      await this.finalSprint();
      return;
    }

    this.status.setText("The Husky takes a turn…");
    await this.timeDelay(350);
    this.race.rivalMove();
    this.saveCheckpoint();
    await this.moveRacer(this.rival, this.race.rival, false);

    this.busy = false;
    this.status.setText("Choose your pace");
    this.choiceGroup?.setVisible(true);
  }

  private saveCheckpoint(): void {
    gameStore().setItem("husky:race-checkpoint",JSON.stringify({turns:this.turns,turbos:this.turbos,kiki:this.race.kiki,rival:this.race.rival}));
  }

  private async finalSprint(): Promise<void> {
    this.setRaceShot(3);
    await depth("race-final-sprint","sled-race","The finish is in sight!","Give Kiki one last cheer — no more math!",[{id:"cheer",label:"Go, Kiki, go!"}],"race-backdrop");
    record("race-beat","sled-race",{beatId:"final-sprint"});
    while(!this.race.over) this.race.playerMove("steady");
    await this.moveKiki(this.race.kiki,true);
    await this.finishRace();
  }

  private askMath(
    difficulty: "normal" | "challenge",
    mode: MoveMode,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const q = this.math.nextQuestion(difficulty);
      record("math-asked","sled-race",{required:true});
      this.showMathPrompt(q, mode, resolve);
    });
  }

  private showMathPrompt(
    q: MathQuestion,
    mode: MoveMode,
    resolve: (result: boolean) => void,
  ): void {
    const c = this.add.container(640, 360).setDepth(100);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x10263a, 0.25);
    const panel = this.add.rectangle(0, 0, 630, 430, 0x142e40, 0.96)
      .setStrokeStyle(7, mode === "turbo" ? 0xc2a1de : 0xe7c36e, 1);
    const header = this.add.text(0, -160, mode === "turbo" ? "TURBO MATH ★" : "STEADY MATH", {
      fontFamily: "Georgia",
      fontSize: "30px",
      color: mode === "turbo" ? "#dfc5ff" : "#ffe3a5",
    }).setOrigin(0.5);
    const prompt = this.add.text(0, -82, q.prompt, {
      fontFamily: "Georgia",
      fontSize: "58px",
      color: "#fff1d4",
    }).setOrigin(0.5);
    c.add([shade, panel, header, prompt]);

    const hint = this.add.text(0, 195, "", { fontFamily: "Arial", fontSize: "18px", color: "#d2e4ee" }).setOrigin(0.5);
    c.add(hint);
    let wrongCount = 0;
    let resolved = false;
    q.answers.forEach((answer, index) => {
      const x = index % 2 === 0 ? -150 : 150;
      const y = 35 + Math.floor(index / 2) * 110;
      const btn = woodButton(this, x, y, 235, 76);
      const label = this.add.text(x, y, String(answer), {
        fontFamily: "Georgia",
        fontSize: "33px",
        color: "#ffffff",
        stroke: "#17324d",
        strokeThickness: 4,
      }).setOrigin(0.5);

      btn.on("pointerdown", () => {
        if (resolved) return;
        record("math-answered","sled-race",{correct:answer === q.correct});
        if (answer === q.correct) {
          resolved = true;
          c.destroy(true);
          this.prompt = undefined;
          resolve(true);
        } else {
          wrongCount += 1;
          if(wrongCount === 2) record("hint-shown","sled-race");
          if (wrongCount >= 2 && q.hint) hint.setText(q.hint);
          this.cameras.main.shake(150, 0.005);
          label.setColor("#ffd6d6");
          this.time.delayedCall(260, () => label.setColor("#ffffff"));
        }
      });
      c.add([btn, label]);
    });

    this.prompt = c;
  }

  private moveKiki(_progress: number, turbo: boolean): Promise<void> {
    this.kikiChar.setIdlePose(turbo ? "race-turbo" : "race-steady");
    this.kikiChar.setPose(turbo ? "race-turbo" : "race-steady");
    return this.moveSled(this.kiki,false,turbo);
  }

  private moveRacer(racer: Phaser.GameObjects.Container, _progress: number, turbo: boolean): Promise<void> {
    return this.moveSled(racer,true,turbo);
  }

  private moveSled(racer: Phaser.GameObjects.Container, rival: boolean, turbo: boolean): Promise<void> {
    const points=RACE_TERRAIN[this.shot];
    const curve=new Phaser.Curves.Spline(points.map(p=>new Phaser.Math.Vector2(p.x,p.y)));
    const dog=rival?this.rivalChar:this.kikiChar;
    const proxy={t:0};
    if(turbo)this.createTurboBurst(racer.x,racer.y);
    return new Promise(resolve=>this.tweens.add({
      targets:proxy,t:1,duration:turbo?1500:2000,ease:"Sine.inOut",
      onUpdate:()=>{
        const t=proxy.t*(rival?0.82:1);
        const point=curve.getPoint(t), tangent=curve.getTangent(t);
        if(rival){point.x-=75*(1-proxy.t);point.y+=35*(1-proxy.t);}
        const scale=Phaser.Math.Linear(points[0].scale,points[2].scale,t)*(rival?0.9:1);
        racer.setPosition(point.x,point.y).setScale(scale);
        dog.setFacing(tangent.x<0?"left":"right");
        (racer.list[0] as Phaser.GameObjects.Image).setFlipX(tangent.x<0);
        // Snow comes from the runner contact, not the dog's body.
        this.createSnowPuff(point.x-35*scale,point.y+70*scale);
      },
      onComplete:()=>resolve(),
    }));
  }

  private createSnowPuff(x: number, y: number): void {
    if (Math.random() > 0.28) return;
    const puff = this.add.circle(x, y, Phaser.Math.Between(3, 8), 0xffffff, 0.7).setDepth(8);
    this.tweens.add({
      targets: puff,
      alpha: 0,
      scale: 2.2,
      duration: 420,
      onComplete: () => puff.destroy(),
    });
  }

  private createTurboBurst(x: number, y: number): void {
    for (let i = 0; i < 9; i++) {
      const star = this.add.star(
        x + Phaser.Math.Between(-30, 30),
        y + Phaser.Math.Between(-35, 35),
        5, 4, 9, 0xffd85a, 1,
      ).setDepth(20);
      this.tweens.add({
        targets: star,
        x: star.x - Phaser.Math.Between(20, 70),
        alpha: 0,
        scale: 0.3,
        duration: 500,
        onComplete: () => star.destroy(),
      });
    }
  }

  private async finishRace(): Promise<void> {
    gameStore().removeItem("husky:race-checkpoint");
    markRaceComplete(HUSKY_GAME_SAVE_KEY, HUSKY_ADVENTURE, { turns: this.turns, turbos: this.turbos }, gameStore());
    this.choiceGroup?.destroy(true);
    this.kikiChar.setIdlePose("race-celebrate");
    this.kikiChar.setPose("race-celebrate");
    this.rivalChar.setIdlePose("celebrate");
    this.rivalChar.setPose("celebrate");
    this.status.setText("KIKI WINS!");
    this.cameras.main.flash(450, 255, 245, 180);


    for (let i = 0; i < 3; i++) {
      this.tweens.add({
        targets: this.kiki,
        y: this.kiki.y - 22,
        duration: 210,
        yoyo: true,
        ease: "Quad.out",
      });
      await this.timeDelay(460);
    }

    for (let i = 0; i < 28; i++) {
      const star = this.add.star(
        Phaser.Math.Between(120, 1160),
        Phaser.Math.Between(130, 580),
        5, 4, 11,
        i % 2 === 0 ? 0xffd64f : 0x7ed6ff,
        1,
      ).setDepth(30);
      this.tweens.add({
        targets: star,
        y: star.y + Phaser.Math.Between(80, 180),
        angle: Phaser.Math.Between(-160, 160),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1500),
        delay: Phaser.Math.Between(0, 250),
        onComplete: () => star.destroy(),
      });
    }

    await this.timeDelay(1500);

    // Clean completion state: persist the win, announce it on the event bus,
    // and hand the player a real continuation (the Husky reward screen) —
    // the race no longer dead-ends on text.

    AdventureEvents.emitRaceComplete({
      adventureId: HUSKY_ADVENTURE.id,
      turns: this.turns,
      turbos: this.turbos,
    });

    const c = this.add.container(640, 470).setDepth(40);
    const label = this.add.text(
      0, 0,
      `Kiki wins in ${this.turns} turns!`,
      {
        fontFamily: "Georgia",
        fontSize: "28px",
        color: "#fff0cc",
        backgroundColor: "#183747ee",
        padding: { x: 18, y: 12 },
      },
    ).setOrigin(0.5);
    const btn = woodButton(this, 0, 90, 320, 70);
    const btnLabel = this.add.text(0, 90, "Continue  →", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: "#ffffff",
    }).setOrigin(0.5);
    // Phaser retains scene data across starts. Clear the prior Play again flag
    // so returning from a replayed race restores its win instead of erasing it.
    btn.once("pointerdown", () => this.scene.start("HuskyScene", { fresh: false }));
    c.add([label, btn, btnLabel]);
    this.status.setVisible(false);
  }

  private timeDelay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
