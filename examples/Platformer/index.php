<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-type" content="text/html; charset=utf-8">
	<title>App Runner</title>
	<style type="text/css" media="screen">
		* {
			padding:0;
			margin:0;
			border:none;
		}
		body {
			background:#e9e9e9;
			color:#333;
		}
		canvas {
			position:relative;
		}
		#viewport-container {
			width:900px;
			height:500px;
			overflow:hidden;
		}
		#centered {
			margin:10px auto;
			width:900px;
		}
	</style>

</head>
<body>
	<!--
	<div id="debug">
	</div>
	-->
	<div id="centered">
		<div id="viewport-container">
		</div>
	</div>
	<script type="text/javascript" src="../../dependencies/jquery-1.4.2-mod.js"></script>
	<script type="text/javascript">
	/*
		(function ($) {
			$.event.special.load = {
				add: function (hollaback) {
					if ( this.nodeType === 1 && this.tagName.toLowerCase() === 'img' && this.src !== '' ) {
						// Image is already complete, fire the hollaback (fixes browser issues were cached
						// images isn't triggering the load event)
						if ( this.complete || this.readyState === 4 ) {
							hollaback.handler.apply(this);
						}

						// Check if data URI images is supported, fire 'error' event if not
						else if ( this.readyState === 'uninitialized' && this.src.indexOf('data:') === 0 ) {
							$(this).trigger('error');
						}

						else {
							$(this).bind('load', hollaback.handler);
						}
					}
				}
			};
		}(jQuery));
	*/
	</script>
	<script type="text/javascript" src="../../dependencies/raphael-1.3.2.js"></script>
	<script type="text/javascript" src="../../classes/Romano.js"></script>
	<script type="text/javascript" src="../../classes/Viewport.js"></script>
	<script type="text/javascript" src="../../classes/Sprite.js"></script>
	<script type="text/javascript" src="../../classes/Surface.js"></script>
	<script type="text/javascript" src="../../classes/Renderer.js"></script>
	<script type="text/javascript" src="../../classes/CanvasSurface.js"></script>
	<script type="text/javascript" src="../../classes/CanvasRenderer.js"></script>
	<script type="text/javascript" src="../../classes/Scrim.js"></script>


	<script type="text/javascript" charset="utf-8">
		window.Platformer = Romano.Application.extend({ }, 'Platformer');
		window.app = new Platformer();
	</script>

	<script type="text/javascript" src="classes/Runner.js"></script>

	<script type="text/javascript" charset="utf-8">
		/**
		* @author Juan Mendes, http://js-bits.blogspot.com/2010/07/canvas-rounded-corner-rectangles.html
		*/
		window.Platformer.roundedRect = function(ctx, x, y, width, height, radius, fill, stroke) {
			stroke = stroke === undefined ? true : false;
			radius = radius === undefined ? 5 : radius;
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + width - radius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			ctx.lineTo(x + width, y + height - radius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
			ctx.lineTo(x + radius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
			if (stroke) {
				ctx.stroke();
			}
			if (fill) {
				ctx.fill();
			}        
		}
	</script>
	
	<script type="text/javascript" charset="utf-8">
		(function($) {

			$(document).ready(function() {

				app.viewport = window.viewport = new Romano.Viewport(
					{
						width: 900,
						height: 500,
						frameRate: 60,
						camera: {
							maxAcceleration: 10,
							damping: .7,
							friction: .2
						}
					}, 
					$('#viewport-container'), 
					new Romano.CanvasSurface()
				);
				
				var jqImg2 = $('<img src="images/bg-2.png">');
				var scrim2 = new Romano.Scrim(app.viewport);
				jqImg2.load(function() {
					scrim2.setImage(jqImg2.get(0));
					scrim2.setDistance(2);
				});
				
				var jqImg1 = $('<img src="images/bg-1.png">');
				var scrim1 = new Romano.Scrim(app.viewport);
				jqImg1.load(function() {
					scrim1.setImage(jqImg1.get(0));
				});
				
				app.runner = new Platformer.Runner();
				app.runner.setViewportPosition(10, 720);
				app.viewport.setPosition(0, 300);
				
				app.viewport.setFriction(.2);
				app.runner.setFriction(.2);
				app.viewport.setDamping(.6);
				app.runner.setDamping(.6);
				
				app.keyRepeatMask = [];
				app.viewport.keydown(function(event) {
					if (app.keyRepeatMask.indexOf(event.which) == -1) {
						app.keyRepeatMask.push(event.which);
					}
					else {
						console.warn('Possibly lost a keyup event.');
					}
					switch (event.which) {
						case 38: // up arrow
							//if (app.keyRepeatMask.indexOf(event.which) == -1) {
								app.runner.jump();
							//}
						break;
						case 39: // right arrow
							app.runner.setDirection(Platformer.Runner.direction.right);
							app.runner.run();
							/*
							if (app.keyRepeatMask.indexOf(event.which) == -1) {
								app.runner.run();
							}
							else {
								app.runner.setDirection(Platformer.Runner.direction.right);
							}
							*/
						break;
						case 40: // down arrow
							if (app.keyRepeatMask.indexOf(event.which) == -1) {
								app.runner.duck();
							}
						break;
						case 37: // left arrow
							app.runner.setDirection(Platformer.Runner.direction.left);
							app.runner.run();
							/*
							if (app.keyRepeatMask.indexOf(event.which) == -1) {
								app.runner.run();
							}
							else {
								
							}
							*/

						break;
					}
					return false;
				});
				app.viewport.keyup(function(event) {
					var maskIndex = app.keyRepeatMask.indexOf(event.which);
					if (maskIndex == -1) {
						return;
					}
					app.keyRepeatMask.splice(maskIndex, 1);
					switch (event.which) {
						case 38: // up arrow
						break;
						case 39: // right arrow
							app.runner.stop();
						break;
						case 40: // down arrow
						break;
						case 37: // left arrow
							app.runner.stop();
						break;
					}
					return false;
				});
				
				app.move = function() {
					
				};
				
				app.startRunning = function() {
					$(app.viewport).bind('beginFrame', app.move);
				};
				
				app.stopRunning = function() {
					$(app.viewport).unbind('beginFrame', app.move);
				};
				
				app.viewport.run();
				app.viewport.focus();
			});
		})(jQuery);
	</script>
	
	
</body>
</html>