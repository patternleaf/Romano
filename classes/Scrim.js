/**
 * Scrim.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

(function($) {
	Romano.Scrim = Romano.RObject.extend({
		init: function(viewport, image) {
			this.viewport = viewport;
			this.viewport.registerScrim(this);
			$(this.viewport).bind('cameraPositionChanged', this.handleCameraPositionChanged._plBind(this));
			if (image) {
				this.setImage(image);
			}
		},
		setSize: function(width, height) {
			if (typeof width == 'object') {
				this.size.width = width.width;
				this.size.height = width.height;
			}
			else {
				this.size.width = width;
				this.size.height = height;
			}
		},
		getSize: function() {
			return {
				width: this.width,
				height: this.height
			};
		},
		setTiling: function(tileX, tileY) {
			this.tiling.x = tileX;
			this.tiling.y = tileY;
		},
		getTiling: function() {
			return {
				x: this.tiling.x,
				y: this.tiling.y
			};
		},
		setDistance: function(distance) {
			this.distance = distance;
		},
		getDistance: function() {
			return this.distance;
		},
		setImage: function(image) {
			this.jqImage = $(image).css({ 
				display: 'block', 
				position: 'absolute', 
				left: $(window).width()
			});
			$('body').append(image);
			this.imageSize.width = this.jqImage.width();
			this.imageSize.height = this.jqImage.height();
			var viewportPosition = this.viewport.getPosition();
			this.jqImage.css('display', 'none');
			this.handleCameraPositionChanged(null, viewportPosition.x, viewportPosition.y);
		},
		getPosition: function() {
			return { x: this.position.x, y: this.position.y };
		},
		setPosition: function(x, y) {
			if (typeof x == 'object') {
				this.position.x = x.x;
				this.position.y = x.y;
			}
			else {
				this.position.x = x;
				this.position.y = y;
			}
		},
		draw: function() {
			if (this.jqImage) {
				var viewportSize = this.viewport.getSize();
				
				// @todo: tiling.
				
				app.viewport.surface.getContext().drawImage(
					this.jqImage.get(0),
					this.position.x + (this.cameraPosition.x / this.distance), 				// world x
					this.position.y + (this.cameraPosition.y / this.distance),				// world y
					Math.min(viewportSize.width, this.imageSize.width),				// source width 
					Math.min(viewportSize.height, this.imageSize.height),			// sourch height
					0, 0,															// dest position in canvas
					viewportSize.width, viewportSize.height							// dest dimensions in canvas
				);
				
			}
		},
		handleCameraPositionChanged: function(event, cameraX, cameraY) {
			this.cameraPosition.x = cameraX;
			this.cameraPosition.y = cameraY;
		},

		tiling: {
			x: false,
			y: false
		},
		viewport: null,
		position: {
			x: 0, 
			y: 0
		},
		size: {
			width: -1,
			height: -1
		},
		jqImage: null,
		imageSize: {
			width: 0,
			height: 0
		},
		cameraPosition: {
			x: 0,
			y: 0
		},
		distance: 1

	}, 'Romano.Scrim');
	
	Romano.Scrim.infinite = -1;
	
})(jQuery);

