angular.module('Y2D')
    .factory('Map', function(PIXI, async, _, Tileset) {
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
                var tile = new Tileset(tileset);
                tile.on('loaded', function() {
                    done(true);
                });
                tile.on('error', function(err) {
                    done(false);
                });
                scope.tilesets.push(tile);
            }, _.bind(function(result) {
                if (result) {
                    this.emit({type: 'loaded'});
                } else {
                    this.emit({type: 'error'});
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
            this.texture.on('update', _.bind(function(e) {
                if (e.content.baseTexture.hasLoaded) {
                    this.emit({type:'loaded'});
                }
            }, this));
            this.texture.on('error', _.bind(function(err) {
                this.emit({type: 'error'});
            }, this));
        };

        return Tileset;
    });
