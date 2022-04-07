const config = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  width: 1600,
  height: 800,
  physics: {
    default: 'arcade',
  },
  scene: {
    preload: preload,
    create: create,
    update: update,

  },
}


/* VARIABLES */

var game = new Phaser.Game(config);
var cursors, player
var tileSize = 64;
let mapHeight = 6
var focusedTile = null;
var playerChangedLevel = false;
var aPopupisOpen = false;

/*OPEN DOOR*/

function openDoors(level) {
  var Part1 = level.layer2.findByIndex(142);
  var Part2 = level.layer2.findByIndex(144);
  var Part3 = level.layer3.findByIndex(143);
  var Part4 = level.layer3.findByIndex(145);
  console.log(Part1)
  level.layer2.putTileAt(-1, Part1.x, Part1.y)
  level.layer2.putTileAt(-1, Part2.x, Part2.y)
  level.layer3.putTileAt(-1, Part3.x, Part3.y)
  level.layer3.putTileAt(-1, Part4.x, Part4.y)
}

/* UPDATING CANVA COORDINATES TO MAP COORDINATES*/

function worldToMap(x, y, layer) {
  var cell = { x: 0, y: 0 };

  var x_pos = (x - 16 - layer.x) / layer.baseTileWidth;
  var y_pos = (y - 24 - layer.y) / layer.baseTileHeight;

  cell.y = Math.round(y_pos - x_pos);
  cell.x = Math.round(x_pos + y_pos);

  return cell;
}

function initiatePopup(level, popup, x, y){
  level.add.sprite(x, y, 'button')
    .setInteractive()
    .on('pointerdown', () => managePopup(popup));

  popup.bg = level.add.sprite(x, y, "logo");
  popup.bg.alpha = 0;

  popup.closeButton = level.add.sprite(popup.bg.x + popup.bg.width / 2, popup.bg.y - popup.bg.height / 2, 'button')
    .setInteractive()
    .on('pointerdown', () => managePopup(popup));
  popup.closeButton.alpha = 0;

  popup.action = level.add.sprite(popup.bg.x, popup.bg.y, "player")
  popup.action.alpha = 0;
  popup.action.setActive(false);

  popup.bg.setDepth(popup.bg.z = 100);
  popup.closeButton.setDepth(popup.closeButton.z = 100);
  popup.action.setDepth(popup.action.z = 100);
}

/* FUNCTION POPUP FOR RIDDLE*/

function managePopup(popup) {
  //popup fonction
  if (aPopupisOpen != true) {
    aPopupisOpen = true;
    popup.bg.alpha = 1;
    popup.closeButton.alpha = 1;
    popup.action.alpha = 1;
    popup.action.setActive(true);
    return;
  }
  popup.bg.alpha = 0;
  popup.closeButton.alpha = 0;
  aPopupisOpen = false;
  popup.action.alpha = 0;
  popup.action.setActive(false);
}

/* UPDATING MAP COORDINATES TO CANVA COORDINATES*/

function mapToWorld(x, y, layer) {
  var pos = { x: 0, y: 0 };

  pos.x = (x - y) * layer.baseTileWidth / 2 + 16 + layer.x;
  pos.y = (x + y) * layer.baseTileHeight / 2 + 24 + layer.y;

  return pos;
}

/* GETTING X AND Y COORDINATES AND CREATING KEYS*/

var focusedTile = null;
var focusedTile2 = null;

function worldToMap(x, y, layer) {
  var cell = { x: 0, y: 0 };

  var x_pos = (x - 16 - layer.x) / layer.baseTileWidth;
  var y_pos = (y - 8 - layer.y) / layer.baseTileHeight;

  cell.y = Math.round(y_pos - x_pos);
  cell.x = Math.round(x_pos + y_pos);

  return cell;
}

function mapToWorld(x, y, layer) {
  var pos = { x: 0, y: 0 };

  pos.x = (x - y) * layer.baseTileWidth / 2 + 16 + layer.x;
  pos.y = (x + y) * layer.baseTileHeight / 2 + 8 + layer.y;

  return pos;
}

function coordsToKey(x, y) {
  return x + 'xXx' + y
}

