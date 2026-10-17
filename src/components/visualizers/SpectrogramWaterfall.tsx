/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';

interface Props {
  sampleRate: number;
}

export const SpectrogramWaterfall: React.FC<Props> = ({ sampleRate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ freq: number; db: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    const offCtx = offCanvas.getContext('2d');

    const colorLookup: string[] = [];
    // Pre-calculate 256 color lookup palette for fast rendering
    for (let i = 0; i < 256; i++) {
      const norm = i / 255;
      if (norm < 0.2) {
        // Deep obsidian navy
        const b = Math.round(norm * 5 * 120);
        colorLookup.push(`rgb(8, 12, ${b})`);
      } else if (norm < 0.5) {
        // Cyan / Blue transition
        const t = (norm - 0.2) / 0.3;
        const g = Math.round(t * 182);
        const b = Math.round(120 + t * 92);
        colorLookup.push(`rgb(6, ${g}, ${b})`);
      } else if (norm < 0.8) {
        // Purple / Magenta transition
        const t = (norm - 0.5) / 0.3;
        const r = Math.round(6 + t * 200);
        const g = Math.round(182 * (1 - t * 0.5));
        const b = 212;
        colorLookup.push(`rgb(${r}, ${g}, ${b})`);
      } else {
        // Hot White / Gold peak
        const t = (norm - 0.8) / 0.2;
        const r = 255;
        const g = Math.round(120 + t * 135);
        const b = Math.round(212 + t * 43);
        colorLookup.push(`rgb(${r}, ${g}, ${b})`);
      }
    }

    const render = () => {
      animId = requestAnimationFrame(render);
      const { master } = audioEngine.getAnalysers();
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        if (offCtx) {
          offCtx.fillStyle = '#080a0f';
          offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Scroll off-screen canvas 1px to the left
      if (offCtx && master) {
        offCtx.drawImage(offCanvas, -1.5, 0);

        const bufferLength = master.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        master.getFloatFrequencyData(dataArray);

        const nyquist = (audioEngine.getAudioContext().sampleRate || 48000) / 2;
        const minFreq = 20;
        const maxFreq = Math.min(sampleRate / 2, 48000);
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);

        const numBinsY = Math.round(height);
        const sliceX = Math.round(width * dpr - 2);

        for (let y = 0; y < numBinsY; y++) {
          const normY = 1 - y / numBinsY; // Top is high freq, bottom is 20Hz
          const freq = Math.pow(10, logMin + normY * (logMax - logMin));
          const bin = Math.min(bufferLength - 1, Math.round((freq / nyquist) * bufferLength));

          let db = dataArray[bin];
          if (db === -Infinity || isNaN(db)) db = -100;
          db = Math.max(-100, Math.min(0, db));

          const normVal = Math.round(((db + 100) / 100) * 255);
          offCtx.fillStyle = colorLookup[normVal] || '#080a0f';
          offCtx.fillRect(sliceX, y * dpr, 2, dpr);
        }
      }

      // Draw the scrolling waterfall buffer to screen
      ctx.drawImage(offCanvas, 0, 0, width, height);

      // Draw frequency guide lines & labels
      const gridFreqs = [50, 200, 1000, 5000, 15000, 30000].filter((f) => f <= sampleRate / 2);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';

      for (const f of gridFreqs) {
        const minFreq = 20;
        const maxFreq = Math.min(sampleRate / 2, 48000);
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);
        const normY = (Math.log10(f) - logMin) / (logMax - logMin);
        const y = height * (1 - normY);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        const label = f >= 1000 ? `${f / 1000}k` : `${f}Hz`;
        ctx.fillText(label, 6, y - 3);
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

    const minFreq = 20;
    const maxFreq = Math.min(sampleRate / 2, 48000);
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const normY = Math.max(0, Math.min(1, 1 - y / rect.height));
    const freq = Math.pow(10, logMin + normY * (logMax - logMin));

    setHoverInfo({ freq: Math.round(freq), db: -32.5, x, y });
  };

  return (
    <div className="relative w-full h-full group">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        className="w-full h-full block cursor-crosshair"
      />
      <div className="absolute top-2 right-3 flex items-center gap-2 text-[10px] font-mono tracking-wider pointer-events-none bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
        <span className="text-cyan-400">2D WATERFALL HEATMAP</span>
        <span className="text-slate-500">· 60 FPS SPECTROGRAM</span>
      </div>
      {hoverInfo && (
        <div
          className="absolute pointer-events-none px-2 py-1 bg-[#0f172a]/95 border border-cyan-500/30 rounded text-[11px] font-mono text-cyan-300 shadow-lg -translate-x-1/2 -translate-y-9 backdrop-blur-xs"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <span>Freq: {hoverInfo.freq >= 1000 ? `${(hoverInfo.freq / 1000).toFixed(2)} kHz` : `${hoverInfo.freq} Hz`}</span>
        </div>
      )}
    </div>
  );
};
