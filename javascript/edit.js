///=====================================================================================
// settings
var animationName = "";

var animationPath = "../animation/";

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
var dirtyStat;

//=====================================================================================
// config file
var config = {
	property: {
		stage: [
			{
				width: {"type":"int","fields":"width,height,scale"},
				height: {"type":"int"},
				scale: {"type":"float"},
			}
		],
		
		cast: [
			{
				type: {
					"type":"select",
					"options": [
						{"name":"","fields":"type"},
						{"name":"rect","fields": "type,x,y,width,height,stroke,strokeWidth,fill,opacity"},
						{"name":"cycle","fields": "type,x,y,width,height,stroke,strokeWidth,fill,opacity"},
						{"name":"image","fields": "type,x,y,width,height,src,opacity"},
						{"name":"text","fields": "type,x,y,width,height,stroke,strokeWidth,fill,text,fontSize,fontStyle,opacity"},
						{"name":"group","fields": "type,x,y,width,height,opacity"}
					]
				},
				x: {"type":"int"},
				y: {"type":"int"},
				width: {"type":"int"},
				height: {"type":"int"},
				stroke: {"type":"color"},
				strokeWidth: {"type":"int"},
				fill: {"type":"color"},
				src: {"type":"text"},
				opacity: {
					"type":"float",
					"min":0,
					"max":1,
					"default":"Actor opacity 0-1"
				},
				text: {"type":"text"},
				fontSize: {"type":"int"},
				fontStyle: {
					"type":"select",
					"options": [
						{"name":""},
						{"name":"bold"},
						{"name":"italic"}
					]
				}
			}
		]
	}
};



//=====================================================================================
// load animation data
function edit(path) {
	animationName = path.split(".")[0];

	$.ajax(animationPath+path, {
		dataType: "json",
		type: "GET",
	})
	.done(function (data) {
		init_edit(data.animation);
	})
	.error(function (xhr,type) {
		console.log(xhr,"ERROR");
		console.log(type,"ERROR");
		alert(type+" in loading animation file");
	});
};




//=====================================================================================
// init animation engine
function init_edit(data) {
//	clean();

// init animation
	var dx = data.stage.width / $("#scene").width();
	var dy = data.stage.height / $("#scene").height();

	scale = 1 / Math.max(dx,dy);

// init editor
	Navigator = new Editor.Navigator(data);
};


