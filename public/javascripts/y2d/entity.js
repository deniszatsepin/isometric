angular.module('Y2D')
    .factory('EntityFactory', function(PIXI, _) {
        function Entity() {
            PIXI.EventTarget.call( this );
            Entity.prototype.init.apply(this, arguments);
        }

        Entity.prototype.init = function(config) {
            config = config || {};
            var animations = this.animations = config.textures;
            var clip = this.clip = new PIXI.MovieClip(animations['idle'][4]);
            var pos = this.position = config.position;
            clip.position.x = pos.x;
            clip.position.y = pos.y;
            clip.anchor.x = 0.5;
            clip.anchor.y = 0.6;
            clip.animationSpeed = 0.2;
            clip.play();
        };

        function EntityFactory() {
            PIXI.EventTarget.call( this );
            EntityFactory.prototype.init.apply(this, arguments);
        }

        EntityFactory.prototype.init = function(config) {
            config = config || {};
            var activities = this.activities = config.animations || ['idle', 'run', 'attack'];
            var name = this.name = config.name;
            var textures = this.textures = {};

            //Initialize textures
            _.each(activities, function(activity) {
                textures[activity] = [];
                for (var i = 0; i < 8; i += 1) {
                    var currentAnimation = textures[activity][i] = [];
                    for (var j = 1; j < 9; j += 1) {
                        var texture = PIXI.Texture.fromFrame(name + '/' + activity + '/a' + i + '000' + j + '.png');
                        currentAnimation.push(texture);
                    }
                }
            });
        };

        EntityFactory.prototype.createEntity = function(x, y) {
            var entity = new Entity({
                animations: this.textures,
                position: Converter.tileToIso(x, y, 32)
            });
            return entity;
        };

        return EntityFactory;
    });
