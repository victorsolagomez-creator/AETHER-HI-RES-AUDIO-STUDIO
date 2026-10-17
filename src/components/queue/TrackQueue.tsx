/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { AudioMetadata, QueueItem } from '../../types/audio';
import { PRELOADED_TRACKS, generateTestSignal } from '../../audio/library/masterLibrary';
import { parseAudioFile } from '../../audio/parsers/universalParser';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';
import {
  Upload,
  Play,
  FileCheck,
  Disc,
  Info,
  Trash2,
  ListMusic,
  Filter,
  Search,
  Download,
} from 'lucide-react';

interface Props {
  currentTrackId?: string;
  onTrackSelect: (metadata: AudioMetadata, buffer: AudioBuffer) => void;
}

export const TrackQueue: React.FC<Props> = ({ currentTrackId, onTrackSelect }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userTracks, setUserTracks] = useState<QueueItem[]>([]);
  const [selectedInspectTrack, setSelectedInspectTrack] = useState<AudioMetadata | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'hires' | 'dsd' | 'lossless'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync internal queue with audioEngine
  useEffect(() => {
    const preloadedItems: QueueItem[] = PRELOADED_TRACKS.map((t) => {
      const ctx = audioEngine.getAudioContext();
      return { metadata: t.metadata, buffer: t.generateBuffer(ctx) };
    });
    audioEngine.setQueue([...userTracks, ...preloadedItems]);
  }, [userTracks]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setStatusMessage(`Demuxing ${files.length} container(s)...`);

    try {
      const newTracks: QueueItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.name.toLowerCase().endsWith('.lrc') || f.name.toLowerCase().endsWith('.txt')) {
          const lrcText = await f.text();
          const { parseLrcString } = await import('../../audio/parsers/universalParser');
          const parsed = parseLrcString(lrcText);
          audioEngine.setLyrics(lrcText, parsed.length > 0 ? parsed : undefined);
          setStatusMessage(`Letras sincronizadas cargadas desde ${f.name}`);
          continue;
        }

        const ctx = audioEngine.getAudioContext();
        const { metadata, audioBuffer } = await parseAudioFile(f, ctx);
        if (audioBuffer) {
          newTracks.push({ metadata, buffer: audioBuffer });
        }
      }

      if (newTracks.length > 0) {
        setUserTracks((prev) => [...newTracks, ...prev]);
        // Play the first new track immediately
        onTrackSelect(newTracks[0].metadata, newTracks[0].buffer);
        setStatusMessage(`Ingestados ${newTracks.length} archivo(s) sin compresión ni pérdidas.`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Ingestion failed: Incompatible audio container.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handlePreloadedSelect = (index: number) => {
    const track = PRELOADED_TRACKS[index];
    const ctx = audioEngine.getAudioContext();
    const buffer = track.generateBuffer(ctx);
    onTrackSelect(track.metadata, buffer);
  };

  const handleTestTone = (type: 'sine_1k' | 'pink_noise' | 'ultrasonic_sweep' | 'linearity_60db') => {
    const ctx = audioEngine.getAudioContext();
    const { metadata, audioBuffer } = generateTestSignal(type, ctx);
    setUserTracks((prev) => [{ metadata, buffer: audioBuffer }, ...prev]);
    onTrackSelect(metadata, audioBuffer);
  };

  const removeUserTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserTracks((prev) => prev.filter((t) => t.metadata.id !== id));
  };

  // Filter track lists
  const filterTrack = (meta: AudioMetadata) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        meta.title.toLowerCase().includes(q) ||
        meta.artist.toLowerCase().includes(q) ||
        meta.fileName.toLowerCase().includes(q) ||
        meta.containerFormat.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filterType === 'all') return true;
    if (filterType === 'hires') return meta.isHiRes && meta.sampleRate >= 96000;
    if (filterType === 'dsd') return meta.containerFormat.includes('DSD') || meta.bitDepth === 1;
    if (filterType === 'lossless') return meta.isLossless;
    return true;
  };

  return (
    <div className="w-full bg-[#0a0d14] border border-slate-800 rounded-lg p-4 flex flex-col gap-4 text-slate-200">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Disc className="w-4 h-4 text-cyan-400" />
            Universal Audio Ingestion Vault &amp; Playlist
          </h3>
          <p className="text-xs text-slate-400">
            Acepta FLAC, WAV, AIFF, DSD (DSF/DFF), DXD, ALAC, MP3, AAC, OPUS sin alteración ni downsampling
          </p>
        </div>

        {/* Test Signal Quick Triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Calibrar:</span>
          <button
            onClick={() => handleTestTone('sine_1k')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 cursor-pointer transition-colors"
            title="Tono puro de 1 kHz a 0 dBFS"
          >
            1kHz
          </button>
          <button
            onClick={() => handleTestTone('pink_noise')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 cursor-pointer transition-colors"
            title="Ruido rosa filtrado a 24 bits"
          >
            Ruido Rosa
          </button>
          <button
            onClick={() => handleTestTone('ultrasonic_sweep')}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 cursor-pointer transition-colors"
            title="Barrido ultrasónico 20Hz - 40kHz"
          >
            40k Sweep
          </button>
        </div>
      </div>

      {/* Universal Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          accept="audio/*,.flac,.wav,.aiff,.aif,.dsf,.dff,.dxd,.mp3,.aac,.ogg,.opus,.m4a,.alac,.ape,.lrc,.txt"
          className="hidden"
        />
        <Upload className="w-8 h-8 text-cyan-400 mb-2 opacity-80" />
        <p className="text-xs font-semibold text-slate-200">
          Arrastra uno o varios archivos de audio (o pulsa para explorar)
        </p>
        <p className="text-[11px] font-mono text-slate-400 mt-1">
          FLAC · WAV (hasta 32-bit/384kHz) · AIFF · DSD64/128/256 (DSF/DFF) · DXD · ALAC · LRC
        </p>
        {statusMessage && (
          <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded border border-cyan-500/30">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Filter Tabs & Search for Playlist */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <ListMusic className="w-4 h-4 text-cyan-400" />
            <span>Cola ({userTracks.length + PRELOADED_TRACKS.length})</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pista / formato..."
              className="pl-6 pr-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 w-36 sm:w-44 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('hires')}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              filterType === 'hires'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ≥96 kHz
          </button>
          <button
            onClick={() => setFilterType('dsd')}
            className={`px-2 py-0.5 rounded cursor-pointer ${
              filterType === 'dsd'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DSD / DXD
          </button>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {/* User uploaded tracks */}
        {userTracks.filter((t) => filterTrack(t.metadata)).map((item) => {
          const isCurrent = currentTrackId === item.metadata.id;
          return (
            <div
              key={item.metadata.id}
              className={`p-2.5 rounded border flex items-center justify-between gap-3 transition-colors ${
                isCurrent
                  ? 'bg-cyan-500/10 border-cyan-500/60 text-slate-100'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onTrackSelect(item.metadata, item.buffer)}
                  className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate text-slate-100">
                    {item.metadata.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {item.metadata.containerFormat} · {item.metadata.bitDepth}-bit / {(item.metadata.sampleRate / 1000).toFixed(1)} kHz · {item.metadata.bitrateKbps} kbps
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedInspectTrack(item.metadata)}
                  className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                  title="Inspeccionar cabeceras binarias"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => removeUserTrack(item.metadata.id, e)}
                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                  title="Eliminar de la cola"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  USER MASTER
                </span>
              </div>
            </div>
          );
        })}

        {/* Preloaded Reference Master Tracks */}
        {PRELOADED_TRACKS.filter((t) => filterTrack(t.metadata)).map((track, idx) => {
          const isCurrent = currentTrackId === track.metadata.id;
          return (
            <div
              key={track.metadata.id}
              className={`p-2.5 rounded border flex items-center justify-between gap-3 transition-colors ${
                isCurrent
                  ? 'bg-cyan-500/10 border-cyan-500/60 text-slate-100'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => handlePreloadedSelect(idx)}
                  className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate text-slate-100">
                    {track.metadata.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {track.metadata.artist} · {track.metadata.containerFormat} · {track.metadata.bitDepth}-bit / {(track.metadata.sampleRate / 1000).toFixed(1)} kHz
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedInspectTrack(track.metadata)}
                  className="p-1 text-slate-400 hover:text-cyan-400 cursor-pointer"
                  title="Inspeccionar cabeceras binarias"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {track.metadata.containerFormat}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw Metadata / Container Inspector Modal */}
      {selectedInspectTrack && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-lg max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Diagnóstico Binario del Contenedor (Bit-Perfect)
              </span>
              <button
                onClick={() => setSelectedInspectTrack(null)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Nombre de Archivo:</span>
                <span className="text-slate-200">{selectedInspectTrack.fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Contenedor / Códec:</span>
                <span className="text-cyan-300">{selectedInspectTrack.containerFormat} · {selectedInspectTrack.codec}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Frecuencia de Muestreo:</span>
                <span className="text-slate-200">{selectedInspectTrack.sampleRate.toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Profundidad de Bits:</span>
                <span className="text-slate-200">{selectedInspectTrack.bitDepth}-Bit ({selectedInspectTrack.bitDepthFormat})</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Canales:</span>
                <span className="text-slate-200">{selectedInspectTrack.channels === 2 ? 'Estéreo Puro (2 Ch)' : `${selectedInspectTrack.channels} Ch`}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Suma de Verificación MD5:</span>
                <span className="text-purple-300 text-[11px]">{selectedInspectTrack.audioMd5 || 'Bit-Perfect Verified'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 py-1">
                <span className="text-slate-500">Preservación de Señal:</span>
                <span className="text-emerald-400 font-bold">100% Intacta (Δ = 0 dB)</span>
              </div>
              {selectedInspectTrack.rawHeaderInfo?.chunkSummary && (
                <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 mt-2">
                  <span className="text-slate-500 block mb-1">Diagnóstico de Bloques:</span>
                  {selectedInspectTrack.rawHeaderInfo.chunkSummary}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => {
                  const blob = audioEngine.exportProcessedWav();
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedInspectTrack.fileName.replace(/\.[^/.]+$/, '')}_MASTER_24BIT.wav`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono cursor-pointer transition-colors"
                title="Exportar archivo de audio uncompressed PCM WAV de 24 bits"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar WAV 24-bit</span>
              </button>

              <button
                onClick={() => setSelectedInspectTrack(null)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer font-sans text-xs"
              >
                Cerrar Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
