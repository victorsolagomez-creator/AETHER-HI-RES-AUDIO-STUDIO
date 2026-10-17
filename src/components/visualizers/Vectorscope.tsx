/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';

export const Vectorscope: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [correlation, setCorrelation] = useState<number>(1.0);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animId = requestAnimationFrame(render);
      const { left, right } = audioEngine.getAnalysers();
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
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) * 0.85;

      // Dark background
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, width, height);

      // Polar coordinate concentric circles (0.25, 0.5, 0.75, 1.0)
      ctx.strokeStyle = '#151d2a';
      ctx.lineWidth = 1;
      for (const rFrac of [0.25, 0.5, 0.75, 1.0]) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * rFrac, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 45-degree stereo axes (+S, -S, M)
      ctx.beginPath();
      // Mid axis (Vertical)
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      // Side axis (Horizontal)
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      // Left 45 axis
      ctx.moveTo(cx - radius * 0.707, cy - radius * 0.707);
      ctx.lineTo(cx + radius * 0.707, cy + radius * 0.707);
      // Right 45 axis
      ctx.moveTo(cx + radius * 0.707, cy - radius * 0.707);
      ctx.lineTo(cx - radius * 0.707, cy + radius * 0.707);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('+M (MONO)', cx - 26, cy - radius - 5);
      ctx.fillText('-S', cx - radius - 18, cy + 3);
      ctx.fillText('+S', cx + radius + 5, cy + 3);
      ctx.fillText('L', cx - radius * 0.707 - 12, cy - radius * 0.707);
      ctx.fillText('R', cx + radius * 0.707 + 4, cy - radius * 0.707);

      if (left && right && audioEngine.getIsPlaying()) {
        const bufferLength = left.fftSize;
        const dataL = new Float32Array(bufferLength);
        const dataR = new Float32Array(bufferLength);
        left.getFloatTimeDomainData(dataL);
        right.getFloatTimeDomainData(dataR);

        const points = 256;
        let dotSum = 0;
        let sumL = 0;
        let sumR = 0;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';

        for (let i = 0; i < points; i++) {
          const l = dataL[i * 4] || 0;
          const r = dataR[i * 4] || 0;

          sumL += l * l;
          sumR += r * r;
          dotSum += l * r;

          // Goniometer rotation:
          // X = (R - L) * cos(45)
          // Y = -(R + L) * sin(45)
          const side = (r - l) * 0.7071;
          const mid = (r + l) * 0.7071;

          const px = cx + side * radius * 1.2;
          const py = cy - mid * radius * 1.2;

          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        const denom = Math.sqrt(sumL * sumR);
        const corr = denom > 0.0001 ? Math.max(-1, Math.min(1, dotSum / denom)) : 1.0;
        setCorrelation(corr);
      }

      ctx.restore();
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 bg-[#080a0f]">
      <canvas ref={canvasRef} className="w-full flex-1 block" />

      {/* Phase correlation meter bar at bottom */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
        <span className="text-slate-400">PHASE CORRELATION</span>
        <div className="flex items-center gap-3 w-48">
          <span className="text-rose-400 text-[10px]">-1</span>
          <div className="relative flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 bottom-0 transition-all duration-75 rounded-full ${
                correlation > 0.5 ? 'bg-emerald-400' : correlation > 0 ? 'bg-cyan-400' : 'bg-rose-500'
              }`}
              style={{
                left: `${((correlation + 1) / 2) * 100 - 3}%`,
                width: '6px',
              }}
            />
            {/* Center zero mark */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600 -translate-x-1/2" />
          </div>
          <span className="text-emerald-400 text-[10px]">+1</span>
          <span className="text-cyan-300 font-bold tabular-nums w-10 text-right">
            {correlation >= 0 ? `+${correlation.toFixed(2)}` : correlation.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
