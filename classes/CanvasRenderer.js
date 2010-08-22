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
			
			this.canvasTransform = new Romano.Matrix();
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
		handleBeginFrame: function() {
		},
		handleEndFrame: function() {
			if (this.sprite.isEnabled()) {
				var surface = this.viewport.getSurface();
				var context = surface.getContext();
				surface.setTransform(this.canvasTransform);
				this.sprite.draw(context);
				this.drawDebugViz();
			}
		},
		handleParentTransformUpdated: function() {
			this.canvasTransform = this.getAncestralTransform();
		},
		handleTransformUpdated: function() {
			//surface.setTransform(this.sprite.getTransform());
			this.canvasTransform = this.getAncestralTransform();
		},
		drawDebugViz: function() {
			if (this.debug.bbox) {
				var context = this.viewport.getSurface().getContext();
				this.sprite.buildHitMask(context);
				context.fillStyle = 'rgba(200, 255, 200, .5)';
				context.fill();
			}
		},
		
		// pretty bad. we should just draw in depth-first order, but that's
		// not how the viewport works right now. :(
		getAncestralTransform: function() {
			var s = this.sprite;
			var p = null;
			var ancestry = [s];
			while (p = s.getParent()) {
				ancestry.push(p);
				s = p;
			}
			var transform = new Romano.Matrix();
			while (ancestry.length) {
				transform = transform.multiply(ancestry.pop().getTransform());
			}
			return transform;
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