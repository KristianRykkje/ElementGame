import levelJsonX from "../../assets/tilemaps/levelx.json";
import LevelScene from "./level";
export default class Level2 extends LevelScene {
  constructor() {
    super("level2");
  }

  preload() {
    this.load.tilemapTiledJSON("level2", levelJsonX);
    super.preload();
  }

  create() {
    super.create();
  }
}
