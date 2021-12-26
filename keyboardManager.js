
//var osc_type =  ['sine','fatsquare', 'triangle', 'fatsawtooth'];
var osc_type =  ['sawtooth', 'fatsawtooth', 'square', 'fatsquare', 'triangle', 'sine'];
//var osc_color = ['#1B8BD2', '#FFFF33', '#008000', '#ff4500']; // 507C9E  
var osc_color = [ '#ff4500','#FFFF33', '#008000', '#1B8BD2']; // 507C9E  
var cur_osc_id1 = 0;
var cur_osc_id2 = 0;
var tempo_value =  ['2n','4n', '8n', '16n', '32n', '64n', '128n'];
var cur_tempo_id = 1 ;
var cur_tempo = tempo_value[cur_tempo_id] ;
var cur_enveloppe_attack = 0.0;
var cur_enveloppe_sustain =  0.1;
var cur_filter_freq = 9000;
var cur_disto =  0.0;
var cur_delay =  0.0;
var cur_detune =  5;
var cur_delay_time =  '128n';
var octave_shift = 4;
var arpOn = false ;

var key_note = {};
var note_on = [];


const filter = new Tone.Filter({type : "lowpass" ,frequency : cur_filter_freq ,rolloff : -12 ,Q : 5 ,gain : 0});
const pingpongdelay =  new Tone.PingPongDelay(cur_delay_time, cur_delay);
const distortion = new Tone.Distortion(cur_disto);

const synth1  = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
        type: osc_type[cur_osc_id1],
        count: 1
    }
}).toDestination();

const synth2  = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
        type: osc_type[cur_osc_id2],
        count: 1
    }
}).toDestination();

Tone.Destination.chain(filter, distortion, pingpongdelay);
Tone.start()
log_info("Synth ready");

let osc = new Nexus.Oscilloscope("#scope", {'size': [340,480] });
osc.colorize("accent",osc_color[cur_osc_id1])

document.getElementById('mainTable').style.borderColor = osc_color[cur_osc_id1]  + "CC";
document.getElementById('display').style.color = osc_color[cur_osc_id1];
osc.colorize("fill","#000000")
osc.connect(Tone.Master);

log_info("Oscillo ready");
var arpbtn = document.getElementById('arpButton');
arpbtn.addEventListener('click', updateArpBtn);

var btn = document.getElementById('mainButton');
btn.addEventListener('click', updateBtn);



var myDialBut = {};
// OSC 1 & 2 type
myDialBut[112] = {'Button' : '#radial1-1', 'Object':synth1, 'Param' : 'waveform', 'min': 0, 'max': 10};
myDialBut[114] = {'Button' : '#radial2-1', 'Object':synth2, 'Param' : 'waveform',  'min': 0,'max': 10};
// OSC 1 & 2 detune
myDialBut[74] =  {'Button' : '#radial1-2', 'Object':synth1, 'Param' : 'detune',  'min': 0,'max' : 50};
myDialBut[18] =  {'Button' : '#radial2-2', 'Object':synth2, 'Param' : 'detune',  'min': 0,'max': 50};
// OSC 1 & 2 Volume
myDialBut[71] =  {'Button' : '#radial1-3', 'Object':synth1, 'Param' : 'volume',  'min': -40,'max': 0};
myDialBut[19] =  {'Button' : '#radial2-3', 'Object':synth2, 'Param' : 'volume',  'min': -40,'max': 0};
// FILTER Freq
myDialBut[76] =  {'Button' : '#radial1-4', 'Object':filter, 'Param' : 'frequency', 'min': 0, 'max': 9000};
// DELAY feedback & delay
myDialBut[77] =  {'Button' : '#radial1-5', 'Object':pingpongdelay, 'Param' : 'feedback',  'min': 0,'max': 1};
myDialBut[17] =  {'Button' : '#radial2-5', 'Object':pingpongdelay, 'Param' : 'delayTime',  'min': 0,'max': 1};


for(var key in myDialBut) {
  var value = myDialBut[key];
  var dial = new Nexus.Dial(value['Button']);
  dial.min = value['min'];
  dial.max = value['max'];
  value['Dial'] = dial;
  myDialBut[key]=value;
  console.log("Create dial ", value);
}


function updateBtn() {
    console.log("Button pressed", btn);
    playNote("C4");
    releaseNote("C4");
  }

  function updateArpBtn() {
    console.log("Arp Button pressed", btn);
    if (arpOn) {
        arpOn=false;
        Tone.Transport.stop();
    } else {
        arpOn=true;
        Tone.Transport.start();
    }
  }

