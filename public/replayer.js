function Replayer(midiFile) {
	var trackStates = [];
	var beatsPerMinute = 60;
	var ticksPerBeat = midiFile.header.ticksPerBeat / 4;
	var channelCount = 16;

	var samplerate = 44100;

	for (var i = 0; i < midiFile.tracks.length; i++) {
		trackStates[i] = {
			'nextEventIndex': 0,
			'ticksToNextEvent': (
				midiFile.tracks[i].length ?
					midiFile.tracks[i][0].deltaTime :
					null
			)
		};
	}

	var sum = 0;
	
	for (var i = 0; i < midiFile.tracks.length; i++)
	{
		var trackLength = 0;
		for (var j = 0; j < midiFile.tracks[i].length; j++)
		{
			trackLength = trackLength + midiFile.tracks[i][j].deltaTime;
		}
		sum = sum + trackLength;
	}
	
	var avgLength = sum / midiFile.tracks.length;

	var startTicks = avgLength * YAHOO.example.slider.minVal / 900;

	var stopTicks = avgLength * YAHOO.example.slider.maxVal / 900;

	function Channel() {
		
		var generatorsByNote = {};
		var currentProgram = PianoProgram;
		
		function noteOn(note, velocity) {
			if (generatorsByNote[note] && !generatorsByNote[note].released) {
				/* playing same note before releasing the last one. BOO */
				generatorsByNote[note].noteOff(); /* TODO: check whether we ought to be passing a velocity in */
			}

			generator = currentProgram.createNote(note, velocity);

			generatorsByNote[note] = generator;
		}

		function noteOff(note, velocity) {
			generatorsByNote[note].noteOff(velocity);
		}

		function setProgram(programNumber) {
			currentProgram = PROGRAMS[programNumber] || PianoProgram;
		}
		
		return {
			'noteOn': noteOn,
			'noteOff': noteOff,
			'setProgram': setProgram
		}

	} // end function Channel()
	
	// allocate array of channels to set up for this moment in time
	
	var channels = [];
	for (var i = 0; i < channelCount; i++) {
		channels[i] = Channel();
	}
	
	var nextEventInfo;
	var samplesToNextEvent = 0;
	var secondsToNextEvent;

	var ticksSoFar = 0;

	function getNextEvent() {
		var ticksToNextEvent = null;
		var nextEventTrack = null;
		var nextEventIndex = null;
		
		console.log('consuming an event');

		for (var i = 0; i < trackStates.length; i++) {
			if (
				trackStates[i].ticksToNextEvent != null
				&& (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)
			) {
				ticksToNextEvent = trackStates[i].ticksToNextEvent;
				nextEventTrack = i;
				nextEventIndex = trackStates[i].nextEventIndex;
			}
		}

		ticksSoFar = ticksSoFar + ticksToNextEvent;
		
		console.log('done looping track states');
		if (nextEventTrack != null) {
			/* consume event from that track */
			var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
			if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
				trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
			} else {
				trackStates[nextEventTrack].ticksToNextEvent = null;
			}
			trackStates[nextEventTrack].nextEventIndex += 1;
			/* advance timings on all tracks by ticksToNextEvent */
			for (var i = 0; i < trackStates.length; i++) {
				if (trackStates[i].ticksToNextEvent != null) {
					trackStates[i].ticksToNextEvent -= ticksToNextEvent
				}
			}
			nextEventInfo = {
				'ticksToEvent': ticksToNextEvent,
				'event': nextEvent,
				'track': nextEventTrack
			}
			console.log('next event set');
			var beatsToNextEvent = ticksToNextEvent / ticksPerBeat;
			secondsToNextEvent = beatsToNextEvent / (beatsPerMinute / 60);

			samplesToNextEvent += secondsToNextEvent * sampleRate;
		} else {
			nextEventInfo = null;
			samplesToNextEvent = null;
			self.finished = true;
		}
	}
	
	function handleEvent() {
		console.log('handling an event');
		var event = nextEventInfo.event;
		switch (event.type) {
			case 'meta':
				switch (event.subtype) {
					case 'setTempo':
						beatsPerMinute = 60000000 / event.microsecondsPerBeat
				}
				break;
			case 'channel':
				switch (event.subtype) {
					case 'noteOn':

						// need a deeper level of integration to get timing right...

						var source1 = context.createBufferSource();
					
						source1.buffer = this.bufferLoader.bufferList[event.noteNumber - 42];
						source1.connect(context.destination);
						source1.noteOn(0);

						break;
				}
				break;
		}
	}
	
	function p()
	{
		var love = 1;
	}

	while (true) {
		//console.log('About to get and handle next event.');
		getNextEvent();

		if (ticksSoFar > startTicks && ticksSoFar < stopTicks)
		
		{
			handleEvent();

			var i;

			for (var te = 0; te <  6 * 9999990 * secondsToNextEvent; te++){
				i = 0;
			}

			var updatedLength = ticksSoFar * 900 / avgLength;

			//YAHOO.example.slider.set('minVal',10);
		}
	}


	function replay(audio) {
		console.log('replay');
		//audio.write(generate(44100));
	}
	
	var self = {
		'replay': replay,
		'generate': generate,
		'finished': false
	}
	return self;
}