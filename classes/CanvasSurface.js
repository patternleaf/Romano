/**
 * CanvasSurface.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
;(function($) {
	/**
	 * 
	 */
	Romano.CanvasSurface = Romano.Surface.extend({
		setup: function(viewport, width, height) {
			var size = viewport.getSize();
			size.width = width || size.width;
			size.height = height || size.height;
			this.height = height;
			this.width = width;
			this.jqCanvas = $('<canvas width="' + size.width + '" height="' + size.height + '"></canvas>');
			this.container = viewport.getContainer();
			$(this.container).append(this.jqCanvas);
			this.jqCanvas.bind('mousedown', this.handleMouseDown._plBind(this));
			this.jqCanvas.bind('mouseup', this.handleMouseUp._plBind(this));
			this.jqCanvas.bind('mousemove', this.handleMouseMoved._plBind(this));
			this.context = this.jqCanvas.get(0).getContext('2d');
			this.viewport = viewport;
			this.mousePosition = { x: -1, y: -1 };
			this.hits = [];
			this.hoveredSprites = {};
		},
		handleMouseUp: function(event) {
			var hit = { 
				x: event.clientX - this.jqCanvas.offset().left,
				y: event.clientY - this.jqCanvas.offset().top
			};
			
			this.hits.push(hit);
			setTimeout((function() {
				this.hits.shift();
			})._plBind(this), 2000);
			
			this.currentMouseUp = event;
			
			/*
			var sprites = this.viewport.getSprites();
			var transform = null;
			var transformedHit = null;
			for (var i = 0; i < sprites.length; i++) {
				this.setTransform(sprites[i].getTransform());
				sprites[i].buildHitMask(this.context);
				this.resetTransform();
				if (this.context.isPointInPath(hit.x, hit.y)) {
					sprites[i].handleMouseUp();
				}
			}
			*/
		},
		handleMouseDown: function(event) {
			/*
			var hit = { 
				x: event.clientX - this.jqCanvas.offset().left,
				y: event.clientY - this.jqCanvas.offset().top
			};
			*/
			this.currentMouseDown = event;
			/*
			var sprites = this.viewport.getSprites();
			var transform = null;
			for (var i = 0; i < sprites.length; i++) {
				this.setTransform(sprites[i].getTransform());
				sprites[i].buildHitMask(this.context);
				this.resetTransform();
				if (this.context.isPointInPath(hit.x, hit.y)) {
					sprites[i].handleMouseDown();
				}
			}
			*/
		},
		resetTransform: function() {
			this.context.setTransform(1, 0, 0, 1, 0, 0);
		},
		setTransform: function(romanoMatrix) {
			this.context.setTransform(
				romanoMatrix._m.a,
				romanoMatrix._m.b,
				romanoMatrix._m.c,
				romanoMatrix._m.d,
				romanoMatrix._m.e,
				romanoMatrix._m.f
			);
		},
		getMouseOffsetForEvent: function(event) {
			return this.getMouseOffset({x: event.clientX, y: event.clientY });
		},
		getMouseOffset: function(point) {
			var offsetParent = this.jqCanvas.offsetParent();
			if (offsetParent && $(offsetParent).css('position') == 'fixed') {
				return {
					x: point.x + $(document).scrollLeft() - this.jqCanvas.offset().left,
					y: point.y + $(document).scrollTop() - this.jqCanvas.offset().top
				}
			}
			return {
				x: point.x - this.jqCanvas.offset().left,
				y: point.y - this.jqCanvas.offset().top
			};
		},
		handleMouseMoved: function(event) {
			this.mousePosition = this.getMouseOffsetForEvent(event);
		},
		handleSpritePreFrame: function(sprite) {
			var canvasOffset = this.jqCanvas.offset();
			this.setTransform(sprite.getRenderer().getAncestralTransform());
			sprite.buildHitMask(this.context);
			this.resetTransform();
			if (this.context.isPointInPath(this.mousePosition.x, this.mousePosition.y)) {
				if (!(sprite.id in this.hoveredSprites)) {
					this.hoveredSprites[sprite.id] = sprite;
					sprite.handleMouseOver();
				}
			}
			else if (sprite.id in this.hoveredSprites) {
				delete this.hoveredSprites[sprite.id];
				sprite.handleMouseOut();
			}
			if (this.currentMouseDown) {
				var down = this.getMouseOffsetForEvent(this.currentMouseDown);
				if (this.context.isPointInPath(down.x, down.y)) {
					sprite.handleMouseDown(this.currentMouseDown)
				}
			}
			if (this.currentMouseUp) {
				var up = this.getMouseOffsetForEvent(this.currentMouseUp);
				if (this.context.isPointInPath(up.x, up.y)) {
					sprite.handleMouseUp(this.currentMouseUp)
				}
			}
		},
		getMousePosition: function() {
			return this.mousePosition;
		},
		getContext: function() {
			return this.context;
		},
		getCanvasElement: function() {
			return this.jqCanvas.get(0);
		},
		setSize: function(width, height) {
			this.jqCanvas.attr({
				width: width,
				height: height
			});
			this.height = height;
			this.width = width;
		},
		handleBeginFrame: function() {
			this.resetTransform();
			this.context.clearRect(0, 0, this.width, this.height);
			this.context.beginPath();
			this.context.rect(0, 0, this.width, this.height);
			this.context.closePath();
			this.context.clip();
		},
		handleEndFrame: function() {
			
			this.currentMouseDown = null;
			this.currentMouseUp = null;
			
			this.resetTransform();
			this.context.fillStyle = 'rgba(200, 200, 255, .4)';

			for (var i = 0; i < this.hits.length; i++) {
				this.context.fillRect(this.hits[i].x - 5, this.hits[i].y - 5, 10, 10);
			}
		}
		
	}, 'Romano.CanvasSurface');
})(jQuery);
