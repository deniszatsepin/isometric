angular.module('Y2D')
    .factory('Map', function(PIXI, async, _, Tileset) {
        function Map() {
            PIXI.EventTarget.call( this );
            Map.prototype.init.apply(this, arguments);
        }

        Map.prototype.init = function(map) {
            this.mapData = map;
            this.tilesets = [];
            this.tiles = [];
            if (map.tilesets && map.tilesets.length) {
                this.__loadTilesets();
            }
        };

        Map.prototype.__loadTilesets = function() {
            var tilesets = this.mapData.tilesets;
            async.every(tilesets, _.bind(function(tileset, done) {
                var tile = new Tileset(tileset);

                tile.on('loaded', _.bind(function() {
                    done(true);
                }, this));
                tile.on('error', function(err) {
                    done(false);
                });
                this.tilesets.push(tile);
            }, this), _.bind(function(result) {
                if (result) {
                    this.preDraw();
                    this.emit({type: 'loaded'});
                } else {
                    this.emit({type: 'error'});
                }
            }, this));
        };

        Map.prototype.getTileById = function(tileId) {
            if (tileId < 1) return null;
            var tilesets = this.tilesets;
            var tileset = null;
            for (var i = 0, len = tilesets.length; i < len; i += 1) {
                if (tileId === tilesets[i].firstgid) {
                    tileset = tilesets[i];
                    break;
                }

                if (tileId < tilesets[i].firstgid) {
                    tileset = tilesets[i - 1];
                    break;
                }
            }

            if (tileset === null) {
                tileset = tilesets[len - 1];
            }

            var width = tileset.imagewidth / tileset.tilewidth;
            var height = tileset.imageheight / tileset.tileheight;
            var pos = tileId - tileset.firstgid;
            var x = (pos % width) * tileset.tilewidth;
            var y = Math.floor(pos / width) * tileset.tileheight;
            var rectangle = new PIXI.Rectangle(x, y, tileset.tilewidth, tileset.tileheight);

            return {
                tileoffset: tileset.tileoffset || {},
                texture: new PIXI.Texture(tileset.texture, rectangle),
                getSprite: function (x, y) {
                    var sprite = new PIXI.Sprite(this.texture);
                    sprite.position.x = x;
                    sprite.position.y = y;

                    sprite.anchor.x = 0;
                    sprite.anchor.y = 1;
                    return sprite;
                }
            };
        };

        Map.prototype.preDraw = function() {
            var layers = this.mapData.layers;
            _.each(layers, _.bind(function(layer, id) {
                var data = layer.data;
                for (var i = 0, len = data.length; i < len; i += 1) {
                    var tileId = data[i];
                    if (tileId !== 0 && !this.tiles[tileId]) {
                        this.tiles[tileId] = this.getTileById(tileId, {
                            x: i % layer.width,
                            y: Math.floor(i % layer.width)
                        });
                    }
                }
            }, this));
        };

        Map.prototype.drawLayer = function(id) {
            var layer = this.mapData.layers[id];
            if (!layer) return;
            var sprites = [];
            var xOffset = -this.mapData.tilewidth / 2;
            var yOffset = this.mapData.tileheight;
            for (var y = 0, yLen = layer.height; y < yLen; y += 1) {
                for (var x = 0, xLen = layer.width; x < xLen; x += 1) {
                    //TODO: add check - is tile in the view port
                    var pos = y * xLen + x;
                    var tileId = layer.data[pos];

                    if (tileId !== 0) {
                        var tile = this.tiles[tileId];
                        if (!tile) {
                            tile = this.tiles[tileId] = this.getTileById(tileId);
                        }
                        var xTileOffset = tile.tileoffset.x || 0;
                        var yTileOffset = tile.tileoffset.y || 0;
                    }
                    var ddX = this.mapData.tilewidth * x / 2;
                    var ddY = this.mapData.tileheight * y;
                    var iso = Converter.cartToIso(ddX, ddY);

                    if (tileId !== 0) {
                        var sprite = tile.getSprite(iso.x + xOffset + xTileOffset, iso.y + yOffset + yTileOffset);
                        sprite.depth = pos;
                        sprites.push(sprite);
                    } else {
                        if (id === 0) {
                            var sprite = new PIXI.DisplayObjectContainer();
                            sprite.x = iso.x + xOffset;
                            sprite.y = iso.y + yOffset;
                            sprites.push(sprite);
                        } else {
                            continue;
                        }

                    }
                }
            }
            return sprites;
        };

        return Map;
    });