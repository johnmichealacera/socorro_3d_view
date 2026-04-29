"use client";

import { useEffect, useRef, useState } from "react";

export default function SoundSystem() {
  const [started, setStarted] = useState(false);
  const [muted,   setMuted]   = useState(false);
  const ctxRef     = useRef<AudioContext | null>(null);
  const masterRef  = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const aliveRef   = useRef(true);

  useEffect(() => {
    if (!started) return;

    const ctx    = new AudioContext();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);
    masterRef.current = master;

    // ── Ocean rumble: filtered noise with wave-rhythm LFO ────────────────────
    function createOcean(): () => void {
      const rate   = ctx.sampleRate;
      const frames = rate * 4;
      const buf    = ctx.createBuffer(2, frames, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop   = true;

      const lpf = ctx.createBiquadFilter();
      lpf.type            = "lowpass";
      lpf.frequency.value = 160;
      lpf.Q.value         = 0.7;

      const wGain = ctx.createGain();
      wGain.gain.value = 0.38;

      // LFO: wave rhythm ~0.22 Hz
      const lfo     = ctx.createOscillator();
      lfo.type      = "sine";
      lfo.frequency.value = 0.22;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.24;
      lfo.connect(lfoGain);
      lfoGain.connect(wGain.gain);

      src.connect(lpf);
      lpf.connect(wGain);
      wGain.connect(master);
      src.start();
      lfo.start();

      return () => {
        try { src.stop(); lfo.stop(); } catch (_) { /* already stopped */ }
        [src, lfo, lfoGain, lpf, wGain].forEach(n => n.disconnect());
      };
    }

    // ── Wind: bandpass filtered noise ────────────────────────────────────────
    function createWind(): () => void {
      const rate   = ctx.sampleRate;
      const frames = rate * 6;
      const buf    = ctx.createBuffer(1, frames, rate);
      const d      = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop   = true;

      const bpf = ctx.createBiquadFilter();
      bpf.type            = "bandpass";
      bpf.frequency.value = 420;
      bpf.Q.value         = 0.55;

      const gain = ctx.createGain();
      gain.gain.value = 0.07;

      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(master);
      src.start();

      return () => {
        try { src.stop(); } catch (_) { /* already stopped */ }
        [src, bpf, gain].forEach(n => n.disconnect());
      };
    }

    // ── Seabird calls: random chirp tones ─────────────────────────────────────
    function scheduleBird(): void {
      if (!aliveRef.current) return;
      const delay = (12 + Math.random() * 22) * 1000;
      setTimeout(() => {
        if (!aliveRef.current || !ctxRef.current || ctx.state === "closed") return;
        const now  = ctx.currentTime;
        const osc  = ctx.createOscillator();
        const gn   = ctx.createGain();
        osc.type   = "sine";
        osc.frequency.setValueAtTime(1700 + Math.random() * 500, now);
        osc.frequency.exponentialRampToValueAtTime(1300 + Math.random() * 300, now + 0.35);
        gn.gain.setValueAtTime(0, now);
        gn.gain.linearRampToValueAtTime(0.055, now + 0.04);
        gn.gain.linearRampToValueAtTime(0, now + 0.38);
        osc.connect(gn);
        gn.connect(master);
        osc.start(now);
        osc.stop(now + 0.40);
        scheduleBird();
      }, delay);
    }

    // ── Church bell: simple tone every ~5 min ─────────────────────────────────
    function scheduleBell(): void {
      if (!aliveRef.current) return;
      const delay = (280 + Math.random() * 60) * 1000;
      setTimeout(() => {
        if (!aliveRef.current || !ctxRef.current || ctx.state === "closed") return;
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          const o  = ctx.createOscillator();
          const g  = ctx.createGain();
          o.type   = "sine";
          o.frequency.value = 523 + i * 131; // C, E, G
          g.gain.setValueAtTime(0, now + i * 1.2);
          g.gain.linearRampToValueAtTime(0.09, now + i * 1.2 + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 1.2 + 2.5);
          o.connect(g);
          g.connect(master);
          o.start(now + i * 1.2);
          o.stop(now + i * 1.2 + 2.6);
        }
        scheduleBell();
      }, delay);
    }

    // ── Rain: high-pass noise layer, triggered by socorro:weather event ─────────
    function createRainLayer(): () => void {
      const rate   = ctx.sampleRate;
      const frames = rate * 3;
      const buf    = ctx.createBuffer(1, frames, rate);
      const d      = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) d[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop   = true;

      const hpf = ctx.createBiquadFilter();
      hpf.type            = "highpass";
      hpf.frequency.value = 1400;

      const bpf = ctx.createBiquadFilter();
      bpf.type            = "bandpass";
      bpf.frequency.value = 3200;
      bpf.Q.value         = 0.28;

      const gain = ctx.createGain();
      gain.gain.value = 0; // silent until rain starts
      rainGainRef.current = gain;

      src.connect(hpf);
      hpf.connect(bpf);
      bpf.connect(gain);
      gain.connect(master);
      src.start();

      return () => {
        try { src.stop(); } catch (_) { /* already stopped */ }
        [src, hpf, bpf, gain].forEach(n => n.disconnect());
        rainGainRef.current = null;
      };
    }

    const handleWeather = (e: Event) => {
      const { raining } = (e as CustomEvent<{ raining: boolean }>).detail;
      if (rainGainRef.current && ctxRef.current) {
        rainGainRef.current.gain.setTargetAtTime(
          raining ? 0.20 : 0,
          ctxRef.current.currentTime,
          0.6
        );
      }
    };
    window.addEventListener("socorro:weather", handleWeather);

    const cleanOcean = createOcean();
    const cleanWind  = createWind();
    const cleanRain  = createRainLayer();
    scheduleBird();
    scheduleBell();

    return () => {
      aliveRef.current = false;
      window.removeEventListener("socorro:weather", handleWeather);
      cleanOcean();
      cleanWind();
      cleanRain();
      ctx.close();
      ctxRef.current = null;
    };
  }, [started]);

  // Mute/unmute via master gain
  useEffect(() => {
    const ctx    = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    master.gain.setTargetAtTime(muted ? 0 : 0.45, ctx.currentTime, 0.3);
  }, [muted]);

  const handleClick = () => {
    if (!started) {
      aliveRef.current = true;
      setStarted(true);
    } else {
      setMuted(m => !m);
    }
  };

  const icon  = !started ? "🔇" : muted ? "🔇" : "🔊";
  const label = !started ? "Enable ambient sound" : muted ? "Unmute" : "Mute";
  const lit   = started && !muted;

  return (
    <button
      onClick={handleClick}
      title={label}
      style={{
        position: "absolute",
        bottom: "1.2rem",
        left: "1rem",
        width:  "36px",
        height: "36px",
        background:    "rgba(4,10,22,0.70)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${lit ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.09)"}`,
        borderRadius: "50%",
        color:  lit ? "#38bdf8" : "#6888aa",
        fontSize: "1rem",
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 50,
        transition: "all 0.2s",
      }}
    >
      {icon}
    </button>
  );
}
