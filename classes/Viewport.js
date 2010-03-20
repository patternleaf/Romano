(function($) {
	/**
	 * 
	 */

	Romano.Viewport = Romano.RObject.extend({
		init: function(options, container) {
			if ('jquery' in container) {
				this.container = container.get(0);
			}
			else {
				this.container = container;
			}
			this.paper = Raphael(this.container, options.width, options.height);

			this.paper.canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

			this.width = options.width;
			this.height = options.height;

			this.camera = $.extend({
				position: { x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				acceleration: { x: 0, y: 0 },
				friction: .5,
				damping: .8,
				maxAcceleration: -1
			}, options.camera);

			this.camera.last = {
				position: $.extend({}, this.camera.position),
				velocity: $.extend({}, this.camera.velocity),
				acceleration: $.extend({}, this.camera.acceleration)
			};

			this.setSize = this.paper.setSize;
			this.frame = 0;
			this.frameRate = options.frameRate || 30;
			this.fps = 0;
			this.lastFrameTime = 0;
			this.running = options.running || true;
			this.sprites = {};
			this.sourceCopies = {};
			this.timer = null;
			this.loadedSymbols = {};
			this.loadingSymbolCallbacks = {};
			this.debug = { bbox: false, position: false };

			this.keyInput = $('<input type="text" style="position:absolute; left:-32000px; height:0px; width:0px" />');
			$(this.container).append(this.keyInput);
			this.keyInput.keydown((function(event) {
				this.handleKeyDown(event);
			})._plBind(this));
			this.keyInput.keyup((function(event) {
				this.handleKeyUp(event);
			})._plBind(this));

			$(this.container).click((function() {
				this.focus();
			})._plBind(this));

			this.offsets = {
				left: $(this.container).offset().left,
				top: $(this.container).offset().top
			};
			Romano.registerViewport(this);
		},

		run: function() {
			$(this).trigger('running');
			this.lastFrameTime = new Date().valueOf();
			this.timer = setTimeout((function() {
				this.fps = 1000 / (new Date().valueOf() - this.lastFrameTime);
				this.lastFrameTime = new Date().valueOf();
				$(this).trigger('beginFrame');

				this.camera.velocity.x += this.camera.acceleration.x;
				this.camera.velocity.y += this.camera.acceleration.y;
				this.camera.position.x += this.camera.velocity.x;
				this.camera.position.y += this.camera.velocity.y;

				this.camera.acceleration.x *= (1 - this.camera.damping);
				this.camera.acceleration.y *= (1 - this.camera.damping);
				this.camera.velocity.x *= (1 - this.camera.friction);
				this.camera.velocity.y *= (1 - this.camera.friction);

				if (this.camera.position.x != this.camera.last.position.x || this.camera.position.y != this.camera.last.position.y) {
					$(this).trigger('cameraPositionChanged');
				}

				for (var spriteID in this.sprites) {
					$(this.sprites[spriteID]).trigger('_frame');
				}
				for (var spriteID in this.sprites) {
					var sprite = this.sprites[spriteID];
					if (sprite.shouldCheckCollisions) {
						var collisions = sprite.findCollisions();
						// see if there are any new collisions this sprite doesn't already know about
						for (var i = 0; i < collisions.length; i++) {
							if (sprite.currentCollisions.indexOf(collisions[i]) == -1) {
								$(sprite).trigger('_beginCollision', [collisions[i]]);
							}
						}
						// see if any collisions are now gone
						for (var i = 0; i < sprite.currentCollisions.length; i++) {
							if (collisions.indexOf(sprite.currentCollisions[i]) == -1) {
								$(sprite).trigger('_endCollision', [sprite.currentCollisions[i]]);
							}
						}
						sprite.currentCollisions = collisions;
					}
				}

				if (this.running) {
					this.timer = setTimeout((arguments.callee)._plBind(this), Math.round(1000 / this.frameRate));
				}
				$(this).trigger('endFrame');

				this.camera.last.position.x = this.camera.position.x;
				this.camera.last.position.y = this.camera.position.y;
				this.camera.last.velocity.x = this.camera.velocity.x;
				this.camera.last.velocity.y = this.camera.velocity.y;
				this.camera.last.acceleration.x = this.camera.acceleration.x;
				this.camera.last.acceleration.y = this.camera.acceleration.y;

			})._plBind(this), Math.round(1000 / this.frameRate));
			this.running = true;
			return this;
		},

		addAcceleration: function(accel) {
			if (arguments.length == 1) {
				this.camera.acceleration.x += accel.x;
				this.camera.acceleration.y += accel.y;
			}
			else if (arguments.length == 2) {
				this.camera.acceleration.x += arguments[0];
				this.camera.acceleration.y += arguments[1];
			}
			if (this.camera.maxAcceleration > 0) {
				for (var d in this.camera.acceleration) {
					if (this.camera.acceleration[d] > 0) {
						this.camera.acceleration[d] = Math.min(this.camera.maxAcceleration, this.camera.acceleration[d]);
					}
					else if (this.camera.acceleration[d] < 0) {
						this.camera.acceleration[d] = Math.max(-this.camera.maxAcceleration, this.camera.acceleration[d]);
					}
				}
			}
			return this;
		},
		setAcceleration: function(accel) {
			if (arguments.length == 1) {
				this.camera.acceleration = { x: accel.x, y: accel.y };
			}
			else if (arguments.length == 2) {
				this.camera.acceleration = { x: arguments[0], y: arguments[1] };
			}
			if (this.camera.maxAccleration > 0) {
				for (var d in this.camera.acceleration) {
					if (this.camera.acceleration[d] > 0) {
						this.camera.acceleration[d] = Math.min(this.camera.maxAcceleration, this.camera.acceleration[d]);
					}
					else if (this.camera.acceleration[d] < 0) {
						this.camera.acceleration[d] = Math.max(-this.camera.maxAcceleration, this.camera.acceleration[d]);
					}
				}
			}
			return this;
		},
		getAcceleration: function() {
			return { x: this.camera.acceleration.x, y: this.camera.acceleration.y };
		},
		setVelocity: function(vel) {
			if (arguments.length == 1) {
				this.camera.velocity = { x: vel.x, y: vel.y };
			}
			else if (arguments.length == 2) {
				this.camera.velocity = { x: arguments[0], y: arguments[1] };
			}
			return this;
		},
		getVelocity: function() {
			return { x: this.camera.velocity.x, y: this.camera.velocity.y };
		},
		setPosition: function(pos) {
			if (arguments.length == 1) {
				this.camera.position = { x: arguments[0].x, y: arguments[0].y };
			}
			else if (arguments.length == 2) {
				this.camera.position = { x: arguments[0], y: arguments[1] };
			}
			return this;
		},
		getPosition: function() {
			return { x: this.camera.position.x, y: this.camera.position.y };
		},

		getFrameRate: function() {
			return this.frameRate;
		},

		getFPS: function() {
			return this.fps;
		},

		contains: function(point) {
			var left = this.camera.position.x;
			var right = this.camera.position.x + this.width;
			var top = this.camera.position.y;
			var bottom = this.camera.position.y + this.height;
			return (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom);
		},

		beginFrame: function() {
			if (arguments.length && typeof arguments[0] == 'function') {
				$(this).bind('beginFrame', arguments[0]);
			}
			return this;
		},

		endFrame: function() {
			if (arguments.length && typeof arguments[0] == 'function') {
				$(this).bind('endFrame', arguments[0]);
			}
			return this;
		},

		getSprites: function() {
			var result = [];
			for (var id in this.sprites) {
				result.push(this.sprites[id]);
			}
			return result;
		},

		pause: function() {
			clearTimeout(this.timer);
			this.running = false;
			$(this).trigger('paused');
			return this;
		},

		/**
		 * 
		 */
		makeNewSymbolID: function(name, copySymbol /* = false */) {
			if (!(name in this.sourceCopies)) {
				this.sourceCopies[name] = 0;
			}
			else if (copySymbol) {
				this.sourceCopies[name] += 1;
			}
			return 'symbol-' + name.replace(/\/|\./g, '-') + '-' + this.sourceCopies[name];
		},

		/**
		 * The viewport loads symbols into a <defs> container. A symbol may then be
		 * used by multiple sprites via a <use> tag.
		 */
		loadSymbol: function(source, readyCallback, copySymbol /* = false */) {

			var symbolID = this.makeNewSymbolID(source, copySymbol);
			if (symbolID in this.loadedSymbols) {
				// symbol already loaded
				setTimeout((function() {
					readyCallback(this.loadedSymbols[symbolID]);
				})._plBind(this), 1);
				return this;
			}
			else if (symbolID in this.loadingSymbolCallbacks) {
				// symbol still loading
				this.loadingSymbolCallbacks[symbolID].push(readyCallback);
				return this;
			}
			// otherwise, we haven't heard of this one before ...
			if (source.substr(-4).toLowerCase() == '.svg') {
				var jqiFrame = $('<iframe border="none" style="display:none;" />');
				var viewport = this;

				jqiFrame.load(function() {
					var iframeDoc = jqiFrame.get(0).contentWindow || jqiFrame.get(0).contentDocument;
					if (iframeDoc.document) {
						iframeDoc = iframeDoc.document;
					}

					var graphics = $('svg', iframeDoc).clone();
					$.each(['id', 'viewbox'], function(i, attr) { graphics.removeAttr(attr); });

					iframeDoc = null;
					jqiFrame.remove();
					jqiFrame = null;

					var defs = $('defs', viewport.paper.canvas).get(0);
					if (!defs) {
						defs = document.createElementNS(viewport.paper.svgns, 'defs');
					}
					var symbol = document.createElementNS(viewport.paper.svgns, 'symbol');
					symbol.setAttribute('id', symbolID);
					defs.appendChild(symbol);
					graphics.each(function() {
						symbol.appendChild(this);
					});
					viewport.loadedSymbols[symbolID] = symbol;

					// all loaded. notify anyone waiting to hear about it.
					if (symbolID in viewport.loadingSymbolCallbacks) {
						$.each(viewport.loadingSymbolCallbacks[symbolID], function(i, callback) {
							callback(symbol);
						});
						delete viewport.loadingSymbolCallbacks[symbolID];
					}

				});

				if (!(symbolID in this.loadingSymbolCallbacks)) {
					this.loadingSymbolCallbacks[symbolID] = [];
				}
				this.loadingSymbolCallbacks[symbolID].push(readyCallback);
				$('body').append(jqiFrame.attr('src', source));
			}
			else {
				// code to load images
			}

			return this;
		},

		getSymbol: function(source, callback) {
		},

		registerSprite: function(sprite) {
			var spriteID = sprite.getID();
			if (!(spriteID in this.sprites)) {
				this.sprites[spriteID] = sprite;
			}
		},

		unregisterSprite: function(sprite) {
			var spriteID = sprite.getID();
			if (spriteID in this.sprites) {
				delete this.sprites[spriteID];
			}
		},

		makeGroup: function() {
		    var el = document.createElementNS(this.paper.svgns, "g");
		    if (this.paper.canvas) {
		        this.paper.canvas.appendChild(el);
		    }
			el.node = el;
			el.transformations = [];
			return el;
		},

		keydown: function(f) {
			$(this).bind('_keydown', (function(jqEvent, keyEvent) {
				f.apply(this, [keyEvent]);
			})._plBind(this));
		},

		keyup: function(f) {
			$(this).bind('_keyup', (function(jqEvent, keyEvent) {
				f.apply(this, [keyEvent]);
			})._plBind(this));
		},

		handleKeyUp: function(event) {
			$(this).trigger('_keyup', event);
		},

		handleKeyDown: function(event) {
			$(this).trigger('_keydown', event);
		},

		focus: function() {
			this.keyInput.focus();
		},

		blur: function() {

		}

	}, 'Romano.Viewport');

})(jQuery);