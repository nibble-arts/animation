///=====================================================================================
// load data file
var animationPath = "../animation/";
var imagePath = "../animation/images/";
var globalStage;


// definition in debugLevel for debug informations to show
// CREATE ... show creation information
// EVENT ... show event information
// RUN ... show runtime information
// ERROR ... show errors
// WARNING ... show warnings
var debug = true; // show/hide debug information on consol
//var debugLevel = new Array("CREATE","RUN","EVENT","ERROR","WARNING");
var debugLevel = new Array("RUN","EVENT","ERROR","WARNING");


//=====================================================================================
// load animation data
function load(path) {
	$.ajax(animationPath+path, {
		dataType: "json",
		type: "GET",
	})
	.done(function (data) {
		init(data.animation);
	})
	.error(function (xhr,type) {
		debug_msg(xhr,"ERROR");
		debug_msg(type,"ERROR");
	});
};




//=====================================================================================
// init animation engine
function init(data) {
	globalStage = new Animation.Stage(data.stage);

	newactor = new Animation.Actor(data.cast);
	globalStage.addActor(newactor);

	newScene = new Animation.Sequence(data.sequence);
	globalStage.addScene(newScene);

	debug_msg(globalStage,"CREATE");

	globalStage.run("main");
};





//=====================================================================================
//=====================================================================================
var Animation = (function () {

// private propertys
	var data;
	var stage = {};
	var layer = {};

//	var start = 0; // animation start frame
//	var end = 200; // animation end frame
//	var frame = 0; // animation position

	var currScene = {}; // current sequence
	currScene.status = "started";

	var timer;
	var loopTime = 20; // step time in ms
	var loop = 1; // number of loops: 0 => loop forever
	var loopPos = 1; // number of loop


// global methods
	return {
		Load: function (path) {
			var data = {};
			currScene.status = "init";

			$.ajax(path, {
				dataType: "json",
				type: "GET",
			})
			.done(function (animJSON) {
				this.data = animJSON;
				currScene.status = "loaded";
			})
			.error(function (xhr,type) {
				debug_msg(xhr,"ERROR");
				debug_msg(type,"ERROR");
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
					debug_msg("sequence ended","RUN");
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
					debug_msg("error - no geometry type defined","ERROR"); 
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
						var imageObj = new Image();
						imageObj.src = imagePath+this.geometry.src;
						this.geometry.image = imageObj;
						
						newactor.obj = new Kinetic.Image(this.geometry);
						break;

					case "group":
						newactor.obj = new Kinetic.Group(this.geometry);
						break;

					case "text":
						newactor.obj = new Kinetic.Text(this.geometry);
						break;
				}

				newactor.group = actorGroup;
				newactor.geometry = this.geometry;

//				newactor.layer = actorLayer;

// add actor to group
				if (actorGroup) {
					if (cast[actorGroup])
						cast[actorGroup].obj.add(newactor.obj);
					else
						debug_msg("group don't exist","WARNING");
				}

// add layer to stage
//				stage.add(layer[actorLayer]);

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
					var event;
					var timeline = this.timeline;


// init actors
					$.each(cast.actor, function (idx,val) {

// check if used and not in a group
// hide unused actors
						if (!timeline.cast[idx] && timeline.cast[this.group] == undefined) {
							this.obj.setAttr("opacity",0);
						}

// init actor
						else {
							(this.geometry.opacity) ? this.obj.setAttr("opacity",this.geometry.opacity) : this.obj.setAttr("opacity",1);
						}
					});

					stage.draw();


					debug_msg("run sequence '"+this.timeline.name+"'","RUN");

// set current sequence
					currScene = this;
					currScene.status = "run";
					currScene.cast = cast;
					currScene.timeline.frame = currScene.timeline.start;

// activate actors
					$.each(currScene.timeline.cast, function (idx) {

// set events
						if(this.event) {
							$.each(this.event, function () {
								
								switch (this.type) {
									case "click":
										debug_msg("set click event on '"+idx+"'","CREATE");
										
										currScene.cast.actor[idx].obj.action = this.action;

										if (this.value)
											currScene.cast.actor[idx].obj.value = this.value;
										
										debug_msg(currScene.cast.actor[idx].obj,"EVENT");
										
// add event to actor
										currScene.cast.actor[idx].obj.on("click", function (evt) {

// parse actions
											switch (this.action) {
												case "resume":
													debug_msg("click event fired","EVENT");
													debug_msg("resume animation","EVENT");

													currScene.Resume();
													break;

												case "goto":
													debug_msg("goto event fired","EVENT");
													debug_msg("goto frame","EVENT");
													break;

												case "scene":
													debug_msg("scene event fired","EVENT");
													debug_msg("start scene '"+this.value+"'","EVENT");

													globalStage.run(this.value);
													break;
											}
										});

										break;
								}
							});
						}

// add actor to layer
						if (!layer[this.layer]) {
							layer[this.layer] = new Kinetic.Layer();
						}

						if (this.layer) {
//TODO
// actor error
							if (!currScene.cast.actor[idx])
								alert("Actor "+idx+" not defined");

							else {
								layer[this.layer].add(currScene.cast.actor[idx].obj);
								stage.add(layer[this.layer]);
							}
						}

					});

// draw result
					stage.draw();

					GUI.showStatus(currScene);
		
// start animation
					timer = setTimeout(this.Step,loopTime);
				},

//================================================
// stop animation
				Stop: function () {

//DEBUG
					debug_msg("animation stopped","RUN");
					
					currScene.status = "stop";
					GUI.showStatus(this);

//TODO jump to next animation
//					currScene = {};
//console.dir(stage);
				},


//================================================
// resume animation
				Resume: function () {
					debug_msg("resume animation","RUN");

					clearTimeout(timer);

					currScene.status = "run";
					currScene.setFrame(currScene.timeline);

					timer = setTimeout(currScene.Step,loopTime);
				},

//================================================
// next animation step
				Step: function () {
					var scene = currScene.timeline;
					var cast = currScene.cast;
					var nextFrame;

//		GUI.showBar(frame / (end - start) * 100);

// execute keyframe
					$.each(scene.cast, function (i,v) {

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


// check time event
					if (scene.event) {
						$.each(scene.event, function () {


							if (this.time == "*") {
								switch (this.action) {
									case "post":
// DEBUG
										debug_msg("post event fired at frame "+frame,"RUN");
										
										var done = Math.round(scene.frame * 100 / scene.end);
										var param = this.value.split("&");
//console.log(scene);

										param.push("sequ="+scene.name);
										param.push("done="+done);
										param.push("time="+scene.frame);

										$.ajax(
											{
												url: this.url,
												data: param.join("&")
											})
										break;
								}
							}


//=================================================================
// execute event
							if (this.time == scene.frame) {
								switch (this.action) {
// stop animation
									case "stop":
										debug_msg("stop event at frame "+scene.frame,"EVENT");
										clearTimeout(timer);
										currScene.Stop();
										break;

// wait animation
									case "wait":
										debug_msg("wait event at frame "+scene.frame+" for "+this.value+"ms","EVENT");
										clearTimeout(timer);
										currScene.Stop();

										timer = setTimeout(currScene.Resume, this.value);
										
										break;

// goto frame
									case "goto":
										debug_msg("event goto frame "+this.frame,"EVENT");
										nextFrame = this.frame;
										break;


// send post message
									case "post":
										debug_msg("post event at frame "+frame,"EVENT");
										var param = this.value.split("&");

										param.push("sequ="+scene.name);
										param.push("time="+scene.frame);
										
										$.ajax(
											{
												url: this.url,
												data: param.join("&")
											})
											
											.success(function (data) {
												debug_msg(data,"EVENT");
											})
											
											.error(function (jqXHR) {
												debug_msg("error: "+jqXHR.statusText+" status: "+jqXHR.status+" readyState: "+jqXHR.readyState,"ERROR");
											});

										break;
								}
							}
						});
					}


//*******************************
// set new animation position
					if (nextFrame != undefined)
						currScene.setFrame(scene,nextFrame);
					else
						currScene.setFrame(scene);
				},


//================================================
// set new frame position
				setFrame: function (scene,frame) {

// goto frame
					if (frame != undefined) {
						if (frame >= scene.start && frame <= scene.end) {
							debug_msg("set frame to "+frame,"RUN");
							scene.frame = frame;
						}
					}
					else {
// loop
						if (scene.frame > scene.end) {

							if (!scene.loop || (loopPos < scene.loop)) {
								scene.frame = scene.start;
								loopPos++;

// restart loop
								timer = setTimeout(currScene.Step, loopTime);
							}
							else {
								debug_msg("end of sequence","RUN");
								
								clearTimeout(timer);
								currScene.Stop();

// onstop found => start new scene
								if (currScene.timeline.onstop) {
									globalStage.run(currScene.timeline.onstop);
								}
							}
						}


// next frame
						else {

							if (currScene.status == "run") {
								scene.frame++;
								timer = setTimeout(currScene.Step, loopTime);
							}
						}
					}
					
					GUI.showFrame(scene);
//					GUI.showStatus(this);
				},
				

//================================================
// get values of object on frame
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



//================================================
//================================================
// debug method
function debug_msg(text,level) {

	if (debug) {
		if ($.inArray(level.toUpperCase(),debugLevel) >= 0) {
			if (typeof(text) == "object") {
				console.log(level);
				console.log(text);
			}
			else
				console.log(level+" "+text);
		}
	}
}

