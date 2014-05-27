angular.module('Y2D')
    .factory('Game', function(PIXI, async, _, Map) {
        return {
            activeKeys: [false, false, false, false],
            xOffset: 0,
            yOffset: 0,
            camSpeed: 6,
            mapWidth: 0,
            mapHeight: 0,
            viewportWidth: 640,
            viewportHeight: 480,
            xOffsetIncr: function() {
                if (this.xOffset < this.mapWidth - this.viewportWidth * 1.5) {
                    this.xOffset += this.camSpeed;
                }
            },
            xOffsetDecr: function() {
                var border = this.mapWidth - this.viewportWidth * 1.5;
                if (this.xOffset > -border) {
                    this.xOffset -= this.camSpeed;
                }
                if (this.xOffset < -border) {
                    this.xOffset = -border;
                }
            },

            yOffsetIncr: function() {
                if (this.yOffset < this.mapHeight - this.viewportHeight){
                    this.yOffset += this.camSpeed;
                }
            },

            yOffsetDecr: function() {
                if (this.yOffset > 0) {
                    this.yOffset -= this.camSpeed;
                }
                if (this.yOffset < 0) {
                    this.yOffset = 0;
                }
            },

            stage: new PIXI.Stage(0x000000),
            renderer: null,
            graphics: new PIXI.Graphics(),
            init: function(map) {
                this.renderer = PIXI.autoDetectRenderer(this.viewportWidth, this.viewportHeight);
                angular.element('.game-box').append(this.renderer.view);
                this.map = map;
                var cartMapWidth = this.map.mapData.width * this.map.mapData.tilewidth;
                var cartMapHeight = this.map.mapData.height * this.map.mapData.tileheight;
                this.mapWidth = Converter.cartToIso(cartMapWidth, 0).x;
                this.mapHeight = Converter.cartToIso(cartMapWidth, cartMapHeight).y;
            },
            drawBackground: function() {
                console.log('x: ', this.xOffset, ', y: ', this.yOffset);
                this.stage = new PIXI.Stage(0x000000);
                var sprites = this.map.drawLayer(0, {
                    x: this.xOffset,
                    y: this.yOffset
                });
                _.each(sprites, _.bind(function(sprite) {
                    this.stage.addChild(sprite);
                }, this));
                var sprites = this.map.drawLayer(1, {
                    x: this.xOffset,
                    y: this.yOffset
                });
                _.each(sprites, _.bind(function(sprite) {
                    this.stage.addChild(sprite);
                }, this));
            },

            calculate: function() {

            },

            loop: function(period) {
                var viewportChanged = false;
                _.each(this.activeKeys, _.bind(function(key, id) {
                    if (key) {
                        viewportChanged = true;
                        switch (id) {
                            case 0: this.yOffsetDecr(); break;
                            case 1: this.yOffsetIncr(); break;
                            case 2: this.xOffsetIncr(); break;
                            case 3: this.xOffsetDecr(); break;
                        }
                    };
                }, this));

                this.calculate();

                if (viewportChanged) {
                    this.drawBackground();
                }

                this.renderer.render(this.stage);

                var activeKeys = this.activeKeys;
            },

            animate: function() {
                var animate = _.bind(function() {
                    //TODO: send time period to the loop
                    this.loop();
                    requestAnimationFrame(animate);
                }, this);

                requestAnimationFrame(animate);
            }
        }
    })
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
        },

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

        Map.prototype.drawLayer = function(id, offset) {
            var layer = this.mapData.layers[id];
            if (!layer) return;
            var sprites = [];
            var xOffset = 640 / 2 - this.mapData.tilewidth / 2 + offset.x;
            var yOffset = this.mapData.tileheight * 3 - offset.y;
            for (var y = 0, yLen = layer.height; y < yLen; y += 1) {
                for (var x = 0, xLen = layer.width; x < xLen; x += 1) {
                    //TODO: add check - is tile in the view port
                    var pos = y * xLen + x;
                    var tileId = layer.data[pos];
                    if (tileId === 0) continue;
                    var tile = this.tiles[tileId];
                    if (!tile) {
                        tile = this.tiles[tileId] = this.getTileById(tileId);
                    }
                    var xTileOffset = tile.tileoffset.x || 0;
                    var yTileOffset = tile.tileoffset.y || 0;
                    var ddX = this.mapData.tilewidth * x / 2;
                    var ddY = this.mapData.tileheight * y;
                    var iso = Converter.cartToIso(ddX, ddY);

                    var sprite = tile.getSprite(iso.x + xOffset + xTileOffset, iso.y + yOffset + yTileOffset);
                    sprites.push(sprite);
                }
            }
            return sprites;
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
