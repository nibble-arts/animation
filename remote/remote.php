<?PHP
// animation controler api
include_once("dom.php");


$client = ""; // calling client: controler/sequencer
$cmd = ""; // api command
$time = 0; // event time
$done = 0; // percentage of sequence run
$sequ = ""; // current sequence name

if (isset($_GET["cmd"])) $cmd = $_GET["cmd"];
if (isset($_GET["time"])) $time = $_GET["time"];
if (isset($_GET["done"])) $done = $_GET["done"];
if (isset($_GET["sequ"])) $sequ = $_GET["sequ"];


$xml = new DOMDocumentExtended('1.0', 'utf-8');
$xml->appendChild($xml->createElement("name","animation_remote"));
$xml->appendChild($xml->createElement("version","0.1"));

$xml->appendChild($xml->createElement("cmd",$cmd));
$xml->appendChild($xml->createElement("time",$time));
$xml->appendChild($xml->createElement("sequ",$sequ));

echo $xml->saveJSON();

switch ($cmd) {
	case "progress":

		if ($done) {
			$element = $xml->createElement("done",$done);
			$xml->appendChild($element);

//			$xml->save("status/".$sequ.".xml");
		}
		break;
	
	default:
//		$xml->save("status/".$sequ.".xml");
		break;
}

?>
