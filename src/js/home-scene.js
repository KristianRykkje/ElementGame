import Phaser from "phaser";
import Player from "./player.js";
import homeJson from "../assets/tilemaps/homeLevel.json";
import kenneyTilset64pxExtrudedx from "../assets/tilesets/kenney-tileset-64px-extruded.png";
import industrialPlayer from "../assets/spritesheets/0x72-industrial-player-32px-extruded.png";

export default class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "homeLevel" });
    this.key = "homeLevel";
  }

  preload() {
    this.load.tilemapTiledJSON(this.key, homeJson);
    this.load.image("kenney-tileset-64px-extrudedx", kenneyTilset64pxExtrudedx);

    this.load.spritesheet("player", industrialPlayer, {
      frameWidth: 32,
      frameHeight: 32,
      margin: 1,
      spacing: 2,
    });
  }

  create() {
    const map = this.make.tilemap({ key: this.key });
    const tileset = map.addTilesetImage(
      "kenney-tileset-64px-extruded",
      "kenney-tileset-64px-extrudedx",
    );

    const groundLayer = map.createLayer("Ground", tileset);
    // const foregroundLayer = map.createLayer("Foreground", tileset);

    groundLayer.setCollisionByProperty({ collides: true });
    // foregroundLayer.setCollisionByProperty({ collides: true });

    this.matter.world.convertTilemapLayer(groundLayer);
    // this.matter.world.convertTilemapLayer(foregroundLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const { x, y } = map.findObject("Spawn", obj => obj.name === "Spawn Point");
    this.player = new Player(this, x, y);

    this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);

    // -----------------------------------------------

    // const rect = map.findObject("Sensors", obj => obj.name === "Exitdoor");
    // const celebrateSensor = this.matter.add.rectangle(
    //   rect.x + rect.width / 2,
    //   rect.y + rect.height / 2,
    //   rect.width,
    //   rect.height,
    //   {
    //     isSensor: true,
    //     isStatic: true,
    //   },
    // );
    // this.unsubscribeCelebrate = this.matterCollision.addOnCollideStart({
    //   objectA: this.player.sprite,
    //   objectB: celebrateSensor,
    //   callback: this.onPlayerWin,
    //   context: this,
    // });

    // -----------------------------------------------

    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = false;
    this.input.keyboard.on("keydown-H", () => {
      this.matter.world.drawDebug = !this.matter.world.drawDebug;
      this.matter.world.debugGraphic.clear();
    });

    const help =
      'Arrows/WASD to move the player.\nPress "H" to see Matter bodies.';
    const helptext = this.add.text(16, 16, help, {
      fontSize: "18px",
      padding: { x: 10, y: 5 },
      backgroundColor: "#ffffff",
      fill: "#000000",
    });
    helptext.setScrollFactor(0).setDepth(1000);
  }

  onPlayerWin() {
    setTimeout(() => this.scene.start("level2"), 500);
  }
}
