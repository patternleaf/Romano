/**
 * CanvasRenderer.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

;(function($){
	Romano.CanvasRenderer = Romano.Renderer.extend({
		init: function() {

			this.debugviz = {};
			this.debug = {
				bbox: false,
				position: false
			};
		},
		
		setup: function(sprite, viewport) {
			this._super(sprite, viewport);
		},
		handleSpriteRemoved: function() {
		},
		setID: function(id) {
		},
		handleChildAdded: function(sprite) {
		},
		handleChildRemoved: function(sprite) {
		},
		handleTransformUpdated: function() {
			var surface = this.viewport.getSurface();
			var context = surface.getContext();
			surface.setTransform(this.sprite.getTransform());
			this.sprite.draw(context);
			this.drawDebugViz();
		},
		drawDebugViz: function() {
			if (this.debug.bbox) {
				var context = this.viewport.getSurface().getContext();
				this.sprite.buildHitMask(context);
				context.fillStyle = 'rgba(200, 255, 200, .5)';
				context.fill();
			}
		},
		getBBox: function() {
			
		},
		handleEnabled: function() {
		},
		handleDisabled: function() {
		},
		show: function() {
		},
		hide: function() {
		},
		isVisible: function() {
		}

	}, 'Romano.CanvasRenderer');
		
})(jQuery);