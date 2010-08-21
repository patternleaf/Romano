
/**
 */
Romano.Sprite = Romano.RObject.extend({
	init: function(id, viewport, renderer, initialState) {

		this.id = id;

		this.viewport = viewport;

		this.renderer = renderer;

		this.trackedByCamera = true;

		this.forceUpdate = false;
		this.enabled = true;

		this.children = [];
		this.parent = null;

		this.currentCollisions = [];

		this.bounds = {
			rough: null,
			transformed: null
		};

		this.transform = new Romano.Matrix();

		$.extend(this, {

			// in world/absolute, not in viewport
			position: { x: 0, y: 0 },
			acceleration: { x: 0, y: 0 },
			velocity: { x: 0, y: 0 },
			friction: .5,
			damping: .8,

			distance: 0,
			_viewportPosition: { x: 0, y: 0 },
			maxAcceleration: -1,

			angularMomentum: 0,
			angularVelocity: 0,
			rotation: 0,
			rotationCenter: { x: 0, y: 0 },
			rotationFriction: .6,
			rotationDamping: .1,

			scale: { x: 1, y: 1 },

			shouldCheckCollisions: false,
			collidable: false

		}, initialState);

		this.last = {
			scale: $.extend({}, this.scale),

			position: $.extend({}, this.position),
			velocity: $.extend({}, this.velocity),
			acceleration: $.extend({}, this.acceleration),

			distance: this.distance,
			_viewportPosition: $.extend({}, this._viewportPosition),

			rotation: this.rotation,
			angularVelocity: this.angularVelocity,
			angularMomentum: this.angularMomentum,
			rotationCenter: $.extend({}, this.rotationCenter),

			bounds: {
				rough: null,
				transformed: null
			}
		};

		$(this).bind('_frame', this._onFrame._plBind(this));
		$(this).bind('_beginCollision', (function(event, collidee) { $(this).trigger('beginCollision', [collidee]); })._plBind(this));
		$(this).bind('_endCollision', (function(event, collidee) { $(this).trigger('endCollision', [collidee]); })._plBind(this));

		this.debug = { bbox: false, position: false };
		
		this.viewport.registerSprite(this);

		this.renderer.setup(this, viewport);
	},
	
	getRenderer: function() {
		return this.renderer;
	},
	
	getViewport: function() {
		return this.viewport;
	},
	
	remove: function() {
		this.renderer.remove();
		this.viewport.unregisterSprite(this);
		$(this).trigger('removed');
		return this;
	},
	getID: function() {
		return this.id;
	},
	setID: function(id) {
		this.id = id;
		this.group.setAttribute('id', id);
		return this;
	},
	addChild: function(sprite) {
		if (this.children.indexOf(sprite) == -1) {
			this.children.push(sprite);
			sprite.parent = this;
			this.renderer.handleChildAdded(sprite);
		}
		return this;
	},

	removeChild: function(sprite) {
		var index = this.children.indexOf(sprite);
		var child = null;
		if (index >= 0) {
			child = this.children.splice(index, 1);
			this.renderer.handleChildRemoved(sprite);
		}
		return child;
	},

	/**
	 * Returns an array with references to all child sprites.
	 */
	getChildren: function() {
		var r = [];
		for (var i = 0; i < this.children.length; i++) {
			r.push(item);
		}
		return r;
	},

	getParent: function() {
		return this.parent;
	},


	setTrackedByCamera: function(isTracked) {
		this.trackedByCamera = isTracked;
	},

	_onFrame: function() {

		$(this).trigger('beginFrame');

		this.velocity.x += this.acceleration.x;
		this.velocity.y += this.acceleration.y;
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;

		this.angularVelocity += this.angularMomentum;
		this.rotation += this.angularVelocity;

		this.acceleration.x *= Math.abs(1 - this.damping);
		this.acceleration.y *= Math.abs(1 - this.damping);
		this.velocity.x *= Math.abs(1 - this.friction);
		this.velocity.y *= Math.abs(1 - this.friction);
		this.angularMomentum *= Math.abs(1 - this.rotationDamping);
		this.angularVelocity *= Math.abs(1 - this.rotationFriction);

		if (this.rotation < 0 && this.last.rotation >= 0) {
			this.rotation = 360 + this.rotation;
		}
		else if (this.rotation >= 360 && this.last.rotation < 360) {
			this.rotation = (this.rotation % 360);
		}

		this.updateTransform();

		this.checkViewportContainment();

		$(this).trigger('endFrame');
		//$(this).trigger('frame');

		this.last.bounds.rough = $.extend({}, this.last.bounds.rough);
		this.last.bounds.transformed = $.extend({}, this.last.bounds.transformed);
		this.bounds.rough = null;
		this.bounds.transformed = null;

		this.last.acceleration.x = this.acceleration.x;
		this.last.acceleration.y = this.acceleration.y;
		this.last.velocity.x = this.velocity.x;
		this.last.velocity.y = this.velocity.y;
		this.last.position.x = this.position.x;
		this.last.position.y = this.position.y;

		this.last.scale.x = this.scale.x;
		this.last.scale.y = this.scale.y;

		this.last._viewportPosition.x = this._viewportPosition.x;
		this.last._viewportPosition.y = this._viewportPosition.y;

		this.last.angularMomentum = this.angularMomentum;
		this.last.angularVelocity = this.angularVelocity;
		this.last.rotation = this.rotation;
		this.last.rotationCenter.x = this.rotationCenter.x;
		this.last.rotationCenter.y = this.rotationCenter.y;

	},

	updateTransform: function(forceOnCall) {
		var update = false;

		var cameraChanged = (this.viewport.camera.position.x != this.viewport.camera.last.position.x || this.viewport.camera.position.y != this.viewport.camera.last.position.y);
		var positionChanged = (this.position.x != this.last.position.x || this.position.y != this.last.position.y);
		var scaleChanged = (this.scale.x != this.last.scale.x || this.scale.y != this.last.scale.y);
		var rotationChanged = (this.rotation != this.last.rotation);
		var rotationCenterChanged = (this.rotationCenter.x != this.last.rotationCenter.x || this.rotationCenter.y != this.last.rotationCenter.y);

		var update = cameraChanged || positionChanged || scaleChanged || rotationChanged || rotationCenterChanged;

		if (update || this.forceUpdate || forceOnCall) {

			//var sanitizedDistance = Math.abs(this.distance) + 1;
			var sanitizedDistance = 1;
			var scaleOffset = {
				x: (this.scale.x - 1) * (-this.rotationCenter.x),
				y: (this.scale.y - 1) * (-this.rotationCenter.y)
			};

			// start with identity 
			this.transform.reset();

			// translate for camera if we're a top-level sprite
			if (!this.parent && this.trackedByCamera) {
				this.transform.translate(
					-(this.viewport.camera.position.x / sanitizedDistance),
					-(this.viewport.camera.position.y / sanitizedDistance)
				);
			}

			// translate to position
			this.transform.translate(
				this.position.x + scaleOffset.x,
				this.position.y + scaleOffset.y
			);

			// rotate around rotationCenter
			this.transform.translate(
				(this.rotationCenter.x * this.scale.x),
				(this.rotationCenter.y * this.scale.y)
			);
			this.transform.rotate(this.rotation);
			this.transform.translate(
				-1 * (this.rotationCenter.x * this.scale.x),
				-1 * (this.rotationCenter.y * this.scale.y)
			);

			// scale
			this.transform.scaleNonUniform(this.scale.x, this.scale.y);

			this.renderer.handleTransformUpdated();
			//this.handleTransformUpdated();

			this._viewportPosition = Romano.transformPoint({ x: 0, y: 0 }, this.transform);

			if (positionChanged || cameraChanged || this.forceUpdate || forceOnCall) {
				$(this).trigger('positionChanged');
			}
			if (rotationChanged || rotationCenterChanged || this.forceUpdate || forceOnCall) {
				$(this).trigger('rotationChanged');
			}
			if (scaleChanged || this.forceUpdate || forceOnCall) {
				$(this).trigger('scaleChanged');
			}

			$(this).trigger('transformChanged');

			for (var i = 0; i < this.children.length; i++) {
				this.children[i].handleParentUpdatedTransform();
			}

			this.forceUpdate = false;

		}
	},

	// handleTransformUpdated: function() {
	// },

	checkViewportContainment: function(point) {
		if (this._viewportPosition.x < 0 && this.last._viewportPosition.x >= 0) {
			$(this).trigger('leftViewport', 'left');
		}
		else if (this._viewportPosition.y < 0 && this.last._viewportPosition.y >= 0) {
			$(this).trigger('leftViewport', 'top');
		}
		else if (this._viewportPosition.x > this.viewport.width && this.last._viewportPosition.x <= this.viewport.width) {
			$(this).trigger('leftViewport', 'right');
		}
		else if (this._viewportPosition.y > this.viewport.height && this.last._viewportPosition.y <= this.viewport.height) {
			$(this).trigger('leftViewport', 'bottom');
		}
		else if (!this.viewport.contains(this._viewportPosition) && this.viewport.contains(this.last._viewportPosition)) {
			$(this).trigger('leftViewport', 'unknown');
		}

		if (this._viewportPosition.x >= 0 && this.last._viewportPosition.x < 0) {
			$(this).trigger('enteredViewport', 'left');
		}
		else if (this._viewportPosition.y >= 0 && this.last._viewportPosition.y < 0) {
			$(this).trigger('enteredViewport', 'top');
		}
		else if (this._viewportPosition.x <= this.viewport.width && this.last._viewportPosition.x > this.viewport.width) {
			$(this).trigger('enteredViewport', 'right');
		}
		else if (this._viewportPosition.y <= this.viewport.height && this.last._viewportPosition.y > this.viewport.height) {
			$(this).trigger('enteredViewport', 'bottom');
		}
		else if (this.viewport.contains(this._viewportPosition) && !this.viewport.contains(this.last._viewportPosition)) {
			$(this).trigger('enteredViewport', 'unknown');
		}
	},


	enable: function() {
		this.enabled = true;
		this.renderer.handleEnabled();
		return this;
	},
	disable: function() {
		this.enabled = false;
		this.renderer.handleDisabled();
		return this;
	},
	hide: function() {
		this.renderer.hide();
		return this;
	},
	show: function() {
		this.renderer.show();
		return this;
	},
	isVisible: function() {
		return this.renderer.isVisible();
	},
	getTransform: function() {
		return this.transform;
	},
	getTransformedBBox: function() {
		if (!this.bounds.transformed) {
			this.calculateBBoxes();
		}
		return this.bounds.transformed;
	},
	getRoughBBox: function() {
		if (!this.bounds.rough) {
			this.calculateBBoxes();
		}
		return this.bounds.rough;
	},
	calculateBBoxes: function() {
		var officialBBox = null;
		try {
			officialBBox = this.renderer.getBBox();
		} catch(e) {
			officialBBox = null;
		}
		if (officialBBox) {
			var result = Romano.transformRect(officialBBox, this.transform);
			this.bounds.transformed = result.points;
			this.bounds.rough = result.bounding;
		}
	},

	handleParentUpdatedTransform: function() {
		//this.drawDebugViz();
	},

	getCollisionInfo: function(otherSprite) {
		if (this.enabled && otherSprite.enabled) {
			var box1 = this.getRoughBBox();
			var box2 = otherSprite.getRoughBBox();
			if (box1 && box2) {
				var intersectionInfo = Romano.velocityBoxesIntersect(box1, this.velocity, box2, otherSprite.velocity);
				return intersectionInfo;
			}
		}
		return {
			isColliding: false,
			willCollide: false
		};
	},
	findCollisions: function() {
		var collisions = [];
		for (var spriteID in this.viewport.sprites) {
			var sprite = this.viewport.sprites[spriteID];
			if (sprite.collidable && !(this == sprite)) {
				var collisionInfo = this.getCollisionInfo(sprite);
				if (collisionInfo.isColliding || collisionInfo.willCollide) {
					collisions.push(sprite);
				}
			}
		}
		return collisions;
	},
	addAcceleration: function(accel) {
		if (arguments.length == 1) {
			this.acceleration.x += accel.x;
			this.acceleration.y += accel.y;
		}
		else if (arguments.length == 2) {
			this.acceleration.x += arguments[0];
			this.acceleration.y += arguments[1];
		}

		if (this.maxAcceleration > 0) {
			for (var d in this.acceleration) {
				if (this.acceleration[d] > 0) {
					this.acceleration[d] = Math.min(this.maxAcceleration, this.acceleration[d]);
				}
				else if (this.acceleration[d] < 0) {
					this.acceleration[d] = Math.max(-this.maxAcceleration, this.acceleration[d]);
				}
			}
		}

		return this;
	},
	setAcceleration: function(accel) {
		if (arguments.length == 1) {
			this.acceleration = { x: accel.x, y: accel.y };
		}
		else if (arguments.length == 2) {
			this.acceleration = { x: arguments[0], y: arguments[1] };
		}
		if (this.maxAcceleration > 0) {
			for (var d in this.acceleration) {
				if (this.acceleration[d] > 0) {
					this.acceleration[d] = Math.min(this.maxAcceleration, this.acceleration[d]);
				}
				else if (this.acceleration[d] < 0) {
					this.acceleration[d] = Math.max(-this.maxAcceleration, this.acceleration[d]);
				}
			}
		}
		return this;
	},
	getAcceleration: function() {
		return { x: this.acceleration.x, y: this.acceleration.y };
	},
	setVelocity: function(vel) {
		if (arguments.length == 1) {
			this.velocity = { x: vel.x, y: vel.y };
		}
		else if (arguments.length == 2) {
			this.velocity = { x: arguments[0], y: arguments[1] };
		}
		return this;
	},
	getVelocity: function() {
		return { x: this.velocity.x, y: this.velocity.y };
	},
	setPosition: function(pos) {
		if (arguments.length == 1) {
			this.position = { x: arguments[0].x, y: arguments[0].y };
		}
		else if (arguments.length == 2) {
			this.position = { x: arguments[0], y: arguments[1] };
		}
		return this;
	},
	getPosition: function() {
		return { x: this.position.x, y: this.position.y };
	},

	setViewportPosition: function(pos) {
		var offset = (!this.parent && this.trackedByCamera) ? { 
			x: this.viewport.camera.position.x, 
			y: this.viewport.camera.position.y } 
		: {
			x: 0, 
			y: 0
		};
		if (arguments.length == 1) {
			this.position = { 
				x: arguments[0].x + offset.x, 
				y: arguments[0].y + offset.y
			};
		}
		else if (arguments.length == 2) {
			this.position = { 
				x: arguments[0] + offset.x, 
				y: arguments[1] + offset.y 
			};
		}
		return this;
	},

	getViewportPosition: function() {
		return { x: this._viewportPosition.x, y: this._viewportPosition.y };
	},
	getLastViewportPosition: function() {
		return { x: this.last._viewportPosition.x, y: this.last._viewportPosition.y };
	},

	setScale: function(scale) {
		if (typeof scale == 'number') {
			if (arguments.length == 1) {
				this.scale = { x: scale, y: scale };
			}
			else if (arguments.length == 2) {
				this.scale = { x: arguments[0], y: arguments[1] };
			}
		}
		else if (typeof scale == 'object') {
			this.scale = { x: scale.x, y: scale.y };
		}
		return this;
	},
	getScale: function() {
		return { x: this.scale.x, y: this.scale.y };
	},

	addAngularMomentum: function(degrees) {
		this.angularMomentum += degrees;
		return this;
	},
	setAngularMomentum: function(degrees) {
		this.angularMomentum = degrees;
		return this;
	},
	getAngularMomentum: function() {
		return this.angularMomentum;
	},
	setAngularVelocity: function(degrees) {
		this.angularVelocity = degrees;
		return this;
	},
	getAngularVelocity: function() {
		return this.angularVelocity;
	},
	/**
	 * 
	 */
	setRotation: function(degrees) {
		this.rotation = degrees;
		return this;
	},
	/**
	 * @return Current rotation in degrees.
	 */
	getRotation: function() {
		return this.rotation;
	},
	setRotationCenter: function(cx, cy) {
		if (typeof cx == 'object') {
			this.rotationCenter = { x: cx.x, y: cx.y };
		}
		else {
			this.rotationCenter = { x: cx, y: cy };
		}
		return this;
	},
	getRotationCenter: function(cx, cy) {
		return { x: this.rotationCenter.x, y: this.rotationCenter.y };
	},

}, 'Romano.Sprite');
/*
// expose jquery handlers on our group element
$.each(['click', 'hover', 'mousemove', 'mouseover', 'mouseout'], function(i, fn) {
	Romano.Sprite.prototype[fn] = function() {
		// we want any passed functions to run in sprite scope, 
		// rather than the node's scope.
		var args = [].splice.call(arguments, 0);
		$.each(args, (function(i, argument) {
			if (typeof args[i] == 'function') {
				args[i] = args[i]._plBind(this);
			}
		})._plBind(this));
		return this.jq[fn].apply(this.jq, args);
	};
});
*/

// expose our own events via jquery-like methods
$.each(['beginFrame', 'endFrame', 'frame', 'beginCollision', 'endCollision', 'removed'], function(i, fn) {
	Romano.Sprite.prototype[fn] = function() {
		if (arguments.length == 0) {
			// this is ... bad. revisit.
			//$(this).trigger(fn);
		}
		else if (typeof arguments[0] == 'function') {
			$(this).bind(fn, (arguments[0])._plBind(this));
		}
		return this;
	};
});