/* PATHFINDING FUNCTION */

function findPathTo(start, target, groundLayer, collisionsLayer) {

  if (!groundLayer.getTileAt(target.x, target.y)) {
    return [];
  }

  if (collisionsLayer.layer.data[target.y][target.x].index !== -1) {
    return [];
  }

  var queue = [];
  var parentForKey = {};

  const startKey = coordsToKey(start.x, start.y);
  const targetKey = coordsToKey(target.x, target.y);

  parentForKey[startKey] = { key: '', position: { x: -1, y: -1 } }

  queue.push(start);

  while (queue.length > 0) {
    const currentTile = queue.shift();
    const currentX = currentTile.x;
    const currentY = currentTile.y;
    const currentKey = coordsToKey(currentX, currentY);

    const neighbors = [{ x: currentX, y: currentY + 1 }, //haut
    { x: currentX, y: currentY - 1 }, //bas
    { x: currentX + 1, y: currentY }, //droite
    { x: currentX - 1, y: currentY }  //gauche
    ]

    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const groundTile = groundLayer.getTileAt(neighbor.x, neighbor.y);
      const collisionTile = collisionsLayer.getTileAt(neighbor.x, neighbor.y);

      if (!groundTile) {
        continue;
      }

      if (collisionTile !== null) {
        continue;
      }

      const neighborKey = coordsToKey(neighbor.x, neighbor.y);

      if (neighborKey in parentForKey) {
        continue;
      }

      parentForKey[neighborKey] = { key: currentKey, position: { x: currentX, y: currentY } };

      queue.push(neighbor);

      if (neighborKey === targetKey) {
        break;
      }
    }
  }

  var path = [];
  var currentPos;
  var currentKey;

  if (!parentForKey[targetKey]) {
    return [];
  }

  path.push(target);
  currentKey = targetKey;
  currentPos = parentForKey[targetKey].position;

  while (currentKey !== startKey) {

    path.push(currentPos);

    currentKey = parentForKey[currentKey].key;
    currentPos = parentForKey[currentKey].position;
  }
  return path.reverse();
}

/* MOVING PLAYER ON PATH */

function getNextTileInPath(path) {
  if (!path || path.length === 0) {
    return;
  }

  return path.shift();
}

function changeSprite(tile, nextTileInPath) {
  if (tile.x > nextTileInPath.x) {
    player.setTexture('playerDroiteBas')
  } else if (tile.x < nextTileInPath.x) {
    player.setTexture('playerGaucheHaut')
  } else if (tile.y > nextTileInPath.y) {
    player.setTexture('playerGaucheBas')
  } else if (tile.y < nextTileInPath.y) {
    player.setTexture('playerDroiteHaut')
  }
}


function preload() {
  this.load.image('ground', 'Assets/allassets.png');
  this.load.image('carousel1', 'Assets/carousel.png');
  this.load.image('bigwheel1', 'Assets/bigwheel.png');
  this.load.image('rollercoaster1', 'Assets/rollercoaster.png');
  this.load.tilemapTiledJSON('map', 'Assets/finalmap.json');

  this.load.image('playerDroiteBas', 'Assets/fantome_dirdb.png')
  this.load.image('playerDroiteHaut', 'Assets/fantome_dirdh.png')
  this.load.image('playerGaucheBas', 'Assets/fantome_dirgb.png')
  this.load.image('playerGaucheHaut', 'Assets/fantome_dirgh.png')
  this.load.audio('ambiance', 'Assets/Melodie_Projet_jeu.mp3')
  this.load.image('logo', 'Assets/task.png')
  this.load.image('button', 'Assets/POPUP.png')
}


