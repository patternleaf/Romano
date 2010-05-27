;(function($) {
	CheeseQuest.Player = Romano.WrappableSprite.extend({
		init: function(viewport, initialState) {
			var defaultState = {
				position: { x: 0, y: 0 },
				accel:{ x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
				friction: .2,
				damping: .7,
				maxAcceleration: 10,
				scale: { x: .6, y: .6 },
				rotationDamping: .3,
				shouldCheckCollisions: true
			};
			this._super(
				'player', 
				viewport,
				new Romano.RaphaelRenderer(),
				$.extend(defaultState, (initialState || {}))
			);

			this.body = new Romano.Sprite('gir-body', viewport, new Romano.RaphaelRenderer(), {
				position: { x: -20, y: 0 }
			});
			this.body.getRenderer().setSource('resources/gir-body.svg');
			this.head = new Romano.Sprite('gir-head', viewport, new Romano.RaphaelRenderer(), {
				position: { x: -20, y: -60 },
				rotationCenter: { x: 25, y: 50 }
			});
			this.head.getRenderer().setSource('resources/gir-head.svg');
			this.leftJet = new Romano.Sprite('gir-left-jet', viewport, new Romano.RaphaelRenderer(), {
				position: { x: -20, y: 56 },
				rotationCenter: { x: 0, y: 0 }
			});
			this.leftJet.getRenderer().setSource('resources/flame-1.svg', function(sprite) {
				sprite.setRotationCenter(0, 0);
				sprite.setScale(1, 0);
			});

			this.rightJet = new Romano.Sprite('gir-right-jet', viewport, new Romano.RaphaelRenderer(), {
				position: { x: -2, y: 58 }, 
				rotationCenter: { x: 0, y: 0 }
			});
			this.rightJet.getRenderer().setSource('resources/flame-1.svg', function(sprite) {
				sprite.setRotationCenter(0, 0);
				sprite.setScale(1, 0);
			});

			this.addChild(this.leftJet);
			this.addChild(this.rightJet);
			this.addChild(this.body);
			this.addChild(this.head);

			this.head.setRotationCenter(25, 50);
			this.leftJet.setRotationCenter(0, 0);

			this.setRotation(0);
			this.cheesePouch = [];

			this.jetsOn = false;
			this.rotationAccel = 0;

			//this.debug = { bbox: true, position: true };

			$(this).bind('beginCollision', this.handleCollision._plBind(this));
			$(this).bind('endFrame', (function() {
				this.addAngularMomentum(Math.min(this.rotationAccel, 3));
			})._plBind(this));
		},
		
		beginFrame: function() {
			//this.surface.
			//console.dir(this.friction)
		},
		
		handleCollision: function(event, collidee) {
			console.log('player colliding with ' + collidee.id);
			if (collidee instanceof CheeseQuest.Cheese) {
				this.cheesePouch.push(collidee);
				$(this).trigger('pickedUpCheese');
				collidee.hide();
			}
		},

		turnJetsOn: function() {
			this.jetsOn = true;
			setTimeout((function() {
				if (this.jetsOn) {
					var f = arguments.callee;
					this.rightJet.setScale(1, Math.random());
					this.leftJet.setScale(1, Math.random());
					this.jetTimer = setTimeout(f._plBind(this), 50);
				}
			})._plBind(this), 50);
		},

		turnJetsOff: function() {
			this.jetsOn = false;
			this.rightJet.setScale(1, 0);
			this.leftJet.setScale(1, 0);
		},

		rotate: function(amt) {
			this.rotationAccel += amt;
			//this.head.addAngularMomentum(amt);
			//this.addAngularMomentum(amt);
		},

		getIcon: function(initialViewportPosition) {
			this.icon = new Romano.Sprite('gir-head-icon', this.getViewport(), new Romano.RaphaelRenderer(), {
				position: { x: initialViewportPosition.x, y: initialViewportPosition.y },
				scale: { x: .15, y: .15 },
				rotationCenter: { x: -6, y: -6 }
			});
			this.icon.getRenderer().setSource('resources/gir-head.svg', function(sprite) {
				sprite.setRotationCenter(-6, -6);
			});
			this.icon.setTrackedByCamera(false);
			//this.icon.debug.position = true;

			return this.icon;
		}

	}, 'CheeseQuest.Player');

})(jQuery);
