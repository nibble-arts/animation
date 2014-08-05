<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<title>HTML5 Animation</title>
		<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>
		<meta http-equiv="X-UA-Compatible" content="IE=9">

		<script src="javascript/jquery-1.11.0.min.js"></script>
		<script src="javascript/kinetic-v5.1.0.min.js"></script>

		<script src="javascript/animation.js" type="text/javascript"></script>

		<script src="javascript/sequence.js" type="text/javascript"></script>

		<link rel="stylesheet" type="text/css" href="animation.css">
		
		<script type="text/javascript">
			$(document).ready(function () {
				load("semmering.json");
			});
		</script>

		<?PHP include_once("remote/remote.php"); ?>
	</head>



	<body>
		<div id="page">
			<noscript><div id="noscript">Sie müssen Javascript aktiviert haben, um die Animation nutzen zu können.</div></noscript>
		</div>

		<div id="scene"></div>
		<div><span id="frame"></span> <span id="status"></span></div>
		<div id="bar"></div>
	</body>
</html>

