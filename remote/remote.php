<?PHP
//=====================================================================
// animation controler api
include_once("dom.php");
include_once("config.php");

global $config;


//***********************************
// variable definition
$cmd = ""; // remote command
$animation = ""; // name of animation
$version = ""; // animation version
$scene = ""; // event time
$time = "-1"; // event time
$action = ""; // remote action
$value = ""; // action value



//***********************************
// set html parameters
if (isset($_GET["version"])) $version = $_GET["version"];

if (isset($_GET["animation"])) $animation = $_GET["animation"];
if (isset($_GET["cmd"])) $cmd = $_GET["cmd"];
if (isset($_GET["animation"])) $animation = $_GET["animation"];
if (isset($_GET["scene"])) $scene = $_GET["scene"];
if (isset($_GET["time"])) $time = $_GET["time"];
if (isset($_GET["action"])) $action = $_GET["action"];
if (isset($_GET["value"])) $value = $_GET["value"];


//***********************************
// create query object
$query = new Query($animation,$scene,$time,$action,$value);
$retQuery = new Query();


//***********************************
// create output dom
$xml = new DOMDocumentExtended('1.0', 'utf-8');
$xml->appendChild($xml->createElement("name","animation_remote"));
$xml->appendChild($xml->createElement("version","0.1"));



//***********************************
// check for paired sequencers

if (!count($config)) {
	$xml->appendChild($xml->createElement("warning","no sequencer paired"));
}


//==========================================================================
// paired sequencer defined
else {
//	$xml->appendChild($xml->createElement("cmd",$cmd));

// execute action
	switch ($cmd) {

// send post
		case "post":
			$retQuery = post_to_paired($query);
			break;

// get data
		case "get":
			$retQuery = get_from_paired($query);
			break;

// get data
		case "remote":
			remote_from_paired($query);
			break;
	}


//==========================================================================
// set output dom data
	if ($retQuery->animation()) $xml->appendChild($xml->createElement("animation",$retQuery->animation()));
	if ($retQuery->scene()) $xml->appendChild($xml->createElement("scene",$retQuery->scene()));
	if ($retQuery->time() >= 0) $xml->appendChild($xml->createElement("time",$retQuery->time()));
	if ($retQuery->action()) $xml->appendChild($xml->createElement("action",$retQuery->action()));
	if ($retQuery->value()) $xml->appendChild($xml->createElement("value",$retQuery->value()));
}


//==========================================================================
// send output
if (count($_GET))
	echo $xml->saveJSON();






//==========================================================================
//==========================================================================
// send post to all paired sequencers
// value@target
function post_to_paired ($query) {
	global $config;
	$sent = 0;
	$cmd = "remote";

	$valArray = explode("@",$query->value());

// look for defined target
	if (count($valArray) > 1) $target = $valArray[1];
	else $target = "";

// no target => sent to all
// target => sent to target only
	foreach ($config as $pair) {
		if ($target == "" or $target == $pair["name"]) {
			send_http($pair["uri"],$cmd,$query);
			$sent++;
		}
	}

	return new Query($query->animation(),$query->scene(),$query->time(),"status","sent:".$sent);
}


//=====================================================================
// get events
function get_from_paired ($query) {
	$animation = "";
	$target = "";
	$fileArray = array();

	$status = new Query();
	$statusPath = "../remote/status/";
	$animationName = $query->animation();


//	foreach ($config as $pair) {
//		array_push($retData,send_http($pair,"get",$query));
//	}

		foreach (scandir($statusPath) as $file) {
			$fileArray = explode(".",$file);
			$target = $fileArray[0];
			$animation = $fileArray[1];

// load file if not written from own animation and target is own animation
			if ($file != "." and $file != ".." and $animation != $animationName and $target == $animationName) {
				$status = new Query(parse_ini_file($statusPath.$file));

				unlink($statusPath.$file);
			}
		}

	return $status;
}


