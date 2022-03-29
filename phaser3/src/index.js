import 'phaser'
import Platform from './platform';


class Level extends Phaser.Scene{
    constructor(config){
        super();
    }

    preload(){
        this.load.image('tiles', 'assets/iso-64x64-building.png');
        this.load.tilemapTiledJSON('map', 'assets/lvl1map.json');
    }

    create(){
        var map = this.add.tilemap('map');

        var tileset1 = map.addTilesetImage('ok', 'tiles');

        var layer = map.createLayer('Calque de Tuiles 1', [tileset1]);

    }
}

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1300,
    height: 1300,
    scene: new Level()
};

var game = new Phaser.Game(config);

