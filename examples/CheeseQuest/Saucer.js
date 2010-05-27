;(function($) {
	CheeseQuest.Saucer = Romano.WrappableSprite.extend({
		init: function(id, viewport, initialState) {
			var defaultState = {
				position: { x: 0, y: 0 },
				accel:{ x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				friction: .2,
				damping: .4,
				maxAcceleration: 5,
				rotationFriction: .9
			};
			this._super(
				id, 
				viewport, 
				new Romano.RaphaelRenderer(),
				$.extend(defaultState, (initialState || {}))
			);
			
			this.frame = 1;
			this.cycle = 0;
			this.maxFrame = 24;
			this.getRenderer().setSource('resources/rotating-spaceship/svg/' + this.frame + '.svg');
			this.setScale(.6);
			$(this).bind('endFrame', this.onEndFrame._plBind(this));
			$(this).bind('leftViewport', this.onLeftViewport._plBind(this));
			$(this).bind('enteredViewport', this.onEnteredViewport._plBind(this));

			$(this).bind('pickedUp', (function(event, karel) {
				this.hide();
			})._plBind(this));

			var sources = [];
			for (var i = 1; i <= 24; i++) {
				sources.push('resources/rotating-spaceship/svg/' + i + '.svg');
			}

			this.getRenderer().preloadSources(sources, (function() {
				for (var i = 1; i <= 24; i++) {
					this.getRenderer().setSource(sources[i - 1], (function() {
						var symbol = this.getRenderer().getCurrentSymbol();
						$('path', symbol.childNodes[0]).each(function() {
							var style = this.getAttribute('style');
							if (style.indexOf('fill: rgb(255, 255, 255);') > 0) {
								this.setAttribute('style', style.replace('fill: rgb(255, 255, 255);', 'opacity: 0;'));
							}
							else if (style.indexOf('fill:#FFFFFF;') > 0) {
								this.setAttribute('style', style.replace('fill:#FFFFFF;', 'opacity: 0;'));
							}
						});
					})._plBind(this));
				}
			})._plBind(this));
		},
		
		register: function(saucer) {
			CheeseQuest.Saucer.saucers.push(saucer);
		},
		unregister: function(saucer) {

		},
		onEndFrame: function() {
			if (this.onScreen) {
				this.getRenderer().setSource('resources/rotating-spaceship/svg/' + this.frame + '.svg');
				if (this.frame >= 24) {
					this.frame = 1;
				}
				else {
					this.frame++;
				}

			}

			if (Math.random() > .9) {
				this.addAcceleration(
					(Math.cos(this.cycle * Romano.degToRadFactor) * 10) + (Math.random() * 5 * (Math.random() > .5 ? -1 : 1)),
					(Math.sin(this.frame * Romano.degToRadFactor) * 10) + (Math.random() * 5 * (Math.random() > .5 ? -1 : 1))
				);
			}
			if (Math.random() > .4) {
				this.addAcceleration(

				);
			}
			this.cycle++;
			if (this.cycle > 360) {
				this.cycle = 0;
			}
		},
		onLeftViewport: function() {
			this.onScreen = false;
		},
		onEnteredViewport: function() {
			this.onScreen = true;
		}
	}, 'CheeseQuest.Saucer');
	CheeseQuest.Saucer.saucers = [];
})(jQuery);

