/**
 * Space.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

(function($) {
	Romano.Space = Romano.RObject.extend({
		init: function(dimensions, viewport, viewportOrigin) {;
			this.width = dimensions.width;
			this.height = dimensions.height;
			this.viewport = viewport;
			this.viewportOrigin = viewportOrigin;
		},
		getPosition: function(id, scaleKey) {
			var p = this.wrappables[id].getPosition();
			return { x: p.x * this.scales[scaleKey || 'default'], y: p.y * this.scales[scaleKey || 'default'] };
		},

		width: 20000,
		height: 20000

	}, 'Romano.Space');
})(jQuery);

