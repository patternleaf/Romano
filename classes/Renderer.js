/**
 * Renderer.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
(function($) {
	/**
	 * 
	 */
	Romano.Renderer = Romano.RObject.extend({
		init: function() {
		},
		setContainer: function(container) {
			this.container = container;
		},
		setup: function(sprite, viewport) {
			this.sprite = sprite;
			this.viewport = viewport;
			this.surface = viewport.getSurface();
		},
		getSprite: function() {
			return this.sprite;
		},
		getViewport: function() {
			return this.viewport;
		},
		getSurface: function() {
			return this.surface;
		},
		handleTransformUpdated: function() {
		},
		getBBox: function() {
			throw new RomanoException('Method must be implemented.');
		},
		handleEnabled: function() {
			throw new RomanoException('Method must be implemented.');
		},
		handleDisabled: function() {
			throw new RomanoException('Method must be implemented.');
		},
		show: function() {
			throw new RomanoException('Method must be implemented.');
		},
		hide: function() {
			throw new RomanoException('Method must be implemented.');
		},
		isVisible: function() {
			throw new RomanoException('Method must be implemented.');
		},
		handleBeginFrame: function() {
		},
		handleEndFrame: function() {
		},
		handleParentTransformUpdated: function() {
		},
		toBack: function() {	
		},
		
		container: null,
		sprite: null,
		viewport: null,
		surface: null
	}, 'Romano.Renderer');
})(jQuery);