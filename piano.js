/*
  Stuff cannibalized from Tim's piano at
  https://codepen.io/timwray87/pen/dmYwjw

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
    this.playNote = function(dynamic, note) {
	console.log("Playing note", dynamic, note);
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
	    console.error(e, "Failed to play", dynamic, note);
	    if (!(dynamic in this.playtime)) {
		console.error(dynamic, 'not in', this.playtime);
	    } else if (!(note in this.playtime[dynamic])) {
		console.error(note, 'not found in', this.playtime[dynamic]);
	    }
	}
    }

    // decay a note
    this.decayNote = function() {
	// in this context, "this" is any of the three audio sprites
	var audio = this;
	console.log(audio.currentTime, audio.dataset.dynamic, "🎶",
		    audio.dataset.note, "⏱ ",
		    audio.dataset.end);
	if(audio.currentTime > audio.dataset.end - 1) {
	    console.log(audio.currentTime, audio.dataset.dynamic, "🔇",
			audio.dataset.note, "because", audio.currentTime, ">",
			audio.dataset.end - 1);
	    audio.pause();
	    removeEventListener('timeupdate', this.decayNote);
	};
    }

    // Construct a piano key
    this.addKey = function(piano, key, parentElem) {
	keyElem = document.createElement('button');
	keyElem.id = key;
	keyElem.innerText = '🎹' + key;
	keyElem.addEventListener('mousedown', function() {
	    piano.playNote(piano.dynamic, this.id);
	});

	parentElem.append(keyElem);
    }

    // Construct a whole piano
    this.addPianoKeys = function(piano, pianoKeys, parentElem) {
	this.addPianoKeys.bind(piano);
	pianoElem = document.createElement('div');
	pianoElem.id = 'piano';
	pianoKeys.forEach(function(key) {
	    piano.addKey(piano, key, pianoElem);
	});

	parentElem.append(pianoElem);
    }

    // Construct dynamic selector
    this.addDynamicSelector = function(dynamics, parentElem) {
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
    this.init = function(parentElem) {
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
		console.log("In this fetch.then this is ", this);
		console.log("In this fetch.then that is ", that);
		Object.keys(data).forEach(function(dynamic) {
		    that.audioSprites[dynamic] = new Audio(data[dynamic].filename);
		});

		// Set up the default dynamic
		that.dynamic = Object.keys(data)[0];

		// Set up the keyMap
		Object.keys(data[that.dynamic]).forEach(function(key) {
		    that.keyMap[key] = {'audio': undefined}
		});

		// Build the piano UI
		that.addPianoKeys(that, Object.keys(data[that.dynamic].sprites), document.getElementById('content'));

		// Build the dynamic selector UI and set it to the default value
		that.addDynamicSelector(Object.keys(data), document.getElementById('content'));
		document.querySelector('input#' + that.dynamic).checked = true;
	    });
    }
}
