
const config = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  width: 1200,
  height: 800,
  physics: {
    default: 'arcade',
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
    worldToMap
  }
};

var game = new Phaser.Game(config);
var cursors
var player
var tileSize = 64;

function preload() {
  //preloading assets
  this.load.image('tiles', 'assets/iso-64x64-building.png');
  this.load.image('button', 'assets/bomb.png');
  this.load.image('logo', 'assets/logo.png');
  this.load.tilemapTiledJSON('map', 'assets/untitled.json');
  this.load.image('test', 'assets/phaser-dude.png')
}

function create() {
  //popup
  this.popupIsOpen = false;
  this.popup = this.add.sprite(700, 700, "logo");
  this.popup.alpha = 0;
  this.closePopup = this.add.sprite(this.popup.x + this.popup.width / 2, this.popup.y - this.popup.height / 2, 'button')
    .setInteractive()
    .on('pointerdown', () => this.managePopup());
  this.closePopup.alpha = 0;
  this.clickButton = this.add.sprite(1000, 1000, 'button')
    .setInteractive()
    .on('pointerdown', () => this.managePopup());
  
  //Map Tile iso
  var map = this.add.tilemap('map');
  var tileset1 = map.addTilesetImage('nom', 'tiles');
  this.layer1 = map.createLayer('Tile Layer 1', [tileset1]);
  this.layer2 = map.createLayer('Tile Layer 2', [tileset1]);


  //Player and controls
  player = this.physics.add.sprite(500, 300, 'test')
  cursors = this.input.keyboard.createCursorKeys()
  this.MousePointer = this.input.activePointer;
  this.playerIsMoving = false;
  this.path = [];
  this.nextTileInPath = undefined;

  //Collision
  player.body.collideWorldBounds = true;
  this.physics.add.collider(player, this.layer2);

  this.text = this.add.text(10, 10, 'Cursors to move', { font: '16px Courier', fill: '#00ff00' }).setScrollFactor(0);
}

var focusedTile = null;
var focusedTile2 = null;

function worldToMap(x, y, layer){
  var cell = {x: 0, y: 0};

  var x_pos = (x - 32 - layer.x) / layer.baseTileWidth;
  var y_pos = (y - 48 - layer.y) / layer.baseTileHeight;

  cell.y = Math.round(y_pos - x_pos);
  cell.x = Math.round(x_pos + y_pos);

  return cell;
}

function mapToWorld(x, y, layer){
  var pos = {x: 0, y: 0};

  pos.x = (x - y) * layer.baseTileWidth / 2 + 32 + layer.x;
  pos.y = (x + y) * layer.baseTileHeight / 2 + 48 + layer.y;

  return pos;
}


