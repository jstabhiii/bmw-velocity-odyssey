/**
 * BMW Velocity Odyssey - Procedural Web Audio Synthesizer
 * Generates realistic dynamic engine acoustics, turbo spool, and exhaust crackles
 * without relying on external audio files.
 */

class BMWAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;
    this.isInitialized = false;

    // Oscillators & Nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.subBassOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.distortionNode = null;

    // Turbo Spool Nodes
    this.turboOsc = null;
    this.turboGain = null;

    // Wind / Road noise
    this.roadNoiseNode = null;
    this.roadNoiseGain = null;

    // Live Analyser for Visualizer
    this.analyser = null;
    this.dataArray = null;

    // State
    this.currentRPM = 900; // Idle RPM
    this.targetRPM = 900;
    this.currentSpeed = 0;
    this.isRevving = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);

      // Analyser for UI Visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect Master to Analyser to Destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // 1. ENGINE CORE (Dual sawtooth for rich combustion harmonics)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime); // 45Hz idle

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime); // 2nd harmonic

      this.subBassOsc = this.ctx.createOscillator();
      this.subBassOsc.type = 'sine';
      this.subBassOsc.frequency.setValueAtTime(28, this.ctx.currentTime); // Sub rumble

      // Engine Filter (Lowpass that opens up as RPM climbs)
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // Engine Gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.subBassOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      // 2. TURBO SPOOL (High whistling sine with bandpass)
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);

      // 3. ROAD & WIND NOISE (Continuous speed hiss)
      this.createRoadNoise();

      // Start all continuous oscillators
      this.engineOsc1.start();
      this.engineOsc2.start();
      this.subBassOsc.start();
      this.turboOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio initialization error: ", e);
    }
  }

  createRoadNoise() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.roadNoiseGain = this.ctx.createGain();
    this.roadNoiseGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(this.roadNoiseGain);
    this.roadNoiseGain.connect(this.masterGain);

    whiteNoise.start();
  }

  toggleMute() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.4, now + 0.15);
    }
    return !this.isMuted;
  }

  setVolume(vol) {
    if (!this.masterGain || !this.ctx || this.isMuted) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setTargetAtTime(clamped * 0.5, this.ctx.currentTime, 0.05);
  }

  /**
   * Updates acoustics based on current speed (0 - 420 km/h) and acceleration
   */
  updateTelemetry(speedKmH, isAccelerating = false) {
    if (!this.isInitialized || !this.ctx) return;

    this.currentSpeed = speedKmH;
    const normalizedSpeed = Math.min(1, Math.max(0, speedKmH / 360));

    // Dynamic RPM calculation (simulating gear shifts)
    let gear = 1;
    let gearRatio = 0;
    if (speedKmH < 45) {
      gear = 1;
      gearRatio = speedKmH / 45;
    } else if (speedKmH < 90) {
      gear = 2;
      gearRatio = (speedKmH - 45) / 45;
    } else if (speedKmH < 145) {
      gear = 3;
      gearRatio = (speedKmH - 90) / 55;
    } else if (speedKmH < 205) {
      gear = 4;
      gearRatio = (speedKmH - 145) / 60;
    } else if (speedKmH < 265) {
      gear = 5;
      gearRatio = (speedKmH - 205) / 60;
    } else if (speedKmH < 325) {
      gear = 6;
      gearRatio = (speedKmH - 265) / 60;
    } else {
      gear = 7;
      gearRatio = Math.min(1, (speedKmH - 325) / 75);
    }

    const baseRpm = 1100 + gearRatio * 5800 + (isAccelerating ? 900 : 0);
    this.targetRPM = Math.min(8500, Math.max(900, baseRpm));

    // Smooth RPM interpolation
    this.currentRPM += (this.targetRPM - this.currentRPM) * 0.12;

    const now = this.ctx.currentTime;

    // Pitch: Frequencies mapped to RPM
    const fundamental = (this.currentRPM / 60) * 1.5; // Cyl firing pulses
    this.engineOsc1.frequency.setTargetAtTime(fundamental, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(fundamental * 2, now, 0.05);
    this.subBassOsc.frequency.setTargetAtTime(fundamental * 0.6, now, 0.05);

    // Filter opens with speed and RPM
    const cutoff = 250 + (this.currentRPM / 8500) * 2800 + (isAccelerating ? 800 : 0);
    this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.08);

    // Turbo whistle intensity
    if (this.turboGain && this.turboOsc) {
      const turboWhistle = isAccelerating && speedKmH > 30 ? (this.currentRPM / 8500) * 0.08 : 0.002;
      this.turboGain.gain.setTargetAtTime(turboWhistle, now, 0.1);
      this.turboOsc.frequency.setTargetAtTime(1200 + (this.currentRPM / 8500) * 2200, now, 0.1);
    }

    // Road noise rises with speed
    if (this.roadNoiseGain) {
      const roadLevel = 0.01 + normalizedSpeed * 0.07;
      this.roadNoiseGain.gain.setTargetAtTime(roadLevel, now, 0.15);
    }
  }

  /**
   * Exhaust pop / crackle simulation on throttle drop or gear change
   */
  triggerExhaustPop() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const delay = i * 0.09 + Math.random() * 0.04;
      const popOsc = this.ctx.createOscillator();
      popOsc.type = 'sawtooth';
      popOsc.frequency.setValueAtTime(80 + Math.random() * 60, now + delay);
      popOsc.frequency.exponentialRampToValueAtTime(25, now + delay + 0.06);

      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(350 + Math.random() * 200, now + delay);

      const popGain = this.ctx.createGain();
      popGain.gain.setValueAtTime(0.25, now + delay);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      popOsc.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.masterGain);

      popOsc.start(now + delay);
      popOsc.stop(now + delay + 0.07);
    }
  }

  /**
   * Dramatic rev blip when user clicks "REV ENGINE" or hits spacebar
   */
  revEngine(carModel = null) {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.isMuted) this.toggleMute();

    const now = this.ctx.currentTime;
    const peakRpm = carModel?.id === 'bmw-e60-m5' ? 8400 : 7200; // E60 V10 screams higher!

    // Fast climb
    const startFundamental = (950 / 60) * 1.5;
    const peakFundamental = (peakRpm / 60) * 1.5;

    this.engineOsc1.frequency.cancelScheduledValues(now);
    this.engineOsc1.frequency.setValueAtTime(startFundamental, now);
    this.engineOsc1.frequency.exponentialRampToValueAtTime(peakFundamental, now + 0.45);
    this.engineOsc1.frequency.exponentialRampToValueAtTime(startFundamental, now + 1.2);

    this.engineOsc2.frequency.cancelScheduledValues(now);
    this.engineOsc2.frequency.setValueAtTime(startFundamental * 2, now);
    this.engineOsc2.frequency.exponentialRampToValueAtTime(peakFundamental * 2, now + 0.45);
    this.engineOsc2.frequency.exponentialRampToValueAtTime(startFundamental * 2, now + 1.2);

    this.engineFilter.frequency.cancelScheduledValues(now);
    this.engineFilter.frequency.setValueAtTime(400, now);
    this.engineFilter.frequency.linearRampToValueAtTime(3200, now + 0.45);
    this.engineFilter.frequency.linearRampToValueAtTime(400, now + 1.2);

    // Turbo spool up and discharge
    if (this.turboGain) {
      this.turboGain.gain.cancelScheduledValues(now);
      this.turboGain.gain.setValueAtTime(0.01, now);
      this.turboGain.gain.linearRampToValueAtTime(0.12, now + 0.45);
      this.turboGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    }

    // Exhaust crackle on overrun
    setTimeout(() => {
      this.triggerExhaustPop();
    }, 600);
  }

  /**
   * Retrieves live visualizer frequencies for canvas/DOM equalizer
   */
  getVisualizerData() {
    if (!this.analyser || !this.dataArray || this.isMuted) {
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    const bins = 8;
    const step = Math.floor(this.dataArray.length / bins);
    const result = [];
    for (let i = 0; i < bins; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += this.dataArray[i * step + j];
      }
      result.push(sum / (step * 255));
    }
    return result;
  }
}

export const audioEngine = new BMWAudioEngine();
