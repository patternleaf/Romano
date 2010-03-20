
/**
 * A sprite is implemented as a group. It can contain other sprites, or
 * just a <use> tag pointing to a symbol, or both.
 * 
 */
Romano.Sprite = Romano.RObject.extend({
	init: function(id, viewport, initialState) {

		this.id = id;

		// this.sources: list of source urls that we know about/are loaded
		this.sources = {};
		this.viewport = viewport;
		this.viewport.registerSprite(this);

		this.trackedByCamera = true;

		// this.paper: our Raphael instance
		this.paper = viewport.paper;

		// this.group: our group node
		this.group = viewport.makeGroup();
		this.group.setAttribute('id', this.getID());
		this.paper.canvas.appendChild(this.group);

		// this.jq: a jquery wrapper for our group node
		this.jq = $('#' + this.getID());

		// this.instance: the top-level "use" node in our group.
		this.instance = document.createElementNS(this.paper.svgns, 'use');
		this.group.appendChild(this.instance);

		// this.currentSource: points to our current symbol node.
		this.currentSource = null;

		this.forceUpdate = false;
		this.enabled = true;

		this.children = [];
		this.parent = null;

		this.currentCollisions = [];

		this.sourceWidth = 0;
		this.sourceHeight = 0;
		this.bounds = {
			rough: null,
			transformed: null
		};

		var initialSource = null;
		var copySymbol = false;
		if ('source' in initialState) {
			initialSource = initialState.source;
			delete initialState.source;				// don't extend into our own props below
		}
		if (('reuseSymbol' in initialState) && !(initialState.reuseSymbol)) {
			copySymbol = true;
			delete initialState.reuseSymbol;		// don't extend into our own props below
		}
		$.extend(this, {

			// in world/absolute, not in viewport
			position: { x: 0, y: 0 },
			acceleration: { x: 0, y: 0 },
			velocity: { x: 0, y: 0 },
			friction: .5,
			damping: .1,

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

		this.transform = viewport.paper.canvas.createSVGMatrix();

		$(this).bind('_frame', this._onFrame._plBind(this));
		$(this).bind('_beginCollision', (function(event, collidee) { $(this).trigger('beginCollision', [collidee]); })._plBind(this));
		$(this).bind('_endCollision', (function(event, collidee) { $(this).trigger('endCollision', [collidee]); })._plBind(this));

		if (initialSource) {
			this.setSource(initialSource, null, copySymbol);
		}

		this.debugviz = {};
		this.debug = { bbox: false, position: false };
	},
}, 'Romano.Sprite');

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


Romano.Sprite.prototype.remove = function() {
	this.group.remove();
	this.viewport.unregisterSprite(this);
	$(this).trigger('removed');
	return this;
};
Romano.Sprite.prototype.getID = function() {
	return this.id;
};
Romano.Sprite.prototype.setID = function(id) {
	this.id = id;
	this.group.setAttribute('id', id);
	return this;
};

Romano.Sprite.prototype.addChild = function(sprite) {
	if (this.children.indexOf(sprite) == -1) {
		this.group.appendChild(sprite.group);
		this.children.push(sprite);
		sprite.parent = this;
	}
	return this;
};

Romano.Sprite.prototype.removeChild = function(sprite) {
	var index = this.children.indexOf(sprite);
	var child = null;
	if (index >= 0) {
		this.group.removeChild(sprite.group);
		child = this.children.splice(index, 1);
	}
	return child;
};

/**
 * Returns an array with references to all child sprites.
 */
Romano.Sprite.prototype.getChildren = function() {
	var r = [];
	for (var i = 0; i < this.children.length; i++) {
		r.push(item);
	}
	return r;
};

Romano.Sprite.prototype.getParent = function() {
	return this.parent;
};

Romano.Sprite.prototype.getCurrentSymbol = function() {
	return this.currentSource;
};

Romano.Sprite.prototype.getInstanceNode = function() {
	return this.group;
};

Romano.Sprite.prototype.setTrackedByCamera = function(isTracked) {
	this.trackedByCamera = isTracked;
};

Romano.Sprite.prototype._onFrame = function() {

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
	$(this).trigger('frame');

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

};

Romano.Sprite.prototype.updateTransform = function(forceOnCall) {
	var update = false;

	var cameraChanged = (this.viewport.camera.position.x != this.viewport.camera.last.position.x || this.viewport.camera.position.y != this.viewport.camera.last.position.y);
	var positionChanged = (this.position.x != this.last.position.x || this.position.y != this.last.position.y);
	var scaleChanged = (this.scale.x != this.last.scale.x || this.scale.y != this.last.scale.y);
	var rotationChanged = (this.rotation != this.last.rotation);
	var rotationCenterChanged = (this.rotationCenter.x != this.last.rotationCenter.x || this.rotationCenter.y != this.last.rotationCenter.y);

	var update = cameraChanged || positionChanged || scaleChanged || rotationChanged || rotationCenterChanged;

	if (update || this.forceUpdate || forceOnCall) {
		
		var sanitizedDistance = Math.abs(this.distance) + 1;
		var scaleOffset = {
			x: (this.scale.x - 1) * (-this.rotationCenter.x),
			y: (this.scale.y - 1) * (-this.rotationCenter.y)
		};

		// start with identity 
		this.transform = this.paper.canvas.createSVGMatrix();

		// translate for camera if we're a top-level sprite
		if (!this.parent && this.trackedByCamera) {
			this.transform = this.transform.translate(
				-(this.viewport.camera.position.x / sanitizedDistance),
				-(this.viewport.camera.position.y / sanitizedDistance)
			);
		}

		// translate to position
		this.transform = this.transform.translate(
			this.position.x + scaleOffset.x,
			this.position.y + scaleOffset.y
		);
		
		// rotate around rotationCenter
		this.transform = this.transform.translate(
			(this.rotationCenter.x * this.scale.x),
			(this.rotationCenter.y * this.scale.y)
		);
		this.transform = this.transform.rotate(this.rotation);
		this.transform = this.transform.translate(
			-1 * (this.rotationCenter.x * this.scale.x),
			-1 * (this.rotationCenter.y * this.scale.y)
		);

		// scale
		this.transform = this.transform.scaleNonUniform(this.scale.x, this.scale.y);

		this.group.setAttribute('transform', 'matrix(' 
			+ this.transform.a + ' ' + this.transform.b + ' ' + this.transform.c + ' '
			+ this.transform.d + ' ' + this.transform.e + ' ' + this.transform.f + ')'
		);

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
		
		this.drawDebugViz();
	}
};

Romano.Sprite.prototype.checkViewportContainment = function(point) {
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
};

Romano.Sprite.prototype.preloadSources = function(sources, callback) {
	var checkedIn = {};
	$.each(sources, (function(i, url) {
		checkedIn[url] = false;
		this.viewport.loadSymbol(url, (function(boundURL) {
			return function() {
				checkedIn[boundURL] = true;
				var allIn = true;
				$.each(checkedIn, function(srcURL, value) {
					if (value == false) {
						allIn = false;
						return false;
					}
				});
				if (allIn) {
					callback();
				}
			};
		})(url));
	})._plBind(this));
	return this;
};
Romano.Sprite.prototype.setSource = function(source, callback, copySymbol /* = false */) {
	if (typeof source == 'string' && (source in this.sources)) {
		// we already know about this one. trigger the "object" response.
		source = this.sources[source];
	}
	if (typeof source == 'object') {
		
		this.instance.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + source.id);

		this.forceUpdate = true;
		this.currentSource = source;
		if (callback) {
			callback(this);
		}
	}
	else {
		// arg is a string path but this sprite hasn't seen it before.
		var f = arguments.callee._plBind(this);
		this.viewport.loadSymbol(source, (function(loadedSource) { 
			this.sources[source] = loadedSource;
			f(loadedSource, callback);	// re-call ourselves with the loaded source object
		})._plBind(this), copySymbol);
	}
	return this;
};

Romano.Sprite.prototype.enable = function() {
	this.enabled = true;
	this.group.style.display = 'block';
	return this;
};
Romano.Sprite.prototype.disable = function() {
	this.enabled = false;
	this.group.style.display = 'none';
	return this;
};
Romano.Sprite.prototype.hide = function() {
	this.group.style.display = 'none';
	return this;
};
Romano.Sprite.prototype.show = function() {
	this.group.style.display = 'block';
	return this;
};
Romano.Sprite.prototype.isVisible = function() {
	return this.group.style.display != 'none';
};
Romano.Sprite.prototype.getTransformedBBox = function() {
	if (!this.bounds.transformed) {
		this.calculateBBoxes();
	}
	return this.bounds.transformed;
};
Romano.Sprite.prototype.getRoughBBox = function() {
	if (!this.bounds.rough) {
		this.calculateBBoxes();
	}
	return this.bounds.rough;
};
Romano.Sprite.prototype.calculateBBoxes = function() {
	var officialBBox = null;
	try{
		officialBBox = this.group.getBBox();
	} catch(e) {
		officialBBox = null;
	}
	if (officialBBox) {
		var result = Romano.transformRect(officialBBox, this.transform);
		this.bounds.transformed = result.points;
		this.bounds.rough = result.bounding;
	}
};

Romano.Sprite.prototype.handleParentUpdatedTransform = function() {
	this.drawDebugViz();
};

Romano.Sprite.prototype.getCollisionInfo = function(otherSprite) {
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
};
Romano.Sprite.prototype.findCollisions = function() {
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
};
Romano.Sprite.prototype.getSourceHeight = function() {
	return this.sourceHeight;
};
Romano.Sprite.prototype.getSourceWidth = function() {
	return this.sourceWidth;
};
Romano.Sprite.prototype.getScaledHeight = function() {
	return this.sourceHeight * this.scale.y;
};
Romano.Sprite.prototype.getScaledWidth = function() {
	return this.sourceWidth * this.scale.x;
};
Romano.Sprite.prototype.addAcceleration = function(accel) {
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
};
Romano.Sprite.prototype.setAcceleration = function(accel) {
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
};
Romano.Sprite.prototype.getAcceleration = function() {
	return { x: this.acceleration.x, y: this.acceleration.y };
};
Romano.Sprite.prototype.setVelocity = function(vel) {
	if (arguments.length == 1) {
		this.velocity = { x: vel.x, y: vel.y };
	}
	else if (arguments.length == 2) {
		this.velocity = { x: arguments[0], y: arguments[1] };
	}
	return this;
};
Romano.Sprite.prototype.getVelocity = function() {
	return { x: this.velocity.x, y: this.velocity.y };
};
Romano.Sprite.prototype.setPosition = function(pos) {
	if (arguments.length == 1) {
		this.position = { x: arguments[0].x, y: arguments[0].y };
	}
	else if (arguments.length == 2) {
		this.position = { x: arguments[0], y: arguments[1] };
	}
	return this;
};
Romano.Sprite.prototype.getPosition = function() {
	return { x: this.position.x, y: this.position.y };
};

Romano.Sprite.prototype.setViewportPosition = function(pos) {
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
};

Romano.Sprite.prototype.getViewportPosition = function() {
	return { x: this._viewportPosition.x, y: this._viewportPosition.y };
};
Romano.Sprite.prototype.getLastViewportPosition = function() {
	return { x: this.last._viewportPosition.x, y: this.last._viewportPosition.y };
};

Romano.Sprite.prototype.setScale = function(scale) {
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
};
Romano.Sprite.prototype.getScale = function() {
	return { x: this.scale.x, y: this.scale.y };
};

Romano.Sprite.prototype.addAngularMomentum = function(degrees) {
	this.angularMomentum += degrees;
	return this;
};
Romano.Sprite.prototype.setAngularMomentum = function(degrees) {
	this.angularMomentum = degrees;
	return this;
};
Romano.Sprite.prototype.getAngularMomentum = function() {
	return this.angularMomentum;
};
Romano.Sprite.prototype.setAngularVelocity = function(degrees) {
	this.angularVelocity = degrees;
	return this;
};
Romano.Sprite.prototype.getAngularVelocity = function() {
	return this.angularVelocity;
};
/**
 * 
 */
Romano.Sprite.prototype.setRotation = function(degrees) {
	this.rotation = degrees;
	return this;
};
/**
 * @return Current rotation in degrees.
 */
Romano.Sprite.prototype.getRotation = function() {
	return this.rotation;
};
Romano.Sprite.prototype.setRotationCenter = function(cx, cy) {
	if (typeof cx == 'object') {
		this.rotationCenter = { x: cx.x, y: cx.y };
	}
	else {
		this.rotationCenter = { x: cx, y: cy };
	}
	return this;
};
Romano.Sprite.prototype.getRotationCenter = function(cx, cy) {
	return { x: this.rotationCenter.x, y: this.rotationCenter.y };
};

Romano.Sprite.prototype.drawDebugViz = function() {
	if (this.viewport.debug.bbox || this.debug.bbox) {
		//var viewportBounds = this.paper.canvas.getBoundingClientRect();
		//console.debug(viewportBounds.left, viewportBounds.top);
		var officialBBox = this.group.getBBox();

		if (officialBBox) {

			var transformedRect = Romano.transformRect(officialBBox, this.transform);

			if (this.debugviz._bbox) {
				this.debugviz._bbox.remove();
			}
			if (this.debugviz._tbox) {
				this.debugviz._tbox.remove();
			}
		
			this.debugviz._tbox = this.paper.path([
				'M', transformedRect.points.ul.x, transformedRect.points.ul.y,
				'L', transformedRect.points.ur.x, transformedRect.points.ur.y,
				'L', transformedRect.points.lr.x, transformedRect.points.lr.y,
				'L', transformedRect.points.ll.x, transformedRect.points.ll.y
			].join(' '));
			this.debugviz._tbox.attr({'stroke': 'red'}).toFront();

			this.debugviz._bbox = this.paper.rect(
				transformedRect.bounding.x, 
				transformedRect.bounding.y, 
				transformedRect.bounding.width, 
				transformedRect.bounding.height).attr('stroke', 'green'
			).toFront();
		}
	}
	if (this.viewport.debug.position || this.debug.position) {
		if (this.debugviz._position) {
			for (var p in this.debugviz._position) {
				this.debugviz._position[p].remove();
			}
		}
		if (this.debugviz._rotationCenter) {
			for (var p in this.debugviz._rotationCenter) {
				this.debugviz._rotationCenter[p].remove();
			}
		}
		var v = Romano.makeVector(this.getRotation(), 20);
		var pos = this.getViewportPosition();
		this.debugviz._position = { 
			pos: this.paper.circle(pos.x, pos.y, 2),
			rotationCenter: this.paper.circle(pos.x + this.rotationCenter.x, pos.y + this.rotationCenter.y, 2),
			rotationVector: this.paper.path('M ' + pos.x + ' ' + pos.y +  ' L ' + (pos.x + v.x) + ' ' + (pos.y + v.y))
		};
		this.debugviz._position.pos.attr({ fill: 'red', stroke: 'white' });
		this.debugviz._position.rotationCenter.attr({ fill: 'black', stroke: 'green', 'stroke-dasharray': '.' });
		this.debugviz._position.rotationVector.attr({
			fill: 'red',
			stroke: '#fff',
			'stroke-width': 3
		});
	}
};