<?php

//include_once ("stage.php");

Class edit {

	var $stage;
	var $cast;
	var $sequence;
	

//=======================================
// create edit object
	function __construct($path = "") {
		if ($path) $this->load($path);
	}


//=======================================
// create edit object
	function load($path) {
		if (file_exists($path)) {
			$data = file_get_contents($path);

			$data = json_decode($data,true);

// animation data loaded and parsed
			if ($data) {

				$this->stage = $data["animation"]["stage"];
				$this->cast = $data["animation"]["cast"];
				$this->sequence = $data["animation"]["sequence"];
			}
		}
	}
	

//=======================================
// echo data
	function __tostring() {
		return print_r($this, true);
	}


//=======================================
// return actor list array
// actor details if name is defined
	function actor($name = "") {

		if ($name) return $this->cast[$name];
		else return $this->cast;
	}

	function draw() {
	}
}

?>
