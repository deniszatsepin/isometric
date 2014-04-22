/**
 *
 * Created by fetch on 19.04.14.
 */

var App = (function() {
  var App = function() {
    App.prototype.init.apply(this, arguments);
  };

  App.prototype.init = function(options) {
    options = options || {};
    if (!options.canvas) return false;
    var canvas = this.canvas = options.canvas;
    this.context = canvas.getContext('2d');

    var tile = this.tile = new Image();
    tile.src = '../images/tile_green.png';
    var that = this;
    tile.onload = function() {
      that.draw();
    };
  };

  App.prototype.draw = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var halfWidth = this.tile.width / 2;
    var halfHeight = this.tile.height / 2;
    for (var col = 0; col < 10; col += 1) {
      for (var row = 0; row < 10; row += 1) {
        var tilePositionX = (row - col) * halfWidth;

        tilePositionX += (this.canvas.width / 2) - (halfWidth);

        var tilePositionY = (row + col) * (halfHeight);

        this.context.drawImage(this.tile, Math.round(tilePositionX), Math.round(tilePositionY), this.tile.width, this.tile.height);
      }
    }
  };

  return App;
})();

window.onload = function() {
  var game = new App({
    canvas: document.getElementById('world')
  });
};


