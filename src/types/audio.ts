/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AudioFormatCategory = 'Lossless/Master' | 'Lossy/Compressed' | 'DSD/Bitstream';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface AudioMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  containerFormat: string; // FLAC, WAV, AIFF, DSD-DSF, DSD-DFF, DXD, MP3, AAC, OGG, OPUS, ALAC, APE, PCM
  codec: string;
  sampleRate: number; // Hz, e.g. 44100, 48000, 88200, 96000, 176400, 192000, 352800, 2822400 (DSD64), 5644800 (DSD128)
  bitDepth: number; // 1, 16, 24, 32
  bitDepthFormat: 'int16' | 'int24' | 'int32' | 'float32' | 'dsd_1bit';
  channels: number; // 1 = Mono, 2 = Stereo
  bitrateKbps: number;
  duration: number; // in seconds
  isLossless: boolean;
  isHiRes: boolean; // sampleRate >= 88200 or bitDepth >= 24 or DSD
  title: string;
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  albumArtUrl?: string;
  audioMd5?: string;
  compressionRatio?: string;
  lyrics?: string;
  syncedLyrics?: LyricLine[];
  waveformPeaks?: number[]; // Pre-computed 100-point normalized waveform peaks for visual scrubber
  rawHeaderInfo?: {
    chunkSummary?: string;
    blockAlign?: number;
    encodingMethod?: string;
    originalBitsPerSample?: number;
  };
}

export type MasterClockMode = 'async_femto' | 'crystal_44k1' | 'crystal_48k' | 'overclock_cryo';
export type DacArchitecture = 'r2r_ladder' | 'delta_sigma_multibit' | 'dsd_direct_1bit';
export type DigitalFilter = 'nos_bitperfect' | 'linear_phase_fast' | 'minimum_phase_slow' | 'apodizing' | 'polyphase_8x';
export type AmpTopology = 'class_a_discrete' | 'ultra_linear_opamp' | 'triode_tube_harmonic';
export type OutputImpedance = 16 | 32 | 80 | 300 | 600 | 0; // 0 = Line-out balanced XLR/4.4mm
export type TargetCurve = 'flat_reference' | 'harman_target' | 'diffuse_field' | 'free_field';
export type CrossfeedPreset = 'bypass' | 'studio_nearfield' | 'audiophile_700' | 'mastering_800' | 'custom';

export interface AudioOutputDeviceOption {
  deviceId: string;
  label: string;
  isDefault: boolean;
}

export interface HardwareAudioInfo {
  deviceSampleRate: number; // Real physical sampleRate of the active AudioContext
  nativeRequestedRate: number;
  hardwareLocked: boolean; // True if physical hardware matched requested track sample rate
  outputDeviceName: string; // e.g. "Realtek Audio", "Focusrite USB DAC", "Default Sound Device"
  availableOutputDevices: AudioOutputDeviceOption[];
  activeDeviceId: string;
  bufferSize: number;
  baseLatencyMs: number;
  outputLatencyMs: number;
  supportedRates: { rate: number; label: string; supported: boolean }[];
}

export interface HyperPepinoConfig {
  pureDirectLossless: boolean; // 100% PURE UNTOUCHED LOSSLESS (Bypasses all DSP, EQ, and harmonic processing - Zero coloration, zero degradation)
  masterClockMode: MasterClockMode;
  clockJitterFs: number; // e.g. 78 femtoseconds
  dacArchitecture: DacArchitecture;
  digitalFilter: DigitalFilter;
  ampTopology: AmpTopology;
  outputImpedance: OutputImpedance;
  targetCurve: TargetCurve;
  crossfeedEnabled: boolean;
  crossfeedPreset: CrossfeedPreset;
  crossfeedLevel: number; // 0 to 100%
  harmonicDrive: number; // 0 to 100%
  bitPerfectLock: boolean; // Locks exact native rate, bypasses OS resampling
  overclockBoost: boolean; // +239.0% Ultra-Singularity Precision Core Overclock & Cryo-stabilization
  abComparisonMode: 'pepino_pipeline' | 'raw_os_bypass';
  playbackRate: number; // 0.5x to 2.0x (1.0 default)
  lyricSyncOffsetMs: number; // -2000 to +2000 ms micro-sync calibration
  eqBands: {
    sub: number; // 32 Hz (-12 to +12 dB)
    bass: number; // 120 Hz
    mid: number; // 1.2 kHz
    presence: number; // 4.5 kHz
    air: number; // 16 kHz
  };
}

export interface ChipTelemetry {
  temperatureC: number;
  dspLoadPct: number;
  clockDriftPpm: number;
  jitterFs: number;
  powerMilliwatts: number;
  thdPlusN: number;
  snrDb: number;
  pllStatus: 'LOCKED' | 'LOCKING' | 'ASYNC_ISOLATED' | 'CRYO_LOCKED';
  activeBitRateKbps: number;
  bufferFrames: number;
  latencyMs: number;
  activeBitsMask: number;
  truePeakL: number;
  truePeakR: number;
  rmsL: number;
  rmsR: number;
  phaseCorrelation: number;
  crestFactorDb: number;
  shannonEntropyBits: number;
  bufferUnderruns: number;
  interSamplePeakDb: number;
  hardwareSampleRate: number;
  hardwareMatchPurity: '100% EXACT HARDWARE MATCH' | 'RESAMPLE-FREE DIRECT' | 'CLAMPED BY OS';
  bitPurityDeltaDb: number; // 0.0000000000 dB = pure bit-for-bit identical to source
  bitExactNullDiffDb: number; // Math null-test: source minus rendered output (-infinity dBFS / 0.000 dB)
  integrityChecksum: string; // Dynamic stream CRC32 / integrity hash
  quantizationFloorDb: number; // Noise floor limit (-144.5 dB for 24-bit, -192.6 dB for 32-bit)
  lufsMomentary: number; // EBU R128 Momentary LUFS
  lufsIntegrated: number; // Integrated LUFS
  dynamicRangeScore: number; // DR score (e.g. DR14)
  totalSamplesProcessed: number; // Total audio samples processed 1:1
  droppedSamplesCount: number; // Strictly 0 in bit-perfect mode
  activeBitHistogram: number[]; // 32-bit real-time activity percentage
}

export type VisualizerMode =
  | 'spectrum'
  | 'spectrogram'
  | 'oscilloscope'
  | 'bit_depth'
  | 'vectorscope'
  | 'vu_meters'
  | 'lyrics';

export interface QueueItem {
  metadata: AudioMetadata;
  buffer: AudioBuffer;
}