function create() {

  //Coordinate
  this.text = this.add.text(10, 10, 'Cursors to move', { font: '16px Courier', fill: '#00ff00' }).setScrollFactor(0);
  const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
  const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

  /* MAP */

  let map = this.add.tilemap('map');
  var tileset1 = map.addTilesetImage('allassets', 'ground');
  this.layer1 = map.createLayer('Groupe 1/layer1', [tileset1]);
  this.layer2 = map.createLayer('Groupe 1/layer2', [tileset1]);
  this.layer3 = map.createLayer('Groupe 1/layer3', [tileset1]);
  this.layer4 = map.createLayer('Groupe 1/layer4', [tileset1]);
  this.layer5 = map.createLayer('Groupe 1/layer5', [tileset1]);

  //SPAWNING PLAYER
  let playerPos = mapToWorld(110, 115, this.layer1.layer)
  player = this.physics.add.sprite(playerPos.x, playerPos.y, 'playerDroiteHaut')

  //CURSOR
  cursors = this.input.keyboard.createCursorKeys()
  this.MousePointer = this.input.activePointer;

  //PATHFINDING
  this.playerIsMoving = false;
  this.path = [];
  this.nextTileInPath = undefined;

  /* AUDIO */
  this.ambiance = this.sound.add("ambiance")
  this.ambiance.loop = true;
  this.ambiance.play();

  /* CAMERA */
  this.cameras.main.startFollow(player, true);
  // this.cameras.main.setZoom(2);

  //popup level 1
  this.popup1 = { bg: null, closeButton: null, action: null }
  initiatePopup(this, this.popup1, 270, 1750);
  this.popup1.action.setInteractive()
    .on('pointerdown', () => {
      openDoors(this);
      managePopup(this.popup1);
    })
  //var for level 2
  this.counterClicked = 0;

  /* FAKE HEIGHT ON MAP */

  player.setDepth(player.z = 1)
  this.layer2.setDepth(this.layer2.z = 1)
  this.layer3.setDepth(this.layer3.z = 2)
  this.layer4.setDepth(this.layer4.z = 2)
  this.layer5.setDepth(this.layer5.z = 2)
}


