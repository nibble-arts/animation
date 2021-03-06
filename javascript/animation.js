///=====================================================================================
// settings
var animationName = "";

// definition in debugLevel for debug informations to show
// CREATE ... show creation information
// EVENT ... show event information
// RUN ... show runtime information
// ERROR ... show errors
// WARNING ... show warnings
var debug = false; // show/hide debug information on consol
//var debugLevel = new Array("CREATE","RUN","EVENT","ERROR","WARNING");
//var debugLevel = new Array("RUN","EVENT","ERROR","WARNING");

// global parameters
var currScene = {}; // current scene


//=====================================================================================
// load animation data
function load(path) {
	var animationPath = "animation/";

	animationName = path.split(".")[0];

	$.ajax(animationPath+path, {
		dataType: "json",
		type: "GET",
	})
	.done(function (data) {
		init(data.animation);
	})
	.error(function (xhr,type) {
		console.log(xhr,"ERROR");
		console.log(type,"ERROR");
		alert(type+" in loading animation file");
	});
};




//=====================================================================================
// init animation engine
function init(data,scale) {
	var animation;

	animation = new Animation.Animation(data,{ "scale": scale, "imagePath": "animation/images/", "remotePath": "remote/remote.php" });
	animation.animation.run("main");
};



//=====================================================================================
//=====================================================================================
var Animation = (function () {

// private propertys
	var stage = {};
	var cast = {};
	var sequence = {};
	var data;

	var layer = {};
	var remote = {};

	var globalScale;
	var imagePath;

	var remote = {};
	
	var timer;
	var loopTime = 10; // step time in ms
	var loop = 1; // number of loops: 0 => loop forever
	var loopPos = 1; // number of loop

	currScene.status = "started";


	var setScale = function (scale) {
		globalScale = scale;
	};

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
// create animation object
		Animation: function (data,options) {
			imagePath = options.imagePath;
			
			setScale(options.scale);
			stage = new Animation.Stage(data.stage,options.scale);

// start remote service
			if (options.remotePath != undefined) {
				remote = new Remote.Start(options.remotePath);
				stage.addRemote(remote);
			}
	
// add cast
			newactor = new Animation.Actor(data.cast);
			stage.addActor(newactor);

// add sequence
			newScene = new Animation.Sequence(data.sequence);
			stage.addScene(newScene);


			return {
				animation: stage
			}
		},


//================================================
// create stage objects
		Stage: function (data) {

//************************************************************************
// create stage
			kStage = new Kinetic.Stage({
				container: data.id,
				width: data.width,
				height: data.height,
			});


// scale parameter overrides animation scale
			if (globalScale != undefined)
				kStage.setScale({x:globalScale,y:globalScale});

// scale value in animation file
			else {
				if (data.scale)
					kStage.setScale({x:data.scale,y:data.scale});
			}


			return {
				stage: kStage,
				cast: cast,
				sequence: scene,

				addActor: function (cast) {
					this.cast = cast;
				},

				addScene: function (scene) {
					this.sequence = scene;
				},

				addRemote: function (remote) {
					this.remote = remote;
				},

				getWidth: function () { return stage.getWidth(); },
				getHeight: function () { return stage.getHeight(); },

				run: function (sceneName,startFrame) {
					if (startFrame == undefined) startFrame = 0;

					if (this.sequence.scene[sceneName] == undefined) alert("Scene "+sceneName+" not found");
					else
						this.sequence.scene[sceneName].run(this.cast,startFrame);
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

				if (!this.geometry.opacity) this.geometry.opacity = 1;

				var geometry = this.geometry;
				
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
						imageObj.src = imagePath+animationName+"/"+this.geometry.src;
						this.geometry.image = imageObj;
						newactor.obj = new Kinetic.Image(this.geometry);
// scale images
						this.geometry.width = newactor.obj.getWidth();
						this.geometry.height = newactor.obj.getHeight();
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
				run: function (cast,startFrame) {
					var event;
					var timeline = this.timeline;
					var fadeTime = 0;
					var prevScene;

					if (currScene.timeline)
						prevScene = currScene.timeline.name;
					else
						prevScene = "";

					if (timeline.fade == undefined && prevScene != "_dissolve") {

						var dissolve = {
							"name": "_dissolve",
							"start": 0,
							"end": fadeTime, // length of dissolve
							"onstop": timeline.name, // name of next sequence
							"onstopframe": startFrame,
							"fade": true,
							"loop": 1,
							"frame": 0,
							"cast": {
							}
						};


//******************************
// dissolve actors
						$.each(cast.actor, function (idx,val) {

// check if used and not in a group
// hide unused actors
							if (!timeline.cast[idx] && timeline.cast[this.group] == undefined) {

//**********
// fade out
//console.log(timeline.name);
//console.log("fade out "+idx);
//console.log(this.obj.attrs.opacity+" -> 0");

// don't hide group members
								if (this.group == undefined) {
									dissolve.cast[idx] = { keys: [] };

									var newKeyStart = { "time": 0, "opacity": this.obj.attrs.opacity };
									var newKeyEnd = { "time": fadeTime, "opacity": 0 };

									dissolve.cast[idx].keys.push(newKeyStart);
									dissolve.cast[idx].keys.push(newKeyEnd);

//									this.obj.setAttr("opacity",0);
								}
							}

							else {
//**********
// fade in
								dissolve.cast[idx] = { keys: [] };

								if (timeline.cast[idx]) {
//console.log(timeline.name);
//console.log("fade in "+idx);
//console.log(this.obj.attrs.opacity+" -> "+timeline.cast[idx].keys[0].opacity);

									var endVal = { "time": fadeTime, "opacity": timeline.cast[idx].keys[0].opacity };
								}
								else
									var endVal = { "time": fadeTime, "opacity": 1 };

								var newKeyStart = { "time": fadeTime, "opacity": this.obj.attrs.opacity };
								var newKeyEnd = endVal;

								dissolve.cast[idx].keys.push(newKeyEnd);
								dissolve.cast[idx].keys.push(newKeyStart);


//								(this.geometry.opacity) ? this.obj.setAttr("opacity",this.geometry.opacity) : this.obj.setAttr("opacity",0);
							}
						});

//console.log(dissolve);

						var newScene = new Animation._Scene();
						newScene["timeline"] = dissolve;

						sequence["_dissolve"] = newScene;
						stage.run("_dissolve",startFrame);

//console.log(stage);

				
//						globalStage.sequence.scene["_dissolve"] = newScene;
//						globalStage.run("_dissolve",startFrame);
					}

// end of dissolve
//******************************




//******************************
// start scene

					else {
						debug_msg("run sequence '"+this.timeline.name+"'","RUN");

// set current sequence
						currScene = this;
						currScene.status = "run";
						currScene.cast = cast;
						currScene.timeline.frame = currScene.timeline.start;

// set startframe after onstop
						if (currScene.timeline.onstopframe != 0)
							startFrame = currScene.timeline.onstopframe;

// activate actors
						$.each(currScene.timeline.cast, function (idx) {

//================================================
// bind events
							if(this.event) {

// set new scene events
							currScene.cast.actor[idx].obj.remove("event");
							currScene.cast.actor[idx].obj.event = this.event;

//TODO check if click defined
							if (true) {
// remove old click event
								currScene.cast.actor[idx].obj.off("click");

// add event to actor
								currScene.cast.actor[idx].obj.on("click", function (evt) {

// parse events
									$.each(this.event, function () {
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


// create dissolve to new scene
//												this.CreateDissolve(this);

//TODO remove use of global variable
												stage.run(this.value,startFrame);
												break;

											case "post":
												debug_msg("post event fired","EVENT");
												
												var param = new Array;

												param.push("scene="+currScene.timeline.name);
												param.push("time="+currScene.timeline.frame);
												param.push("action="+this.action);
												param.push("value="+this.value);
												param.push("cmd=post");

												Remote.Send(remote.remotePath,param);
												break;
										}
									});
								});
							}
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
								stage.stage.add(layer[this.layer]);
							}
						}

					});

// draw result
					//stage.draw();

					GUI.showStatus(currScene);
		
// set start frame
//					currScene.setFrame(currScene,20);
					if (startFrame != undefined)
						currScene.timeline.frame = startFrame;
					else currScene.timeline.frame = 0;


// start animation
					timer = setTimeout(this.Step,loopTime);
					}
				},

//================================================
// stop animation
				Stop: function () {
//DEBUG
					debug_msg("animation stopped","RUN");
					
					currScene.status = "stop";
					GUI.showStatus(this);
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
//================================================
// next animation step
				Step: function () {
					var scene = currScene.timeline;
					var cast = currScene.cast;
					var nextFrame;
					var progress = 0;
					var eventValue;

// calculate progess: 0-100%
					var sceneLength = scene.end - scene.start;
					if (sceneLength)
						progress = Math.round(scene.frame / (sceneLength) * 100)

// limit to 100%
					if (progress > 100) progress = 100;

// set screen progress
					if (progress == undefined)
						scene.progress = progress;

					if (scene.progress != progress) {
						scene.progress = progress;
					}



// execute keyframe
					$.each(scene.cast, function (i,v) {

						var playObj = cast.actor[i].obj;
						var geometry = cast.actor[i].geometry;
						var playLay = cast.actor[i].layer;

// get actor data from definition
						if (v.keys) {
							var keys = v.keys;

// keys defined

							if (keys != undefined) {

// get last and next keyframe
								var keyVal = currScene.getKeyValues(keys,scene.frame);

// update actor attributes
								$.each (keyVal, function (ind,val) {
									playObj.setAttr(ind,val);
								});
							}
						}
					});

					stage.stage.draw();


// check time event
					if (scene.event) {
						$.each(scene.event, function () {

/*							if (this.time == "*") {
								switch (this.action) {
// post event
									case "post":
										debug_msg("scene post event fired at frame "+frame,"RUN");
										
										var done = Math.round(scene.frame * 100 / scene.end);
										var param = new Array;
//console.log(scene);

										param.push("scene="+scene.name);
										param.push("time="+scene.frame);

										Remote.Send(remotePath,param);
										break;
								}
							}*/


//=================================================================
// execute event
							if (this.time == scene.frame || this.time == undefined) {

								eventValue = this.value;
								
// insert progress value
								if (this.value != undefined && typeof (this.value) == "string") {
									var progArray = this.value.split(":");

									if (progArray.length > 2) {
										if (progArray[2] == "progress") {

										eventValue = progArray[0]+":"+progArray[1]+":"+scene.progress;
										}
									}
								}
								

								switch (this.action) {
// stop animation
									case "stop":
										debug_msg("stop event at frame "+scene.frame,"EVENT");
										clearTimeout(timer);
										currScene.Stop();
										break;

// wait animation
									case "wait":
										debug_msg("wait event at frame "+scene.frame+" for "+eventValue+"ms","EVENT");
										clearTimeout(timer);
										currScene.Stop();

										timer = setTimeout(currScene.Resume, eventValue);
										
										break;

// goto frame
									case "goto":
										debug_msg("event goto frame "+this.frame,"EVENT");
										nextFrame = this.frame;
										break;


// stopto frame
									case "stopto":
										debug_msg("event goto frame and stop "+this.frame,"EVENT");
										nextFrame = this.frame;
										break;

// send post message
									case "post":
										debug_msg("post remote event","EVENT");
										var param = new Array;

										param.push("value="+eventValue);
										param.push("progress"+progress);
										param.push("time="+scene.frame);
										param.push("cmd=post");

										Remote.Send(remote.remotePath,param);
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
									stage.run(currScene.timeline.onstop,currScene.timeline.onstopframe);
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

// key only numbers

						if (typeof(val.start.val) == "number" && typeof(val.end.val) == "number")
							var dv = parseFloat(val.start.val) + parseFloat((dt * (val.end.val - val.start.val)));
						else dv = val.end.val;

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
				},



//================================================
// create dissolve to switch to new scene
				CreateDissolve: function (newScene) {

//console.log(globalStage.cast.actor);
//console.log(globalStage.sequence.scene[newScene].timeline.cast);


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
// create remote objects
var Remote = function () {

	var status = "undefined";
	var data = {};
	var callback;
	var remoteTimer;
	var remoteTime = 500;
	var remoteRetryTime = 5000;
	var remotePath;
	

	return {
// get api data
		Start: function (path) {
			var sceneName;

			if (remotePath == undefined)
				remotePath = path;

			if (currScene.timeline) sceneName = currScene.timeline.name;

			$.ajax(remotePath, {
				dataType: "json",
				type: "GET",
				data: { "cmd": "get", "animation": animationName },
				callback: this
			})

			.success(function (data) {
				clearTimeout(remoteTimer);

//***********************************
// parse action
// only if adressed
				console.log(data.action);
				switch (data.action) {
					case "scene":
						debug_msg("remote scene event","EVENT");
						debug_msg("remote start scene '"+data.value+"'","EVENT");

// create dissolve to new scene
//						currScene.CreateDissolve(data.value);

//TODO remove use of global variable
						stage.run(data.value);
						break;

					case "stop":
						currScene.Stop();
						break;

					case "resume":
						console.log("resume");
						currScene.Resume();
						break;

					case "goto":
						break;

					case "stopto":
						if (data.value) {
							if (data.value != undefined) {
								var stoptoVal = data.value.split(":");

								stage.run(stoptoVal[0],stoptoVal[1]);
							}
						}
						break;
				}

// start remote timeout
				if (data.name = "animation_remote") {
					this.data = data;





					if (status == "undefined")
						debug_msg("remote connected","RUN");

					status = "connected";
					remoteTimer = setTimeout(Remote.Start,remoteTime);
				}

// retry remote connection
				else {
					debug_msg("no remote connection","RUN");

// connection lost ?
					if (status == "connected")
						debug_msg("remote connection lost","RUN");
					
					status = "undefined";

					remoteTimer = setTimeout(Remote.Start,remoteRetryTime);
				}
			})

			.error(function (xhr,type) {
				console.log(xhr,"ERROR");
				console.log(type,"ERROR");
			});

			return {
				remotePath: remotePath,
				remoteTime: remoteTime,
				remoteRetryTime: remoteRetryTime
			}
		},


//************************
// send remote command
		Send: function (url, data) {
//			data.push("animation="+animationName);

			show_debug(url+"?"+data.join("&"));

			$.ajax(
				{
					url: url,
					data: data.join("&")
				}
			)

			.success(function (data) {
				show_debug(data);
				debug_msg(data,"EVENT");
			})

			.error(function (jqXHR) {
				debug_msg("error: "+jqXHR.statusText+" status: "+jqXHR.status+" readyState: "+jqXHR.readyState,"ERROR");
			});
		}
	}
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
				console.log(level)+":";
				console.log(text);
			}
			else
				console.log(level+": "+text);
		}
	}
}



function show_debug(text) {
	if (text) {
		$("#debug")
			.css("visibility","show")
			.append("<p>> "+text+"</p>");
	}
}

