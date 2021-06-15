import Phaser from "phaser";
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin";
import ButtonPlugin from "phaser3-rex-plugins/plugins/button-plugin";

import Level1 from "./js/levels/level1";
import Level2 from "./js/levels/level2";
import TitleScene from "./js/title-scene";
import HomeScene from "./js/home-scene";

const levels = [Level1, Level2];

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.NONE,
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  backgroundColor: "#000c1f",
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
      {
        plugin: VirtualJoystickPlugin,
        key: "rexVirtualJoystick",
        mapping: "rexVirtualJoystick",
        start: true,
      },
      {
        plugin: ButtonPlugin,
        key: "rexButton",
        mapping: "rexButton",
        start: true,
      },
    ],
  },
};

const phaserGame = new Phaser.Game(config);

addEventListener("resize", () => {
  phaserGame.scale.resize(window.innerWidth, window.innerHeight);
});