function update() {

  screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
  screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

  this.text.setText([
    'screen x: ' + this.input.x,
    'screen y: ' + this.input.y,
    'world x: ' + this.input.mousePointer.worldX,
    'world y: ' + this.input.mousePointer.worldY,
  ]);
  this.text.setDepth(this.text.z = 10)

  /* MOUVEMENT & PATHFINDING */

  player.body.setVelocity(0); // Stop any previous movement from the last frame

  //GETING CLICK
  var coordsPointerInMap = worldToMap(this.MousePointer.worldX, this.MousePointer.worldY, this.layer1.layer);
  var coordsPlayerInMap = worldToMap(player.x, player.y + player.height / 2, this.layer1.layer);
  if (focusedTile) {
    focusedTile.setVisible(true);
  }
  if (coordsPointerInMap.x >= 0 && coordsPointerInMap.y >= 0 && coordsPointerInMap.x < this.layer1.layer.width && coordsPointerInMap.y < this.layer1.layer.height) {
    focusedTile = this.layer1.getTileAt(coordsPointerInMap.x, coordsPointerInMap.y);
    if (focusedTile && this.layer1.getTileAt(coordsPointerInMap.x, coordsPointerInMap.y).index != 0) {
      focusedTile.setVisible(false);
    }
  }

  //STARTING PATHFINDING ON CLICK
  if (this.MousePointer.isDown && !this.playerIsMoving && !aPopupisOpen) {
    coordsPointerInMap = worldToMap(this.MousePointer.worldX, this.MousePointer.worldY, this.layer1.layer);
    coordsPlayerInMap = worldToMap(player.x, player.y + player.height / 2, this.layer1.layer);
    this.playerIsMoving = true;
    this.path = findPathTo(coordsPlayerInMap, coordsPointerInMap, this.layer1, this.layer2);
    if (this.path.length > 0) {
      for (let i = 0; i < this.path.length; i++) {
        this.layer1.getTileAt(this.path[i].x, this.path[i].y).setVisible(false);
      }
    }
  }

  //SETTING SPEED AND MOVING PLAYER 
  if (this.playerIsMoving) {
    let dx = 0;
    let dy = 0;

    if (!this.nextTileInPath && this.path.length > 0) {
      this.nextTileInPath = getNextTileInPath(this.path);
    }
    else if (!this.nextTileInPath && this.path.length === 0) {
      this.playerIsMoving = false;
      return;
    }

    //getting direction and placement
    var nextPos = mapToWorld(this.nextTileInPath.x, this.nextTileInPath.y, this.layer1.layer);
    nextPos.y -= player.height / 2;
    this.physics.moveTo(player, nextPos.x, nextPos.y, 100);

    dx = nextPos.x - player.x;
    dy = nextPos.y - player.y;

    //stoping player if he's on the correct tile
    if (Math.abs(dx) < 5) {
      dx = 0;
    }

    if (Math.abs(dy) < 5) {
      dy = 0;
    }

    //putting the tile we just walked on back to visible
    if (dx === 0 && dy === 0) {
      if (this.path.length > 0) { //continuing following the path
        this.layer1.getTileAt(this.nextTileInPath.x, this.nextTileInPath.y).setVisible(true);
        let tile = this.path.shift()
        changeSprite(tile, this.nextTileInPath)
        this.nextTileInPath = tile
      }
      else { //arrived
        this.playerIsMoving = false;
        this.nextTileInPath = null;
      }
    }
  }

  /* PLAYER ARRIVED AT THE END OF THE FIRST MAP */

  if (coordsPlayerInMap.x == 110, coordsPlayerInMap.y == 102 || coordsPlayerInMap.x == 111, coordsPlayerInMap.y == 102 || coordsPlayerInMap.x == 112, coordsPlayerInMap.y == 102 && playerChangedLevel == false) {
    
    //load new map
    this.cameras.main.fadeOut(1250);
    this.cameras.main.fadeIn(1250);
    let map = this.add.tilemap('map')
    var tileset1 = map.addTilesetImage('allassets', 'ground');
    this.layer2.destroy()
    this.layer3.destroy()
    this.layer4.destroy()
    this.layer5.destroy()
    this.layer1 = map.createLayer('Groupe 2/layer1', [tileset1]);
    this.layer2 = map.createLayer('Groupe 2/layer2', [tileset1]);
    this.layer3 = map.createLayer('Groupe 2/layer3', [tileset1]);
    this.layer4 = map.createLayer('Groupe 2/layer4', [tileset1]);
    
    //reset pos
    let playerPos = mapToWorld(114, 117, this.layer1.layer);
    player.x = playerPos.x;
    player.y = playerPos.y;
    this.playerIsMoving = false;
    playerChangedLevel = true;
    this.nextTileInPath = null;

    //set layers depth again
    this.layer2.setDepth(this.layer2.z = 2)
    this.layer3.setDepth(this.layer3.z = 2)
    this.layer4.setDepth(this.layer4.z = 2)

    //popups

    //first popup
    this.popup2 = { bg: null, closeButton: null, action: null }
    initiatePopup(this, this.popup2, -50, 1500)
    this.popup2.alreadyBeenClicked = false;
    this.popup2.action.setInteractive()
    .on('pointerdown', () => {
      if(!this.popup2.alreadyBeenClicked){
        this.counterClicked++;
        this.popup2.alreadyBeenClicked = true;
        managePopup(this.popup2)
      }
    })

    //second popup
    this.popup3 = { bg: null, closeButton: null, action: null }
    initiatePopup(this, this.popup3, -130, 1350)
    this.popup3.alreadyBeenClicked = false;
    this.popup3.action.setInteractive().
    on('pointerdown', () => {
      if(!this.popup3.alreadyBeenClicked){
        this.counterClicked++;
        this.popup3.alreadyBeenClicked = true;
        managePopup(this.popup3)
      }
    })
    
    this.popup4 = { bg: null, closeButton: null, action: null }
    initiatePopup(this, this.popup4, 1025, 1365)
    this.popup4.alreadyBeenClicked = false;
    this.popup4.action.setInteractive()
    .on('pointerdown', () => {
      if(!this.popup4.alreadyBeenClicked){
        this.counterClicked++;
        this.popup4.alreadyBeenClicked = true;
        managePopup(this.popup4)
      }
    })
  }

  if(this.counterClicked === 3){
    openDoors(this)
  }


  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-100);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(100);
  }

  // Vertical movement
  if (cursors.up.isDown) {
    player.body.setVelocityY(-100);
  } else if (cursors.down.isDown) {
    player.body.setVelocityY(100);
  }
}