/**
 * Billboard.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

(function($) {
	/**
	 * 
	 */
	Romano.Billboard = Romano.Sprite.extend({
		init: function(id, viewport, renderer, initialState) {
		    this._super(
				id, 
				viewport, 
				renderer,
				$.extend(defaultState, (initialState || {}))
			);
		},
	}, 'Romano.Billboard');
	
})(jQuery);

