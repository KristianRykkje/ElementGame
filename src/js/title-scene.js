import Phaser from "phaser";

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "tileScene" });
  }

  create() {
    const gameTitle = this.add
      .text(0, 100, "Welcome to my game!")
      .setColor("#fafa5d")
      .setFontSize(40);

    const startGameText = this.add
      .text(0, 200, "Start game")
      .setColor("#1f1")
      .setFontSize(32);
    startGameText.setInteractive({ useHandCursor: true });
    startGameText.on("pointerdown", () => this.startGameButton());

    const optionsText = this.add
      .text(0, 300, "Options")
      .setColor("#1f1")
      .setFontSize(32);
    optionsText.setInteractive({ useHandCursor: true });
    optionsText.on("pointerdown", () => this.optionsButton());

    this.add.container(180, 0, [gameTitle, startGameText, optionsText]);
  }

  startGameButton() {
    this.scene.start("level1");
  }

  optionsButton() {
    console.log("Options");
  }
}
