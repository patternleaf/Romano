(function($) {
	Romano.WrappedHUD = Romano.RObject.extend({
		init: function(viewport, wrappedSpace, scale) {
			this.wrappedSpace = wrappedSpace;
			this.viewport = viewport;
			this.scale = scale; 

			wrappedSpace.setScaleKey('hud', scale);

			this.width = wrappedSpace.width * scale;
			this.height = wrappedSpace.height * scale;

			this.left = viewport.width - this.width - 10;
			this.top = 10;
			this.bg = this.viewport.paper.rect(this.left, this.top, this.width, this.height, 4);
			this.bg.attr({
				fill: '#fff',
				opacity: .3
			});

			this.objects = {};

			var vp = this.viewport.getPosition();
			this.viewportRect = this.viewport.paper.rect(
				this.left + (vp.x * scale), 
				this.top + (vp.y * scale),
				this.viewport.width * scale,
				this.viewport.height * scale
			)
			this.viewportRect.attr({
				stroke: '#ddd',
				'stoke-dasharray': '. '
			});
		},
		
		update: function() {
			var wrappables = this.wrappedSpace.getWrappables();
			var p = null;
			for (var id in wrappables) {
				p = this.wrappedSpace.getPosition(id, 'hud');
				if (id in this.objects) {
					if (this.objects[id] instanceof Romano.Sprite) {
						if (wrappables[id].isVisible()) {
							this.objects[id].show();
							this.objects[id].setViewportPosition(this.left + p.x, this.top + p.y);
						}
						else {
							this.objects[id].hide();
						}
					}
					else {
						var box = wrappables[id].getRoughBBox();
						if (box && wrappables[id].isVisible()) {
							this.objects[id].show();
							this.objects[id].attr({ cx: this.left + p.x, cy: this.top + p.y, r: box.width * this.scale });
						}
						else {
							this.objects[id].hide();
						}
					}
				}
				else {
					this.objects[id] = wrappables[id].getIcon({ x: this.left + p.x, y: this.top + p.y });
					if (!this.objects[id]) {
						this.objects[id] = this.viewport.paper.circle(this.left + p.x, this.top + p.y, 1);
						this.objects[id].attr({
							fill: '#999',
							'stroke-width': 0
						});
					}
				}
			}
			for (id in this.objects) {
				if (!(id in wrappables)) {
					delete this.objects[id];
				}
			}
			var vp = this.viewport.getPosition();
			this.viewportRect.attr({
				x: this.left + (vp.x * this.scale),
				y: this.top + (vp.y * this.scale),
				width: this.viewport.width * this.scale,
				height: this.viewport.height * this.scale,
			});
		}
	}, 'Romano.WrappedHUD');

})(jQuery);

