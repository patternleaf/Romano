/**
 * Surface.js. Part of the Romano Javascript Game Engine
 *
 * Copyright (c) 2010 Eric Miller/Immortal Cookie Software
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
;(function($) {
	/**
	 * Abstract class.
	 */
	Romano.Surface = Romano.RObject.extend({
		init: function() {
			this.loadedSymbols = {};
			this.loadingSymbolCallbacks = {};
			this.sourceCopies = {};
			this.viewport = null;
		},
		setup: function(viewport, width /* [optional] */, height /* [optional] */) {
			throw new Romano.Exception('Surface::setup must be implemented by a subclass.');
		},
		setSize: function(width, height) {
			throw new Romano.Exception('Surface::setSize must be implemented by a subclass.');
		},

		loadSymbol: function(source, readyCallback, copySymbol /* = false */) {
		},
		handleBeginFrame: function() {
			
		},
		handleEndFrame: function() {
		},
		registerSprite: function() {	
		},
		handleSpritePreFrame: function(sprite) {
		},
		handleSpritePostFrame: function(sprite) {
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
		}

	}, 'Romano.Surface');
})(jQuery);