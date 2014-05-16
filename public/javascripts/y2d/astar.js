angular.module('Y2D')
    .factory('AStar', function() {
        return (function AStar() {
            var HRZ = 10, DGN = 14;

            function AStar() {
                AStar.prototype.init.apply(this, arguments);
            }

            function Point() {
                Point.prototype.init.apply(this, arguments);
            }

            Point.prototype.init = function (conf) {
                conf = conf || {};
                this.x = conf.x || 0;
                this.y = conf.y || 0;
                this.parent = conf.parent || null;
                this.f = 0;
                this.g = 0;
                this.h = 0;
                this.key = this.x + '|' + this.y;
            };

            Point.prototype.getHash = function () {
                this.key = x + '' + y;
                return this.key;
            };


            AStar.prototype.init = function (conf) {
                conf = conf || {};

                this.open = [];
                this.close = [];
                this.points = conf.points || [];
                this.sizeX = conf.sizeX - 1;
                this.sizeY = conf.sizeY - 1;
                this.position = conf.position || {x: 0, y: 0};
                this.box = conf.box;
            };

            AStar.prototype.manhattan = function (from, to) {
                return HRZ * (Math.abs(from.x - to.x) + Math.abs(from.y - to.y));
            };

            AStar.prototype.getDistance = function (from, to) {
                var dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
                return dist > 1 ? DGN : HRZ;
            };

            AStar.prototype.diagonalShortcut = function (from, to) {
                var xDistance = Math.abs(from.x - to.x);
                var yDistance = Math.abs(from.y - to.y);
                return (xDistance > yDistance) ?
                    DGN * yDistance + HRZ * (xDistance - yDistance) :
                    DGN * xDistance + HRZ * (yDistance - xDistance)
            };

            AStar.prototype.getPath = function (from) {
                var path = [];
                while (from.parent) {
                    path.push({x: from.x, y: from.y});
                    from = from.parent;
                }
                path.push({x: from.x, y: from.y});
                this.path = path;
                this.render();
                console.log(Date.now() - this.startTime);
                return path;
            };

            AStar.prototype.render = function (current) {
                if (!this.box) return 0;
                $box = $(this.box);
                $box.empty();
                _.each(this.points, function (row, rid) {
                    _.each(row, function (tile, tid) {
                        var $tile = $('<div class="tile" data-id="' + rid + '|' + tid + '"></div>');
                        $box.append($tile);
                        switch (tile) {
                            case 0:
                                $tile.addClass('wall');
                                break;
                            case 1:
                                $tile.addClass('ground');
                        }
                    });
                });

                _.each(this.close, function (close) {
                    $('[data-id="' + close.key + '"]').addClass('close');
                    $('[data-id="' + close.key + '"]').html('f:' + close.f + '<br/>g: ' + close.g + '<br/>h:' + close.h);
                });

                _.each(this.open, function (open) {
                    $('[data-id="' + open.key + '"]').addClass('open');
                    $('[data-id="' + open.key + '"]').html('f:' + open.f + '<br/>g: ' + open.g + '<br/>h:' + open.h);
                });

                _.each(this.path, function (path) {
                    var key = path.x + '|' + path.y;
                    $('[data-id="' + key + '"]').addClass('path');
                });
                if (current) {
                    $('[data-id="' + current.key + '"]').addClass('current');
                }
            };

            AStar.prototype.search = function (source, target) {
                this.startTime = Date.now();
                this.open = [];
                this.close = {};

                var startPoint = new Point(source);
                startPoint.h = this.manhattan({x: startPoint.x, y: startPoint.y}, target);
                startPoint.f = startPoint.g + startPoint.h;

                this.open.push(startPoint);

                while (this.open.length) {
                    var sorted = _.sortBy(this.open, 'f');
                    this.open = sorted;


                    var current = this.open.shift();

                    //this.render(current);
                    this.close[current.key] = current;
                    for (var y = -1; y <= 1; y += 1) {
                        for (var x = -1; x <= 1; x += 1) {
                            var posX = current.x + x;
                            var posY = current.y + y;
                            if (posX < 0 || posY < 0 || posX > this.sizeX || posY > this.sizeY) continue;

                            var p = this.points[posX][posY];
                            var point = new Point({
                                x: posX,
                                y: posY,
                                parent: current
                            });
                            if (this.close[point.key]) continue;

                            if (target.x === posX && target.y === posY) {
                                return this.getPath(point);
                            }

                            var tentativeBetter = true;
                            var tentativeG = current.g + this.getDistance({x: current.x, y: current.y}, {x: point.x, y: point.y});

                            if (!p) continue;

                            var idx = _.findIndex(this.open, { key: point.key });
                            if (idx === -1) {
                                this.open.push(point);
                            } else {
                                point = this.open[idx];
                                if (tentativeG >= point.g) {
                                    tentativeBetter = false;
                                }
                            }

                            if (tentativeBetter) {
                                point.parent = current;
                                point.g = tentativeG;
                                point.h = this.manhattan({x: point.x, y: point.y}, target);
                                point.f = point.g + point.h;
                            }
                        }
                    }
                }
            }

            return AStar;
        })();
    });