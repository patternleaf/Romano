(function($) {
	Romano.WrappedSpace = Romano.RObject.extend({
		init: function(dimensions, viewport, viewportOrigin) {
			this.dimensions = dimensions;
			this.width = dimensions.width;
			this.height = dimensions.height;
			this.viewport = viewport;
			this.viewportOrigin = viewportOrigin;
		
			this.scales = {
				'default': 1,
				'fifth': .2,
				'half': .5
			};
		
			this.wrappables = {};
		},
		addWrappable: function(wrappable) {
			this.wrappables[wrappable.getID()] = wrappable;
		},
		setScaleKey: function(keyName, scale) {
			this.scales[keyName] = scale;
		},
		getPosition: function(id, scaleKey) {
			var p = this.wrappables[id].getPosition();
			return { x: p.x * this.scales[scaleKey || 'default'], y: p.y * this.scales[scaleKey || 'default'] };
		},
		updatePosition: function(id, position) {
			
		},
		getWrappables: function() {
			return this.wrappables;
		}
	}, 'Romano.WrappedSpace');
})(jQuery);

