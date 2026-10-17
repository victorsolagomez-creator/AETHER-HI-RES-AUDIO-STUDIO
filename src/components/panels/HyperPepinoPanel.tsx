/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { audioEngine } from '../../audio/engine/HyperPepinoAudioEngine';
import {
  AmpTopology,
  DacArchitecture,
  DigitalFilter,
  MasterClockMode,
  OutputImpedance,
  TargetCurve,
  CrossfeedPreset,
} from '../../types/audio';
import { Sliders, Cpu, Radio, Zap, Headphones, RotateCcw, Flame, Sparkles } from 'lucide-react';

export const HyperPepinoPanel: React.FC = () => {
  const [config, setConfig] = useState(audioEngine.getConfig());
  const [activeTab, setActiveTab] = useState<'dsp' | 'dac_clock' | 'target_ab' | 'eq'>('dsp');

  const update = (partial: Partial<typeof config>) => {
    audioEngine.setConfig(partial);
    setConfig(audioEngine.getConfig());
  };

  const handleEqChange = (band: keyof typeof config.eqBands, val: number) => {
    const updated = {
      ...config.eqBands,
      [band]: val,
    };
    update({ eqBands: updated });
  };

  const resetEq = () => {
    update({
      eqBands: {
        sub: 0,
        bass: 0,
        mid: 0,
        presence: 0,
        air: 0,
      },
    });
  };

  return (
    <div className="w-full bg-[#0b0e17] border border-slate-800 rounded-lg overflow-hidden flex flex-col text-slate-200">
      {/* Panel Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm tracking-wide text-slate-100">
            Hyper-Pepino DSP Core
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            {config.bitPerfectLock ? '· BIT-PERFECT LOCK' : '· DSP ACTIVE'}
          </span>
          {config.overclockBoost && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              +239.0% BOOST
            </span>
          )}
        </div>

        {/* Tab segmented buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-md">
          <button
            onClick={() => setActiveTab('dsp')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'dsp'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Amp & Crossfeed
          </button>
          <button
            onClick={() => setActiveTab('dac_clock')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'dac_clock'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clock & Filters
          </button>
          <button
            onClick={() => setActiveTab('target_ab')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'target_ab'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A/B & Acoustic Curve
          </button>
          <button
            onClick={() => setActiveTab('eq')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'eq'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5-Band EQ
          </button>
        </div>
      </div>

      {/* Pure Direct Lossless Banner */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              config.pureDirectLossless ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="font-bold text-slate-200">
            {config.pureDirectLossless
              ? 'Modo Directo Puro: Activo (Sin colorear ni alterar la señal original)'
              : 'Modo Simulación DSP: Activo (Procesamiento analógico y filtros habilitados)'}
          </span>
        </div>
        <button
          onClick={() => update({ pureDirectLossless: !config.pureDirectLossless })}
          className={`px-3 py-1 rounded border text-[11px] font-bold cursor-pointer transition-all ${
            config.pureDirectLossless
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
          }`}
        >
          {config.pureDirectLossless ? 'ACTIVAR SIMULACIÓN DSP' : 'ACTIVAR MODO DIRECTO PURO'}
        </button>
      </div>

      {/* Tab 1: Amp & Crossfeed */}
      {activeTab === 'dsp' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Amplifier Topology */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Discrete Amp Stage</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'class_a_discrete', label: 'Class-A Discrete', desc: 'Ultra-low THD, high current' },
                  { id: 'ultra_linear_opamp', label: 'Ultra-Linear Lab', desc: 'Measurement grade precision' },
                  { id: 'triode_tube_harmonic', label: 'Triode Tube Warmth', desc: 'Euphoric 2nd harmonic decay' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => update({ ampTopology: item.id as AmpTopology })}
                  className={`text-left p-2.5 rounded border transition-all cursor-pointer ${
                    config.ampTopology === item.id
                      ? 'bg-amber-500/10 border-amber-500/60 text-slate-100'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* Overclock Boost Button */}
            <div className="pt-2">
              <button
                onClick={() => update({ overclockBoost: !config.overclockBoost })}
                className={`w-full p-2.5 rounded border text-left transition-all flex items-center justify-between cursor-pointer ${
                  config.overclockBoost
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-xs'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Overclock & Cryo-Stabilizer
                  </div>
                  <div className="text-[10px] text-slate-400">
                    +239.0% precision boost, 0.72 fs jitter floor
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {config.overclockBoost ? 'ACTIVE' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Output Load / Impedance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>Headphone Load Match</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { val: 16, label: '16Ω IEM', sub: 'Low noise floor' },
                  { val: 32, label: '32Ω Portable', sub: 'Standard dynamic' },
                  { val: 80, label: '80Ω Studio', sub: 'Balanced damping' },
                  { val: 300, label: '300Ω High-Z', sub: 'Sennheiser HD' },
                  { val: 600, label: '600Ω Master', sub: 'Reference 10V swing' },
                  { val: 0, label: 'Line Out XLR', sub: '+4 dBu Balanced' },
                ] as const
              ).map((item) => (
                <button
                  key={item.val}
                  onClick={() => update({ outputImpedance: item.val as OutputImpedance })}
                  className={`p-2 rounded border text-left transition-all cursor-pointer ${
                    config.outputImpedance === item.val
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.sub}</div>
                </button>
              ))}
            </div>

            {/* Harmonic Drive Slider */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Harmonic Density:</span>
                <span className="text-cyan-400">{config.harmonicDrive}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={config.harmonicDrive}
                onChange={(e) => update({ harmonicDrive: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Bauer Stereo-to-Binaural Crossfeed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Bauer Binaural Crossfeed</span>
              </div>
              <button
                onClick={() => update({ crossfeedEnabled: !config.crossfeedEnabled })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  config.crossfeedEnabled
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {config.crossfeedEnabled ? 'ENABLED' : 'BYPASS'}
              </button>
            </div>

            {/* Crossfeed Presets */}
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'studio_nearfield', label: 'Nearfield' },
                  { id: 'audiophile_700', label: '700Hz Mid' },
                  { id: 'mastering_800', label: 'Mastering' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() =>
                    update({
                      crossfeedEnabled: true,
                      crossfeedPreset: preset.id as CrossfeedPreset,
                    })
                  }
                  className={`p-1.5 rounded border text-center text-[10px] font-mono cursor-pointer transition-all ${
                    config.crossfeedPreset === preset.id && config.crossfeedEnabled
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Crossfeed Intensity:</span>
                <span className="text-purple-300">{config.crossfeedLevel}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                disabled={!config.crossfeedEnabled}
                value={config.crossfeedLevel}
                onChange={(e) =>
                  update({ crossfeedLevel: Number(e.target.value), crossfeedPreset: 'custom' })
                }
                className="w-full accent-purple-400 cursor-pointer disabled:opacity-30"
              />
            </div>

            {/* Bit-Perfect Pass-Through Toggle */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block text-slate-200">
                  Bit-Perfect Pass-Through Lock
                </span>
                <span className="text-[10px] text-slate-500">
                  Bypasses OS & browser sample rate alterations
                </span>
              </div>
              <button
                onClick={() => update({ bitPerfectLock: !config.bitPerfectLock })}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                  config.bitPerfectLock
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {config.bitPerfectLock ? 'LOCKED' : 'UNLOCKED'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Clock & DAC Filter */}
      {activeTab === 'dac_clock' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asynchronous Master Clock */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Femtosecond Master Clock Oscillator</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  {
                    id: 'async_femto',
                    title: 'Ultra-Low Jitter Asynchronous Femto-Clock',
                    details: '78 fs RMS Jitter · Isolated FIFO Buffer',
                  },
                  {
                    id: 'overclock_cryo',
                    title: 'Hyper-Pepino Precision Cryo-Clock (+3.9%)',
                    details: '74.9 fs RMS Jitter · Cryo Thermal Stabilization',
                  },
                  {
                    id: 'crystal_44k1',
                    title: 'Crystal A Oscillator (45.1584 MHz)',
                    details: 'Dedicated for 44.1k / 88.2k / 176.4k / 352.8k / DSD',
                  },
                  {
                    id: 'crystal_48k',
                    title: 'Crystal B Oscillator (49.1520 MHz)',
                    details: 'Dedicated for 48k / 96k / 192k / 384k DXD',
                  },
                ] as const
              ).map((clock) => (
                <button
                  key={clock.id}
                  onClick={() => update({ masterClockMode: clock.id as MasterClockMode })}
                  className={`p-3 rounded border text-left transition-all cursor-pointer ${
                    config.masterClockMode === clock.id
                      ? 'bg-cyan-500/15 border-cyan-400 text-slate-100 shadow-xs'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{clock.title}</div>
                  <div className="text-[11px] font-mono text-cyan-400/90 mt-0.5">
                    {clock.details}
                  </div>
                </button>
              ))}
            </div>

            {/* DAC Architecture Mode */}
            <div className="pt-2">
              <span className="text-xs font-mono uppercase text-slate-400 block mb-2">
                DAC Core Architecture
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => update({ dacArchitecture: 'r2r_ladder' as DacArchitecture })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    config.dacArchitecture === 'r2r_ladder'
                      ? 'bg-purple-500/15 border-purple-400 text-purple-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">R-2R Ladder</div>
                  <div className="text-[10px] text-slate-500">Pure discrete impulse</div>
                </button>
                <button
                  onClick={() => update({ dacArchitecture: 'delta_sigma_multibit' as DacArchitecture })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    config.dacArchitecture === 'delta_sigma_multibit'
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">Delta-Sigma</div>
                  <div className="text-[10px] text-slate-500">32-bit Multi-Bit</div>
                </button>
                <button
                  onClick={() => update({ dacArchitecture: 'dsd_direct_1bit' as DacArchitecture })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    config.dacArchitecture === 'dsd_direct_1bit'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">1-Bit DSD Direct</div>
                  <div className="text-[10px] text-slate-500">Native PDM Stream</div>
                </button>
              </div>
            </div>
          </div>

          {/* Digital Reconstruction Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Digital Reconstruction Filter</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(
                [
                  {
                    id: 'nos_bitperfect',
                    title: 'Non-Oversampling (NOS) Bit-Perfect',
                    desc: 'Direct impulse response, zero digital filtering, no ringing',
                  },
                  {
                    id: 'polyphase_8x',
                    title: '8x Polyphase FIR Master Filter (+3.9% Flatness)',
                    desc: 'Linear phase mastering interpolation with -140dB stopband rejection',
                  },
                  {
                    id: 'minimum_phase_slow',
                    title: 'Minimum Phase Slow Roll-Off',
                    desc: 'Zero pre-ringing, warm analog-like acoustic decay',
                  },
                  {
                    id: 'linear_phase_fast',
                    title: 'Linear Phase Fast Roll-Off',
                    desc: 'Strict symmetrical frequency cutoff, neutral mastering curve',
                  },
                  {
                    id: 'apodizing',
                    title: 'Apodizing Anti-Ringing Filter',
                    desc: 'Removes pre-ringing artifacts introduced at recording ADC',
                  },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => update({ digitalFilter: filter.id as DigitalFilter })}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    config.digitalFilter === filter.id
                      ? 'bg-emerald-500/15 border-emerald-400 text-slate-100'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{filter.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{filter.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: A/B Blind Listening & Acoustic Target Curves */}
      {activeTab === 'target_ab' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instant A/B Blind Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400">
              <span>Instant A/B Blind Listening Comparison</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toggle instantly between the uncompressed <strong>Hyper-Pepino Lossless Pipeline</strong>{' '}
              and standard <strong>Raw OS Mixer Bypass</strong> to hear the acoustic difference in real-time.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => update({ abComparisonMode: 'pepino_pipeline' })}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  config.abComparisonMode === 'pepino_pipeline'
                    ? 'bg-cyan-500/20 border-cyan-400 text-slate-100 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-cyan-300">A · Hyper-Pepino Master</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Active R-2R ladder, femto clock, Class-A amp & crossfeed
                </div>
              </button>

              <button
                onClick={() => update({ abComparisonMode: 'raw_os_bypass' })}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  config.abComparisonMode === 'raw_os_bypass'
                    ? 'bg-amber-500/20 border-amber-400 text-slate-100 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-amber-300">B · Raw OS Mixer Bypass</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Standard uncompensated operating system sound pipeline
                </div>
              </button>
            </div>
          </div>

          {/* Headphone & Room Target Curves */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase text-slate-400 block">
              Acoustic Headphone Target Curves
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: 'flat_reference',
                    name: 'Flat Studio Reference',
                    sub: 'Zero coloration, laboratory response',
                  },
                  {
                    id: 'harman_target',
                    name: 'Harman Audiophile Target',
                    sub: '+4.5dB warm sub-shelf, +2.5dB pinna',
                  },
                  {
                    id: 'diffuse_field',
                    name: 'Diffuse Field (DF)',
                    sub: 'Simulates ideal reverberant room',
                  },
                  {
                    id: 'free_field',
                    name: 'Free Field (FF)',
                    sub: 'Anechoic speaker front angle',
                  },
                ] as const
              ).map((curve) => (
                <button
                  key={curve.id}
                  onClick={() => update({ targetCurve: curve.id as TargetCurve })}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                    config.targetCurve === curve.id
                      ? 'bg-purple-500/15 border-purple-400 text-purple-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{curve.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{curve.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 5-Band Studio EQ */}
      {activeTab === 'eq' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">
              5-Band Studio Parametric Mastering Equalizer
            </span>
            <button
              onClick={resetEq}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Flat (0.0 dB)</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {(
              [
                { band: 'sub', freq: '32 Hz', label: 'Sub-Bass', min: -12, max: 12 },
                { band: 'bass', freq: '120 Hz', label: 'Bass', min: -12, max: 12 },
                { band: 'mid', freq: '1.2 kHz', label: 'Midrange', min: -12, max: 12 },
                { band: 'presence', freq: '4.5 kHz', label: 'Presence', min: -12, max: 12 },
                { band: 'air', freq: '16 kHz', label: 'Air Brilliance', min: -12, max: 12 },
              ] as const
            ).map((item) => {
              const currentVal = config.eqBands[item.band];
              return (
                <div
                  key={item.band}
                  className="flex flex-col items-center bg-slate-900/50 p-3 rounded border border-slate-800 space-y-2"
                >
                  <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{item.freq}</span>

                  <div className="h-32 flex items-center justify-center py-2">
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step="0.5"
                      value={currentVal}
                      onChange={(e) => handleEqChange(item.band, parseFloat(e.target.value))}
                      className="h-28 -rotate-90 accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <span className="text-xs font-mono font-bold tabular-nums text-slate-100">
                    {currentVal > 0 ? `+${currentVal.toFixed(1)}` : currentVal.toFixed(1)} dB
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
