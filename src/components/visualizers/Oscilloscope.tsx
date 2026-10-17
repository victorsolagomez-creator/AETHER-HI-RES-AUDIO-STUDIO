/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';

export const Oscilloscope: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

      // Dark oscilloscope screen
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope reticle lines
      ctx.strokeStyle = '#131b27';
      ctx.lineWidth = 1;
      const midY = height / 2;

      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Quarter divisions
      ctx.beginPath();
      ctx.moveTo(0, height * 0.25);
      ctx.lineTo(width, height * 0.25);
      ctx.moveTo(0, height * 0.75);
      ctx.lineTo(width, height * 0.75);
      ctx.stroke();

      if (left && right) {
        const bufferLength = left.fftSize;
        const dataL = new Float32Array(bufferLength);
        const dataR = new Float32Array(bufferLength);
        left.getFloatTimeDomainData(dataL);
        right.getFloatTimeDomainData(dataR);

        // Simple trigger synchronization: find positive zero crossing
        let triggerIndex = 0;
        for (let i = 0; i < bufferLength / 2; i++) {
          if (dataL[i] < 0 && dataL[i + 1] >= 0) {
            triggerIndex = i;
            break;
          }
        }

        const renderPoints = 512;
        const stepX = width / renderPoints;

        // Draw Right Channel (Purple/Violet)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < renderPoints; i++) {
          const sampleIdx = Math.min(bufferLength - 1, triggerIndex + i * 2);
          const sample = dataR[sampleIdx] || 0;
          const y = midY - sample * (height * 0.42);
          const x = i * stepX;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Left Channel (Cyan)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < renderPoints; i++) {
          const sampleIdx = Math.min(bufferLength - 1, triggerIndex + i * 2);
          const sample = dataL[sampleIdx] || 0;
          const y = midY - sample * (height * 0.42);
          const x = i * stepX;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-2 left-3 flex items-center gap-4 text-[10px] font-mono tracking-wider pointer-events-none">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2 h-0.5 bg-cyan-400 rounded-xs"></span>
          CH1 LEFT (FLOAT32)
        </span>
        <span className="flex items-center gap-1.5 text-purple-400">
          <span className="w-2 h-0.5 bg-purple-400 rounded-xs"></span>
          CH2 RIGHT (FLOAT32)
        </span>
        <span className="text-slate-500">TRIG: ZERO-CROSS AUTO</span>
      </div>
    </div>
  );
};
