const CONF = {
	octavePos: 4,
	transpose: 0,
};

const key2relnote = e => {
	if (e.code === 'IntlYen') return;
	if (e.isComposing === true) return;
	if (e.ctrlKey === true) return;
	if (e.altKey === true) return;
	if (e.shiftKey === true) return;
	if (e.repeat === true) return;

	const OCT_0_KEYS = 'zsxdcvgbhnjm,l.;/\\';
	const n0 = OCT_0_KEYS.indexOf(e.key);
	if (n0 !== -1) return n0;

	const OCT_1_KEYS = 'q2w3er5t6y7ui9o0p@^[';
	const n1 = OCT_1_KEYS.indexOf(e.key);
	if (n1 !== -1) return n1 + 12;

	return;
};

const isPedal = e => {
	if (e.isComposing === true) return false;
	if (e.ctrlKey === true) return false;
	if (e.altKey === true) return false;
	if (e.shiftKey === true) return false;
	if (e.repeat === true) return false;
	if (e.key !== ' ') return false;

	return true;
};

const keyEvent = (e, state) => {
	if (state) {
		if (e.key == "ArrowUp") {
			CONF.transpose ++;
			e.preventDefault();
			return;
		} else if (e.key == "ArrowDown") {
			CONF.transpose --;
			e.preventDefault();
			return;
		} else if (e.key == "ArrowLeft") {
			CONF.octavePos --;
			e.preventDefault();
			return;
		} else if (e.key == "ArrowRight") {
			CONF.octavePos ++;
			e.preventDefault();
			return;
		}
	}

	if (isPedal(e)) {
		synth.send({ type: 'Pedal', state: state });
		logger.send({ type: 'Pedal', state: state });

		e.preventDefault();
		return;
	}

	const relnote = key2relnote(e);

	if (relnote !== undefined) {
		const note = relnote + CONF.octavePos * 12 + CONF.transpose;
		synth.send({ type: state ? 'NoteOn' : 'NoteOff' , note: note });
		logger.send({ type: state ? 'NoteOn' : 'NoteOff' , note: note });

		e.preventDefault();
		return;
	}
};

class Logger {
	constructor(target) {
		this.target = target;
	}

	send(m) {
		const e = document.createElement('option');

		switch (m.type) {
			case 'NoteOn':
			case 'NoteOff':
				e.innerHTML = `${m.type} ${m.note}`;
				break;

			case 'Pedal':
				e.innerHTML = `${m.type} ${m.state}`;
				break;
		}

		this.target.appendChild(e);
		this.target.scrollTo(0, this.target.scrollHeight);
	}
}

document.addEventListener('keydown', e => { keyEvent(e, true); });
document.addEventListener('keyup', e => { keyEvent(e, false); });

const synth = new Synthesizer();
const logger = new Logger(document.getElementById('event_log'));
