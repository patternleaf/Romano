;(function($) {
	CheeseQuest.Cheese = Romano.WrappableSprite.extend({
		init: function(id, viewport, initialState) {
			var defaultState = {
				position: { x: 0, y: 0 },
				accel:{ x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				friction: .57,
				damping: 1,
				maxAcceleration: 3,
				rotationFriction: .9,
				collidable: true
			};
			this._super(
				id, 
				viewport, 
				new Romano.RaphaelRenderer(),
				$.extend(defaultState, (initialState || {}))
			);
			this.renderer.setSource('resources/cheese.svg');
			this.setScale(.6);
			$(this).bind('endFrame', this.onEndFrame._plBind(this));

			$(this).bind('pickedUp', (function(event, player) {
				this.hide();
			})._plBind(this));
		},

		onEndFrame: function() {
			if (Math.random() > .99) {
				this.setAngularMomentum(Math.random() > .5 ? 5 + (Math.random() * 5) : -5 - (Math.random() * 5));
			}
		}

	}, 'CheeseQuest.Cheese');

})(jQuery);

