<?PHP
// animation controler api

$cmd; // api command
$time; // event time
$done; // percentage of sequence run
$seq; // current sequence name


if (isset($_GET["cmd"])) $cmd = $_GET["cmd"];
if (isset($_GET["time"])) $time = $_GET["time"];
if (isset($_GET["done"])) $done = $_GET["done"];
if (isset($_GET["seq"])) $seq = $_GET["seq"];


switch ($cmd) {
	case "progress":
		$xml = new DOMDocument('1.0', 'utf-8');

		if ($done) {
			$element = $xml->createElement("done",$done);
			$xml->appendChild($element);

			echo $xml->saveXML();
		}
		break;
	
	default:
		break;
?>
