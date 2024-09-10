class Synthesizer {
	constructor() {
		this.pressing_keys = new Set();
		this.active_notes = new Set();
		this.is_sustain_active = false;
	}

	send(m) {
		console.log(m);
		switch (m.type) {
			case 'NoteOn': this.noteOn(m.note); break;
			case 'NoteOff': this.noteOff(m.note); break;
			case 'Pedal': this.pedal(m.state); break;
		}
	}

	pedal(state) {
		this.is_sustain_active = state;

		if (state === false)
			[...this.active_notes].filter(note => !this.pressing_keys.has(note)).forEach(note => {
				this.toneGens[note + ''].stop();
				this.active_notes.delete(note);
			});
	}

	initialize() {
		this.audioCtx = new AudioContext();
		this.toneGens = {};
		this.initialized = true;
		this.master_gain = this.audioCtx.createGain();
		this.master_gain.gain.setTargetAtTime(0.5, 0, 0);
		this.master_gain.connect(this.audioCtx.destination);
	}

	noteOff(note) {
		this.pressing_keys.delete(note);

		if (!this.is_sustain_active) {
			this.toneGens[note + ''].stop();
			this.active_notes.delete(note);
		}
	}

	noteOn(note) {
		this.pressing_keys.add(note);
		this.active_notes.add(note);
		if (!this.initialized) this.initialize();

		const toneGen = this.toneGens[note + ''] ??
			new ToneGenerator(this.audioCtx, this.master_gain, note);

		toneGen.start();

		this.toneGens[note + ''] = toneGen;
	}
}

class ToneGenerator {
	constructor(audioCtx, master, note) {
		this.eg = audioCtx.createGain();
		this.eg.connect(master);
		this.freq = (440 / 32) * (2 ** ((note - 9) / 12));
		this.audioCtx = audioCtx;
	}

	stop() {
		const t3 = this.audioCtx.currentTime;
		const t4_offset = 0.05;

		this.eg.gain.cancelScheduledValues(t3);
		this.eg.gain.setValueAtTime(this.eg.gain.value, t3);
		this.eg.gain.setTargetAtTime(0, t3, t4_offset);

		this.schedule = setTimeout(() => {
			this.schedule = undefined;
			this.osc.stop();
			this.osc = undefined;
			console.log("RELEASE HANDLE " + this.freq);
		}, 100);
	}

	start() {
		if (this.schedule) {
			clearTimeout(this.schedule);
			this.schedule = false;
		}

		const t0 = this.audioCtx.currentTime;
		const t1 = t0 + 0.01; /* attack */
		const t2_offset = 0.34; /* decay */
		const t2Value = 0.13; /* sustain */

		if (!this.osc) {
			const osc = this.audioCtx.createOscillator();
			osc.frequency.setValueAtTime(this.freq, t0);
			osc.connect(this.eg);
			osc.start();
			this.osc = osc;
		}

		this.eg.gain.cancelScheduledValues(t0);

		this.eg.gain.setValueAtTime(0, t0);

		this.eg.gain.setTargetAtTime(1, t0, t1 - t0);

		this.eg.gain.setTargetAtTime(t2Value, t1, t2_offset);
	}
}
