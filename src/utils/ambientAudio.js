// Web Audio API Generative Gallery Ambiance Engine
// Creates a soothing, endless, luxury museum ambient soundscape.

class GalleryAmbientSoundscape {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
    this.isPlaying = false;
    this.volume = 0.35;
    this.timer = null;
    this.chimeTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master Gain for smooth volume transitions
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Warm Low-pass Filter (removes harshness for velvet lounge feel)
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(520, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // Soft Delay / Reverb effect
    const delay = this.ctx.createDelay();
    delay.delayTime.setValueAtTime(0.38, this.ctx.currentTime);
    const delayGain = this.ctx.createGain();
    delayGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain.connect(this.filter);
    this.filter.connect(this.ctx.destination);
    this.filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.filter);
  }

  // Soft ambient chord frequencies (Fmaj7 -> Cmaj7 -> Am9 -> Dm7 -> Bbmaj7)
  getChords() {
    return [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
      [110.00, 164.81, 196.00, 261.63], // Am9   (A2, E3, G3, C4)
      [146.83, 174.61, 220.00, 261.63], // Dm7   (D3, F3, A3, C4)
      [116.54, 174.61, 220.00, 293.66], // Bbmaj7(Bb2, F3, A3, D4)
    ];
  }

  playChord(freqs, duration = 8) {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Warm sine + soft triangle blend
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Micro detuning for rich chorus swell
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

      // Attack & Release Envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  playChimeNote() {
    if (!this.ctx || !this.isPlaying) return;
    // Gentle high chime notes (pentatonic A-major / C-major)
    const chimes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const freq = chimes[Math.floor(Math.random() * chimes.length)];
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 4.6);
  }

  start() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 2);

    const chords = this.getChords();
    let chordIdx = 0;

    const step = () => {
      if (!this.isPlaying) return;
      this.playChord(chords[chordIdx], 9);
      chordIdx = (chordIdx + 1) % chords.length;
      this.timer = setTimeout(step, 7500);
    };
    step();

    // Random chime accents every 6-12 seconds
    const chimeStep = () => {
      if (!this.isPlaying) return;
      this.playChimeNote();
      const delay = Math.random() * 6000 + 6000;
      this.chimeTimer = setTimeout(chimeStep, delay);
    };
    chimeStep();
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    this.isPlaying = false;
    clearTimeout(this.timer);
    clearTimeout(this.chimeTimer);

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }
}

export const ambientSoundscape = new GalleryAmbientSoundscape();
