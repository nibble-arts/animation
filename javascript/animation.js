/*var stage;
var player = {};
var layer = {};
var timeline = {};

var start = 0; // animation start frame
var end = 200; // animation end frame
var frame = 0; // animation position
var status;
var loopTime = 10; // step time in ms
var loop = 1; // number of loops: 0 => loop forever
var loopPos = 1; // number of loop*/



//=====================================================================================
var Animation = (function () {

// private propertys
	var data;
	var stage = {};
	var player = {}
	var layer = {};
	var sequence = {};
	var timeline = {};

	var start = 0; // animation start frame
	var end = 200; // animation end frame
	var frame = 0; // animation position
	var status;
	var loopTime = 10; // step time in ms
	var loop = 1; // number of loops: 0 => loop forever
	var loopPos = 1; // number of loop


// global methods
	return {
		Load: function (path) {
			var data = {};
			var status = "init";

			$.ajax(path, {
				dataType: "json",
				type: "GET",
			})
			.done(function (animJSON) {
				this.data = animJSON;
				this.status = "loaded";
			})
			.error(function (xhr,type) {
				console.log(xhr);
				console.log(type);
			});

			return {
				status: function () {
					return this.status;
				}
			}
		},



//================================================
// create stage objects
		Stage: function (data) {

//************************************
// create stage
			stage = new Kinetic.Stage({
				container: data.id,
				width: data.width,
				height: data.height,
			});

			return {
				getWidth: function () { return stage.getWidth(); },
				getHeight: function () { return stage.getHeight(); }
			}
		},
		

//************************************
// create player
		Player: function (data) {
			var playerCnt = data.length;

			$.each(data, function () {
				var playerName = this.name;
				var playerLayer = this.layer;
				var playerGroup = this.group;

				player[playerName] = {};

				if (!this.geometry.type) {
					console.log("error - no geometry type defined"); 
				}

Animation
// create kinetic object
				switch (this.geometry.type) {
					case "rect":
						player[playerName].obj = new Kinetic.Rect(this.geometry);
						break;

					case "circle":
						player[playerName].obj = new Kinetic.Circle(this.geometry);
						break;

					case "image":
						break;

					case "group":
						player[playerName].obj = new Kinetic.Group(this.geometry);
						break;

					case "text":
						player[playerName].obj = new Kinetic.Text(this.geometry);
						break;
				}

				player[playerName].layer = playerLayer;
				player[playerName].group = playerGroup;
				player[playerName].geometry = this.geometry;

				if (!layer[playerLayer]) {
					layer[playerLayer] = new Kinetic.Layer();
				}

// add player to layer
				if (playerLayer) {
					layer[playerLayer].add(player[playerName].obj);
				}

// add player to group
				if (playerGroup) {
					if (player[playerGroup])
						player[playerGroup].obj.add(player[playerName].obj);
					else
						console.log("group don't exist");
				}

// add layer to stage
				stage.add(layer[playerLayer]);



//************************************
// create animation metadata
				if (this.keys != undefined) {
					player[playerName].keys = this.keys;

					$.each(this.keys, function () {
			// keytime dont exist
						if (!timeline[this.time]) {
							timeline[this.time] = new Array;
						}


			// insert player
						var player = this;
						player.player = playerName;
						player.layer = playerLayer;
					
						timeline[this.time].push(player);
					});
				}
			});


// global methods
			return {
				getPlayer: function (playerName) {

					if (playerName)
						return player[playerName] || {};
					else
						return player;
				},

				"length": playerCnt
			}
		},

		Keys: function () {
		},

		Sequence: function (data) {

			$.each(data, function () {
				sequence[this.name] = this;
			});

			return {
				getSequence: function () { return sequence; },

				run: function (sequName) {
					
console.log("run sequence "+sequName+" from "+sequence[sequName].start+" to "+sequence[sequName].end);
console.log("animating "+sequence[sequName].player.length+" player");
				}
			}
		}
	}
})();



//=====================================================================================
// load data file

function load(path) {
	$.ajax(path, {
		dataType: "json",
		type: "GET",
	})
	.done(function (data) {
		init(data.animation);
	})
	.error(function (xhr,type) {
		console.log(xhr);
		console.log(type);
	});
};


// init animation engine
function init(data) {
	stage = new Animation.Stage(data.stage);
	player = new Animation.Player(data.player);
	sequence = new Animation.Sequence(data.sequence);

	sequence.run("intro");
};









//=====================================================================================
//=====================================================================================



