/**
 * RaphaelSurface.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

;(function($) {
	/**
	 * 
	 */
	Romano.RaphaelSurface = Romano.Surface.extend({
		setup: function(viewport, width, height) {
			this.jqContainer = $(viewport.getContainer());
			this.viewport = viewport;
			this.raphael = Raphael(this.jqContainer.get(0), width, height);
			this.raphael.canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		},
		setSize: function(width, height) {
			this.raphael.setSize(width, height);
		},
		registerSprite: function(sprite) {
			//this._super(sprite);
			/* done by the renderer
			var group = this.makeGroup();
			group.setAttribute('id', sprite.getID());
			this.raphael.canvas.appendChild(group);
			var useInstance = document.createElementNS(this.raphael.canvas.svgns, 'use');
			group.appendChild(useInstance);
			*/
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
				var surface = this;

				jqiFrame.load(function() {
					var iframeDoc = jqiFrame.get(0).contentWindow || jqiFrame.get(0).contentDocument;
					if (iframeDoc.document) {
						iframeDoc = iframeDoc.document;
					}

					var graphics = $('svg', iframeDoc).clone();
					$.each(['id'], function(i, attr) { graphics.removeAttr(attr); });

					iframeDoc = null;
					jqiFrame.remove();
					jqiFrame = null;

					var defs = $('defs', surface.raphael.canvas).get(0);
					if (!defs) {
						defs = document.createElementNS(surface.raphael.svgns, 'defs');
					}
					var symbol = document.createElementNS(surface.raphael.svgns, 'symbol');

					symbol.setAttribute('id', symbolID);
					defs.appendChild(symbol);
					graphics.children().each(function() {
						symbol.appendChild(this);
					});
					surface.loadedSymbols[symbolID] = symbol;

					// all loaded. notify anyone waiting to hear about it.
					if (symbolID in surface.loadingSymbolCallbacks) {
						$.each(surface.loadingSymbolCallbacks[symbolID], function(i, callback) {
							callback(symbol);
						});
						delete surface.loadingSymbolCallbacks[symbolID];
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
		makeGroup: function() {
		    var el = document.createElementNS(this.raphael.svgns, "g");
		    if (this.raphael.canvas) {
		        this.raphael.canvas.appendChild(el);
		    }
			el.node = el;
			el.transformations = [];
			return el;
		}

	}, 'Romano.RaphaelSurface');
})(jQuery);
