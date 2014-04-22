/**
 * Created by d on 22.04.2014.
 */

var WIDTH = 700;
var HEIGHT = 300;
var stage = new PIXI.Stage(0xeeffff);

var renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT);

$(document.body).append(renderer.view);


var graphics = new PIXI.Graphics();

stage.addChild(graphics);

function isoTile(filename) {
    var texture =  PIXI.Texture.fromImage('/images/tile_' + filename + '.png');

    return function(x, y) {
        var tile = new PIXI.Sprite(texture);
        tile.position.x = x;
        tile.position.y = y;

        tile.anchor.x = 0;
        tile.anchor.y = 1;
        stage.addChild(tile);
    }
}

var G = 0, D = 1, W = 2, T = 3;

var terrain = [
    [G, G, G, G],
    [D, D, T, D],
    [D, T, T, W],
    [D, T, W, W],
    [G, T, W, W]
];

var tileHeight = 32;
var tileWidth = 32;

var grass = isoTile('green');
var dirt = isoTile('gray');
var water = isoTile('pink');
var tree = isoTile('tree'); //function() {};
var tileMethods = [grass, dirt, water, tree];

function drawMap(terrain, xOffset, yOffset) {
    var tileType, x, y, isoX, isoY, idx;

    for (var i = 0, iL = terrain.length; i < iL; i += 1) {
        for (var j = 0, jL = terrain[i].length; j < jL; j += 1) {
            x = j * tileWidth;
            y = i * tileHeight;

            isoX = x - y;
            isoY = (x + y) / 2;

            tileType = terrain[i][j];
            var drawTile = tileMethods[tileType];
            drawTile(xOffset + isoX, isoY + yOffset);
        }
    }
}

drawMap(terrain, WIDTH / 2, tileHeight);

function animate() {
    requestAnimFrame(animate);

    renderer.render(stage);
}
requestAnimFrame(animate);