//================================================
var Editor = (function () {

// private propertys
	var data;
	
	var stageData;
	var castData;
	var sequenceData;

	var frame;
	var prop;

	var animation;

	var actor;

	var scale;


//================================================
// set clean
	var clean = function () {
		dirtyStat = false;

		$(".dirty")
			.removeClass("dirty");
	}


//================================================
// get list of actors to edit
	var createAnimation = function (aniData,name) {
		var tempCast = {};
		var tempFrame = {};


// stage frame
		tempFrame = {
			"geometry": {
				"type": "rect",
				"x": 0,
				"y": 0,
				"width": stageData.width,
				"height": stageData.height,
				"stroke": '#e0e080',
				"strokeWidth": 1,
				"fill": "#fffff0"
			}
		};

		tempCast["_frame"] = tempFrame;

/*		tempFrame = {
			"geometry": {
				"type": "rect",
				"x": aniData[name].geometry.x-5,
				"y": aniData[name].geometry.y-5,
				"width": aniData[name].geometry.width+10,
				"height": aniData[name].geometry.height+10,
				"stroke": '#0000ff',
				"strokeWidth": 5,
			}
		};

		tempCast["_actorFrame"] = tempFrame;*/


// get all grouped actors
		if (aniData[name].geometry.type == "group") {

			tempCast[name] = aniData[name];

			$.each(aniData, function (i,v) {
				if (v.group == name)
					tempCast[i] = aniData[i];
			});
		}

// get singleactor
		else
			tempCast[name] = aniData[name];


// create temporary keyframe
		var tempKey = {};
		tempKey["_frame"] = {
			"layer": "_back",
			"keys": [
				{ "time": 0, "opacity": 1 }
			]
		};

		tempKey[name] = {
			"layer": "edit",
			"keys": [
				{ "time": 0, "opacity": 1 }
			]
		};

/*		tempKey["_actorFrame"] = {
			"layer": "_front",
			"keys": [
				{ "time": 0, "opacity": 1 }
			]
		};*/

// create temporary sequence for animator
		var tempSequ = {
			"main": {
				"name": "main",
				"start": 0,
				"end": 0,
				"loop": 1,
				"event": [
					{ "time": 0, "action": "stop" }
				],
				"cast": tempKey
			}
		};

		var tempData = {
			"stage": stageData,
			"cast": tempCast,
			"sequence": tempSequ
		}


		return tempData;
	};
	

//================================================================================
// update navigation
	var updateNavigation = function () {
		var list;
		var cnt;
		var children;
		var abort;

//================================================================================
// init animation
		frame = $("#navigator");
		frame.empty();

// create nav list
		frame.append("<div id='nav'></div>");

// stage
		frame.append("<div id='nav_stage' class='nav_list'></div>");

		list = $("#nav_stage");

		list.append("<div class='title link'>Stage</div>");
//			list.append("<div class='label'>Width: <span class='value'>"+stageData.width+"</span></div>");
//			list.append("<div class='label'>Height: <span class='value'>"+stageData.height+"</span></div>");
//			list.append("<div class='label'>Scale: <span class='value'>"+stageData.scale+"</span></div>");

		$("#nav_stage").click(function () {
			if (dirtyStat)
				abort = !confirm("Geänderte Daten verwerfen?");
				
			if (!abort) {
				clean();

// select entry
				$(".selected").removeClass("selected");
				$(this).addClass("selected");

// call properties
				updateProps(stageData,{"name": "stage", "type": "stage"});
			}
		});



//================================================================================
// actors
		frame.append("<div id='nav_cast' class='nav_list'></div>");

		list = $("#nav_cast");
		list.append("<div class='title'>Cast</div>");

		cnt = 0;
		$.each(castData, function (i,v) {

//**********
// IMPORTANT
//**********
// grouped actors has to be defined at the end of the cast list
// show grouped actor beyond group actor
			if (v.group != undefined) {
				children = $("#nav_"+v.group).children().length;

				$("#nav_"+v.group)
					.append("<div id='nav_"+i+"' group='"+v.group+"' class='label grouped'><span id='nav_prop_"+i+"' name='"+i+"' class='link'>"+i+"</span></div>");

				$("#nav_"+i).hide();

				$("#nav_prop_"+i).click(function () {
					if (dirtyStat)
						abort = !confirm("Geänderte Daten verwerfen?");
						
					if (!abort) {
						clean();

// select entry
						$(".selected").removeClass("selected");
						$(this).addClass("selected");

// show actor
// call properties
						updateStage(createAnimation(castData,$(this).attr("name")));
						updateProps(castData[$(this).attr("name")],{"name": $(this).attr("name"), "type": "cast"});
					
					}
				});

// show extend button for group
				if (parseInt(children) == 2) {

					$("#nav_ext_"+v.group)
						.show()
						.click(function () {

// show grouped actors
							if ($(this).attr("expand") == undefined) {
								$(this).attr("expand","1");
								$(this).attr("src","images/arrow_down.png");

								$("div[group="+v.group+"]").show();
							}

// hide grouped actors
							else {
								$(this).removeAttr("expand");
								$(this).attr("src","images/arrow_right.png");

								$("div[group="+v.group+"]").hide();
							}
						});
				}
			}

// actor/group name
			else {
				list.append("<div id='nav_"+i+"' class='label'></div>");

				entry = $("#nav_"+i);
				entry.append("<img id='nav_ext_"+i+"' class='expand' src='images/arrow_right.png'></img>");
				entry.append("<span id='nav_prop_"+i+"' name='"+i+"' class='link'>"+i+"</span>");

				$("#nav_ext_"+i).hide();

				$("#nav_prop_"+i).click(function () {
					if (dirtyStat)
						abort = !confirm("Geänderte Daten verwerfen?");

					if (!abort) {
						clean();

// select entry
						$(".selected").removeClass("selected");
						$(this).addClass("selected");

// get actor to edit
// call properties
						updateStage(createAnimation(castData,$(this).attr("name")));
						updateProps(castData[$(this).attr("name")],{"name": $(this).attr("name"), "type": "cast"});
					}
				});
			}

		});

console.log(data);
	};
		

//================================================================================
// show object
	var updateStage = function (actor) {
// empty stage
		if (typeof(animation) == "object")
			animation.animation.stage.removeChildren();

		setScale();


// create new object display
		animation = new Animation.Animation(actor,{ "scale": scale, "imagePath": "../animation/images/" });
		animation.animation.run("main");
	};


//================================================================================
// show properties
	var updateProps = function (actor,options) {
		prop = new Editor.Property(actor,options);
		prop.show();
	};


//================================================================================
// set scale
	var setScale = function () {

		var dx = data.stage.width / $("#scene").width();
		var dy = data.stage.height / $("#scene").height();

		scale = 1 / Math.max(dx,dy);

		$("#scale").text(scale.toFixed(2));
	};

	
//================================================
//================================================
// global methods
	return {

// Navigator
		Navigator: function (aniData) {

			data = aniData;
			
			stageData = data.stage;
			castData = data.cast;
			sequenceData = data.sequence;

			setScale();

			updateNavigation();
		},


//================================================
// property method
		Property: function (actorData,option) {
			var name;
			var type;
			var table;
			var valuefield;
			var field;

			var visibleFields;
			
			var name = option.name;
			var type = option.type;
			var propData;
			var minVal;
			var maxVal;

			actor = actorData;

			var propertyConfig = config.property[option.type][0];

			if (actorData.geometry != undefined)
				propData = actorData.geometry;
			else
				propData = actorData;


//=====================================================
// change displayed fields
			show_fields = function () {
				var filterFields;

// get field list
				filterFields = visibleFields;

// definition found => change display
				if (filterFields) {
// hide all fields
					$.each(propertyConfig, function (ffi,ffv) {
						$("#prop_"+ffi).hide();
					});

// show defined fields
					$.each(filterFields, function (ffi,ffv) {
						$("#prop_"+ffv).show();
					});
				}
			
			};


//=====================================================
			set_visible_fields = function (field,value) {

				$.each(propertyConfig[field].options, function (i,v) {

					if (v.fields) {
						if (v.name == value) {
							visibleFields = v.fields.split(",");
						}
					}
				});
			};
			

//================================================
// content change => set dirty
			dirty = function (obj) {
				var id;
				dirtyStat = true;

				if ($(obj).attr("id") != undefined) id = $(obj).attr("id");
				if ($(this).attr("id") != undefined) id = $(this).attr("id");


				$("#"+id).removeClass("empty");
				$("#"+id).addClass("dirty");

				$("#save")
					.removeAttr("disabled")
					.addClass("dirty");
			}


//================================================
// write change to server => clear dirty
			save_change = function () {
				var savevals = {};

				$("#save")
					.attr("disabled","");


// save all visible fields
				$.each(visibleFields, function () {
					var field = $("[id='prop_val_"+this+"']");


// save value if not empty
					if (field.val().length > 0)
						savevals[this] = field.val();

// mark empty
					else
						field.addClass("empty");
						
				});


				if (actor.geometry != undefined) {
// add group
					var group = $("#prop_val_group").val();

					if (group)
						actor["group"] = group;
					else
						actor["group"] = undefined;

// save values
					actor.geometry = savevals;
				}
				else
					actor = savevals;

				clean();

				var tempActor = {};
				tempActor[name] = actor;

// update display
				updateNavigation();
				updateStage(createAnimation(tempActor,name));

//TODO
// flush data to server
//console.log(data);
			}




//=====================================================
//=====================================================
// global methods
			return {
				createAnimation: function () {
					return actor;
				},

				getName: function () {
					return name;
				},

				getData: function () {
					return propData;
				},
				
				show: function () {
					var fieldType;
					var fieldOptions;
					var inputfield;
					var save;
					var dispString;
					
					frame = $("#property");
					frame.empty();

		// create nav list
					save = $("<input id='save' type='submit' value='save' disabled>");
					save.click(save_change);

					frame.append(save);

//=====================================================
// group link

// build group selector list
					var groupfield = $("<select id='prop_val_group' name='group'></select>");

// empty first entry
					groupfield.append("<option></option>");

					$.each (castData, function (ind, val) {

						if (val.geometry.type == "group")
							dispString = "(+) "+ind;
						else
							dispString = ind;

						
						if (ind == actorData.group) {
							groupfield.append("<option selected>"+dispString+"</option>");
						}

						else
							groupfield.append("<option>"+dispString+"</option>");
					});

			

					groupfield.change(function () {
						var filter = $("select#prop_group option:selected").text();

						dirty(this);
					});

					
//=====================================================

					frame.append("<div id='prop' class='prop_list'></div>");

					list = $("#prop");
					list.append("<div class='title'>"+type+": "+name+"</div>");

					table = $("<table></table>");
					list.append(table);

					line = $("<tr></tr>");
					table.append(line);

					line.append("<td class='label'>group</td>");

					valuefield = $("<td></td>");
					line.append(valuefield);

					valuefield.append(groupfield);


// add fields
					$.each(propertyConfig, function (i,v) {
						line = $("<tr id='prop_"+i+"'></tr>");
						table.append(line);
						
						line.append("<td class='label'>"+i+"</td>");
						
						valuefield = $("<td></td>");
						line.append(valuefield);



// get data
						fieldType = v.type;
						fieldOptions = v.options;

//						(propData[i] != undefined) ? fieldData = propData[i] : fieldData = "";
						fieldData = propData[i];

						if (v.min) minVal = v.min;
						if (v.max) maxVal = v.max;

						if (v.fields != undefined)
							visibleFields = v.fields.split(",");

						switch (fieldType) {
							case "int":
								inputfield = $("<input type='text' name='"+i+"' value='"+fieldData+"'>");
								
								inputfield.keypress(dirty);
								break;

							case "float":
								inputfield = $("<input type='text' name='"+i+"' value='"+fieldData+"'>");
								
								inputfield.keypress(dirty);
								break;

							case "text":
								inputfield = $("<input type='text' name='"+i+"' value='"+fieldData+"'>");
								
								inputfield.keypress(dirty);
								break;

							case "color":
								color = $("<span id='prop_color_"+i+"' class='color'>&nbsp;</span>");
								color.css("background-color",fieldData);
						
								valuefield.append(color);
								inputfield = $("<input type='text' size='10' name='"+i+"' value='"+fieldData+"'>");
								
								inputfield
									.keypress(dirty)

// update color field
									.keyup(function () {
										if (this.value[0] != "#" && this.value.length) this.value = "#"+this.value;
										
										$("#prop_color_"+this.name).css("background-color",this.value);
									});


								
								break;

							case "select":
								inputfield = $("<select name='"+i+"'></select>");

// empty first entry
//								inputfield.append("<option></option>");

// build selector list
								$.each (fieldOptions, function (ind, val) {

									if (fieldData == val.name) {
										inputfield.append("<option selected>"+val.name+"</option>");

										set_visible_fields(i,val.name);
									}

									else
										inputfield.append("<option>"+val.name+"</option>");
								});

								inputfield.change(function () {
									var filter = $("select#prop_val_"+i+" option:selected").text();

									set_visible_fields($(this).attr("name"),filter);
									show_fields();

									dirty(this);
								});
								break;
						}

						show_fields();

// mark empty
						if (fieldData == undefined) {
							inputfield.val("");
							inputfield.addClass("empty");
						}

						inputfield.attr("id","prop_val_"+i);
						inputfield.attr("name",i);

						valuefield.append(inputfield);
					});
				}
			}
		}
	}
})();





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

