(function($) {
	CheeseQuest.Star = Romano.Sprite.extend({
		init: function(id, viewport, initialState) {
	//console.dir(initialState);
			var defaultState = {
				position: { x: 0, y: 0 },
				accel:{ x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				friction: .4,
				damping: .3,
				maxAcceleration: 4,
				rotationFriction: .9
			};

			this._super(id, viewport, $.extend(defaultState, (initialState || {})))

			this.distance = 0;//Math.random();

			var p = this.getViewportPosition();
			this.initialDiameter = Math.max(1, Math.random() * 3);
			this.ellipse = this.paper.ellipse(0, 0, this.initialDiameter, this.initialDiameter);
			this.ellipse.attr({ 'fill': '#fff', 'stroke-width': 0 });

			setTimeout((function() {
				this.ellipse.attr({
					fill: 'hsb(' + Math.random() + ', ' + Math.min(Math.random(), .7) + ', ' + Math.max(Math.random(), .8) + ')'
				});
				setTimeout(arguments.callee._plBind(this), Math.random() * 3000)
			})._plBind(this), Math.random() * 3000);

			this.group.node.appendChild(this.ellipse.node);
			this.ellipse.toBack();
			this.updateTransform(true);

			$(this).bind('leftViewport', function(event, side) {
				var vp = this.getViewportPosition();
				var randomize = false;
				this.leftViewport = true;
				if (side == 'left' || side == 'right' && (Math.abs(this._viewportPosition.x - this.last._viewportPosition.x) > 20)) {
					randomize = true;
				}
				else if (side == 'top' || side == 'left' && (Math.abs(this._viewportPosition.y - this.last._viewportPosition.y) > 20)) {
					randomize = true;
				}

				this.distance = 0;

				if (randomize) {
					this.setViewportPosition(Math.random() * this.viewport.width, Math.random() * this.viewport.height);
				}
				else {
					switch (side) {
						case 'left':
							this.setViewportPosition(this.viewport.width - 1, Math.random() * this.viewport.height);
						break;
						case 'top':
							this.setViewportPosition(Math.random() * this.viewport.width, this.viewport.height - 1);
						break;
						case 'right':
							this.setViewportPosition(1, Math.random() * this.viewport.height);
						break;
						case 'bottom':
							this.setViewportPosition(Math.random() * this.viewport.width, 1);
						break;
					}
				}

				this.updateTransform(true);
				this.distance = 0;//Math.random();
			});
			$(this).bind('endFrame', this.handleEndFrame._plBind(this));
		},
		handleEndFrame: function() {
			var d = Romano.subtractVectors(this.getViewportPosition(), this.getLastViewportPosition());
			var am = Romano.getAngleAndMagnitudeFromVector(d);
			if (!this.leftViewport) {
				this.setRotation(am.angle);
				this.ellipse.attr({
					rx: Math.max(am.magnitude / 5, 1) * this.initialDiameter,
					ry: this.initialDiameter / Math.max(am.magnitude / 5, 1)
				});
			}
			this.leftViewport = false;
		}
	}, 'CheeseQuest.Star');

})(jQuery);

