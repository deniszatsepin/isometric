angular.module('Y2D')
    .factory('Game', function(PIXI, async, _, Map) {
        return {
            activeKeys: [false, false, false, false],
            xOffset: 0,
            yOffset: 0,
            camSpeed: 6,
            mapWidth: 0,
            mapHeight: 0,
            viewportWidth: 800,
            viewportHeight: 600,
	        entities: [],
            layers: [],
            BACKGROUND: 0,
            ENTITIES: 1,
            COLLISION: 2,
            loadResources: function() {

            },
            initEntities: function() {

            },
            xOffsetIncr: function() {
	            var bound = this.bounds.right + this.viewportWidth / 2;
                if (this.xOffset < bound) {
                    this.xOffset += this.camSpeed;
                }
	            if (this.xOffset > bound) {
		            this.xOffset = bound;
	            }
            },
            xOffsetDecr: function() {
                var border = this.bounds.left - this.viewportWidth * 0.5;
                if (this.xOffset > -border) {
                    this.xOffset -= this.camSpeed;
                }
                if (this.xOffset < -border) {
                    this.xOffset = -border;
                }
            },

            yOffsetIncr: function() {
	            var border = this.viewportHeight * 0.5;
                if (this.yOffset < border){
                    this.yOffset += this.camSpeed;
                }
                if (this.yOffset > border) {
                    this.yOffset = 0;
                }
            },

            yOffsetDecr: function() {
                var maxOffset = this.bounds.bottom - this.viewportHeight * 0.5;
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
                this.initAstar();
                var cartMapWidth = this.map.mapData.width * this.map.mapData.tilewidth;
                var cartMapHeight = this.map.mapData.height * this.map.mapData.tileheight;
	            this.bounds = {
		            left: Math.abs(Converter.cartToIso(0, cartMapHeight).x),
		            right: Math.abs(Converter.cartToIso(cartMapWidth / 2, 0).x),
		            top: 0,
		            bottom: Converter.cartToIso(cartMapWidth / 2, cartMapHeight).y
	            };
                this.mapWidth = Converter.cartToIso(cartMapWidth, 0).x;
                this.mapHeight = Converter.cartToIso(cartMapWidth, cartMapHeight).y;

                this.layers[this.BACKGROUND] = new PIXI.DisplayObjectContainer(); //Background
                this.layers[this.ENTITIES] = new PIXI.DisplayObjectContainer(); //Entities
                this.layers[this.COLLISION] = new PIXI.DisplayObjectContainer(); //Entities
                this.stage.addChild(this.layers[this.BACKGROUND]);
                this.stage.addChild(this.layers[this.ENTITIES]);
	            this.stage.click = _.bind(this.stageClick, this);
            },

            initAstar: function() {
                var collisionsLayer = this.map.mapData.layers[2];
                var width = collisionsLayer.width;
                var height = collisionsLayer.height;
                var data = collisionsLayer.data;
                var collisionsMap = [];
                for (var i = 0; i < height; i += 1) {
                    var row = collisionsMap[i] = [];
                    for (var j = 0; j < width; j += 1) {
                        var pos = i * width + j;
                        row[j] = data[pos];
                    }
                }
                //this.aStarGraph = new Graph(collisionsMap);
                this.findGrid = new PF.Grid(width, height, collisionsMap);
                this.finder = new PF.AStarFinder({
                    allowDiagonal: true,
                    dontCrossCorners: true
                });
            },

	        stageClick: function(info) {
		        var oEvent = info.originalEvent;
		        var pos = {
			        x: oEvent.layerX,
			        y: oEvent.layerY
		        }
		        console.log(pos);
		        _.each(this.entities, _.bind(function(entity) {
			        var targetPos = {
				        x: pos.x - this.xOffset,
				        y: pos.y - this.yOffset
			        };
                    entity.targetTile = Converter.isoToTile(targetPos.x, targetPos.y, 32);
			        console.log(targetPos.x, ', ', targetPos.y);
			        console.log('Tile: ', entity.targetTile);
                    var current = Converter.isoToTile(entity.x, entity.y, 32);
                    entity.currentTile = current;
                    /*
                    var start = this.aStarGraph.nodes[current.y][current.x];
                    var end = this.aStarGraph.nodes[entity.targetTile.y][entity.targetTile.x];
                    var path = astar.search(this.aStarGraph.nodes, start, end, true);
                    */
                    var path = this.finder.findPath(current.x, current.y, entity.targetTile.x, entity.targetTile.y, this.findGrid.clone());
                    path.shift();
                    entity.path = path;
                    console.log('Path: ', path);
                    if (path.length > 0) {
                        var last = path[path.length - 1];
                        console.log('Path: x: ', last[0], ', y: ', last[1]);
                    }
		        }, this));
	        },

            drawBackground: function(first) {
                if (first) {
                    _.each(this.map.drawLayer(0), _.bind(function (sprite) {
                        this.layers[this.BACKGROUND].addChild(sprite);
                    }, this));
                    _.each(this.map.drawLayer(1), _.bind(function (sprite) {
                        this.layers[this.ENTITIES].addChild(sprite);
                    }, this));
                    _.each(this.map.drawLayer(2), _.bind(function (sprite) {
                        this.layers[this.COLLISION].addChild(sprite);
                    }, this));

                    var entities = this.layers[this.ENTITIES];
                    _.each(this.entities, _.bind(function (entity) {
                        entities.addChild(entity);
                    }, this));
                } else {
                    this.layers[this.BACKGROUND].position = new PIXI.Point(this.xOffset, this.yOffset);
                    this.layers[this.ENTITIES].position = new PIXI.Point(this.xOffset, this.yOffset);
                }
            },

            calculate: function() {
	            var mapDataLayers = this.map.mapData.layers;
	            var objectLayer = mapDataLayers[1];
	            var collisionLayer = mapDataLayers[2];
                _.each(this.entities, _.bind(function(entity) {
                    var path = entity.path;
                    if (path) {
                        while (path.length > 0 && entity.targetPos && entity.targetPos.finished) {
                            entity.targetPos.finished = false;
                            path.shift();
                        }
                        if (path.length > 0) {
                            entity.targetPos = Converter.tileToIso(path[0][0], path[0][1], 32);
                        }

                        if (entity.targetPos) {
                            var currentX = entity.x;
                            var currentY = entity.y;
                            var targetX = entity.targetPos.x;
                            var targetY = entity.targetPos.y;

                            var velocity = 2;
                            if (currentX !== targetX || currentY !== targetY) {
                                var pos = this.moveEntity(entity, currentX, currentY, targetX, targetY, velocity);

                                /*
                                 var targetTile = Converter.isoToTile(pos.x, pos.y, 32);
                                 var targetTilePos = (targetTile.y - 1) * collisionLayer.width + (targetTile.x - 1);
                                 if (collisionLayer.data[targetTilePos] > 0) {
                                 entity.targetPos.x = currentX;
                                 entity.targetPos.y = currentY;
                                 return;
                                 }
                                 */

                                entity.x = pos.x;
                                entity.y = pos.y;
                                if (entity.x === targetX && entity.y === targetY) {
                                    if (entity.path && entity.path.length > 0) {
                                        entity.targetPos.finished = true;
                                    }
                                }
                            } else {
                                if (entity.prevDirection !== undefined) {
                                    entity.textures = entity.animationTextures['idle'][entity.prevDirection];
                                } else {
                                    entity.textures = entity.animationTextures['idle'][0];
                                }
                            }
                            var pos = Converter.isoToTile(entity.x, entity.y + 32, 32);
                            var width = objectLayer.width;
                            entity.depth = pos.y * width + pos.x;
                        }

                    }


	            }, this));

	            var entities = this.layers[this.ENTITIES].children;
	            entities.sort(function(a, b) {
		            return a.depth - b.depth;
	            });

            },

	        moveEntity: function(entity, currentX, currentY, targetX, targetY, velocity) {
				var angle = Math.atan2(targetY - currentY, targetX - currentX) * 180 / Math.PI;
		        if (angle < 0) {
			        angle = 360 + angle;
		        }
		        var dir = Math.floor(angle / 45);
		        var directions = [4, 5, 6, 7, 0, 1, 2, 3];
		        /*
		        {
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
		        */
		        var direction = directions[dir];
		        if (direction === undefined) {
			        direction = 0;
		        }

		        entity.prevDirection = direction;
		        entity.textures = entity.animationTextures['run'][direction];

		        var getTarget = function(targetX, currentX) {
			        if (targetX - currentX > 0) {
				        currentX += velocity;
				        if (currentX > targetX) {
					        currentX = targetX;
				        }
			        } else {
				        if (targetX - currentX < 0) {
					        currentX -= velocity;
					        if (currentX < targetX) {
						        currentX = targetX;
					        }
				        }
			        }
			        return currentX;
		        };

				return {
					x: getTarget(targetX, currentX),
					y: getTarget(targetY, currentY)
				};
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

	            //this.moveEntity(act.join(''));

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
    });
