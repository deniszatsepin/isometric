angular.module('Y2D')
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