var Anima = function () {

return {
	animationPath: "animation/",
	animationExt: ".json",


//================================================
// load data file
	Load: function (animationName) {
		$.ajax(this.animationPath + animationName + this.animationExt, {
			dataType: "json",
			type: "GET",
		})
		.done(function (data) {
			Animation.Create(data.animation);
			Animation.Run(0,200);
		})
		.error(function (xhr,type) {
			console.log(xhr);
			console.log(type);
		});
	},



//================================================
// create stage objects
	Create: function (data) {

//************************************
// create stage
		stage = new Kinetic.Stage({
			container: data.stage.id,
			width: data.stage.width,
			height: data.stage.height,
			fill: "blue"
		});



//************************************
// create player
		$.each(data.player, function () {
			var playerName = this.name;
			var playerLayer = this.layer;
			var playerGroup = this.group;

			player[playerName] = {};

			if (!this.geometry.type) {
				console.log("error - no geometry type defined"); 
			}


//var a = new Anima.Player(this.geometry);
//console.log(a);



// create kinetic object
			switch (this.geometry.type) {
				case "rect":
					player[playerName].obj = new Kinetic.Rect(this.geometry);
					break;

				case "circle":
					player[playerName].obj = new Kinetic.Circle(this.geometry);
					break;

				case "image":
					break;

				case "group":
					player[playerName].obj = new Kinetic.Group(this.geometry);
					break;

				case "text":
					player[playerName].obj = new Kinetic.Text(this.geometry);
					break;
			}

			player[playerName].layer = playerLayer;
			player[playerName].group = playerGroup;
			player[playerName].geometry = this.geometry;

			if (!layer[playerLayer]) {
				layer[playerLayer] = new Kinetic.Layer();
			}

// add player to layer
			if (playerLayer) {
				layer[playerLayer].add(player[playerName].obj);
			}

// add player to group
			if (playerGroup) {
				if (player[playerGroup])
					player[playerGroup].obj.add(player[playerName].obj);
				else
					console.log("group don't exist");
			}

// add layer to stage
			stage.add(layer[playerLayer]);



//************************************
// create animation metadata
			if (this.keys != undefined) {
				player[playerName].keys = this.keys;

				$.each(this.keys, function () {
		// keytime dont exist
					if (!timeline[this.time]) {
						timeline[this.time] = new Array;
					}


		// insert player
					var player = this;
					player.player = playerName;
					player.layer = playerLayer;
					
					timeline[this.time].push(player);
				});
			}


//			if (player[playerName].keys)
//				var keyVal = Animation.getKeyValues(player[playerName].keys,8);

		});
	},




//================================================
//================================================
// run animation
	Run: function (startFrame,endFrame) {
		if (startFrame) start = startFrame;
		if (endFrame) end = endFrame;

		var frame = start;
		status = "run";
		GUI.showStatus();
		
	// start animation
		setTimeout(Animation.Step, loopTime);
	},


//================================================
// stop animation
	Stop: function () {
		status = "stop";
		GUI.showStatus();
		
//TODO jump to next animation
	},


//================================================
// next animation step
	Step: function () {

		GUI.showFrame();
		GUI.showStatus();

//		GUI.showBar(frame / (end - start) * 100);

// execute keyframe
			$.each(player, function () {
				var playObj = this.obj;
				var playLay = this.layer;
				var keys = this.keys;


// keys defined
				if (keys != undefined) {

// get last and next keyframe
					var keyVal = Animation.getKeyValues(keys,frame);

			// update player attributes
					$.each (keyVal, function (ind,val) {
						playObj.setAttr(ind,val);
					});

					stage.draw();
				}
			});



//*******************************
// set new animation position
		frame++;

// loop
		if (frame > end) {

			frame = start;
			if (!loop || (loopPos < loop)) {
				loopPos++;

// restart loop
				setTimeout(Animation.Step, loopTime);
			}
			else {
				Animation.Stop();
			}
		}
		else
			setTimeout(Animation.Step, loopTime);
	},


//================================================
	getKeyValues: function (keys,frame) {
		var keyArea = Animation._getKeyArea(keys,frame);
		var keyVal = {};
		
// calculate current values at frame
		$.each(keyArea, function (ind,val) {
			if (val.start.time == "hold")
				val.start.time = start;

			if (val.end.time == "hold")
				val.end.time = end;

			var dt =  (frame - val.start.time) / (val.end.time - val.start.time);
			var dv = parseFloat(val.start.val) + parseFloat((dt * (val.end.val - val.start.val)));
			
			keyVal[ind] = dv;
		});

		return keyVal;
	},


//================================================
// get key values
	_getKeyArea: function (keys,frame) {
		var last;
		var next;
		var keyVal = {};
		var keyTime;

		last = $.grep(keys, function(obj) {
			if (frame >= obj.time)
				return obj.time;
		});

		next = $.grep(keys, function(obj) {
			if (frame < obj.time)
				return obj.time;
		});

//************************************
// loop all last keys backwards
		last.reverse();

		$.each(last, function () {
			keyTime = this.time;
			
	// loop parameters
			$.each (this, function (ind,val) {

		// save first instance of value in last
				if (!keyVal[ind] && !(ind == "time" || ind == "layer" || ind == "player")) {
					keyVal[ind] = { start: { val: val, time: keyTime } };
				}
			});
		});


//************************************
// loop all next keys
		$.each(next, function () {
			keyTime = this.time;
			
	// loop parameters
			$.each (this, function (ind,val) {

		// save first instance of value in last
				if (!(ind == "time" || ind == "layer" || ind == "player")) {

					if (!keyVal[ind])
						keyVal[ind] = {};

					if (!keyVal[ind].end)
						keyVal[ind].end = { val: val, time: keyTime };
				}
			});
		});


//************************************
// set hold values
		$.each(keyVal, function () {

// hold before first keyframe
			if (!this.start)
				this.start = { val: this.end.val, time: "hold" };

// hold after last keyframe
			if (!this.end) {
				this.end = { val: this.start.val, time: "hold" };
			}
		});

		return (keyVal);
	},
};
}();


//================================================
//================================================
// control gui
var GUI = function () {
	
	return {
		frameId: "frame",
		statusId: "status",
		
		showBar: function (percentage) {
			$("#bar").progressbar({
				value: percentage
			});
		},
			
		showFrame: function () {
			$("#"+this.frameId).text("Frame "+frame+" ("+start+"-"+end+")");
		},

		showStatus: function (id) {
			$("#"+this.statusId).text(status);
		}
	};

}();




