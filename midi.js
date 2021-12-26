lastOut = '';
var btn = document.getElementById('mainButton');

function convertTo(range,value) {
    return (range*value/127).toFixed(3);
}

WebMidi.enable(function (err) {
  if (err) {
    console.log("WebMidi could not be enabled.", err);
  } else {
    console.log("WebMidi enabled!");
  }
});

/* WebMidi.enable(function (err) {
    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);
}); */
WebMidi.enable(function (err) {
  for (var i = 0; i < WebMidi.inputs.length; i++) {
      lastOut =  WebMidi.inputs[i]._midiInput.name ;
      console.log("Nb" + i + " name " + lastOut);
  }
  console.log("Connect to "+ lastOut);
  var input = WebMidi.getInputByName(lastOut);
  btn.innerText=lastOut

  // Listen for a 'note on' message on all channels
  input.addListener('noteon', 1,
    function (e) {
      //console.log("    Received 'noteon' message (" + e.note.name + e.note.octave + ").");
      playNote(e.note.name + e.note.octave);
    }
  );

    input.addListener('noteoff', 1,
    function (e) {
      //console.log("    Received 'noteoff' message (" + e.note.name + e.note.octave + ").");
      releaseNote(e.note.name + e.note.octave);
    }
  );

  // Listen to pitch bend message on channel 1
  input.addListener('pitchbend', 1,
    function (e) {
      console.log("    Received 'pitchbend' message.", e.data);
    }
  );

  // Listen to control change message on all channels
  input.addListener('controlchange', 1,
    function (e) {
      //console.log("    Received 'controlchange' message : ", e.channel,  e.controller.number, e.data[2]);
	  
      if (e.controller.number == 113 && e.data[2] == 0) { 				// CLICK
        cur_osc_id1 = cur_osc_id1 + 1;
        if (cur_osc_id1 >= osc_type.length) {
				cur_osc_id1  = 0; }
			synth1.set({oscillator: { type: osc_type[cur_osc_id1] } });
			log_info("OSC1 " + osc_type[cur_osc_id1]);
       } else if (e.controller.number == 115 && e.data[2] == 0) {
			cur_osc_id2 = cur_osc_id2 + 1;
			if (cur_osc_id2 >= osc_type.length) {
				cur_osc_id2  = 0;        }
			synth2.set({oscillator: { type: osc_type[cur_osc_id2] } });
			log_info("OSC2 " + osc_type[cur_osc_id2]);
		}
		else ( e.controller.number in  myDialBut ) 
		{
			value = myDialBut[e.controller.number];
			//console.log("Moving  ", value);
			if (e.controller.number == 71 ||  e.controller.number == 19) { // special fpr volume 
				cur_value = convertTo(40, e.data[2]) - 40;
        //cur_value = convertTo(value['max'], e.data[2]);
			} else {
				cur_value = convertTo(value['max'], e.data[2]);
			}
			var curObject = value['Object'];
			var curParam = value['Param'];
			var curDial = value['Dial'];
			if (curParam == "frequency") {	curObject.set( { frequency : cur_value});			}
			else if (curParam == "volume") {curObject.set( { volume : cur_value});			}
			else if (curParam== "detune") {	curObject.set( { detune : cur_value});			}
      else if (curParam== "feedback") {	curObject.set( { feedback : cur_value});			}
      else if (curParam== "delayTime") {	curObject.set( { delayTime : cur_value});			}
			curDial.value = cur_value;
		}
	}
	

	
  );


});