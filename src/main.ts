import { choosePlayer } from "./visuals/PlayerStart";
import "./visuals/player-start.css";
import Phaser from "phaser";
import { HuskyScene } from "./scenes/HuskyScene";
import { RaceScene } from "./scenes/RaceScene";

const inspection = import.meta.env.DEV && new URLSearchParams(location.search).has("composition");
const game = (inspection ? Promise.resolve() : choosePlayer()).then(() => new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#dff3ff",
  width: 1280,
  height: 720,
  scene: inspection && new URLSearchParams(location.search).get("composition")?.startsWith("race-shot-") ? [RaceScene, HuskyScene] : [HuskyScene, RaceScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
}));

export default game;