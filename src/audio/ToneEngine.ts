import * as Tone from "tone";

class ToneEngine {
  private player: Tone.GrainPlayer | null = null;
  private pitchShift: Tone.PitchShift;
  private eq: Tone.EQ3;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private analyzer: Tone.Analyser;
  private recorder: Tone.Recorder;
  private playbackRate: number = 1;

  constructor() {
    this.pitchShift = new Tone.PitchShift(0);
    this.eq = new Tone.EQ3(0, 0, 0);
    this.delay = new Tone.FeedbackDelay("8n", 0);
    this.reverb = new Tone.Reverb({ decay: 1.5, wet: 0 });
    this.analyzer = new Tone.Analyser("waveform", 256);
    this.recorder = new Tone.Recorder();

    // Initial dry/wet
    this.delay.wet.value = 0;
    this.reverb.wet.value = 0;

    // Connect chain
    // player is created dynamically on file load
    this.pitchShift.chain(this.eq, this.delay, this.reverb, Tone.getDestination());
    this.reverb.connect(this.analyzer);
    this.reverb.connect(this.recorder);
  }

  async loadFile(url: string) {
    if (this.player) {
      this.player.dispose();
    }

    this.player = new Tone.GrainPlayer(url, () => {
      console.log("Audio loaded");
    });
    
    this.player.playbackRate = this.playbackRate;
    this.player.connect(this.pitchShift);
    await Tone.loaded();
  }

  play() {
    if (this.player) {
      Tone.start();
      this.player.start();
    }
  }

  pause() {
    if (this.player) {
      this.player.stop(); // GrainPlayer stop is more like pause if handled correctly, or we can use stop/start
    }
  }

  stop() {
    if (this.player) {
      this.player.stop();
    }
  }

  // Recording
  startRecording() {
    this.recorder.start();
  }

  async stopRecording(): Promise<Blob> {
    const blob = await this.recorder.stop();
    return blob;
  }

  // Effect controls
  setPitch(semitones: number) {
    this.pitchShift.pitch = semitones;
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.player) {
      this.player.playbackRate = rate;
    }
  }

  setDetune(detune: number) {
    if (this.player) {
      this.player.detune = detune;
    }
  }

  setEQ(low: number, mid: number, high: number) {
    this.eq.low.value = low;
    this.eq.mid.value = mid;
    this.eq.high.value = high;
  }

  setDelay(delayTime: string | number, feedback: number, wet: number) {
    this.delay.delayTime.value = delayTime;
    this.delay.feedback.value = feedback;
    this.delay.wet.value = wet;
  }

  setReverb(decay: number, wet: number) {
    this.reverb.decay = decay;
    this.reverb.wet.value = wet;
  }

  getWaveformData() {
    return this.analyzer.getValue();
  }

  get isPlaying() {
    return this.player?.state === "started";
  }
}

export const toneEngine = new ToneEngine();
