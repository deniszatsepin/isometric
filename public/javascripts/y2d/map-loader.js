angular.module('Y2D')
    .factory('Map', function(PIXI, async, _) {
        function Map() {
            PIXI.EventTarget.call( this );
            Map.prototype.init.apply(this, arguments);
        }

        Map.prototype.init = function(map) {
            this.tilesets = [];
            if (map.tilesets && map.tilesets.length) {
                this.__loadTilesets(map.tilesets);
            }
        };

        Map.prototype.__loadTilesets = function(tilesets) {
            var scope = this;
            async.every(tilesets, function(tileset, done) {
                var tile = new Y2D.Tileset(tileset);
                tile.on('loaded', function() { done(true); });
                tile.on('error', function() { done(false); });
                scope.tilesets.push(tile);
            }, _.bind(function(result) {
                if (result) {
                    this.emit('loaded');
                } else {
                    this.emit('error');
                }
            }, this));
        };

        return Map;
    })
    .factory('Tileset', function(PIXI, async, _) {
        function Tileset() {
            PIXI.EventTarget.call( this );
            Tileset.prototype.init.apply(this, arguments);
        }

        Tileset.prototype.init = function(tileset) {
            _.extend(this, tileset);
            this.texture = PIXI.Texture.fromImage(this.image);
            this.texture.on('loaded', _.bind(function() {
                this.emit('loaded');
            }));
            this.texture.on('error', function(err) {
                this.emit('error');
            });
        };

        return Tileset;
    });
