///=====================================================================================
// settings
var animationName = "";

var animationPath = "../animation/";
var imagePath = "../animation/images/";

var remotePath = "../remote/remote.php";

var remote;
var remoteTimer;
var remoteTime = 500;
var remoteRetryTime = 5000;

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
var globalStage;
var currScene = {}; // current scene

var dirtyStat;

//=====================================================================================
// config file
var config = {
	property: {
		stage: {
			width: {"type":"int"},
			height: {"type":"int"}
		},

		actor: [
			{
				type: {
					"type":"select",
					"options": [
						{"name":"rect"},
						{"name":"cycle"},
						{"name":"image"},
						{"name":"text"},
						{"name":"group"}
					]
				},
				x: {"type":"int","default":"x Position"},
				y: {"type":"int","default":"y Position"},
				width: {"type":"int","default":"width"},
				height: {"type":"int","default":"height"},
				fill: {"type":"color"},
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
function init(data) {
	Navigator = new Editor.Navigator(data);


};



//================================================
var Editor = (function () {

// private propertys
	var data;
	var frame;
	var prop;


// global methods
	return {

// Navigator
		Navigator: function (data) {
			var list;
			var cnt;
			var children;
			var abort;
			
			frame = $("#navigator");
			frame.empty();

// create nav list
			frame.append("<div id='nav'></div>");

// stage
			frame.append("<div id='nav_stage' class='nav_list'></div>");

			list = $("#nav_stage");
			list.append("<div class='title'>Stage</div>");
			list.append("<div class='label'>Width: <span class='value'>"+data.stage.width+"</span></div>");
			list.append("<div class='label'>Height: <span class='value'>"+data.stage.height+"</span></div>");

// actors
			frame.append("<div id='nav_cast' class='nav_list'></div>");

			list = $("#nav_cast");
			list.append("<div class='title'>Cast</div>");

			cnt = 0;
			$.each(data.cast, function (i,v) {

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
							abort = !confirm("Geänderte Daten speichern?");
							
						if (!abort) {
							clean();
							prop = new Editor.Property(data.cast[$(this).attr("name")].geometry,{"name": $(this).attr("name"), "type": "actor"});
							prop.show();
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
							abort = !confirm("Geänderte Daten speichern?");

						if (!abort) {
							clean();
							prop = new Editor.Property(data.cast[$(this).attr("name")].geometry,{"name": $(this).attr("name"), "type": "actor"});
							prop.show();
						}
					});
				}

			});
		},


//================================================
// property method
		Property: function (data,option) {
			var name;
			var type;
			var data;
			var table;
			var valuefield;
			var save;
			var field;

			var name = option.name;
			var type = option.type;
			var data = data;
			var minVal;
			var maxVal;

			var propertyConfig = config.property[option.type][0];

console.log(data);

			return {
				show: function () {
					var fieldType;
					var fieldOptions;
					
					frame = $("#property");
					frame.empty();

		// create nav list
					save = $("<input id='save' type='submit' value='save' disabled>");
					save.click(save_change);
					
					frame.append(save);
					frame.append("<div id='prop' class='prop_list'></div>");

					list = $("#prop");
					list.append("<div class='title'>"+type+": "+name+"</div>");
					table = $("<table></table>");

					list.append(table);

					$.each(propertyConfig, function (i,v) {
						line = $("<tr></tr>");
						table.append(line);
						
						line.append("<td class='label'>"+i+"</td>");
						
						valuefield = $("<td></td>");
						line.append(valuefield);


// get data
						fieldType = v.type;
						fieldOptions = v.options;

						fieldData = data[i];

						if (v.min) minVal = v.min;
						if (v.max) maxVal = v.max;

						switch (fieldType) {
							case "int":
								inputfield = $("<input type='text' name='"+i+"' value='"+fieldData+"'>");
								break;

							case "float":
								inputfield = $("<input type='text' name='"+i+"' value='"+fieldData+"'>");
								break;

							case "text":
								inputfield = $("<input type='text' name='"+i+"' value='"+fieldData+"'>");
								break;

							case "color":
								color = $("<span class='color'>&nbsp;</span>");
								color.css("background-color",fieldData);
						
								valuefield.append(color);
								inputfield = $("<input type='text' size='10' name='"+i+"' value='"+fieldData+"'>");
								break;

							case "select":
								selector = $("<select></select>");
								valuefield
									.append(selector);

								$.each (fieldOptions, function (ind, val) {
									selector.append("<option selected>"+val.name+"</option>");
								});
								break;
						}

						valuefield.append(inputfield);

						if (fieldData == undefined)
							valuefield.addClass("empty");
						

					});



/*					$.each(data, function (i,v) {
						line = $("<tr></tr>");
						table.append(line);
						
						line.append("<td class='label'>"+i+"</td>");
						
						valuefield = $("<td></td>");
						line.append(valuefield);

						switch (i) {
							case "type":

								selector = $("<select></select>");
								valuefield
									.append(selector);

								(v == "rect") ? selector.append("<option selected>rect</option>") : selector.append("<option>rect</option>");
								(v == "circle") ? selector.append("<option selected>circle</option>") : selector.append("<option>circle</option>");
								(v == "image") ? selector.append("<option selected>image</option>") : selector.append("<option>image</option>");
								(v == "group") ? selector.append("<option selected>group</option>") : selector.append("<option>group</option>");
								(v == "text") ? selector.append("<option selected>text</option>") : selector.append("<option>text</option>");
								break;

							case "fill":
								color = $("<span class='color'>&nbsp;</span>");
								color.css("background-color",v);
								
								valuefield.append(color);
								valuefield.append("<input type='text' size='10' name='"+i+"' value='"+v+"'>");
								break;
								
							case "src":
								valuefield.append("<input type='text' name='"+i+"' value='"+v+"'>");
								break;

							case "fontStyle":
								selector = $("<select></select>");
								valuefield.append(selector);

								(v == "bold") ? selector.append("<option selected>bold</option>") : selector.append("<option>bold</option>");
								(v == "italic") ? selector.append("<option selected>italic</option>") : selector.append("<option>italic</option>");
								break;

							default:
								field = $("<input type='text' name='"+i+"' value='"+v+"'>");
								field.keypress({"object": field},dirty);
								
								valuefield
									.append(field);
						}

					});*/
				}
			}
		}
	}
})();


//================================================
// content change => set dirty
function dirty(object) {
	dirtyStat = true;

	console.dir($(object.target).addClass("dirty"));

	$("#save")
		.removeAttr("disabled")
		.addClass("dirty");
}


//================================================
// set cleatn
function clean() {
	dirtyStat = false;

	$(".dirty")
		.removeClass("dirty");
}


//================================================
// write change to server => clear dirty
function save_change() {
	$("#save")
		.attr("disabled","");

	clean();
}


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

