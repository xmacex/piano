/*
  Stuff cannibalized from Tim's piano at
  https://codepen.io/timwray87/pen/dmYwjw

  Mace Ojala
*/

const soundApi = '';
var dynamics = [];
var dynamic = undefined; // selected dynamic
var keyMap = {};
var audioSprites = {};

// Play a note
function playNote(note, dynamic) {
    console.log("Playing note " + note + ', ' + dynamic);
    var audio = audioSprites[dynamic];
    audio.dataset.note = note;
    audio.dataset.dynamic = dynamic;
    audio.currentTime = playtime[dynamic].sprites[note].begin;
    audio.play();

    audio.addEventListener('timeupdate', decayNote);
}

// Decay a note
function decayNote() {
    // In this context, "this" is any of the three audio sprites
    console.log(this.currentTime, this.dataset.dynamic, "🎶",
		this.dataset.note, "⏱ ",
		playtime[this.dataset.dynamic].sprites[this.dataset.note].end);
    if(this.currentTime > playtime[this.dataset.dynamic].sprites[this.dataset.note].end - 1) {
	console.log(this.currentTime, this.dataset.dynamic, "🔇",
		    this.dataset.note, "because", this.currentTime, ">",
		    playtime[this.dataset.dynamic].sprites[this.dataset.note].end);
	this.pause();
	removeEventListener('click', decayNote);
    };
}

// Construct a piano key
function addKey(key, parentElem) {
    keyElem = document.createElement('button');
    keyElem.id = key;
    keyElem.innerText = '🎹' + key;
    keyElem.addEventListener('mousedown', function() {
	playNote(this.id, dynamic);
    });
    
    parentElem.append(keyElem);
}

// Construct a whole piano
function addPianoKeys(pianoKeys, parentElem) {
    pianoElem = document.createElement('div');
    pianoElem.id = 'piano';
    pianoKeys.forEach(function(key) {
	addKey(key, pianoElem);
    });

    parentElem.append(pianoElem);
}

// Construct dynamic selector
function addDynamicSelector(dynamics, parentElem) {
    selElem = document.createElement('div');
    selElem.id = 'dynamic-selector';
    dynamics.forEach(function(dyn) {
	dynElem = document.createElement('input');
	dynElem.id = dyn;
	dynElem.type = 'radio';
	dynElem.name = 'dynamic';
	dynElem.value = dyn;
	dynElem.onclick = function() {
	    dynamic = dyn;
	};

	labelElem = document.createElement('label');
	labelElem.for = dyn;
	labelElem.innerText = dyn;

	selElem.append(dynElem);
	selElem.append(labelElem);
    });
    parentElem.append(selElem);
}

// Fetch playtime data and construct the UI
var playtime = undefined;
fetch('playtimes-as.json')
    .then(res => res.json())
    .catch(err => console.log(err))
    .then(function(data) {
	playtime = data;

	// Set up the audio sprites
	Object.keys(playtime).forEach(function(dynamic) {
	    audioSprites[dynamic] = new Audio(soundApi + playtime[dynamic].filename);
	});

	// Set up the default dynamic
	dynamic = Object.keys(playtime)[0];

	// Set up the keyMap
	Object.keys(playtime[dynamic]).forEach(function(key) {
	    keyMap[key] = {'audio': undefined}
	});

	// Build the piano UI
	addPianoKeys(Object.keys(playtime[dynamic].sprites), document.getElementById('content'));

	// Build the dynamic selector UI and set it to the default value
	addDynamicSelector(Object.keys(playtime), document.getElementById('content'));
	document.querySelector('input#' + dynamic).checked = true;
    });
