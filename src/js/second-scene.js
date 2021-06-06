import Phaser from "phaser";
import Player from "./player.js";
import levelJsonx from "../assets/tilemaps/levelx.json";
import kenneyTilset64pxExtrudedx from "../assets/tilesets/kenney-tileset-64px-extruded.png";
import images from "../assets/images/*.png";
import emojiPng from "../assets/atlases/emoji.png";
import emojiJson from "../assets/atlases/emoji.json";
import industrialPlayer from "../assets/spritesheets/0x72-industrial-player-32px-extruded.png";

export default class SecondScene extends Phaser.Scene {
  constructor() {
    super({ key: "scene2" });
  }

  preload() {
    this.load.tilemapTiledJSON("mapx", levelJsonx);
    this.load.image("kenney-tileset-64px-extrudedx", kenneyTilset64pxExtrudedx);

    this.load.image("wooden-plank", images.wooden_plank);
    this.load.image("block", images.block);

    this.load.spritesheet("player", industrialPlayer, {
      frameWidth: 32,
      frameHeight: 32,
      margin: 1,
      spacing: 2,
    });

    this.load.atlas("emoji", emojiPng, emojiJson);
  }

  create() {
    const map = this.make.tilemap({ key: "mapx" });
    const tileset = map.addTilesetImage(
      "kenney-tileset-64px-extruded",
      "kenney-tileset-64px-extrudedx",
    );
    const groundLayer = map.createLayer("Ground", tileset);
    const foregroundLayer = map.createLayer("Foreground", tileset, 0, 0);

    // Set colliding tiles before converting the layer to Matter bodies
    groundLayer.setCollisionByProperty({ collides: true });
    foregroundLayer.setCollisionByProperty({ collides: true });

    // Get the layers registered with Matter. Any colliding tiles will be given a Matter body. We
    // haven't mapped our collision shapes in Tiled so each colliding tile will get a default
    // rectangle body (similar to AP).
    this.matter.world.convertTilemapLayer(groundLayer);
    this.matter.world.convertTilemapLayer(foregroundLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.matter.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // The spawn point is set using a point object inside of Tiled (within the "Spawn" object layer)
    const { x, y } = map.findObject("Spawn", obj => obj.name === "Spawn Point");
    this.player = new Player(this, x, y);

    // The exit point
    // Create a sensor at rectangle object created in Tiled (under the "Sensors" layer)
    const rect = map.findObject("Sensors", obj => obj.name === "Exitdoor");
    const celebrateSensor = this.matter.add.rectangle(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width,
      rect.height,
      {
        isSensor: true, // It shouldn't physically interact with other bodies
        isStatic: true, // It shouldn't move
      },
    );
    this.unsubscribeCelebrate = this.matterCollision.addOnCollideStart({
      objectA: this.player.sprite,
      objectB: celebrateSensor,
      callback: this.onPlayerWin,
      context: this,
    });

    // Smoothly follow the player
    this.cameras.main.startFollow(this.player.sprite, false, 0.5, 0.5);

    this.unsubscribePlayerCollide = this.matterCollision.addOnCollideStart({
      objectA: this.player.sprite,
      callback: this.onPlayerCollide,
      context: this,
    });

    const help = this.add.text(16, 16, "Arrows/WASD to move the player.", {
      fontSize: "18px",
      padding: { x: 10, y: 5 },
      backgroundColor: "#ffffff",
      fill: "#000000",
    });
    help.setScrollFactor(0).setDepth(1000);

    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = false;
    this.input.keyboard.on("keydown-H", event => {
      console.log(event);
      this.matter.world.drawDebug = !this.matter.world.drawDebug;
      this.matter.world.debugGraphic.clear();
    });

    const helptext =
      'Left-click to emoji.\nArrows to scroll.\nPress "H" to see Matter bodies.';
    const helptextItem = this.add.text(16, 16, helptext, {
      fontSize: "18px",
      padding: { x: 10, y: 5 },
      backgroundColor: "#ffffff",
      fill: "#000000",
    });
    helptextItem.setScrollFactor(0).setDepth(1000);

    this.input.manager.enabled = true;
    this.input.once(
      "pointerdown",
      function (event) {
        this.scene.start("scene1");
      },
      this,
    );

    this.matter.world.createDebugGraphic();
    this.matter.world.drawDebug = true;
    this.input.keyboard.on("keydown-H", event => {
      console.log(event);
      this.matter.world.drawDebug = !this.matter.world.drawDebug;
      this.matter.world.debugGraphic.clear();
    });
  }

  onPlayerCollide({ gameObjectB }) {
    if (!gameObjectB || !(gameObjectB instanceof Phaser.Tilemaps.Tile)) return;

    const tile = gameObjectB;

    // Check the tile property set in Tiled (you could also just check the index if you aren't using
    // Tiled in your game)
    if (tile.properties.isLethal) {
      // Unsubscribe from collision events so that this logic is run only once
      this.unsubscribePlayerCollide();

      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => this.scene.restart());
    }
  }

  onPlayerWin() {
    // Celebrate only once
    this.unsubscribeCelebrate();

    // Drop some heart-eye emojis, of course
    for (let i = 0; i < 35; i++) {
      const x = this.player.sprite.x + Phaser.Math.RND.integerInRange(-50, 50);
      const y =
        this.player.sprite.y - 150 + Phaser.Math.RND.integerInRange(-10, 10);
      this.matter.add
        .image(x, y, "emoji", "1f60d", {
          restitution: 1,
          friction: 0,
          density: 0.0001,
          shape: "circle",
        })
        .setScale(0.5);
    }
    setTimeout(() => this.scene.start("scene1"), 500);
  }
}
