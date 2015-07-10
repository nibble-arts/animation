<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<title>HTML5 Animation</title>
		<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>
		<meta http-equiv="X-UA-Compatible" content="IE=9">

		<link rel="stylesheet" type="text/css" href="edit.css">

		<script src="../javascript/jquery-1.11.0.min.js"></script>
		<script src="../javascript/kinetic-v5.1.0.min.js"></script>

		<script src="../javascript/animation.js" type="text/javascript"></script>
		<script src="../javascript/edit.js" type="text/javascript"></script>

<?PHP
			include_once("../lib/edit.php");
?>

		<script type="text/javascript">
			$(document).ready(function () {
				edit("control.json");
			});
		</script>
	</head>



	<body>
		<div id="page">
			<noscript><div id="noscript">Sie müssen Javascript aktiviert haben, um die Animation nutzen zu können.</div></noscript>

			<div id="menu">Menu</div>
			<div id="navigator">Navigator</div>
			<div id="scene"></div>
			<div id="property">Properties</div>
			<div id="timeline">Timeline</div>
			<div id="info">Maßstab 1:<span id="scale"></span></div>
		</div>

	</body>
</html>