//=====================================================================
// save remote data
function remote_from_paired ($query) {
	global $config;
	
	$timestamp = time();
	$statusPath = "../remote/status/";
	$target = "";
	$value = $query->value();

// extract target
	$valArray = explode("@",$value);

// look for defined target
	if (count($valArray) > 1) {
		$target = array_pop($valArray);
		$value = $valArray[0];
	}

// extract action and value from value-parameter (action:value)
	$act_val = explode(":",$value);

	$query->set_action(array_shift($act_val));
	$query->set_value(implode(":",$act_val));

// rewrite status
// send to specified target if target != own animation
	if ($target != "")
		write_status($statusPath,$target,$query->animation(),$query->as_ini());

// send to all targets
	else {
		foreach ($config as $pair) {
			write_status($statusPath,$pair["name"],$query->animation(),$query->as_ini());
		}
	}

}


//=====================================================================
function write_status($path,$target,$animation,$content) {
	if ($target != $animation)
		file_put_contents($path.$target.".".$animation.".txt",$content);
}


//=====================================================================
// send http request and return
function send_http ($url,$cmd,$param) {

	$paramArray = $param->get_array();
	$paramArray["cmd"] = $cmd;

//print_r(http_build_query($paramArray,"","&"));

	return file_get_contents($url."?cmd=".$cmd."&".http_build_query($paramArray,"","&"),true);
}






//==========================================================================
//==========================================================================
// query class
class Query {
	private $queryAnimation = "";
	private $queryScene = "";
	private $queryTime = "-1";
	private $queryAction = "";
	private $queryValue = "";
	
	function __construct ($queryAnimation = "",$queryScene = "",$queryTime = "-1",$queryAction = "",$queryValue = "") {
		if (gettype($queryAnimation) == "array") {
			if (array_key_exists("animation",$queryAnimation)) $this->queryAnimation = $queryAnimation["animation"];
			if (array_key_exists("scene",$queryAnimation)) $this->queryScene = $queryAnimation["scene"];
			if (array_key_exists("time",$queryAnimation)) $this->queryTime = $queryAnimation["time"];
			if (array_key_exists("action",$queryAnimation)) $this->queryAction = $queryAnimation["action"];
			if (array_key_exists("value",$queryAnimation)) $this->queryValue = $queryAnimation["value"];
		}

		else {
			if ($queryAnimation) $this->queryAnimation = $queryAnimation;
			if ($queryScene) $this->queryScene = $queryScene;
			if ($queryTime >= 0) $this->queryTime = $queryTime;
			if ($queryAction) $this->queryAction = $queryAction;
			if ($queryValue) $this->queryValue = $queryValue;
		}
	}

	function get() {
		return new Query($this->queryAnimation,$this->queryScene,$this->queryTime,$this->queryAction,$this->queryValue);
	}
	
	function get_array() {
		$retArray = array();
		
		if ($this->queryAnimation) $retArray["animation"] = $this->queryAnimation;
		if ($this->queryScene) $retArray["scene"] = $this->queryScene;
		if ($this->queryTime >= 0) $retArray["time"] = $this->queryTime;
		if ($this->queryAction) $retArray["action"] = $this->queryAction;
		if ($this->queryValue) $retArray["value"] = $this->queryValue;

		return $retArray;
	}

	function as_ini() {
		$retString = "";
		
		foreach($this->get_array() as $key=>$value) {
			$retString .= $key." = '".$value."'\n";
		}

		return $retString;
	}
	
	function animation() {
		return $this->queryAnimation;
	}

	function set_animation($data) {
		$this->queryAnimation = $data;
	}

	function scene() {
		return $this->queryScene;
	}

	function set_scene($data) {
		$this->queryScene = $data;
	}

	function time() {
		return $this->queryTime;
	}

	function set_time($data) {
		$this->queryTime = $data;
	}

	function action() {
		return $this->queryAction;
	}

	function set_action($data) {
		$this->queryAction = $data;
	}

	function value() {
		return $this->queryValue;
	}

	function set_value($data) {
		$this->queryValue = $data;
	}

}
?>
