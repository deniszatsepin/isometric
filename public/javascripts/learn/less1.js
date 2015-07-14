/**
 * Created by fetch on 10.05.14.
 */

var Learning = angular.module('Learning', ['Y2D']);

Learning.run(function($rootScope, $http, $timeout, PIXI, _, Map, Tileset, Game, AssetLoaderService) {
    $rootScope.mapData = {};
    $http.get('/maps/collision_map.json').success(function(data) {
        $rootScope.mapData = data;
        $rootScope.map = new Map(data);
        $rootScope.map.on('loaded', function() {
            console.log('Map has been loaded.');
            AssetLoaderService.load().then(function() {
                Game.init($rootScope.map);
                Game.animate();
                Game.activeKeys[2] = true;
                $timeout(function() {
                    Game.activeKeys[2] = false;
                }, 1000);
            });
        });
        $rootScope.map.on('error', function() {
            console.log('Map hasn\'t been loaded');
        })
    });

    console.log('Map: ', Map);
    console.log('Tileset', Tileset);
});

Learning.service('AssetLoaderService', ['$q', '_', 'PIXI', 'Game', function($q, _, PIXI, Game) {
    function load(assets) {
        var deferred = $q.defer();
        var assetsToLoader = assets || ['/personages/minotaur.json'];
        var loader = new PIXI.AssetLoader(assetsToLoader);
        loader.onComplete = onAssetsLoaded;

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
            console.log("CONVERTER: ", Converter.cartToTile(0, 33, 32));
            console.log("CONVERTER: ", Converter.isoToTile(15, 46, 32));

            var movieClip = new PIXI.MovieClip(textures['idle'][4]);
            movieClip.animationTextures = textures;
            movieClip.textures = movieClip.animationTextures['run'][4];
            var pos = Converter.tileToIso(4, 4, 32);
            movieClip.position.x = pos.x;
            movieClip.position.y = pos.y;
            movieClip.anchor.x = 0.5;
            movieClip.anchor.y = 0.6;
            movieClip.animationSpeed = 0.2;
            movieClip.play();
            movieClip.isoPos = new PIXI.Point(0, 0);
            Game.entities.push(movieClip);
            deferred.resolve(true);
        }
        loader.load();
        return deferred.promise;
    }

    return {
        load: function() {
            return load.apply(null, arguments);
        }
    }
}]);

Learning.controller('LearningController', function($scope, PIXI, _, Game) {
    $scope.key = [false, false, false, false];

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


});

Learning.directive('gameWrapper', function() {
    return {
        link: function(scope, element) {
            element.focus();
        }
    }
});