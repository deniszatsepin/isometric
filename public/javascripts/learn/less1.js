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
    }
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
    }
});