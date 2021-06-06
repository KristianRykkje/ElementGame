import Phaser from "phaser";
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
import Level1 from "./levels/level1";
import Level2 from "./levels/level2";
import TitleScene from "./title-scene";
import HomeScene from "./home-scene";

const levels = [Level1, Level2];

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#000c1f",
  parent: "game-container",
  scene: [TitleScene, HomeScene, ...levels],
  pixelArt: true,
  physics: {
    default: "matter",
    matter: { debug: { showbody: true, showStaticBody: true } },
  },
  plugins: {
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin, // The plugin class
        key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
        mapping: "matterCollision", // Where to store in the Scene, e.g. scene.matterCollision
      },
    ],
  },
};

new Phaser.Game(config);