function update() {
  // Stop any previous movement from the last frame
  player.body.setVelocity(0);

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
  
  var coordsPointerInMap = worldToMap(this.MousePointer.x, this.MousePointer.y, this.layer1.layer);
  if(focusedTile){
    focusedTile.setVisible(true);
  }
  if(coordsPointerInMap.x >= 0 && coordsPointerInMap.y >= 0 && coordsPointerInMap.x < this.layer1.layer.width && coordsPointerInMap.y < this.layer1.layer.height){
    focusedTile = this.layer1.getTileAt(coordsPointerInMap.x, coordsPointerInMap.y);
    focusedTile.setVisible(false);
  }

  if(this.MousePointer.isDown && !this.playerIsMoving){
    /*
    var targetPos = mapToWorld(focusedTile.x, focusedTile.y, this.layer1.layer);
    player.x = targetPos.x;
    player.y = targetPos.y - player.height/2;
    */
    focusedTile.setVisible(true);
    this.playerIsMoving = true;
    var coordsPointerInMap = worldToMap(this.MousePointer.x, this.MousePointer.y, this.layer1.layer);
    var coordsPlayerInMap = worldToMap(player.x, player.y + player.height/2, this.layer1.layer);
    var test = mapToWorld(4, 6, this.layer1.layer);
    test = worldToMap(test.x, test.y, this.layer1.layer);
    this.path = findPathTo(coordsPlayerInMap, coordsPointerInMap, this.layer1, this.layer2);
    if(this.path.length > 0){
      for(let i=0; i < this.path.length; i++){
        this.layer1.getTileAt(this.path[i].x, this.path[i].y).setVisible(false);
      }
    }
    console.log(this.path);
  } 

  if(this.playerIsMoving){
    let dx = 0;
    let dy = 0;

    if (!this.nextTileInPath && this.path.length > 0){
      this.nextTileInPath = getNextTileInPath(this.path);
    }
    else if(!this.nextTileInPath && this.path.length === 0){
      this.playerIsMoving = false;
      return;
    }

    var nextPos = mapToWorld(this.nextTileInPath.x, this.nextTileInPath.y, this.layer1.layer);
    nextPos.y -= player.height/2;
    this.physics.moveTo(player, nextPos.x, nextPos.y, 100);

    dx = nextPos.x - player.x;
    dy = nextPos.y - player.y;

    if(Math.abs(dx) < 5){
      dx = 0;
    }

    if(Math.abs(dy) < 5){
      dy = 0;
    }

    if(dx === 0 && dy === 0){
      if(this.path.length > 0){
        this.layer1.getTileAt(this.nextTileInPath.x, this.nextTileInPath.y).setVisible(true);
        this.nextTileInPath = this.path.shift();
      }
      else{
        this.playerIsMoving = false;
        this.nextTileInPath = null;
      }
    }
  }

  this.text.setText([
    'screen x: ' + this.input.x,
    'screen y: ' + this.input.y,
    'world x: ' + this.input.mousePointer.worldX,
    'world y: ' + this.input.mousePointer.worldY
  ]);
}

/*
function estimatedCostBetween(ColA, RowA, ColB, RowB){
  return Math.abs(ColA - ColB) + Math.abs(RowA - RowB);
}
*/

function coordsToKey(x, y){
  return x + 'xXx' + y
}

function findPathTo(start, target, groundLayer, collisionsLayer){
  console.log(target)

  if(!groundLayer.getTileAt(target.x, target.y)){
    return [];
  }

  if(collisionsLayer.layer.data[target.y][target.x].index !== -1){
    return [];
  }



  var queue = [];
  var parentForKey = {};

  const startKey = coordsToKey(start.x, start.y);
  const targetKey = coordsToKey(target.x, target.y);

  parentForKey[startKey] = {key:'', position: {x: -1, y: -1}}

  queue.push(start);

  while(queue.length > 0){
    const currentTile = queue.shift();
    const currentX = currentTile.x;
    const currentY = currentTile.y;
    const currentKey = coordsToKey(currentX, currentY);

    const neighbors = [{x: currentX, y: currentY + 1}, //haut
                       {x: currentX, y: currentY - 1}, //bas
                       {x: currentX + 1, y: currentY}, //droite
                       {x: currentX - 1, y: currentY}  //gauche
    ]

    for(let i=0; i<neighbors.length; i++){
      const neighbor = neighbors[i];
      const groundTile = groundLayer.getTileAt(neighbor.x, neighbor.y);
      const collisionTile = collisionsLayer.getTileAt(neighbor.x, neighbor.y);

      if(!groundTile){
        continue;
      }

      if(collisionTile !== null){
        continue;
      }

      const neighborKey = coordsToKey(neighbor.x, neighbor.y);

      if(neighborKey in parentForKey){
        continue;
      }

      parentForKey[neighborKey] = {key: currentKey, position: {x: currentX, y: currentY}};
      
      queue.push(neighbor);

      if(neighborKey === targetKey){
        break;
      }
    }
  }

  var path = [];
  var currentPos;
  var currentKey;
  
  if(!parentForKey[targetKey]){
    return [];   
  }

  path.push(target);
  currentKey = targetKey;
  currentPos = parentForKey[targetKey].position;

  while(currentKey !== startKey){

    path.push(currentPos);

    currentKey = parentForKey[currentKey].key;
    currentPos = parentForKey[currentKey].position;
  }


  return path.reverse();
}

