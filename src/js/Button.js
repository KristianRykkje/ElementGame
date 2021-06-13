class Button {
  constructor(x, y, label, scene, callback) {
    const button = scene.add
      .text(x, y, label)
      .setOrigin(0.5)
      .setPadding(15, 15)
      .setStyle({ backgroundColor: "#111" })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => callback())
      .on("pointerover", () =>
        button.setStyle({ fill: "#f39c12", backgroundColor: "#333" }),
      )
      .on("pointerout", () =>
        button.setStyle({ fill: "#FFF", backgroundColor: "#000" }),
      )
      .setScrollFactor(0)
      .setDepth(1001);
  }
}

export default Button;
