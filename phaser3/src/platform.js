import "phaser"


class Platform extends Phaser.GameObjects.Sprite{
  constructor(config){
    super(config.scene, config.x, config.y, config.image);

    config.scene.physics.add.existing(this);
    config.scene.platforms.add(this);
  }
}

export default Platform