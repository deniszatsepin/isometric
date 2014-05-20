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