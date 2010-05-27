(function($) {
	if (!Function.prototype._plBind) {
		Function.prototype._plBind = function(obj) {
			var f = this;
			return (function() {
				return f.apply(obj, arguments);
			});
		};
	}


	window.Romano = {};
	
	/**
	 * Classical OO inheritance-style extension code based on John Resig's
	 * inheritance technique:
	 * 
	 * http://ejohn.org/blog/simple-javascript-inheritance/
	 * 
	 * 
	 */
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	
	Romano.RObject = function() {};
	Romano.RObject.extend = function(definition, className) {
		var _super = this.prototype;
		
		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;
		
		// Copy the properties over onto the new prototype
		for (var name in definition) {
			// Check if we're overwriting an existing function
			if (typeof definition[name] == "function" && typeof _super[name] == "function" && fnTest.test(definition[name])) {
				prototype[name] = (function(name, fn) {
					return function() {
						var tmp = this._super;

						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];

						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						
						return ret;
					};
				})(name, definition[name]);
			}
			else {
				prototype[name] = definition[name];
			}
		};
				
		// The dummy class constructor
		function RObject() {
			if ( !initializing ) {
				if (arguments.length == 1 && arguments[0] == Romano.ObjectGraph._rehydrate_) {
					//
				}
				else {
					// regular construction of a new instance
					this._guid = Romano.ObjectGraph.generateGUID();
					this._className = className;
					// give ourselves private copies of declared arrays and objects
					for (var p in this) {
						if (typeof this[p] != 'function') {
							this[p] = Romano.ObjectGraph.clone(this[p]);
						} 
					}					
					if (this.init) {
						// All construction is actually done in the init method
						this.init.apply(this, arguments);
					}
				}
			}
		};
		
		// Populate our constructed prototype object
		RObject.prototype = prototype;
		
		// Enforce the constructor to be what we expect
		prototype.constructor = RObject;

		// And make this class extendable
		RObject.extend = arguments.callee;

		return RObject;
	};
	
	Romano.RObject.prototype.toString = function() {
		return this._className + '[' + this._guid + ']';
	};
	
	
	Romano.Persistable = Romano.RObject.extend({
		init: function() {
			if (Romano.app) {
				Romano.app.getActiveGraph().register(this._guid, this);
			}
		},
		_persistable: true
	}, 'Romano.Persistable');
	
	Romano.ObjectGraph = Romano.RObject.extend({
		init: function() {
			this.guid = Romano.ObjectGraph.generateGUID();
		},
		register: function(key, object) {
			this._objectRegistry[key] = object;
		},
		_objectRegistry: {}
	}, 'Romano.ObjectGraph');
	Romano.ObjectGraph._rehydrate_ = '__romano__rehydrate__flag__';
	Romano.ObjectGraph = function() {

	};
	Romano.ObjectGraph.objectCounter = 0;
	Romano.ObjectGraph.generateGUID = function() {
		return 'r_' + new Date().valueOf() + (Romano.ObjectGraph.objectCounter++).toString();
	};
	Romano.ObjectGraph.clone = function(arg) {
		if (arg && typeof arg == 'object') {
			if (arg instanceof Array) {
				var copy = [];
				for (var i = 0; i < arg.length; i++) {
					copy.push(Romano.ObjectGraph.clone(arg[i]));
				}
			}
			if (!copy) {
				var copy = {};
			}
			for (var p in arg) {
				copy[p] = Romano.ObjectGraph.clone(arg[p]);
			}
			if (typeof arg.prototype != 'undefined') {
				copy.prototype = arg.prototype;
			}
		}
		else {
			var copy = arg;
		}
		return copy;
	};
	Romano.ObjectGraph.reydrateObject = function(bareObject) {
		if ('_className' in bareObject) {
			var newObject = null;
			eval('newObject = new ' + bareObject._className + '(Romano.ObjectGraph._rehydrate_);');
			var obj = arguments[1];
			for (var p in bareObject) {
				newObject[p] = bareObject[p];
			}
		}
	};
	Romano.ObjectGraph.dehydrateObject = function(rObject) {
		
	};
	Romano.ObjectGraph.serialize = function(graph) {
		
	};
	Romano.ObjectGraph.unserialize = function(json) {
		
	};
	
	Romano.app = null;
	Romano.Application = Romano.RObject.extend({
		init: function() {
			this._activeGraph = new Romano.ObjectGraph();
			Romano.app = this;
		},
		getActiveGraph: function() {
			return this._activeGraph;
		},
		_activeGraph: null
	}, 'Romano.Application');
	
	
	Romano.Exception = function(message, detail, code) {
		this.message = message || '';
		this.detail = detail || '';
		this.code = code || 0;
		Error.apply(this, [message]);
	};
	Romano.Exception.prototype = new Error();
	
	Romano.Exception.extend = function(o) {
		// @todo. or just use RObject?
	};
	
	
	Romano.assert = function(test, message) {
		if (!test) {
			throw new Romano.Exception('Assertion Condition Failed', message);
		}
	};
	
	Romano._initSecretSVG = function() {
		if (!Romano._svg) {
			Romano._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			Romano._svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			Romano._svg.setAttribute('version', '1.1');
			Romano._svg.setAttribute('width', 0);
			Romano._svg.setAttribute('height', 0);
		}
	};
	
	Romano._svg = null;
	Romano.Matrix = function(a, b, c, d, e, f) {
		if (!Romano._svg) {
			Romano._initSecretSVG();
		}
		this._m = Romano._svg.createSVGMatrix();
		if (arguments.length == 1) {
			this._m = a;
		}
		else if (arguments.length) {
			this._m.a = a;
			this._m.b = b;
			this._m.c = c;
			this._m.d = d;
			this._m.e = e;
			this._m.f = f;
		}
	};
	Romano.Matrix.prototype.get = function(element) {
		return this._m[element];
	};
	Romano.Matrix.prototype.reset = function() {
		this._m = Romano._svg.createSVGMatrix();
	};
	Romano.Matrix.prototype.rotate = function(degrees) {
		this._m = this._m.rotate(degrees);
	};
	Romano.Matrix.prototype.translate = function(x, y) {
		this._m = this._m.translate(x, y);
	};
	Romano.Matrix.prototype.scale = function(s) {
		this._m = this._m.scale(s);
	};
	Romano.Matrix.prototype.scaleNonUniform = function(x, y) {
		this._m = this._m.scaleNonUniform(x, y);
	};
	Romano.Matrix.prototype.multiply = function(matrix) {
		this._m = this._m.multiply(matrix._m);
	};


	// if currently colliding
	// if collision between next frame boundaries (unimplemented)
	Romano.velocityBoxesIntersect = function(box1, v1, box2, v2) {
		var result = {
			isColliding: false,
			willCollide: false
		};
		//console.debug(box1, box2);
		result.isColliding = !(
			box2.x > (box1.x + box1.width) || 
			(box2.x + box2.width) < box1.x || 
			box2.y > (box1.y + box1.height) || 
			box2.y + box2.height < box1.y
		);

		return result;
	};
	
	Romano.addVectors = function(v1, v2) {
		return {
			x: v1.x + v2.x,
			y: v1.y + v2.y
		};
	};
	Romano.subtractVectors = function(v1, v2) {
		return {
			x: v1.x - v2.x,
			y: v1.y - v2.y
		};
	};
	Romano.normalizeVector = function(vector) {
		var l = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
		return { 
			x: vector.x / l, 
			y: vector.y / l 
		};
	};

	Romano.getVectorMagnitude = function(vector) {
		return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	};

	Romano.getDistance = function(p1, p2) {
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	Romano.degToRadFactor = (Math.PI / 180);
	Romano.radToDegFactor = (180 / Math.PI);
	
	/**
	 * @param float angle The angle of the vector, in degrees. 
	 */
	Romano.makeVector = function(angle, magnitude) {
		return {
			x: Math.cos(angle * Romano.degToRadFactor) * magnitude,
			y: Math.sin(angle * Romano.degToRadFactor) * magnitude
		};
	};

	Romano.getAngleAndMagnitudeFromVector = function(v) {
		if (v.x == 0 && v.y == 0) {
			return {
				angle: 0,
				magnitude: 0
			};
		}
		return {
			angle: Math.atan(v.y / v.x) * Romano.radToDegFactor,
			magnitude: Romano.getVectorMagnitude(v)
		};
	};

	/**
	 * Will be populated with SVGPoints when a viewport is registered.
	 */
	Romano._transformPoints = {
		ul: null,
		ur: null,
		ll: null,
		lr: null
	};
	Romano.viewports = [];
	Romano.registerViewport = function(viewport) {
		Romano.viewports.push(viewport);
		if (Romano.viewports.length == 1) {
			if (!Romano._svg) {
				Romano._initSecretSVG();
			}
			Romano._transformPoints = {
				ul: Romano._svg.createSVGPoint(),
				ur: Romano._svg.createSVGPoint(),
				ll: Romano._svg.createSVGPoint(),
				lr: Romano._svg.createSVGPoint()
			};
		}
	};
	
	Romano.transformPoint = function(point, romanoMatrix) {
		var p = Romano._transformPoints.ul;
		p.x = point.x;
		p.y = point.y;
		p = p.matrixTransform(romanoMatrix._m);
		return { x: p.x, y: p.y };
	};
	
	/**
	 * Returns a rect transformed by the passed matrix, both its
	 * individual points, and its bounding box.
	 */
	Romano.transformRect = function(svgRect, romanoMatrix) {
		if (!romanoMatrix || !svgRect) {
			return {
				bounding: {
					x: 0, y: 0, width: 0, height: 0
				},
				points: {
					ul: { x: 0, y: 0 },
					ur: { x: 0, y: 0 },
					ll: { x: 0, y: 0 },
					lr: { x: 0, y: 0 }
				}
			};
		}
		var ul = Romano._transformPoints.ul;
		var ur = Romano._transformPoints.ur;
		var ll = Romano._transformPoints.ll;
		var lr = Romano._transformPoints.lr;
		ul.x = svgRect.x;
		ul.y = svgRect.y;
		ur.x = svgRect.x + svgRect.width;
		ur.y = svgRect.y;
		ll.x = svgRect.x;
		ll.y = svgRect.y + svgRect.height;
		lr.x = svgRect.x + svgRect.width;
		lr.y = svgRect.y + svgRect.height;
		ul = ul.matrixTransform(romanoMatrix._m);
		ur = ur.matrixTransform(romanoMatrix._m);
		ll = ll.matrixTransform(romanoMatrix._m);
		lr = lr.matrixTransform(romanoMatrix._m);
//console.debug(romanoMatrix._m)
		var maxX = Math.max(ul.x, ur.x, ll.x, lr.x);
		var maxY = Math.max(ul.y, ur.y, ll.y, lr.y);
		var minX = Math.min(ul.x, ur.x, ll.x, lr.x);
		var minY = Math.min(ul.y, ur.y, ll.y, lr.y);
		return {
			bounding: {
				x: minX,
				y: minY,
				width: (maxX - minX),
				height: (maxY - minY)
			},
			points: {
				ul: ul,
				ur: ur,
				ll: ll,
				lr: lr
			}
		};
	};

})(jQuery);

