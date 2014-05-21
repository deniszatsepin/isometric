angular.module('Y2D')
    .factory('Game', function(PIXI, async, _, Map) {
        return {
            activeKeys: [false, false, false, false],
            xOffset: 0,
            yOffset: 0,
            camSpeed: 2,
            mapWidth: 0,
            mapHeight: 0,
            viewportWidth: 640,
            viewportHeight: 480,
            xOffsetIncr: function() {
                if (this.xOffset < this.mapWidth - this.viewportWidth) {
                    this.xOffset += this.camSpeed;
                }
            },
            xOffsetDecr: function() {
                if (this.xOffset > 0) {
                    this.xOffset -= this.camSpeed;
                }
                if (this.xOffset < 0) {
                    this.xOffset = 0;
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
            renderer: PIXI.autoDetectRenderer(640, 480),
            graphics: new PIXI.Graphics(),
            init: function(map) {
                angular.element('.game-box').append(this.renderer.view);
                this.map = map;
                this.mapWidth = this.map.mapData.width * this.map.mapData.tilewidth;
                this.mapHeight = this.map.mapData.height * this.map.mapData.tileheight;
            },
            drawBackground: function() {
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
            loop: function(period) {
                var viewportChanged = false;
                _.each(this.activeKeys, _.bind(function(key, id) {
                    if (key) {
                        viewportChanged = true;
                        switch (id) {
                            case 0: this.yOffsetIncr(); break;
                            case 1: this.yOffsetDecr(); break;
                            case 2: this.xOffsetDecr(); break;
                            case 3: this.xOffsetIncr(); break;
                        }
                    };
                }, this));

                if (viewportChanged) {
                    this.drawBackground();
                }
                this.renderer.render(this.stage);

                var activeKeys = this.activeKeys;
                for (var i = 0, len = activeKeys.length; i < len; i += 1) {
                    activeKeys[i] = false;
                }
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
            var xOffset = 640 / 2 - this.mapData.tilewidth + offset.x;
            var yOffset = this.mapData.tileheight * 2 + offset.y;
            for (var y = 0, yLen = layer.height; y < yLen; y += 1) {
                for (var x = 0, xLen = layer.width; x < xLen; x += 1) {
                    //TODO: add check - is tile in the view port
                    var pos = y * xLen + x;
                    var tileId = layer.data[pos];
                    if (tileId === 0) continue;
                    if (!this.tiles[tileId]) {
                        this.tiles[tileId] = this.getTileById(tileId);
                    }
                    var ddX = this.mapData.tilewidth * x / 2;
                    var ddY = this.mapData.tileheight * y;
                    var iso = Converter.cartToIso(ddX, ddY);
                    var sprite = this.tiles[tileId].getSprite(iso.x + xOffset, iso.y + yOffset);
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
