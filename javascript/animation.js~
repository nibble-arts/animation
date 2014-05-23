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

	newstage = new Animation.Stage(data.stage);

	newactor = new Animation.Actor(data.actor);
	newstage.addActor(newactor);

	newScene = new Animation.Sequence(data.sequence);
	newstage.addScene(newScene);

console.dir(newstage);

	newstage.run("intro");
};





//=====================================================================================
var Animation = (function () {

// private propertys
	var data;
	var stage = {};
	var layer = {};

//	var start = 0; // animation start frame
//	var end = 200; // animation end frame
//	var frame = 0; // animation position

	var currScene; // current sequence
	var status = "undef";
	var loopTime = 30; // step time in ms
	var loop = 1; // number of loops: 0 => loop forever
	var loopPos = 1; // number of loop


// global methods
	return {
		Load: function (path) {
			var data = {};
			status = "init";

			$.ajax(path, {
				dataType: "json",
				type: "GET",
			})
			.done(function (animJSON) {
				this.data = animJSON;
				status = "loaded";
			})
			.error(function (xhr,type) {
				console.log(xhr);
				console.log(type);
			});
		},


//================================================
// create stage objects
		Stage: function (data) {
			var cast = {};
			var sequence = {};
			var layer = {};


//************************************************************************
// create stage
			stage = new Kinetic.Stage({
				container: data.id,
				width: data.width,
				height: data.height,
			});

			return {
				cast: cast,
				sequence: scene,
				
				addActor: function (cast) {
					this.cast = cast;
				},

				addScene: function (scene) {
					this.sequence = scene;
				},
				
				getWidth: function () { return stage.getWidth(); },
				getHeight: function () { return stage.getHeight(); },

				run: function (sceneName) {
					this.sequence.scene[sceneName].run(this.cast);
				},

				stop: function () {
				}
			}
		},
		

//************************************************************************
// create actor
		Actor: function (data) {
			var actorCnt = data.length;
			var cast = {};

			$.each(data, function (idx) {
				var newactor = new Animation._Actor();

				var actorName = idx;
				var actorLayer = this.layer;
				var actorGroup = this.group;

				if (!this.geometry.type) {
					console.log("error - no geometry type defined"); 
				}

//Animation
// create kinetic object
				switch (this.geometry.type) {
					case "rect":
						newactor.obj = new Kinetic.Rect(this.geometry);
						break;

					case "circle":
						newactor.obj = new Kinetic.Circle(this.geometry);
						break;

					case "image":
						break;

					case "group":
						newactor.obj = new Kinetic.Group(this.geometry);
						break;

					case "text":
						newactor.obj = new Kinetic.Text(this.geometry);
						break;
				}

				newactor.layer = actorLayer;
				newactor.group = actorGroup;
				newactor.geometry = this.geometry;

// add actor to layer
				if (!layer[actorLayer]) {
					layer[actorLayer] = new Kinetic.Layer();
				}

				if (actorLayer) {
					layer[actorLayer].add(newactor.obj);
				}

// add actor to group
				if (actorGroup) {
					if (actor[actorGroup])
						newactor[actorGroup].obj.add(newactor.obj);
					else
						console.log("group don't exist");
				}

// add layer to stage
				stage.add(layer[actorLayer]);

				cast[actorName] = newactor;
			});


// global methods
			return {
				actor: cast,
				layer: layer,
				"length": actorCnt
			}
		},


		_Actor: function () {
			return {
				layer: {},
				
				getActor: function () { return this.actor; },
				getLayer: function () { return this.layer; },
			}
		},
	

//************************************************************************
// sequence constructor
		Sequence: function (data) {
			var sequence = {};
			$.each(data, function (i,v) {
				var newScene = new Animation._Scene();

				if (!v.frame) v.frame = v.start;
				newScene.timeline = v;

				sequence[v.name] = newScene;
			});

			return {
				scene: sequence
			}
		},


		_Scene: function (cast) {

			return {
				
				getSequence: function () { return scene; },

//================================================
// run animation
				run: function (cast) {

// set current sequence
					currScene = this;
					currScene.cast = cast;
					currScene.timeline.frame = currScene.timeline.start;

					status = "run";
					GUI.showStatus(currScene);
		
// start animation
					setTimeout(this.Step,loopTime);
				},

//================================================
// stop animation
				Stop: function () {
					status = "stop";
					GUI.showStatus(this);

//TODO jump to next animation
					currScene = {};
console.dir(this);
				},


//================================================
// next animation step
				Step: function () {
					var scene = currScene.timeline;
					var cast = currScene.cast;

					GUI.showFrame(scene);
//					GUI.showStatus(this);

//		GUI.showBar(frame / (end - start) * 100);

// execute keyframe
					$.each(scene.actor, function (i,v) {
// get actor data from definition
						if (v.keys) {
							var playObj = cast.actor[i].obj;
							var playLay = playObj.layer;
							var keys = v.keys;

// keys defined
							if (keys != undefined) {

// get last and next keyframe
								var keyVal = currScene.getKeyValues(keys,scene.frame);

// update actor attributes
								$.each (keyVal, function (ind,val) {
									playObj.setAttr(ind,val);
								});

								stage.draw();
							}
						}
					});


//*******************************
// set new animation position
					scene.frame++;
// loop
					if (scene.frame > scene.end) {

						if (!scene.loop || (loopPos < scene.loop)) {
							scene.frame = scene.start;
							loopPos++;

// restart loop
							setTimeout(currScene.Step, loopTime);
						}
						else {
							currScene.Stop();
						}
					}
// next frame
					else {
						setTimeout(currScene.Step, loopTime);
					}
				},


//================================================
				getKeyValues: function (keys,frame) {
					var sequObj = this;

					var keyArea = sequObj._getKeyArea(keys,frame);
					var keyVal = {};

// calculate current values at frame
					$.each(keyArea, function (ind,val) {

						if (val.start.time == "hold")
							val.start.time = currScene.timeline.start;

						if (val.end.time == "hold")
							val.end.time = currScene.timeline.end;

						if (val.end.time - val.start.time)
							var dt =  (frame - val.start.time) / (val.end.time - val.start.time);
						else
							var dt = 0;

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
							return obj;
					});

					next = $.grep(keys, function(obj) {
						if (frame < obj.time)
							return obj;
					});

//************************************
// loop all last keys backwards
					last.reverse();

					$.each(last, function () {
						keyTime = this.time;
			
	// loop parameters
						$.each (this, function (ind,val) {

		// save first instance of value in last
							if (!keyVal[ind] && !(ind == "time" || ind == "layer" || ind == "actor")) {
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
							if (!(ind == "time" || ind == "layer" || ind == "actor")) {

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
				}


			}
		},







//************************************************************************
// key object
		Keys: function (keyValues) {
			var keys = keyValues;

			return {
				keys: keyValues,
				
//================================================
				getKeyValues: function (keys,frame) {
					var sequObj = this;

					var keyArea = sequObj._getKeyArea(keys,frame);
					var keyVal = {};

// calculate current values at frame
					$.each(keyArea, function (ind,val) {
						if (val.start.time == "hold")
							val.start.time = start;

						if (val.end.time == "hold")
							val.end.time = end;

						if (val.end.time - val.start.time)
							var dt =  (frame - val.start.time) / (val.end.time - val.start.time);
						else
							var dt = 0;

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
							return obj;
					});

					next = $.grep(keys, function(obj) {
						if (frame < obj.time)
							return obj;
					});

//************************************
// loop all last keys backwards
					last.reverse();

					$.each(last, function () {
						keyTime = this.time;
			
	// loop parameters
						$.each (this, function (ind,val) {

		// save first instance of value in last
							if (!keyVal[ind] && !(ind == "time" || ind == "layer" || ind == "actor")) {
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
							if (!(ind == "time" || ind == "layer" || ind == "actor")) {

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
				}
			}
		}

	}
})();





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
			
		showFrame: function (e) {
			$("#"+this.frameId).text("Frame "+e.frame+" ("+e.start+"-"+e.end+")");
		},

		showStatus: function (id) {
			$("#"+this.statusId).text(status);
		}
	};

}();

