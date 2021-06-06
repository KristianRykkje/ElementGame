import levelJson5 from "../../assets/tilemaps/level5.json";
import LevelScene from "./level";
export default class Level1 extends LevelScene {
  constructor() {
    super("level1");
  }

  preload() {
    this.load.tilemapTiledJSON("level1", levelJson5);
    super.preload();
  }

  create() {
    super.create();
  }
}
