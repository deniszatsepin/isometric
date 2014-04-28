
var Point = (function() {
    var Point = function() {
        Point.prototype.init.app(this, arguments);
    };

    Point.prototype.init = function(x, y) {
        this.x = x;
        this.y = y;
    };

    return Point;
});

var Converter = {
    isoToCart: function(x, y) {
        return {
            x: (2 * y + x) / 2,
            y: (2 * y - x) / 2
        };
    },
    isoToCartPoint: function(point) {
        var p = this.isoToCart(point.x, point.y);
        return new Point(p.x, p.y);
    },

    cartToIso: function(x, y) {
        return {
            x: x - y,
            y: (x + y) / 2
        };
    },

    isoToTile: function(x, y, tileWidth) {
        return {
            x: Math.floor(x / tileWidth),
            y: Math.floor(y / tileWidth)
        };
    },

    tileToIso: function(x, y, tileWidth) {
        return {
            x: x * tileWidth,
            y: y * tileWidth
        }
    }
};