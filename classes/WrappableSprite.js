(function($) {
	/**
	 * 1. Broadcasts changes in position to a wrapped space.
	 * 2. Wraps its position around the edges of a wrapped space
	 */
	Romano.WrappableSprite = Romano.Sprite.extend({
		init: function(id, viewport, renderer, initialState) {
			this.wrappedSpace = Romano.app.wrappedSpace;	// assumption
			this._super(id, viewport, renderer, initialState);
			this.wrappedSpace.addWrappable(this);
			$(this).bind('positionChanged', this.handlePositionChanged);
		},
		handlePositionChanged: function() {
			var p = this.getPosition();
			var trigger = false;
			// @todo: trigger events and/or show/hide when outside of viewport bounds

			//this.wrappedSpace.updatePosition(this.getID(), p);
			if (p.x < 0) {
				this.setPosition(this.wrappedSpace.width, p.y);
				p = this.getPosition();
				trigger = true;
			}
			if (p.y < 0) {
				this.setPosition(p.x, this.wrappedSpace.height);
				p = this.getPosition();
				trigger = true;
			}
			if (p.x > this.wrappedSpace.width) {
				this.setPosition(0, p.y);
				p = this.getPosition();
				trigger = true;
			}
			if (p.y > this.wrappedSpace.height) {
				this.setPosition(p.x, 0);
				trigger = true;
			}

			if (trigger) {
				$(this).trigger('wrapped');
			}
		},
		getIcon: function(initialViewportPosition) {
			return null;
		}
	}, 'Romano.WrappableSprite');
	
})(jQuery);