function playNote(note) {
    log_info("  playNote " +note);
    if (note_on.length < 4) {
        note_on.push(note);
        if (arpOn) {
            log_info("   Nbr ARP " + note_on.length);
            Tone.Transport.cancel();
            log_info("   Nbr ARP " + note_on.length);
            Tone.Transport.scheduleRepeat((time) => {
                var relativeTime = 0;
                log_info("   Nbr ARP " + note_on.length);
                for (const note_arp in note_on) {
                    log_info("   sched ARP " + note_on[note_arp] + " " + relativeTime + " " + cur_tempo);
                    synth1.triggerAttackRelease( note_on[note_arp], getdelayArp(cur_tempo_id, note_on.length), time + relativeTime);
                    relativeTime += Tone.Time(getdelayArp(cur_tempo_id, note_on.length)).toSeconds();
                }
            }, cur_tempo);
            log_info("  ARP " + enTofrTab(note_on));
        } else {
                
                synth1.triggerAttack(note, Tone.now(), 1);
                synth2.triggerAttack(note, Tone.now(), 1);
                noteLow = Tone.Frequency(note).transpose(-2);
                noteFreq = Tone.Frequency(note).toFrequency();
                //synth2.triggerAttack(noteLow, Tone.now(), 1);
                log_info("  Play " + enTofr(note)  + " " + noteFreq.toFixed(1)+ "hz");
            }
    }
    else {
        log_info("  Reach max polyphony " + note_on.length + " skipping");
    }
}


function releaseNote(note) {
    
    const index = note_on.indexOf(note);
    if (index > -1) {
        note_on.splice(index, 1);
    }
    if (arpOn) {
        Tone.Transport.cancel();
        if (note_on.length > 0) {
            Tone.Transport.scheduleRepeat((time) => {
                var relativeTime = 0;
                for (const note_arp in note_on) {
                    log_info("   sched ARP " + note_on[note_arp] + " " + relativeTime + " " + cur_tempo);
                    synth1.triggerAttackRelease( note_on[note_arp], getdelayArp(cur_tempo_id, note_on.length), time + relativeTime);
                    relativeTime += Tone.Time(getdelayArp(cur_tempo_id, note_on.length)).toSeconds();
                }
            }, cur_tempo);
            log_info("  ARP " + enTofrTab(note_on));
        } 
    }
    else {
        synth1.triggerRelease(note);
        synth2.triggerRelease(note);
        
    }
    log_info("  Stop " + enTofr(note) );
}


document.onkeyup = function(e) {
    
    if (e.which in key_note) {
        var note_string = key_note[e.which]
        releaseNote(note_string);
    }
}

function getHigherTempo(mytempo) {
    var index = tempo_value.indexOf(mytempo);
    if (index > -1) {
        index = index + 1;
        if (index > tempo_value.length) {index = tempo_value.length }
    }
    return tempo_value[index];
}

function getdelayArp(tempo, note_cpt) {
    if (note_cpt === 1) {
        return tempo_value[tempo+1]
    } else if (note_cpt === 2) {
        return tempo_value[tempo+1]
    } else if (note_cpt === 3) {
        return tempo_value[tempo+2]
    } else {
        return tempo_value[tempo+2]
    }
}

function delayTimeCalc(delay) {
    var timeDelay = '128n'
    switch (true) {
        case (delay < 0.1):
            timeDelay = '64n';
            break;
        case (delay < 0.2):
            timeDelay = '16n';
            break;
        case (delay < 0.3):
            timeDelay = '16n';
            break;
        case (delay < 0.5):
            timeDelay = '8n';
            break;
        case (delay < 0.6):
            timeDelay = '4n';
            break;
        default:
            timeDelay = '4n';
            break;
    }
    return timeDelay;

}

function IDtoName(ID) {
    var IDname = {};
    IDname[49] = "A-";
    IDname[50] = "A+";
    IDname[51] = "S-";
    IDname[52] = "S+";
    IDname[53] = "Dt-";
    IDname[54] = "Dt+";
    IDname[55] = "Di-";
    IDname[56] = "Di+";
    IDname[57] = "De-";
    IDname[48] = "De+";
    IDname[219] = "T-";
    IDname[187] = "T+";
    /*IDname[] = "-";
    IDname[] = "+";
    IDname[] = "-";
    IDname[] = "+";
    IDname[] = "-";
    IDname[] = "+";
    IDname[] = "-";*/
    return IDname[ID];

}

function log_info(mytext) {
    console.log(mytext);
    document.getElementById('logs').value = document.getElementById('logs').value + " LOG:\t" +  mytext + '\n';
    document.getElementById('logs').scrollTop = document.getElementById('logs').scrollHeight ;
    
    document.getElementById('display').value = ' Oscillator1   : ' + osc_type[cur_osc_id1] + '\n';
    document.getElementById('display').value += ' Oscillator2  : ' + osc_type[cur_osc_id2] + '\n';
    document.getElementById('display').value += ' Tempo        : ' + cur_tempo ;
    document.getElementById('notes').value =  enTofrTab(note_on);
}

function enTofrTab(noteArray) {
    var noteDisplay = '';
    for (const noteAr in noteArray) {
        noteDisplay = noteDisplay + " " + enTofr(noteArray[noteAr]);
    }
    return noteDisplay
}

function enTofr(noteIn) {

    note = noteIn.replace('D','Re').replace('C','Do').replace('E','Mi').replace('F','Fa').replace('G','Sol').replace('A','La').replace('B','Si');
    octave = parseInt(note.charAt(note.length-1));
    var note = note.slice(0, -1);
    addition = ''
    if (octave > octave_shift) {
        addition = '+';
    } else if (octave === octave_shift) {
        addition = ''
    }
    else {
        addition = '-';
    }
    return note + addition;
}