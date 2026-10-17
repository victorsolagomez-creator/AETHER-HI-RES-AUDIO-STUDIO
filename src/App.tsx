/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { AudioMetadata, VisualizerMode } from './types/audio';
import { audioEngine } from './audio/engine/HyperPepinoAudioEngine';
import { PRELOADED_TRACKS } from './audio/library/masterLibrary';
import { TelemetryHUD } from './components/telemetry/TelemetryHUD';
import { SpectrumAnalyzer } from './components/visualizers/SpectrumAnalyzer';
import { SpectrogramWaterfall } from './components/visualizers/SpectrogramWaterfall';
import { Oscilloscope } from './components/visualizers/Oscilloscope';
import { BitDepthMeter } from './components/visualizers/BitDepthMeter';
import { Vectorscope } from './components/visualizers/Vectorscope';
import { VUMeter } from './components/visualizers/VUMeter';
import { LyricsViewer } from './components/lyrics/LyricsViewer';
import { HyperPepinoPanel } from './components/panels/HyperPepinoPanel';
import { TrackQueue } from './components/queue/TrackQueue';
import { TransportBar } from './components/transport/TransportBar';
import { ArchitectureModal } from './components/modals/ArchitectureModal';
import {
  Upload,
  BarChart2,
  Activity,
  Binary,
  Compass,
  Volume2,
  Flame,
  Waves,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [currentMetadata, setCurrentMetadata] = useState<AudioMetadata | null>(null);
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerMode>('spectrum');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isOverclocked, setIsOverclocked] = useState(audioEngine.getConfig().overclockBoost);
  const [isPureDirect, setIsPureDirect] = useState(audioEngine.getConfig().pureDirectLossless);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize with reference Chopin 24-bit / 96kHz FLAC master on load
  useEffect(() => {
    const defaultTrack = PRELOADED_TRACKS[0];
    const ctx = audioEngine.getAudioContext(defaultTrack.metadata.sampleRate);
    const buffer = defaultTrack.generateBuffer(ctx);
    audioEngine.loadTrack(defaultTrack.metadata, buffer);
    setCurrentMetadata(defaultTrack.metadata);

    const onStateChange = () => {
      setIsOverclocked(audioEngine.getConfig().overclockBoost);
      setIsPureDirect(audioEngine.getConfig().pureDirectLossless);
      setCurrentMetadata(audioEngine.getCurrentMetadata());
    };
    audioEngine.registerStateChangeCallback(onStateChange);
  }, []);

  const handleTrackSelect = (metadata: AudioMetadata, buffer: AudioBuffer) => {
    audioEngine.loadTrack(metadata, buffer);
    setCurrentMetadata(metadata);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#090c13] shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-black text-sm shadow-md shadow-cyan-500/20">
            Æ
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
            Aether Hi-Res Studio
          </span>
          {isPureDirect ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              DIRECTO 100% INTACTO
            </span>
          ) : isOverclocked ? (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Flame className="w-3 h-3 text-amber-400" />
              PEPINO +239.0% ULTRA-SINGULARITY CRYO-BOOST
            </span>
          ) : null}
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a
            href="#visualizer"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Visualizer &amp; Letras
          </a>
          <a
            href="#dsp-core"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Hyper-Pepino DSP
          </a>
          <a
            href="#ingest"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Format Ingest
          </a>
          <button
            onClick={() => setIsArchitectureOpen(true)}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap cursor-pointer text-left"
          >
            Technical Blueprint
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              const fileEl = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileEl) fileEl.click();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm shadow-cyan-500/30 whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Audio File</span>
          </button>
        </div>
      </header>

      {/* Real-time Hardware Telemetry HUD Ribbon */}
      <TelemetryHUD
        metadata={currentMetadata}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Main Studio Workstation Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Visualizer & Lyrics Stage Container */}
        <section
          id="visualizer"
          className="flex flex-col bg-[#0a0d14] border border-slate-800 rounded-xl overflow-hidden shadow-xl"
        >
          {/* Mode Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-900/60 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
              <span className="text-cyan-400 font-bold">SPATIAL AUDIO HUD</span>
              <span className="text-slate-600">·</span>
              <span>60 FPS REAL-TIME INSTRUMENTATION</span>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg flex-wrap">
              <button
                onClick={() => setActiveVisualizer('spectrum')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'spectrum'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>FFT Spectrum</span>
              </button>
              <button
                onClick={() => setActiveVisualizer('lyrics')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'lyrics'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Letras (Lyrics)</span>
              </button>
              <button
                onClick={() => setActiveVisualizer('spectrogram')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'spectrogram'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>2D Spectrogram</span>
              </button>
              <button
                onClick={() => setActiveVisualizer('oscilloscope')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'oscilloscope'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Oscilloscope</span>
              </button>
              <button
                onClick={() => setActiveVisualizer('bit_depth')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'bit_depth'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Binary className="w-3.5 h-3.5" />
                <span>32-Bit Grid</span>
              </button>
              <button
                onClick={() => setActiveVisualizer('vectorscope')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'vectorscope'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Vectorscope</span>
              </button>
              <button
                onClick={() => setActiveVisualizer('vu_meters')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeVisualizer === 'vu_meters'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>VU Meters</span>
              </button>
            </div>
          </div>

          {/* Display Viewport */}
          <div className="h-72 md:h-88 w-full relative bg-[#080a0f]">
            {activeVisualizer === 'spectrum' && (
              <SpectrumAnalyzer sampleRate={currentMetadata?.sampleRate || 48000} />
            )}
            {activeVisualizer === 'lyrics' && <LyricsViewer metadata={currentMetadata} />}
            {activeVisualizer === 'spectrogram' && (
              <SpectrogramWaterfall sampleRate={currentMetadata?.sampleRate || 48000} />
            )}
            {activeVisualizer === 'oscilloscope' && <Oscilloscope />}
            {activeVisualizer === 'bit_depth' && <BitDepthMeter metadata={currentMetadata} />}
            {activeVisualizer === 'vectorscope' && <Vectorscope />}
            {activeVisualizer === 'vu_meters' && <VUMeter />}
          </div>
        </section>

        {/* 2-Column Workstation Grid: DSP Simulator & Ingestion Vault */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hyper-Pepino Hardware Simulator Panel (7 Cols) */}
          <section id="dsp-core" className="lg:col-span-7">
            <HyperPepinoPanel />
          </section>

          {/* Universal Format Ingestion & Master Library (5 Cols) */}
          <section id="ingest" className="lg:col-span-5">
            <TrackQueue
              currentTrackId={currentMetadata?.id}
              onTrackSelect={handleTrackSelect}
            />
          </section>
        </div>
      </main>

      {/* Fixed Studio Audio Transport Bar */}
      <footer className="sticky bottom-0 z-30 shadow-2xl">
        <TransportBar metadata={currentMetadata} />
      </footer>

      {/* System Architecture Blueprint Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
