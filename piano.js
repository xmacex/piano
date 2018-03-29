/*
  Stuff cannibalized from Tim's piano at
  https://codepen.io/timwray87/pen/dmYwjw

  Mace Ojala
*/

// A test setup
const keys = ['B6', 'C1', 'D2', 'Db4', 'E6', 'F1'];
const dynamics = ['pp', 'mf', 'ff'];
var dynamic = 'mf';
var keyMap = {
    'B6': {
	'audio': undefined
    },
    'C1': {
	'audio': undefined
    },
    'D2': {
	'audio': undefined
    },
    'Db4': {
	'audio': undefined
    },
    'E6': {
	'audio': undefined
    },
    'F1': {
	'audio': undefined
    }
};

// Play a note
function playNote(note, dynamic) {
    console.log("Playing note " + note + ', ' + dynamic);
    var noteUrl = 'http://localhost:8080/' + dynamic + '/' + note + '.mp3';
    console.log("loading " + noteUrl);
    var noteSound = new Audio(noteUrl);
    keyMap[note].audio = noteSound;
    noteSound.play();
}

// Stop a note
function stopNote(note) {
    console.log("Stopping note " + note);
    var notePlaying = keyMap[note].audio;
    if(notePlaying) {
	notePlaying.pause();
	notePlaying.currentTime = 0;
	keyMap[note].audio = undefined;
    }
}

// Construct piano keys
function addKey(key, parentElem) {
    keyElem = document.createElement('button');
    keyElem.id = key;
    keyElem.innerText = '🎹' + key;
    keyElem.addEventListener('mousedown', function() {
	playNote(this.id, dynamic);
    });
    keyElem.addEventListener('mouseup', function() {
	stopNote(this.id);
    });
    
    parentElem.append(keyElem);
}

function addDynamicSelector(dynamics, parentElem) {
    selElem = document.createElement('div');
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

	parentElem.append(dynElem);
	parentElem.append(labelElem);
    });
    parentElem.append(selElem);
}

// Set up the piano
keys.forEach(function(k) {
    addKey(k, document.getElementById('content'));
});

addDynamicSelector(dynamics, document.getElementById('content'));
