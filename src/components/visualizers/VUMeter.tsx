/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';

export const VUMeter: React.FC = () => {
  const [levels, setLevels] = useState<{
    peakL: number;
    peakR: number;
    rmsL: number;
    rmsR: number;
    clipL: boolean;
    clipR: boolean;
  }>({
    peakL: -60,
    peakR: -60,
    rmsL: 0,
    rmsR: 0,
    clipL: false,
    clipR: false,
  });

  useEffect(() => {
    let animId: number;

    const updateMeters = () => {
      animId = requestAnimationFrame(updateMeters);
      const tele = audioEngine.getTelemetry();

      setLevels({
        peakL: tele.truePeakL,
        peakR: tele.truePeakR,
        rmsL: tele.rmsL,
        rmsR: tele.rmsR,
        clipL: tele.truePeakL >= -0.1,
        clipR: tele.truePeakR >= -0.1,
      });
    };

    updateMeters();
    return () => cancelAnimationFrame(animId);
  }, []);

  const dBs = [0, -3, -6, -12, -18, -24, -36, -48, -60];

  const calculatePct = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    return ((db + 60) / 60) * 100;
  };

  const pctL = calculatePct(levels.peakL);
  const pctR = calculatePct(levels.peakR);
  const rmsPctL = Math.min(100, levels.rmsL * 150);
  const rmsPctR = Math.min(100, levels.rmsR * 150);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-[#080a0f] text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <span className="text-xs uppercase font-mono tracking-wider text-cyan-400">
          Studio Master Peak / RMS Meters
        </span>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="text-slate-400">SCALE: dBFS TRUE PEAK (ITU-R BS.1770)</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5 my-auto max-w-xl mx-auto w-full">
        {/* Left Channel */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-bold text-cyan-400">CH 1 · LEFT</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Peak: <strong className="text-slate-200 tabular-nums">{levels.peakL > -60 ? `${levels.peakL.toFixed(1)} dB` : '-INF'}</strong>
              </span>
              <span
                className={`px-1 rounded text-[9px] font-bold ${
                  levels.clipL ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-600'
                }`}
              >
                CLIP
              </span>
            </div>
          </div>
          <div className="relative h-6 bg-slate-900 border border-slate-800 rounded overflow-hidden">
            {/* Meter Bar */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-cyan-400 to-rose-500 transition-all duration-75"
              style={{ width: `${pctL}%` }}
            />
            {/* RMS overlay */}
            <div
              className="absolute top-1 bottom-1 left-0 bg-white/20 border-r-2 border-white pointer-events-none"
              style={{ width: `${rmsPctL}%` }}
            />
          </div>
        </div>

        {/* dB Scale ticks */}
        <div className="flex justify-between px-1 text-[9px] font-mono text-slate-500 select-none">
          {dBs.map((db) => (
            <span key={db}>{db}</span>
          ))}
        </div>

        {/* Right Channel */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="font-bold text-purple-400">CH 2 · RIGHT</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Peak: <strong className="text-slate-200 tabular-nums">{levels.peakR > -60 ? `${levels.peakR.toFixed(1)} dB` : '-INF'}</strong>
              </span>
              <span
                className={`px-1 rounded text-[9px] font-bold ${
                  levels.clipR ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-600'
                }`}
              >
                CLIP
              </span>
            </div>
          </div>
          <div className="relative h-6 bg-slate-900 border border-slate-800 rounded overflow-hidden">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-cyan-400 to-rose-500 transition-all duration-75"
              style={{ width: `${pctR}%` }}
            />
            <div
              className="absolute top-1 bottom-1 left-0 bg-white/20 border-r-2 border-white pointer-events-none"
              style={{ width: `${rmsPctR}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Ballistics: 5ms Attack / 1.7s True Peak Hold</span>
        <span className="text-emerald-400 font-semibold">Headroom: +18.0 dBu Inter-Sample Margin</span>
      </div>
    </div>
  );
};
