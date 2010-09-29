;(function($) {
    Platformer.Runner = Romano.Sprite.extend({
		init: function() {
			this._super(
				Romano.ObjectGraph.generateGUID(),
                app.viewport,
				new Romano.CanvasRenderer()
			);
			$(app.viewport).bind('endFrame', this.handleEndFrame._plBind(this));
			this.currentFloor = 720;
		},
		
		handleEndFrame: function() {
			if (Math.ceil(this.position.y + 1) > this.currentFloor) {
				this.setPosition(this.position.x, this.currentFloor);
			}
			else {
				this.addAcceleration(0, 5);
			}
		},
		
		run: function() {
			this.runTimer = setInterval(this.handleRunTimeout._plBind(this), 80);
		},
		
		stop: function() {
			clearInterval(this.runTimer);
			//this.
		},
		
		setDirection: function(direction) {
			this.direction = direction
		},
		
		handleRunTimeout: function() {
			var v = {
				x: (this.direction == Platformer.Runner.direction.right ? 5 : -5 ),
				y: 0
			}
			this.addAcceleration(v);
			app.viewport.addAcceleration(v);
		},
		
		draw: function(context) {
			context.beginPath();
			context.rect(
				0, 0, 20, 20
			);
			context.closePath();
			context.fillStyle = 'rgba(128, 128, 0, 1)';
			context.fill();
		},
		
		buildHitMask: function(context) {
			context.beginPath();
			context.rect(
				0, 0, 50, 50
			);
			context.closePath();
		},
		
		jump: function() {
			this.addAcceleration({
				//x: (this.direction == Platformer.Runner.direction.right ? 2 : -2 ), 
				x: 0,
				y: -60
			});
		},
		
		duck: function() {
			
		},
		
		runTimer: null,
		direction: 0,
		currentFloor: 0
		
	}, 'Platformer.Runner');
	Platformer.Runner.direction = {
		left: 0,
		right: 1
	};
})(jQuery);