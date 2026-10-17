/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';

interface Props {
  sampleRate: number;
}

function freqToNote(f: number): string {
  if (f <= 0) return '';
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midiFloat = 12 * Math.log2(f / 440) + 69;
  const midi = Math.round(midiFloat);
  if (midi < 12 || midi > 127) return '';
  const note = notes[midi % 12];
  const oct = Math.floor(midi / 12) - 1;
  const cents = Math.round((midiFloat - midi) * 100);
  const centsStr = cents > 0 ? `+${cents}¢` : cents < 0 ? `${cents}¢` : '0¢';
  return ` (${note}${oct} ${centsStr})`;
}

export const SpectrumAnalyzer: React.FC<Props> = ({ sampleRate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverData, setHoverData] = useState<{ freq: number; db: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const peakArray = new Float32Array(512).fill(-120);

    const render = () => {
      animId = requestAnimationFrame(render);
      const { master } = audioEngine.getAnalysers();
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      // Dark canvas clear with subtle grid
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw octave frequency grid lines (20, 50, 100, 250, 500, 1k, 2k, 4k, 8k, 16k, 24k, 48k)
      const maxDisplayFreq = Math.min(sampleRate / 2, 48000);
      const minDisplayFreq = 20;
      const gridFreqs = [20, 50, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 24000, 48000].filter(
        (f) => f <= maxDisplayFreq
      );

      ctx.strokeStyle = '#151d2a';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';

      for (const f of gridFreqs) {
        const logMin = Math.log10(minDisplayFreq);
        const logMax = Math.log10(maxDisplayFreq);
        const norm = (Math.log10(f) - logMin) / (logMax - logMin);
        const x = norm * width;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 18);
        ctx.stroke();

        const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
        ctx.fillText(label, x + 3, height - 6);
      }

      // Draw dB horizontal grid (-6, -12, -24, -48, -72 dB)
      const dBs = [-6, -18, -36, -60, -90];
      for (const db of dBs) {
        const normDb = (db + 100) / 100;
        const y = height - 20 - normDb * (height - 30);

        ctx.beginPath();
        ctx.strokeStyle = '#121926';
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillText(`${db}dB`, 4, y - 3);
      }

      if (master) {
        const bufferLength = master.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        master.getFloatFrequencyData(dataArray);

        const nyquist = (audioEngine.getAudioContext().sampleRate || 48000) / 2;
        const pointsCount = 1024;
        const stepX = width / pointsCount;

        // Create gradient fill for Hi-Res audio spectrum
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#06b6d4'); // Cyan sub/bass
        grad.addColorStop(0.3, '#3b82f6'); // Blue mids
        grad.addColorStop(0.7, '#8b5cf6'); // Purple presence
        grad.addColorStop(1, '#ec4899'); // Pink ultrasonic

        ctx.beginPath();
        ctx.moveTo(0, height - 20);

        for (let i = 0; i < pointsCount; i++) {
          const normX = i / pointsCount;
          const logMin = Math.log10(minDisplayFreq);
          const logMax = Math.log10(maxDisplayFreq);
          const targetFreq = Math.pow(10, logMin + normX * (logMax - logMin));
          const bin = Math.min(bufferLength - 1, Math.round((targetFreq / nyquist) * bufferLength));

          let val = dataArray[bin];
          if (val === -Infinity || isNaN(val)) val = -120;
          val = Math.max(-100, Math.min(0, val));

          const normY = (val + 100) / 100;
          const y = height - 20 - normY * (height - 30);
          const x = i * stepX;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          // Peak hold decay
          if (y < peakArray[i]) {
            peakArray[i] = y;
          } else {
            peakArray[i] += 0.55; // decay
          }
        }

        ctx.lineTo(width, height - 20);
        ctx.closePath();

        // Subtle glowing fill
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.fill();

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Peak Hold markers
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < pointsCount; i += 2) {
          const x = i * stepX;
          const py = Math.min(height - 20, peakArray[i]);
          ctx.beginPath();
          ctx.moveTo(x, py);
          ctx.lineTo(x + stepX, py);
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [sampleRate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDisplayFreq = Math.min(sampleRate / 2, 48000);
    const minDisplayFreq = 20;
    const logMin = Math.log10(minDisplayFreq);
    const logMax = Math.log10(maxDisplayFreq);
    const normX = Math.max(0, Math.min(1, x / rect.width));
    const freq = Math.pow(10, logMin + normX * (logMax - logMin));

    const normY = Math.max(0, Math.min(1, (rect.height - 20 - y) / (rect.height - 30)));
    const db = -100 + normY * 100;

    setHoverData({ freq: Math.round(freq), db: Number(db.toFixed(1)), x, y });
  };

  return (
    <div className="relative w-full h-full group">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverData(null)}
        className="w-full h-full block cursor-crosshair"
      />
      {hoverData && (
        <div
          className="absolute pointer-events-none px-2 py-1 bg-[#0f172a]/95 border border-cyan-500/30 rounded text-[11px] font-mono text-cyan-300 shadow-lg -translate-x-1/2 -translate-y-9 backdrop-blur-xs"
          style={{ left: hoverData.x, top: hoverData.y }}
        >
          <span className="text-slate-400 font-sans">Freq:</span>{' '}
          {hoverData.freq >= 1000 ? `${(hoverData.freq / 1000).toFixed(2)} kHz` : `${hoverData.freq} Hz`}
          <span className="text-purple-300 font-bold">{freqToNote(hoverData.freq)}</span>
          <span className="mx-1 text-slate-600">·</span>
          <span className="text-slate-400 font-sans">Level:</span> {hoverData.db} dBFS
        </div>
      )}
    </div>
  );
};
