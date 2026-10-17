/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';
import { AudioMetadata } from '../../types/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Radio,
  FileAudio,
  Download,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Props {
  metadata: AudioMetadata | null;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const TransportBar: React.FC<Props> = ({ metadata, isZenMode, onToggleZenMode }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(audioEngine.getIsPlaying());
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(audioEngine.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);

  const peaks = metadata?.waveformPeaks || [];

  useEffect(() => {
    const onStateChange = () => {
      setIsPlaying(audioEngine.getIsPlaying());
      setDuration(audioEngine.getDuration());
    };

    audioEngine.registerStateChangeCallback(onStateChange);

    const interval = setInterval(() => {
      setCurrentTime(audioEngine.getCurrentTime());
      setDuration(audioEngine.getDuration());
      setIsPlaying(audioEngine.getIsPlaying());

      if (
        isLooping &&
        audioEngine.getCurrentTime() >= audioEngine.getDuration() - 0.2 &&
        audioEngine.getDuration() > 0
      ) {
        audioEngine.seek(0);
        audioEngine.play();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (audioEngine.getIsPlaying()) audioEngine.pause();
        else audioEngine.play();
        setIsPlaying(audioEngine.getIsPlaying());
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audioEngine.seek(audioEngine.getCurrentTime() - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        audioEngine.seek(audioEngine.getCurrentTime() + 5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF' && onToggleZenMode) {
        e.preventDefault();
        onToggleZenMode();
      } else if (e.code === 'KeyN') {
        e.preventDefault();
        audioEngine.playNext();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        audioEngine.playPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLooping, isMuted, volume, onToggleZenMode]);

  const togglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
    setIsPlaying(audioEngine.getIsPlaying());
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    audioEngine.seek(target);
    setCurrentTime(target);
  };

  const handleMouseMoveScrubber = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = frac * duration;
    setHoverTime({ time: t, x: e.clientX - rect.left });
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioEngine.setVolume(val);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioEngine.setVolume(volume || 0.85);
      setIsMuted(false);
    } else {
      audioEngine.setVolume(0);
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setConfig({ playbackRate: rate });
  };

  const handleExportWav = () => {
    setIsExporting(true);
    try {
      const blob = audioEngine.exportProcessedWav();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = (metadata?.title || 'aether_master').toLowerCase().replace(/\s+/g, '_');
        a.download = `${name}_pure_master_24bit.wav`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00.00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-[#0b0f19] border-t border-slate-800 px-4 py-3 text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Scrubber Rail with Audio Waveform Overview */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-cyan-400 tabular-nums w-16 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="relative flex-1 flex items-center h-8 cursor-pointer group"
            onMouseMove={handleMouseMoveScrubber}
            onMouseLeave={() => setHoverTime(null)}
          >
            {/* Waveform Peaks background */}
            <div className="absolute inset-x-0 h-6 flex items-center gap-px pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
              {peaks.length > 0
                ? peaks.map((p, idx) => {
                    const isPlayed = (idx / peaks.length) * 100 <= progressPercent;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-xs transition-colors ${
                          isPlayed ? 'bg-cyan-400' : 'bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(12, p * 100)}%` }}
                      />
                    );
                  })
                : (
                    <div className="w-full h-1 bg-slate-800 rounded-full" />
                  )}
            </div>

            {/* Custom progress highlight bar */}
            <div className="absolute left-0 right-0 h-1 bg-slate-800/80 rounded-full overflow-hidden pointer-events-none">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Lyric verse cue pins */}
            {metadata?.syncedLyrics && duration > 0 && (
              <div className="absolute inset-x-0 h-4 pointer-events-none z-5 flex items-center">
                {metadata.syncedLyrics.map((line, idx) => {
                  const pct = Math.min(100, Math.max(0, (line.time / duration) * 100));
                  return (
                    <div
                      key={idx}
                      className="absolute w-0.5 h-2 bg-cyan-400/50 rounded-full"
                      style={{ left: `${pct}%` }}
                      title={`Verso ${idx + 1}: ${line.text}`}
                    />
                  );
                })}
              </div>
            )}

            {/* Range Scrubber */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-8 opacity-0 cursor-pointer z-10"
            />

            {/* Hover timestamp tooltip */}
            {hoverTime && (
              <div
                className="absolute pointer-events-none -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 shadow-md"
                style={{ left: hoverTime.x }}
              >
                {formatTime(hoverTime.time)}
              </div>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-500 tabular-nums w-16">
            {formatTime(duration)}
          </span>
        </div>

        {/* Transport Controls & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 max-w-sm">
            {metadata?.albumArtUrl ? (
              <img
                src={metadata.albumArtUrl}
                alt="Album Art"
                className="w-10 h-10 rounded border border-slate-800 object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded border border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                <FileAudio className="w-5 h-5 text-cyan-400" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-100 truncate">
                {metadata?.title || 'No Audio Stream Loaded'}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {metadata?.artist || 'Select or drop a Hi-Res track to begin'}
              </p>
            </div>
          </div>

          {/* Primary Transport Buttons with Next/Prev Queue Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => audioEngine.playPrevious()}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
              title="Pista anterior (P)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => audioEngine.seek(0)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
              title="Reiniciar pista"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause (Espacio)' : 'Play (Espacio)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => audioEngine.playNext()}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-full transition-colors cursor-pointer"
              title="Pista siguiente (N)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isLooping
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
              title="Repetir bucle"
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Varispeed Pitch/Tempo selector */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-[10px] font-mono ml-1">
              {[0.75, 1.0, 1.25].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    playbackRate === rate ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Volume, Zen Mode & Export */}
          <div className="flex items-center gap-3">
            {onToggleZenMode && (
              <button
                onClick={onToggleZenMode}
                className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer ${
                  isZenMode
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-slate-100'
                }`}
                title="Modo Zen de Escucha Pura (F)"
              >
                {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isZenMode ? 'Salir Zen' : 'Modo Zen'}</span>
              </button>
            )}

            <button
              onClick={handleExportWav}
              disabled={isExporting || !metadata}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-mono cursor-pointer transition-colors disabled:opacity-40"
              title="Exportar archivo master WAV a 24 bits sin pérdida"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Master WAV</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
                title="Silenciar (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-300" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolume}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 tabular-nums w-8">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-400">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="hidden md:inline">PASSTHROUGH</span>
              <span>100% BIT-PERFECT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
