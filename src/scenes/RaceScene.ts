import Phaser from "phaser";
import { MathEngine, MathQuestion } from "../systems/MathEngine";
import { RaceProgressState } from "../systems/RaceProgress";
import { KikiCharacter } from "../systems/KikiCharacter";
import { KikiMover } from "../systems/KikiMover";
import { HUSKY_ADVENTURE, HUSKY_SAVE_KEY } from "../systems/HuskyAdventure";
import { markRaceComplete } from "../systems/AdventurePersistence";
import { AdventureEvents } from "../systems/AdventureEvents";

type MoveMode = "steady" | "turbo";

/** Husky race length: 3 (all-turbo) to 5 (all-steady) math decisions. */
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
  private rival!: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;
  private prompt?: Phaser.GameObjects.Container;
  private choiceGroup!: Phaser.GameObjects.Container;

  constructor() {
    super("RaceScene");
  }

  preload(): void {
    KikiCharacter.preload(this);
  }

  create(): void {
    this.race.reset();
    this.busy = false;
    this.turns = 0;
    this.turbos = 0;
    this.prompt = undefined;

    this.cameras.main.setBackgroundColor("#bde8ff");
    this.drawTrack();
    this.drawHeader();
    this.createKikiRacer();
    this.rival = this.createDog(155, 300, 0x51657c, 0xf5f8ff, "HUSKY");
    this.status = this.add.text(640, 640, "Choose your pace", {
      fontFamily: "Arial Black, Arial",
      fontSize: "24px",
      color: "#17324d",
      backgroundColor: "#ffffffdd",
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setDepth(20);

    this.showPaceChoices();
  }

  private createKikiRacer(): void {
    this.kiki = this.add.container(155, 426).setDepth(12);
    const sled = this.add.rectangle(-8, 29, 92, 14, 0x9b5a2f, 1).setStrokeStyle(3, 0x63371c);
    const runner = this.add.line(0, 0, -55, 42, 40, 42, 0x5c6f7f, 1).setLineWidth(4);
    const tag = this.add.text(0, 62, "KIKI", {
      fontFamily: "Arial Black, Arial",
      fontSize: "18px",
      color: "#17324d",
      backgroundColor: "#ffffffcc",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5);

    this.kikiChar = new KikiCharacter(this, 0, -4, {
      depth: 0,
      scale: 0.6,
      footprints: false,
      puffs: true,
    });
    this.kikiChar.setIdlePose("race");
    this.kikiChar.setPose("race");
    this.kiki.add([runner, sled, this.kikiChar.container, tag]);
    this.kikiMover = new KikiMover(this, this.kikiChar, this.kiki);
  }

  private drawHeader(): void {
    this.add.text(640, 55, "THE GREAT HUSKY SLED RACE", {
      fontFamily: "Arial Black, Arial",
      fontSize: "42px",
      color: "#ffffff",
      stroke: "#215a88",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(640, 105, "Steady Math = 1 space  •  Turbo Math = 2 spaces", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#204d6d",
    }).setOrigin(0.5).setDepth(10);
  }

  private drawTrack(): void {
    const g = this.add.graphics();
    g.fillStyle(0xc9efff, 1);
    g.fillRect(0, 0, 1280, 720);

    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(80, 180, 1120, 400, 46);

    for (let lane = 0; lane < 2; lane++) {
      const y = lane === 0 ? 300 : 470;
      g.lineStyle(5, lane === 0 ? 0x7ca0bd : 0x4a83b8, 0.35);
      g.lineBetween(140, y, 1120, y);

      for (let i = 0; i <= this.race.finish; i++) {
        const x = 155 + i * 155;
        g.fillStyle(i === this.race.finish ? 0xf4c542 : 0xffffff, 1);
        g.fillCircle(x, y, i === this.race.finish ? 21 : 15);
        g.lineStyle(4, i === this.race.finish ? 0xc28c13 : 0x6ea2c8, 1);
        g.strokeCircle(x, y, i === this.race.finish ? 21 : 15);
      }
    }

    g.fillStyle(0x214d6b, 1);
    g.fillRect(1086, 210, 14, 340);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 === 0 ? 0xffffff : 0x1f2730, 1);
      g.fillRect(1100, 218 + i * 40, 42, 40);
      g.fillStyle(i % 2 === 0 ? 0x1f2730 : 0xffffff, 1);
      g.fillRect(1142, 218 + i * 40, 42, 40);
    }
  }

  private createDog(
    x: number,
    y: number,
    primary: number,
    secondary: number,
    label: string,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y - 44).setDepth(12);
    const sled = this.add.rectangle(-8, 29, 92, 14, 0x9b5a2f, 1).setStrokeStyle(3, 0x63371c);
    const runner1 = this.add.line(0, 0, -55, 42, 40, 42, 0x5c6f7f, 1).setLineWidth(4);
    const body = this.add.ellipse(0, 0, 58, 38, primary, 1).setStrokeStyle(3, 0x26384a);
    const chest = this.add.ellipse(17, 3, 22, 30, secondary, 1);
    const head = this.add.circle(25, -18, 23, primary, 1).setStrokeStyle(3, 0x26384a);
    const muzzle = this.add.ellipse(38, -7, 20, 14, secondary, 1);
    const ear1 = this.add.triangle(10, -35, 4, -58, 19, -40, primary, 1);
    const ear2 = this.add.triangle(37, -36, 45, -59, 31, -40, primary, 1);
    const eye = this.add.circle(31, -21, 3, 0x101820, 1);
    const nose = this.add.circle(48, -8, 4, 0x101820, 1);
    const tag = this.add.text(0, 62, label, {
      fontFamily: "Arial Black, Arial",
      fontSize: "18px",
      color: "#17324d",
      backgroundColor: "#ffffffcc",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5);

    c.add([runner1, sled, body, chest, head, muzzle, ear1, ear2, eye, nose, tag]);
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
    const bg = this.add.rectangle(0, 0, 300, 74, color, 1)
      .setStrokeStyle(4, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const titleText = this.add.text(0, -12, title, {
      fontFamily: "Arial Black, Arial",
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

    const success = await this.askMath(mode === "turbo" ? "challenge" : "normal", mode);
    if (success) {
      this.turns += 1;
      if (mode === "turbo") this.turbos += 1;
      this.race.playerMove(mode);
      await this.moveKiki(this.race.kiki, mode === "turbo");
    }

    if (this.race.over) {
      await this.finishRace();
      return;
    }

    this.status.setText("The Husky takes a turn…");
    await this.timeDelay(350);
    this.race.rivalMove();
    await this.moveRacer(this.rival, this.race.rival, false);

    this.busy = false;
    this.status.setText("Choose your pace");
    this.choiceGroup?.setVisible(true);
  }

  private askMath(
    difficulty: "normal" | "challenge",
    mode: MoveMode,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const q = this.math.nextQuestion(difficulty);
      this.showMathPrompt(q, mode, resolve);
    });
  }

  private showMathPrompt(
    q: MathQuestion,
    mode: MoveMode,
    resolve: (result: boolean) => void,
  ): void {
    const c = this.add.container(640, 360).setDepth(100);
    const shade = this.add.rectangle(0, 0, 1280, 720, 0x10263a, 0.64);
    const panel = this.add.rectangle(0, 0, 630, 430, 0xfffbef, 1)
      .setStrokeStyle(7, mode === "turbo" ? 0x7651b3 : 0x2f84b8, 1);
    const header = this.add.text(0, -160, mode === "turbo" ? "TURBO MATH ★" : "STEADY MATH", {
      fontFamily: "Arial Black, Arial",
      fontSize: "30px",
      color: mode === "turbo" ? "#68439d" : "#1d668e",
    }).setOrigin(0.5);
    const prompt = this.add.text(0, -82, q.prompt, {
      fontFamily: "Arial Black, Arial",
      fontSize: "58px",
      color: "#17324d",
    }).setOrigin(0.5);
    c.add([shade, panel, header, prompt]);

    let resolved = false;
    q.answers.forEach((answer, index) => {
      const x = index % 2 === 0 ? -150 : 150;
      const y = 35 + Math.floor(index / 2) * 110;
      const btn = this.add.rectangle(x, y, 235, 76, index % 2 === 0 ? 0x4da7e5 : 0xf1b941, 1)
        .setStrokeStyle(4, 0xffffff)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, String(answer), {
        fontFamily: "Arial Black, Arial",
        fontSize: "33px",
        color: "#ffffff",
        stroke: "#17324d",
        strokeThickness: 4,
      }).setOrigin(0.5);

      btn.on("pointerdown", () => {
        if (resolved) return;
        if (answer === q.correct) {
          resolved = true;
          c.destroy(true);
          this.prompt = undefined;
          resolve(true);
        } else {
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
    const targetX = 155 + progress * 155;
    if (turbo) this.createTurboBurst(this.kiki.x, this.kiki.y);

    const curve = new Phaser.Curves.Line(
      new Phaser.Math.Vector2(this.kiki.x, this.kiki.y),
      new Phaser.Math.Vector2(targetX, this.kiki.y),
    );
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
    const targetX = 155 + progress * 155;
    if (turbo) this.createTurboBurst(racer.x, racer.y);

    return new Promise((resolve) => {
      this.tweens.add({
        targets: racer,
        x: targetX,
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
    this.choiceGroup?.destroy(true);
    this.status.setText("KIKI WINS!");
    this.cameras.main.flash(450, 255, 245, 180);

    this.kikiChar.react("happy", 2600);
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
    markRaceComplete(
      HUSKY_SAVE_KEY,
      HUSKY_ADVENTURE,
      { turns: this.turns, turbos: this.turbos },
    );
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
        fontFamily: "Arial Black, Arial",
        fontSize: "28px",
        color: "#17324d",
        backgroundColor: "#ffffffee",
        padding: { x: 18, y: 12 },
      },
    ).setOrigin(0.5);
    const btn = this.add.rectangle(0, 90, 320, 70, 0x2f84b8, 1)
      .setStrokeStyle(4, 0xffffff, 1)
      .setInteractive({ useHandCursor: true });
    const btnLabel = this.add.text(0, 90, "Continue  →", {
      fontFamily: "Arial Black, Arial",
      fontSize: "24px",
      color: "#ffffff",
    }).setOrigin(0.5);
    btn.once("pointerdown", () => this.scene.start("HuskyScene"));
    c.add([label, btn, btnLabel]);
    this.status.setText("");
  }

  private timeDelay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
