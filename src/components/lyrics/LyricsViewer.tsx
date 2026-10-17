/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';
import { AudioMetadata, LyricLine } from '../../types/audio';
import { parseLrcString } from '../../audio/parsers/universalParser';
import {
  AlignLeft,
  FileText,
  Upload,
  Sparkles,
  Check,
  Copy,
  Download,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface Props {
  metadata: AudioMetadata | null;
}

export const LyricsViewer: React.FC<Props> = ({ metadata }) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'synced' | 'full'>('synced');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [customLrcInput, setCustomLrcInput] = useState<string>('');
  const [syncOffsetMs, setSyncOffsetMs] = useState<number>(
    audioEngine.getConfig().lyricSyncOffsetMs || 0
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [userInterruptedScroll, setUserInterruptedScroll] = useState<boolean>(false);

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncedLyrics: LyricLine[] = metadata?.syncedLyrics || [];
  const fullText: string = metadata?.lyrics || '';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(audioEngine.getCurrentTime());
    }, 8);
    return () => clearInterval(interval);
  }, []);

  const effectiveTime = Math.max(0, currentTime + syncOffsetMs / 1000);

  // Find the index of the currently playing lyric line based on effectiveTime
  let activeIndex = -1;
  for (let i = 0; i < syncedLyrics.length; i++) {
    if (effectiveTime >= syncedLyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Calculate progress inside active line
  let activeLineProgress = 0;
  if (activeIndex >= 0 && activeIndex < syncedLyrics.length) {
    const currentLineTime = syncedLyrics[activeIndex].time;
    const nextLineTime =
      activeIndex + 1 < syncedLyrics.length
        ? syncedLyrics[activeIndex + 1].time
        : currentLineTime + 4.5;
    const duration = Math.max(0.8, nextLineTime - currentLineTime);
    activeLineProgress = Math.min(
      100,
      Math.max(0, ((effectiveTime - currentLineTime) / duration) * 100)
    );
  }

  // Smooth auto-scroll active lyric into center of view unless user recently scrolled manually
  useEffect(() => {
    if (
      viewMode === 'synced' &&
      !userInterruptedScroll &&
      activeLineRef.current &&
      containerRef.current
    ) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, viewMode, userInterruptedScroll]);

  const handleContainerScroll = () => {
    setUserInterruptedScroll(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserInterruptedScroll(false);
    }, 3500);
  };

  const handleLineClick = (time: number) => {
    setUserInterruptedScroll(false);
    audioEngine.seek(time);
  };

  const handleOffsetAdjust = (deltaMs: number) => {
    const next = syncOffsetMs + deltaMs;
    setSyncOffsetMs(next);
    audioEngine.setConfig({ lyricSyncOffsetMs: next });
  };

  const handleOffsetReset = () => {
    setSyncOffsetMs(0);
    audioEngine.setConfig({ lyricSyncOffsetMs: 0 });
  };

  const handleCopyLyrics = () => {
    const textToCopy =
      fullText ||
      syncedLyrics
        .map(
          (l) =>
            `[${Math.floor(l.time / 60)
              .toString()
              .padStart(2, '0')}:${(l.time % 60).toFixed(2).padStart(5, '0')}] ${l.text}`
        )
        .join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadLrc = () => {
    const lrcContent =
      fullText.includes('[') && fullText.includes(']')
        ? fullText
        : syncedLyrics
            .map(
              (l) =>
                `[${Math.floor(l.time / 60)
                  .toString()
                  .padStart(2, '0')}:${(l.time % 60).toFixed(2).padStart(5, '0')}] ${l.text}`
            )
            .join('\n');

    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata?.fileName.replace(/\.[^/.]+$/, '') || 'lyrics'}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyCustomLyrics = () => {
    if (!customLrcInput.trim()) return;
    const parsed = parseLrcString(customLrcInput);
    audioEngine.setLyrics(customLrcInput, parsed.length > 0 ? parsed : undefined);
    setIsModalOpen(false);
  };

  const handleLrcFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseLrcString(text);
        audioEngine.setLyrics(text, parsed.length > 0 ? parsed : undefined);
        setIsModalOpen(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 md:p-4 bg-[#080a0f] text-slate-200 select-none">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-bold">
            Letras Sincronizadas
          </span>
          {syncedLyrics.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {syncedLyrics.length} VERSOS · BIT-ACCURATE
            </span>
          )}
          {syncOffsetMs !== 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              OFFSET: {syncOffsetMs > 0 ? `+${syncOffsetMs}` : syncOffsetMs} ms
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Micro Sync Offset calibration controls */}
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400 mr-1">Calibrar:</span>
            <button
              onClick={() => handleOffsetAdjust(-200)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Adelantar versos 200ms"
            >
              -200ms
            </button>
            <button
              onClick={() => handleOffsetAdjust(-50)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Adelantar versos 50ms"
            >
              -50ms
            </button>
            <button
              onClick={handleOffsetReset}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                syncOffsetMs === 0
                  ? 'text-slate-500'
                  : 'bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30'
              }`}
              title="Reiniciar calibración a 0ms"
            >
              <RotateCcw className="w-2.5 h-2.5 inline mr-0.5" />
              0
            </button>
            <button
              onClick={() => handleOffsetAdjust(50)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Retrasar versos 50ms"
            >
              +50ms
            </button>
            <button
              onClick={() => handleOffsetAdjust(200)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Retrasar versos 200ms"
            >
              +200ms
            </button>
          </div>

          {/* Font Size controls */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-900 rounded border border-slate-800">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                fontSize === 'sm'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tamaño de texto pequeño"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                fontSize === 'md'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tamaño de texto mediano"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                fontSize === 'lg'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tamaño de texto grande"
            >
              A+
            </button>
          </div>

          {/* Mode Switch */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
            <button
              onClick={() => setViewMode('synced')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                viewMode === 'synced'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Karaoke
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completo
            </button>
          </div>

          {/* Verse Jump buttons (< and >) */}
          <div className="flex items-center gap-0.5 bg-slate-900 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => {
                if (syncedLyrics.length === 0) return;
                const prevIdx = Math.max(0, activeIndex - 1);
                audioEngine.seek(syncedLyrics[prevIdx].time);
              }}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
              title="Verso anterior"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (syncedLyrics.length === 0) return;
                const nextIdx = Math.min(syncedLyrics.length - 1, activeIndex + 1);
                audioEngine.seek(syncedLyrics[nextIdx].time);
              }}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded cursor-pointer"
              title="Verso siguiente"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search within lyrics */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar versos..."
              className="pl-6 pr-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 w-28 sm:w-36 font-mono"
            />
          </div>

          {/* Copy and Download buttons */}
          <button
            onClick={handleCopyLyrics}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
            title="Copiar versos al portapapeles"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {syncedLyrics.length > 0 && (
            <button
              onClick={handleDownloadLrc}
              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              title="Descargar archivo .LRC"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span>.LRC / Editar</span>
          </button>
        </div>
      </div>

      {/* Lyrics Display Stage */}
      <div
        ref={containerRef}
        onWheel={handleContainerScroll}
        onTouchMove={handleContainerScroll}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth space-y-4 text-center max-w-2xl mx-auto w-full relative"
      >
        {/* Floating resume auto-scroll button if user scrolled manually */}
        {userInterruptedScroll && (
          <button
            onClick={() => setUserInterruptedScroll(false)}
            className="sticky top-2 z-20 mx-auto px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-mono shadow-lg hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5 animate-bounce"
          >
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            <span>Recentrar versos en reproducción</span>
          </button>
        )}

        {syncedLyrics.length > 0 ? (
          viewMode === 'synced' ? (
            syncedLyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              const textSizeClass =
                fontSize === 'sm'
                  ? isActive
                    ? 'text-base md:text-lg'
                    : 'text-xs'
                  : fontSize === 'lg'
                  ? isActive
                    ? 'text-xl md:text-2xl'
                    : 'text-base'
                  : isActive
                  ? 'text-lg md:text-xl'
                  : 'text-sm';

              const isMatch =
                searchQuery.trim().length > 0 &&
                line.text.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => handleLineClick(line.time)}
                  className={`relative py-2.5 px-4 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive
                      ? `text-cyan-200 font-bold ${textSizeClass} scale-105 bg-cyan-950/40 border border-cyan-500/50 shadow-xl shadow-cyan-500/10`
                      : isMatch
                      ? `text-amber-200 ${textSizeClass} bg-amber-950/25 border border-amber-500/50 shadow-xs`
                      : isPast
                      ? `text-slate-500 ${textSizeClass} hover:text-slate-300 opacity-60`
                      : `text-slate-400 ${textSizeClass} hover:text-slate-200 opacity-80`
                  }`}
                >
                  {isMatch && !isActive && (
                    <span className="absolute top-1.5 right-2 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      COINCIDENCIA
                    </span>
                  )}
                  {/* Subtle dynamic fill bar behind active verse for karaoke feel */}
                  {isActive && (
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-transparent transition-all duration-75 pointer-events-none rounded-xl"
                      style={{ width: `${activeLineProgress}%` }}
                    />
                  )}

                  <p className="relative z-10 leading-relaxed tracking-wide drop-shadow-xs">
                    {line.text}
                  </p>

                  <span className="relative z-10 text-[10px] font-mono text-slate-500 block mt-1 opacity-70">
                    {Math.floor(line.time / 60)}:
                    {(line.time % 60).toFixed(1).padStart(4, '0')}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="whitespace-pre-line text-left font-sans text-sm text-slate-300 leading-loose p-5 bg-slate-900/40 rounded-xl border border-slate-800">
              {fullText || syncedLyrics.map((l) => l.text).join('\n')}
            </div>
          )
        ) : fullText ? (
          <div className="whitespace-pre-line text-left font-sans text-sm text-slate-300 leading-loose p-5 bg-slate-900/40 rounded-xl border border-slate-800">
            {fullText}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2">
            <AlignLeft className="w-8 h-8 opacity-40 text-cyan-400" />
            <p className="text-xs font-semibold text-slate-400">
              No hay letras incrustadas en este archivo de audio
            </p>
            <p className="text-[11px] font-mono text-slate-500 max-w-sm">
              Pulsa en &ldquo;.LRC / Editar&rdquo; para sincronizar un archivo .lrc o pegar las letras con marcas de tiempo.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer hover:bg-cyan-500/30 transition-colors"
            >
              Añadir Letras Sincronizadas
            </button>
          </div>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 gap-2">
        <span>Haz clic en cualquier verso para saltar a ese segundo exacto</span>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">Bit-Perfect 0% Quality Loss</span>
          <span className="text-cyan-400">AudioWorklet Frame-Accurate Sync</span>
        </div>
      </div>

      {/* Modal for importing LRC or pasting custom lyrics */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Cargar o Pegar Letras Sincronizadas (.LRC)
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 block mb-1 text-[11px]">
                  1. Cargar archivo .LRC local:
                </span>
                <input
                  type="file"
                  accept=".lrc,.txt"
                  onChange={handleLrcFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1 text-[11px]">
                  2. O pegar texto con marcas de tiempo [mm:ss.xx]:
                </span>
                <textarea
                  rows={8}
                  value={customLrcInput}
                  onChange={(e) => setCustomLrcInput(e.target.value)}
                  placeholder={`[00:02.00] Primera estrofa de la canción\n[00:06.50] Segunda estrofa sincronizada...`}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-mono focus:border-cyan-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCustomLyrics}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer text-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Letras</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
