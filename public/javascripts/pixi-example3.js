/**
 * Created by d on 22.04.2014.
 */
var AVATAR_X_OFFSET = 32 / 2;
var AVATAR_Y_OFFSET = 32 / 2;
var WIDTH = 700;
var HEIGHT = 300;
var STAGE_WIDTH = 700;
var STAGE_HEIGHT = 300;
var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;
var MAP_WIDTH = TILE_WIDTH * 8;
var MAP_HEIGHT = TILE_HEIGHT * 8;
var THICKNESS = 8;
var SKEW_X_OFFSET = STAGE_WIDTH / 2 - TILE_WIDTH;
var SKEW_Y_OFFSET = TILE_HEIGHT * 2;

var avatar;
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
    [G, G, G, G, G, G, G, G],
    [D, D, T, T, T, T, T, T],
    [D, T, T, W, W, W, W, T],
    [D, T, W, W, W, W, W, T],
    [G, G, G, G, G, G, G, T],
    [G, T, G, G, G, G, G, T],
    [G, T, G, G, G, G, G, T],
    [G, T, T, T, T, T, T, T]
];

var tileHeight = 32;
var tileWidth = 32;


var grass = isoTile('green');
var dirt = isoTile('gray');
var water = isoTile('pink');
var tree = isoTile('tree'); //function() {};
var tileMethods = [grass, dirt, water, tree];

function drawMap(terrain, xOffset, yOffset) {
    var tileType, x, y, pos, drawTile;

    for (var i = 0, iL = terrain.length; i < iL; i += 1) {
        for (var j = 0, jL = terrain[i].length; j < jL; j += 1) {
            x = j * tileWidth;
            y = i * tileHeight;

            pos = Converter.cartToIso(x, y);

            tileType = terrain[i][j];
            drawTile = tileMethods[tileType];
            drawTile(pos.x + xOffset, pos.y + yOffset);
        }
    }
}

drawMap(terrain, WIDTH / 2, tileHeight);

function ddToIso(x, y) {
    return {
        x: x - y,
        y: (x + y) / 2
    }
}

function Coordinates() {
    // Converts 2D coordinates to tile coordinates taking into
    // account anchor placement and thickness of tile
    function ddToTile(x, y) {
        var iso = ddToIso(x, y);
        return {
            x: iso.x + SKEW_X_OFFSET + TILE_WIDTH,
            y: iso.y + SKEW_Y_OFFSET - TILE_WIDTH - THICKNESS
        };
    }

    // Offset a 2D point keeping the point within the boundaries
    // of the map.

    function ddOffset(pt, byX, byY) {
        pt.x = Math.max(0, Math.min(pt.x + byX, MAP_WIDTH));
        pt.y = Math.max(0, Math.min(pt.y + byY, MAP_HEIGHT));
    }

    // Avatars avatar has depth too so we must ensure

    function ddToAvatar(x, y) {
        x = Math.min(MAP_WIDTH - 10, Math.max(0, x));
        y = Math.min(MAP_HEIGHT - 10, Math.max(0, y));

        var tile = ddToTile(x, y);
        return {
            x: tile.x - AVATAR_X_OFFSET,
            y: tile.y + AVATAR_Y_OFFSET
        };
    }

    return {
        ddToTile: ddToTile,
        ddToAvatar: ddToAvatar,
        ddOffset: ddOffset
    };
}
var coords = Coordinates();

function stageAvatar(x, y) {
    var avatar = PIXI.Sprite.fromImage('/images/bunny.png');
    avatar.location = new PIXI.Point(x, y);

    var pt = coords.ddToAvatar(x, y);
    avatar.position.x = pt.x;
    avatar.position.y = pt.y;
    avatar.anchor.x = 0;
    avatar.anchor.y = 1;

    stage.addChild(avatar);
    return avatar;
}

function moveAvatar(byX, byY) {
    // ensures avatar stays within bounds
    coords.ddOffset(avatar.location, byX, byY);

    var p = coords.ddToAvatar(avatar.location.x, avatar.location.y);
    avatar.position.x = p.x;
    avatar.position.y = p.y;
}

function moveUp(e) {
    e.shiftKey ? moveAvatar(0, -2) : moveAvatar(-2, -2);
}

function moveDown(e) {
    e.shiftKey ? moveAvatar(0, 2) : moveAvatar(2, 2);
}

function moveLeft(e) {
    e.shiftKey ? moveAvatar(-2, 0) : moveAvatar(-2, 2);
}

function moveRight(e) {
    e.shiftKey ? moveAvatar(2, 0) : moveAvatar(2, -2);
}

kd.UP.down(moveUp);
kd.DOWN.down(moveDown);
kd.LEFT.down(moveLeft);
kd.RIGHT.down(moveRight);



function start() {
    drawMap(terrain);
    avatar = stageAvatar(0, 0);

    function animate() {
        // keyboard handler
        kd.tick();
        requestAnimFrame(animate);
        renderer.render(stage);
    }
    requestAnimFrame(animate);
}
//start();


var POINTS = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//1
    [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],//2
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1],//3
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//4
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//5
    [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//6
    [1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//7
    [1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//8
    [1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//9
    [1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//0
    [1,0,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//1
    [1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//2
    [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//3
    [1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1],//4
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1],//5
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1],//6
    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],//7
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//8
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],//9
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//0
    [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],//1
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//2
    [1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],//1
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//4
    [1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//5
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//6
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],//7
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]//8
];
$(function() {
    var aStar = new AStar({
        points: POINTS,
        box: $('#RND'),
        sizeX: 28,
        sizeY: 50
    });


    var path = aStar.search({x: 1, y: 1}, {x: 24, y: 48});
});
