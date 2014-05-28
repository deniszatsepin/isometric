/**
 * Created by fetch on 10.05.14.
 */

var Learning = angular.module('Learning', ['Y2D']);

Learning.run(function($rootScope, $http, PIXI, _, Map, Tileset) {
    $rootScope.mapData = {};
    $http.get('/maps/grassland_template.json').success(function(data) {
        $rootScope.mapData = data;
        $rootScope.map = new Map(data);
        $rootScope.map.on('loaded', function() {
            console.log('Map has been loaded.');
        });
        $rootScope.map.on('error', function() {
            console.log('Map hasn\'t been loaded');
        })
    });

    console.log('Map: ', Map);
    console.log('Tileset', Tileset);
});

Learning.controller('LearningController', function($scope, PIXI, _, Game, Map, Tileset) {
    $scope.key = [false, false, false, false];
    $scope.drawMap = function() {
        console.log('click:', $scope.map);
        Game.init($scope.map);
        Game.drawBackground();
        Game.animate();
    };

    $scope.onKeyDown = function($event) {
        $event.stopPropagation();
        $event.preventDefault();
        var keyCode = $event.keyCode;
        console.log("down: ", keyCode);
        var activeKeys = Game.activeKeys;
        switch(keyCode) {
            case 38: //UP
                activeKeys[0] = true;
                break;
            case 40: //DOWN
                activeKeys[1] = true;
                break;
            case 37: //LEFT
                activeKeys[2] = true;
                break;
            case 39:
                activeKeys[3] = true;
                break;
        }
    };
    $scope.onKeyUp = function($event) {
        $event.stopPropagation();
        $event.preventDefault();
        var keyCode = $event.keyCode;
        console.log('up: ', keyCode);
        var activeKeys = Game.activeKeys;
        switch(keyCode) {
            case 38: //UP
                activeKeys[0] = false;
                break;
            case 40: //DOWN
                activeKeys[1] = false;
                break;
            case 37: //LEFT
                activeKeys[2] = false;
                break;
            case 39:
                activeKeys[3] = false;
                break;
        }
    };

	$scope.assetsToLoader = ['/personages/minotaur.json'];
	$scope.loader = new PIXI.AssetLoader($scope.assetsToLoader);
	$scope.loader.onComplete = onAssetsLoaded;

	$scope.addEntity = function() {
		$scope.loader.load();
	}

	function onAssetsLoaded() {
		var activities = ['idle', 'run', 'attack'];
		var textures = {};

		_.each(activities, function(activity) {
			textures[activity] = [];
			for (var i = 0; i < 8; i += 1) {
				var currentAnimation = textures[activity][i] = [];
				for (var j = 1; j < 9; j += 1) {
					var texture = PIXI.Texture.fromFrame(activity + '/a' + i + '000' + j + '.png');
					currentAnimation.push(texture);
				}
			}
		});

		var movieClip = new PIXI.MovieClip(textures['idle'][4]);
		movieClip.animationTextures = textures;
		movieClip.textures = movieClip.animationTextures['run'][4];
		movieClip.position.x = 300;
		movieClip.position.y = 300;
		movieClip.anchor.x = 0.5;
		movieClip.anchor.y = 1;
		movieClip.animationSpeed = 0.2;
		movieClip.play();
		Game.entities.push(movieClip);
	}

});