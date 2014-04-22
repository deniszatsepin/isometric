/**
 * Created by d on 22.04.2014.
 */

var stage = new PIXI.Stage(0xeeeeee);

var renderer = PIXI.autoDetectRenderer(400, 300);

$(document.body).append(renderer.view);

requestAnimFrame(animate);


var texture =  PIXI.Texture.fromImage('/images/tile_tree.png');
var tree = new PIXI.Sprite(texture);

tree.anchor.x = 0.5;
tree.anchor.y = 0.5;

tree.position.x = 200;
tree.position.y = 150;

stage.addChild(tree);

var bunnyTexture = PIXI.Texture.fromImage('/images/bunny.png');
var bunny = new PIXI.Sprite(bunnyTexture);

bunny.anchor.x = 0.5;
bunny.anchor.y = 0.5;

bunny.position.x = 100;
bunny.position.y = 100;

stage.addChild(bunny);


function animate() {
    requestAnimFrame(animate);

    bunny.rotation += 0.1;

    renderer.render(stage);
}