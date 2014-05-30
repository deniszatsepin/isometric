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
	        entities: [],
            layers: [],
            BACKGROUND: 0,
            ENTITIES: 1,
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
                if (this.yOffset < 0){
                    this.yOffset += this.camSpeed;
                }
                if (this.yOffset > 0) {
                    this.yOffset = 0;
                }
            },

            yOffsetDecr: function() {
                var maxOffset = this.mapHeight - this.viewportHeight * 1.5;
                if (this.yOffset > -maxOffset) {
                    this.yOffset -= this.camSpeed;
                }
                if (this.yOffset < -maxOffset) {
                    this.yOffset = -maxOffset;
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

                this.layers[this.BACKGROUND] = new PIXI.DisplayObjectContainer(); //Background
                this.layers[this.ENTITIES] = new PIXI.DisplayObjectContainer(); //Entities
                this.stage.addChild(this.layers[this.BACKGROUND]);
                this.stage.addChild(this.layers[this.ENTITIES]);
            },
            drawBackground: function(first) {
                if (first) {
                    _.each(this.map.drawLayer(0), _.bind(function (sprite) {
                        this.layers[this.BACKGROUND].addChild(sprite);
                    }, this));

                    _.each(this.map.drawLayer(1), _.bind(function (sprite) {
                        this.layers[this.ENTITIES].addChild(sprite);
                    }, this));

                    var tile = this.layers[this.ENTITIES].getChildAt(0);
                    _.each(this.entities, _.bind(function (entity) {
                        tile.addChild(entity);
                    }, this));
                } else {
                    this.layers[this.BACKGROUND].position = new PIXI.Point(this.xOffset, this.yOffset);
                    this.layers[this.ENTITIES].position = new PIXI.Point(this.xOffset, this.yOffset);
                }
            },

            calculate: function() {

            },

	        moveEntity: function(dir) {
		        var directions = {
			        '0000': 100,
			        '0010': 0,
			        '1010': 1,
			        '1000': 2,
			        '1001': 3,
			        '0001': 4,
			        '0101': 5,
			        '0100': 6,
			        '0110': 7
		        };
		        var direction = directions[dir];
		        if (direction === undefined) {
			        direction = 0;
		        }

		        _.each(this.entities, _.bind(function(entity) {
			        if (direction === 100) {
				        if (entity.prevDirection !== undefined) {
					        entity.textures = entity.animationTextures['idle'][entity.prevDirection];
				        } else {
					        entity.textures = entity.animationTextures['idle'][0];
				        }
			        } else {
				        entity.prevDirection = direction;
				        entity.textures = entity.animationTextures['run'][direction];
			        }
                    var x = - this.xOffset;
                    var y = - this.yOffset;
                    entity.x = x % 64;
                    entity.y = y % 64;
                    console.log(x, ',', y);
                    var tile = Converter.isoToTile(x, y, 32);
                    if (tile.x < 0 || tile.y < 0) {
                        entity.visible = false;
                    } else {
                        entity.visible = true;
                        var xLen = this.map.mapData.layers[1].width;
                        var pos = tile.y * xLen + tile.x;
                        if (this.layers[this.ENTITIES].children.length > 0) {
                            var t = this.layers[this.ENTITIES].getChildAt(pos);
                            t.addChild(entity);
                        }
                    }
                    console.log(tile, pos);
		        }, this));
	        },

            loop: function(period) {
                var viewportChanged = false;
	            var act = [];
                _.each(this.activeKeys, _.bind(function(key, id) {
	                act.push(key ? 1 : 0);
                    if (key) {
                        viewportChanged = true;
                        switch (id) {
                            case 0: this.yOffsetIncr(); break;
                            case 1: this.yOffsetDecr(); break;
                            case 2: this.xOffsetIncr(); break;
                            case 3: this.xOffsetDecr(); break;
                        }

                    };
                }, this));

	            this.moveEntity(act.join(''));

                this.calculate();

                if (viewportChanged) {
                    if (!this.drawnOnce) {
                        this.drawBackground(true);
                        this.drawnOnce = true;
                    } else {
                        this.drawBackground();
                    }
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

        Map.prototype.drawLayer = function(id) {
            var layer = this.mapData.layers[id];
            if (!layer) return;
            var sprites = [];
            var xOffset = 640 / 2 - this.mapData.tilewidth / 2;
            var yOffset = this.mapData.tileheight * 3;
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
                    } else {
                        var sprite = new PIXI.DisplayObjectContainer();
                        sprite.x = iso.x + xOffset;
                        sprite.y = iso.y + yOffset;
                    }
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
