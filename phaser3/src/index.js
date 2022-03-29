import 'phaser'
import Platform from './platform';


class Level extends Phaser.Scene{
    constructor(config){
        super();
    }

    preload(){
        this.load.image('tiles', 'assets/iso-64x64-building.png');
        this.load.image('button', 'assets/bomb.png');
        this.load.image('logo', 'assets/logo.png');
        this.load.tilemapTiledJSON('map', 'assets/lvl1map.json');
    }

    create(){
        this.popupIsOpen = false;
        
        var map = this.add.tilemap('map');

        this.popup = this.add.sprite(700, 700, "logo");
        this.popup.alpha = 0;

        this.closePopup = this.add.sprite(this.popup.x + this.popup.width/2, this.popup.y - this.popup.height/2, 'button')
            .setInteractive()
            .on('pointerdown', () => this.managePopup() );
        this.closePopup.alpha = 0;

        var tileset1 = map.addTilesetImage('ok', 'tiles');

        var layer = map.createLayer('Calque de Tuiles 1', [tileset1]);

        this.clickButton = this.add.sprite(1000, 1000, 'button')
            .setInteractive()
            .on('pointerdown', () => this.managePopup() );

    }

    managePopup(){
        if(this.popupIsOpen != true){
            this.popupIsOpen = true;
            this.popup.alpha = 1;
            this.closePopup.alpha = 1; 
            return;
        }
        this.popup.alpha = 0;
        this.closePopup.alpha = 0; 
        this.popupIsOpen = false;
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