function getNextTileInPath(path){
  if(!path || path.length === 0){
    return;
  }
  
  return path.shift();
}

/*
function movePlayerToTile(startCol, startRow, destCol, destRow, mapLayer, scenePhysics){
  var visitedTiles = [];
  var currentTile = {x:startCol, y:startRow, costToHere:0, costToDest:destCol + destRow, cost:1};
  var previousTile;

  while(currentTile.x !== destCol && currentTile.y !== destRow){
    foundNextNode = false;
    
    const neighbors = [{x:currentTile.x + 1, y:currentTile.y, costToHere:currentTile.costToHere + 1, costToDest: estimatedCostBetween(currentTile.x + 1, currentTile.y, destCol, destRow), cost:1},             //droite
                       {x:currentTile.x - 1, y:currentTile.y, costToHere:currentTile.costToHere + 1, costToDest: estimatedCostBetween(currentTile.x - 1, currentTile.y, destCol, destRow), cost:1},             //gauche
                       {x:currentTile.x, y:currentTile.y - 1, costToHere:currentTile.costToHere + 1, costToDest: estimatedCostBetween(currentTile.x, currentTile.y + 1, destCol, destRow), cost:1},             //haut
                       {x:currentTile.x, y:currentTile.y + 1, costToHere:currentTile.costToHere + 1, costToDest: estimatedCostBetween(currentTile.x, currentTile.y - 1, destCol, destRow), cost:1},             //bas
                       {x:currentTile.x + 1, y:currentTile.y - 1, costToHere:currentTile.costToHere + 0.5, costToDest: estimatedCostBetween(currentTile.x + 1, currentTile.y - 1, destCol, destRow), cost:0.5}, //haut-droite
                       {x:currentTile.x - 1, y:currentTile.y - 1, costToHere:currentTile.costToHere + 0.5, costToDest: estimatedCostBetween(currentTile.x - 1, currentTile.y - 1, destCol, destRow), cost:0.5}, //haut-gauche
                       {x:currentTile.x + 1, y:currentTile.y + 1, costToHere:currentTile.costToHere + 0.5, costToDest: estimatedCostBetween(currentTile.x + 1, currentTile.y + 1, destCol, destRow), cost:0.5}, //bas-droite
                       {x:currentTile.x - 1, y:currentTile.y + 1, costToHere:currentTile.costToHere + 0.5, costToDest: estimatedCostBetween(currentTile.x - 1, currentTile.y + 1, destCol, destRow), cost:0.5}, //bas-gauche
    ]

    for(i=0; i < neighbors.length; i++){
      if((neighbors[i].costToHere + neighbors[i].costToDest < currentTile.costToHere + currentTile.costToDest)
          && mapLayer.layer.data[neighbors[i].x + 10*neighbors[i].y] !== 3){
        previousTile = currentTile;
        currentTile = neighbors[i];
        visitedTiles.push(currentTile);
        foundNextNode = true;
      }
    }

    if(!foundNextNode){
      currentTile = previousTile;
    }
  }

  for(i=0; i<visitedTiles.length; i++){
    scenePhysics.moveTo(player, mapLayer.offsetx + visitedTiles[i].x * tileSize, visitedTiles[i].y * 32);
  }
}
*/

function managePopup() {
  //popup fonction
  if (this.popupIsOpen != true) {
    this.popupIsOpen = true;
    this.popup.alpha = 1;
    this.closePopup.alpha = 1;
    return;
  }
  this.popup.alpha = 0;
  this.closePopup.alpha = 0;
  this.popupIsOpen = false;
}