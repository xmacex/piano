/*
  An Audio Sprite idea. Maybe works.

  Mace Ojala
*/

function Piano(soundData) {
    // Initialize some instance properties
    this.soundData = soundData || 'playtimes-as.json';

    this.playtime = undefined;
    this.dynamics = undefined;
    this.keyMap = {};
    this.audioSprites = {};

    // Play a note
    this.playNote = function(note, dynamic = 'mf') {
	console.log("Playing note", note, dynamic);
	var audio = this.audioSprites[dynamic];
	// Using the HTML element (w. dataset) to transfer data :-P
	// This is inconsistent, since also the Piano object exists
	// and holds this data. But not invoking, but passing the
	// event listener with arguments would need some syntactic
	// trickery. Conceptually, using the event would also makes
	// sense for the decay.
	try {
	    audio.dataset.note = note;
	    audio.dataset.dynamic = dynamic;
	    audio.dataset.end = this.playtime[dynamic].sprites[note].end;

	    audio.currentTime = this.playtime[dynamic].sprites[note].begin;
	    audio.play();
	    audio.addEventListener('timeupdate', this.decayNote);
	} catch (e) {
	    console.error(e, "Failed to play", note, dynamic);
	    if (!(dynamic in this.playtime)) {
		console.error(dynamic, 'not in', this.playtime);
	    } else if (!(note in this.playtime[dynamic])) {
		console.error(note, 'not found in', this.playtime[dynamic]);
	    }
	}
    }

    // Stop a note
    this.stopNote = function(dynamic) {
	this.audioSprites[dynamic].pause();
    }

    // Decay a note
    this.decayNote = function() {
	// in this context, "this" is any of the three audio sprites
	var audio = this;
	console.log(audio.currentTime, audio.dataset.note, "🎶",
		    audio.dataset.dynamic, "⏱ ",
		    audio.dataset.end);
	if(audio.currentTime > audio.dataset.end - 1) {
	    console.log(audio.currentTime, audio.dataset.note,
			audio.dataset.dynamic, "🔇", "because",
			audio.currentTime, ">", audio.dataset.end - 1);
	    audio.pause();
	    removeEventListener('timeupdate', this.decayNote);
	};
    }

    // Construct a piano key
    this.addKey = function(key, parentElem) {
	// Ok having these that = this idioms trickling this far down
	// is getting old... re-architecturing would be welcome
	var that = this;
	keyElem = document.createElement('button');
	keyElem.id = key;
	keyElem.innerText = '🎹' + key;
	keyElem.addEventListener('mousedown', function() {
	    that.playNote(this.id, that.dynamic);
	});

	parentElem.append(keyElem);
    }

    // Construct a whole piano
    this.addPianoKeys = function(pianoKeys, parentElem) {
	var that = this;
	pianoElem = document.createElement('div');
	pianoElem.id = 'piano';
	pianoKeys.forEach(function(key) {
	    that.addKey(key, parentElem);
	});

	parentElem.append(pianoElem);
    }

    // Construct dynamic selector
    this.addDynamicSelector = function(dynamics, parentElem) {
	var that = this;
	selElem = document.createElement('div');
	selElem.id = 'dynamic-selector';
	dynamics.forEach(function(dyn) {
	    dynElem = document.createElement('input');
	    dynElem.id = dyn;
	    dynElem.type = 'radio';
	    dynElem.name = 'dynamic';
	    dynElem.value = dyn;
	    dynElem.onclick = function() {
		that.dynamic = dyn;
	    };

	    labelElem = document.createElement('label');
	    labelElem.for = dyn;
	    labelElem.innerText = dyn;

	    selElem.append(dynElem);
	    selElem.append(labelElem);
	});
	parentElem.append(selElem);
    }

    // Build a test UI
    this.buildTestUI = function(selector) {
	// Build the piano UI
	console.log("Building demo ui, this is", this);
	var parentElem = document.querySelector(selector);
	this.addPianoKeys(Object.keys(this.playtime[this.dynamic].sprites), parentElem);

	// Build the dynamic selector UI and set it to the default value
	this.addDynamicSelector(Object.keys(this.playtime), parentElem);
	document.querySelector('input#' + this.dynamic).checked = true;
    }

    // Fetch playtime data and construct the UI
    this.init = function(demoselector) {
	// Javascript 'that' idiom to keep track of changing
	// contexts. Here, 'that' will be the piano object, as inside
	// fetch 'this' will be the window
	var that = this;
	// var playtime = undefined;
	fetch(this.soundData)
	    .then(res => res.json())
	    .catch(err => console.log(err))
	    .then(function(data) {
		that.playtime = data;

		// Set up the audio sprites
		Object.keys(data).forEach(function(dynamic) {
		    that.audioSprites[dynamic] = new Audio(data[dynamic].filename);
		});

		// Set up the default dynamic
		that.dynamic = Object.keys(data)[0];

		// Set up the keyMap
		Object.keys(data[that.dynamic]).forEach(function(key) {
		    that.keyMap[key] = {'audio': undefined}
		});

		// User has requested the demo UI to be built
		if (demoselector) {
		    that.buildTestUI(demoselector);
		}
	    });
    }
}
