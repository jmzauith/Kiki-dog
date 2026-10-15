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
import { KikiMover } from "../systems/KikiMover";
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
  private kikiMover!: KikiMover;
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

    try {
      const checkpoint = JSON.parse(gameStore().getItem("husky:race-checkpoint") ?? "null");
      if(checkpoint && Number.isInteger(checkpoint.turns) && checkpoint.turns >= 0 && checkpoint.turns <= 3 && Number.isInteger(checkpoint.kiki) && checkpoint.kiki >= 0 && checkpoint.kiki <= this.race.finish && Number.isInteger(checkpoint.rival) && checkpoint.rival >= 0 && checkpoint.rival < this.race.finish) {
        this.turns=checkpoint.turns; this.turbos=checkpoint.turbos;
        this.race.kiki=checkpoint.kiki; this.race.rival=checkpoint.rival;
        this.kiki.setPosition(this.trackX(this.race.kiki),480-this.race.kiki*31);
        this.rival.setPosition(this.trackX(this.race.rival),390-this.race.rival*22);
      }
    } catch { /* Optional checkpoint corruption must not block play. */ }
    if(this.turns >= 3) { this.busy=true; void this.finalSprint(); }
    else this.showPaceChoices();
  }

  private createKikiRacer(): void {
    this.kiki = this.add.container(155, 480).setDepth(12);
    const sled = this.add.image(-6, 45, "wooden-sled").setDisplaySize(180, 60);

    this.kikiChar = new KikiCharacter(this, 0, -7, {
      depth: 0,
      scale: 0.72,
      footprints: false,
      puffs: true,
    });
    this.kikiChar.setIdlePose("sled-ready");
    this.kikiChar.setPose("sled-ready");
    this.kiki.add([sled, this.kikiChar.container]);
    this.kikiMover = new KikiMover(this, this.kikiChar, this.kiki);
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

  private trackX(progress: number): number {
    return 155 + progress * (945 / this.race.finish);
  }

  private drawTrack(): void {
    this.backdrop = this.add.image(0, 0, "ip-re-downhill").setOrigin(0).setDisplaySize(1280, 720).setDepth(-10);
    this.add.image(1100, 295, "race-checkpoint").setDisplaySize(300, 170).setDepth(2);
  }

  private createHuskyRacer(): Phaser.GameObjects.Container {
    const c = this.add.container(155, 390).setDepth(11);
    const sled = this.add.image(-6, 45, "wooden-sled").setDisplaySize(200, 67);
    this.rivalChar = new HuskyCharacter(this, 0, -16, { scale: 0.92, depth: 0, footprints: false, puffs: true });
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
    this.backdrop.setTexture(["ip-re-downhill","ip-re-icyturn","ip-re-deepsnow"][this.turns]).setDisplaySize(1280,720);
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
    this.backdrop.setTexture("ip-re-finish").setDisplaySize(1280,720);
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

  private moveKiki(progress: number, turbo: boolean): Promise<void> {
    this.kikiChar.setIdlePose(turbo ? "race-turbo" : "race-steady");
    this.kikiChar.setPose(turbo ? "race-turbo" : "race-steady");
    const targetX = this.trackX(progress);
    if (turbo) this.createTurboBurst(this.kiki.x, this.kiki.y);

    const targetY = 480 - progress * 31;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(this.kiki.x, this.kiki.y),
      new Phaser.Math.Vector2((this.kiki.x + targetX) / 2, this.kiki.y + 12),
      new Phaser.Math.Vector2(targetX, targetY),
    );
    this.tweens.add({ targets: this.kiki, scale: 1 - progress * 0.045, duration: 650 });
    return this.kikiMover.walk({
      curve,
      gait: turbo ? "dash" : "trot",
      durationMs: turbo ? 650 : 950,
      arrivalReaction: turbo ? "happy" : "none",
      keepPose: true,
    });
  }

  private moveRacer(
    racer: Phaser.GameObjects.Container,
    progress: number,
    turbo: boolean,
  ): Promise<void> {
    const targetX = this.trackX(progress);
    if (turbo) this.createTurboBurst(racer.x, racer.y);

    return new Promise((resolve) => {
      this.tweens.add({
        targets: racer,
        x: targetX,
        y: 390 - progress * 22,
        scale: 1 - progress * 0.045,
        duration: turbo ? 650 : 950,
        ease: turbo ? "Back.out" : "Sine.inOut",
        onUpdate: () => this.createSnowPuff(racer.x - 42, racer.y + 42),
        onComplete: () => resolve(),
      });
    });
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
    btn.once("pointerdown", () => this.scene.start("HuskyScene"));
    c.add([label, btn, btnLabel]);
    this.status.setVisible(false);
  }

  private timeDelay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
