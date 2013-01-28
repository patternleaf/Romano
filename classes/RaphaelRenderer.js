/**
 * RaphaelRenderer.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
;(function($){
	Romano.RaphaelRenderer = Romano.Renderer.extend({
		init: function() {

			// this.sources: list of source urls that we know about/are loaded
			this.sources = {};

			this.sourceWidth = 0;
			this.sourceHeight = 0;

			// this.currentSource: points to our current symbol node.
			this.currentSource = null;

			this.debugviz = {};
			this.debug = {
				bbox: false,
				position: false
			};
		},
		
		setup: function(sprite, viewport) {
			this._super(sprite, viewport);
			
			// this.group: our group node
			this.group = this.surface.makeGroup();
			this.group.setAttribute('id', this.sprite.getID());
			this.surface.raphael.canvas.appendChild(this.group);
			this.jq = $('#' + this.sprite.getID());

			// this.instance: the top-level "use" node in our group.
			this.instance = document.createElementNS(this.surface.raphael.svgns, 'use');
			this.group.appendChild(this.instance);

		},

		toBack: function() {
			// sketchy.
			var firstChild = this.group.parentNode.firstChild;
			this.group.parentNode.insertBefore(this.group, firstChild);
		},

		// ?? 
		remove: function() {
			//console.log('remove');
			$(this.group).remove();
		},
		
		// handleSpriteRemoved: function() {
		// 	this.group.remove();
		// },
		
		setID: function(id) {
			this.group.setAttribute('id', id);
		},
		handleChildAdded: function(sprite) {
			this.group.appendChild(sprite.getRenderer().group);
		},
		handleChildRemoved: function(sprite) {
			this.group.removeChild(sprite.getRenderer().group);
		},
		getCurrentSymbol: function() {
			return this.currentSource;
		},
		getInstanceNode: function() {
			return this.group;
		},
		handleTransformUpdated: function() {
			this.group.setAttribute('transform', 'matrix(' 
				+ this.sprite.transform._m.a + ' ' + this.sprite.transform._m.b + ' ' + this.sprite.transform._m.c + ' '
				+ this.sprite.transform._m.d + ' ' + this.sprite.transform._m.e + ' ' + this.sprite.transform._m.f + ')'
			);
			this.drawDebugViz();
		},
		preloadSources: function(sources, callback) {
			var checkedIn = {};
			$.each(sources, (function(i, url) {
				checkedIn[url] = false;
				this.surface.loadSymbol(url, (function(boundURL) {
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
		},
		setSource: function(source, callback, copySymbol /* = false */) {
			if (typeof source == 'string' && (source in this.sources)) {
				// we already know about this one. trigger the "object" response.
				source = this.sources[source];
			}
			if (typeof source == 'object') {
				
				this.instance.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + source.id);

				this.forceUpdate = true;
				this.currentSource = source;
				if (callback) {
					callback(this.getSprite());
				}
			}
			else {
				// arg is a string path but this sprite hasn't seen it before.
				var f = arguments.callee._plBind(this);
				this.surface.loadSymbol(source, (function(loadedSource) { 
					this.sources[source] = loadedSource;
					f(loadedSource, callback);	// re-call ourselves with the loaded source object
				})._plBind(this), copySymbol);
			}
			return this;
		},
		handleEnabled: function() {
			this.group.style.display = 'block';
		},
		handleDisabled: function() {
			this.group.style.display = 'none';
		},
		hide: function() {
			this.group.style.display = 'none';
		},
		show: function() {
			this.group.style.display = 'block';
		},
		isVisible: function() {
			return this.group.style.display != 'none';
		},
		getBBox: function() {
			return this.group.getBBox();
		},
		drawDebugViz: function() {
			if (this.debug.bbox || this.sprite.debug.bbox) {
				//var viewportBounds = this.surface.raphael.canvas.getBoundingClientRect();
				//console.debug(viewportBounds.left, viewportBounds.top);
				var officialBBox = this.group.getBBox();

				if (officialBBox) {
//console.log(officialBBox)
					var transformedRect = Romano.transformRect(officialBBox, this.sprite.transform);

					if (this.debugviz._bbox) {
						this.debugviz._bbox.remove();
					}
					if (this.debugviz._tbox) {
						this.debugviz._tbox.remove();
					}

					this.debugviz._tbox = this.surface.raphael.path([
						'M', transformedRect.points.ul.x, transformedRect.points.ul.y,
						'L', transformedRect.points.ur.x, transformedRect.points.ur.y,
						'L', transformedRect.points.lr.x, transformedRect.points.lr.y,
						'L', transformedRect.points.ll.x, transformedRect.points.ll.y
					].join(' '));
					this.debugviz._tbox.attr({'stroke': 'red'}).toFront();

					this.debugviz._bbox = this.surface.raphael.rect(
						transformedRect.bounding.x, 
						transformedRect.bounding.y, 
						transformedRect.bounding.width, 
						transformedRect.bounding.height).attr('stroke', 'green'
					).toFront();
				}
			}
			if (this.debug.position || this.sprite.debug.position) {
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
				var v = Romano.makeVector(this.sprite.getRotation(), 20);
				var pos = this.sprite.getViewportPosition();
				var rCenter = this.sprite.getRotationCenter();
				this.debugviz._position = { 
					pos: this.surface.raphael.circle(pos.x, pos.y, 2),
					rotationCenter: this.surface.raphael.circle(pos.x + rCenter.x, pos.y + rCenter.y, 2),
					rotationVector: this.surface.raphael.path('M ' + pos.x + ' ' + pos.y +  ' L ' + (pos.x + v.x) + ' ' + (pos.y + v.y))
				};
				this.debugviz._position.pos.attr({ fill: 'red', stroke: 'white' });
				this.debugviz._position.rotationCenter.attr({ fill: 'black', stroke: 'green', 'stroke-dasharray': '.' });
				this.debugviz._position.rotationVector.attr({
					fill: 'red',
					stroke: '#fff',
					'stroke-width': 3
				});
			}
		},
		getSourceHeight: function() {
			return this.sourceHeight;
		},
		getSourceWidth: function() {
			return this.sourceWidth;
		},
		getScaledHeight: function() {
			return this.sourceHeight * this.scale.y;
		},
		getScaledWidth: function() {
			return this.sourceWidth * this.scale.x;
		}


	}, 'Romano.RaphaelRenderer');
	
	// expose jquery handlers on our group element
	$.each(['click', 'hover', 'mousemove', 'mouseover', 'mouseout'], function(i, fn) {
		Romano.RaphaelRenderer.prototype[fn] = function() {
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
	
})(jQuery);