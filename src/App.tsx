import { useState, useEffect, useRef } from "react";
import "./App.css";
import { toneEngine } from "./audio/ToneEngine";
import { FileUploader } from "./components/FileUploader";
import { ControlSlider } from "./components/ControlSlider";
import { audioBufferToWav } from "./utils/audioEncoder";
import * as Tone from "tone";

function App() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Effect States
  const [pitch, setPitch] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  const [reverbWet, setReverbWet] = useState(0);
  const [delayWet, setDelayWet] = useState(0);
  const [delayTime, setDelayTime] = useState(0.25);
  const [delayFeedback, setDelayFeedback] = useState(0.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Visualization loop
    let animationFrame: number;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const render = () => {
        if (ctx) {
          const values = toneEngine.getWaveformData();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.beginPath();
          ctx.strokeStyle = "#00ffcc";
          ctx.lineWidth = 2;
          const sliceWidth = canvas.width / values.length;
          let x = 0;
          for (let i = 0; i < values.length; i++) {
            const val = values[i];
            const v = (typeof val === "number" ? val : 0) * 0.5 + 0.5;
            const y = v * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        }
        animationFrame = requestAnimationFrame(render);
      };
      render();
    }
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      toneEngine.stop();
    } else {
      toneEngine.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleRecord = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      try {
        const webmBlob = await toneEngine.stopRecording();
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
        const wavBlob = audioBufferToWav(audioBuffer);
        
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `synth-export-${Date.now()}.wav`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Recording failed:", err);
      } finally {
        setIsProcessing(false);
      }
    } else {
      toneEngine.startRecording();
      setIsRecording(true);
    }
  };

  // Handlers
  const handlePitchChange = (v: number) => {
    setPitch(v);
    toneEngine.setPitch(v);
  };

  const handleRateChange = (v: number) => {
    setPlaybackRate(v);
    toneEngine.setPlaybackRate(v);
  };

  const handleEqChange = (l: number, m: number, h: number) => {
    setEqLow(l);
    setEqMid(m);
    setEqHigh(h);
    toneEngine.setEQ(l, m, h);
  };

  const handleReverbChange = (v: number) => {
    setReverbWet(v);
    toneEngine.setReverb(1.5, v);
  };

  const handleDelayChange = (time: number, feedback: number, wet: number) => {
    setDelayTime(time);
    setDelayFeedback(feedback);
    setDelayWet(wet);
    toneEngine.setDelay(time, feedback, wet);
  };

  return (
    <div className="app-container">
      <header>
        <div>
          <h1>Web Synth</h1>
        </div>
        <FileUploader onFileLoaded={setFileName} />
        {fileName && <div className="file-info">Loaded: {fileName}</div>}
      </header>

      <main>
        <div className="visualizer-container">
          <canvas ref={canvasRef} width={800} height={200} />
        </div>

        <div className="transport-controls">
          <button className={`play-btn ${isPlaying ? "playing" : ""}`} onClick={togglePlay} disabled={!fileName}>
            {isPlaying ? "STOP" : "PLAY"}
          </button>
          <button 
            className={`record-btn ${isRecording ? "recording" : ""}`} 
            onClick={toggleRecord} 
            disabled={!fileName || isProcessing}
          >
            {isProcessing ? "PROCESSING..." : isRecording ? "STOP RECORD" : "RECORD"}
          </button>
        </div>

        <div className="effects-grid">
          <section className="effect-section">
            <h3>Pitch & Time</h3>
            <ControlSlider
              label="Pitch Shift"
              min={-12}
              max={12}
              step={1}
              value={pitch}
              defaultValue={0}
              unit=" st"
              onChange={handlePitchChange}
            />
            <ControlSlider
              label="Time Stretch"
              min={0.1}
              max={2}
              step={0.01}
              value={playbackRate}
              defaultValue={1}
              unit="x"
              onChange={handleRateChange}
            />
          </section>

          <section className="effect-section">
            <h3>Equalizer</h3>
            <ControlSlider
              label="Low"
              min={-24}
              max={24}
              step={0.1}
              value={eqLow}
              defaultValue={0}
              unit=" dB"
              onChange={(v) => handleEqChange(v, eqMid, eqHigh)}
            />
            <ControlSlider
              label="Mid"
              min={-24}
              max={24}
              step={0.1}
              value={eqMid}
              defaultValue={0}
              unit=" dB"
              onChange={(v) => handleEqChange(eqLow, v, eqHigh)}
            />
            <ControlSlider
              label="High"
              min={-24}
              max={24}
              step={0.1}
              value={eqHigh}
              defaultValue={0}
              unit=" dB"
              onChange={(v) => handleEqChange(eqLow, eqMid, v)}
            />
          </section>

          <section className="effect-section">
            <h3>Reverb</h3>
            <ControlSlider
              label="Mix"
              min={0}
              max={1}
              step={0.01}
              value={reverbWet}
              defaultValue={0}
              onChange={handleReverbChange}
            />
          </section>

          <section className="effect-section">
            <h3>Delay</h3>
            <ControlSlider
              label="Time"
              min={0.01}
              max={1}
              step={0.01}
              value={delayTime}
              defaultValue={0.25}
              unit="s"
              onChange={(v) => handleDelayChange(v, delayFeedback, delayWet)}
            />
            <ControlSlider
              label="Feedback"
              min={0}
              max={0.9}
              step={0.01}
              value={delayFeedback}
              defaultValue={0.5}
              onChange={(v) => handleDelayChange(delayTime, v, delayWet)}
            />
            <ControlSlider
              label="Mix"
              min={0}
              max={1}
              step={0.01}
              value={delayWet}
              defaultValue={0}
              onChange={(v) => handleDelayChange(delayTime, delayFeedback, v)}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
