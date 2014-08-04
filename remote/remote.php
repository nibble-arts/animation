<?PHP
//=====================================================================
// animation controler api
include_once("dom.php");
include_once("config.php");


//***********************************
// variable definition
$cmd = ""; // remote command
$version = ""; // animation version
$scene = ""; // event time
$time = "-1"; // event time
$action = ""; // remote action
$value = ""; // action value


//***********************************
// set html parameters
if (isset($_GET["version"])) $version = $_GET["version"];

if (isset($_GET["cmd"])) $cmd = $_GET["cmd"];
if (isset($_GET["scene"])) $scene = $_GET["scene"];
if (isset($_GET["time"])) $time = $_GET["time"];
if (isset($_GET["action"])) $action = $_GET["action"];
if (isset($_GET["value"])) $value = $_GET["value"];


//***********************************
// init querys
$query = new Query($scene,$time,$action,$value);
$retQuery = new Query();


//***********************************
// create output dom
$xml = new DOMDocumentExtended('1.0', 'utf-8');
$xml->appendChild($xml->createElement("name","animation_remote"));
$xml->appendChild($xml->createElement("version","0.1"));


//***********************************
// check for paired sequencers
if (!count($config["pair"])) {
	$xml->appendChild($xml->createElement("warning","no sequencer paired"));
}


//***********************************
// paired sequencer defined
else {

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


//***********************************
// set output dom data
	if ($retQuery->scene()) $xml->appendChild($xml->createElement("scene",$retQuery->scene()));
	if ($retQuery->time() >= 0) $xml->appendChild($xml->createElement("time",$retQuery->time()));
	if ($retQuery->action()) $xml->appendChild($xml->createElement("action",$retQuery->action()));
	if ($retQuery->value()) $xml->appendChild($xml->createElement("value",$retQuery->value()));
}


// send output
//echo $xml->saveJSON();


//=====================================================================
// send post to all paired sequencers
function post_to_paired ($query) {
	global $config;
	$cmd = "remote";
	
	foreach ($config["pair"] as $pair) {
echo "<pre>";
echo		send_http($pair,$cmd,$query);
echo "</pre>";
	}

	return new Query($query->scene(),$query->time(),"status","sent:".count($config["pair"]));
}


//=====================================================================
// get events
function get_from_paired ($query) {
	global $config;
	$retData = array();
	
	foreach ($config["pair"] as $pair) {
		$retData.push(send_http($pair,"get",$query));
	}

	return $query; //new Query($scene,$time,$action,$value);
}


//=====================================================================
// save remote data
function remote_from_paired ($query) {
	$timestamp = time();
	$statusPath = "status/";
	$statusFile = "";
	$filePath = $statusPath.$timestamp.".status";

// extract action and value from value-parameter (action:value)
	$act_val = explode(":",$query->value());

	$query->set_action($act_val[0]);
	$query->set_value($act_val[1]);


//TODO choose method
// write status with timestamp
//	if (!file_exists($filePath)) {
//		file_put_contents($filePath,$query->as_ini());
//	}

// rewrite status
	file_put_contents($statusPath."status.txt",$query->as_ini());
}

//=====================================================================
// send http request and return
function send_http ($url,$cmd,$param) {

	$paramArray = $param->get_array();
	$paramArray["cmd"] = $cmd;

//print_r(http_build_query($paramArray,"","&"));

	return file_get_contents($url."?cmd=".$cmd."&".http_build_query($paramArray,"","&"),true);
}


//=====================================================================
// query class
class Query {
	private $queryScene = "";
	private $queryTime = "-1";
	private $queryAction = "";
	private $queryValue = "";
	
	function __construct ($queryScene = "",$queryTime = "-1",$queryAction = "",$queryValue = "") {
		if ($queryScene) $this->queryScene = $queryScene;
		if ($queryTime >= 0) $this->queryTime = $queryTime;
		if ($queryAction) $this->queryAction = $queryAction;
		if ($queryValue) $this->queryValue = $queryValue;
	}

	function get() {
		return new Query($this->queryScene,$this->queryTime,$this->queryAction,$this->queryValue);
	}
	
	function get_array() {
		$retArray = array();
		
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
	
	function scene() {
		return $this->queryScene;
	}

	function set_scene($scene) {
		$this->queryScene = $scene;
	}

	function time() {
		return $this->queryTime;
	}

	function set_time($time) {
		$this->queryTime = $time;
	}

	function action() {
		return $this->queryAction;
	}

	function set_action($action) {
		$this->queryAction = $action;
	}

	function value() {
		return $this->queryValue;
	}

	function set_value($value) {
		$this->queryValue = $value;
	}

}
?>
