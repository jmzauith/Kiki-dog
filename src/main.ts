import Phaser from "phaser";
import { HuskyScene } from "./scenes/HuskyScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#dff3ff",
  width: 1280,
  height: 720,
  scene: [HuskyScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
});

export default game;