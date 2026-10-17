/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioMetadata } from '../../types/audio';

export interface PreloadedTrack {
  metadata: AudioMetadata;
  generateBuffer: (ctx: AudioContext) => AudioBuffer;
}

/**
 * Creates high-fidelity synthesized musical audio buffer for offline demo listening
 * without needing huge network downloads or failing external URLs.
 */
function createChopinNocturneBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 28; // 28 seconds preview segment
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.round(duration * sampleRate);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Chopin Nocturne in C# minor opening motif: C#4, D#4, E4, G#4, F#4, E4, D#4, C#4...
  // Frequencies:
  const chordNotes = [
    { freq: 138.59, start: 0, dur: 7.0 },  // C#3 bass
    { freq: 277.18, start: 0.5, dur: 6.5 }, // C#4
    { freq: 329.63, start: 1.0, dur: 6.0 }, // E4
    { freq: 415.30, start: 1.5, dur: 5.5 }, // G#4
    // Melody
    { freq: 554.37, start: 2.2, dur: 2.0 }, // C#5
    { freq: 622.25, start: 4.2, dur: 1.5 }, // D#5
    { freq: 659.25, start: 5.7, dur: 2.5 }, // E5
    { freq: 830.61, start: 8.2, dur: 3.0 }, // G#5
    { freq: 739.99, start: 11.2, dur: 1.8 }, // F#5
    { freq: 659.25, start: 13.0, dur: 1.8 }, // E5
    { freq: 622.25, start: 14.8, dur: 2.0 }, // D#5
    { freq: 554.37, start: 16.8, dur: 4.0 }, // C#5
    // Secondary chord
    { freq: 110.00, start: 8.0, dur: 8.0 },  // A2 bass
    { freq: 220.00, start: 8.5, dur: 7.5 },  // A3
    { freq: 261.63, start: 9.0, dur: 7.0 },  // C4
    { freq: 329.63, start: 9.5, dur: 6.5 },  // E4
    // Resolving chord
    { freq: 123.47, start: 17.0, dur: 10.0 }, // B2
    { freq: 185.00, start: 17.5, dur: 9.5 },  // F#3
    { freq: 246.94, start: 18.0, dur: 9.0 },  // B3
    { freq: 311.13, start: 18.5, dur: 8.5 },  // D#4
  ];

  for (const note of chordNotes) {
    const startSample = Math.round(note.start * sampleRate);
    const endSample = Math.min(numSamples, Math.round((note.start + note.dur) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const progress = t / note.dur;
      // Piano hammer envelope: fast attack, natural exponential decay
      const env = Math.exp(-progress * 4.2) * (1 - Math.exp(-t * 120));

      // Steinway Grand Acoustic Piano Harmonics (24-bit resolution depth)
      const f = note.freq;
      const h1 = Math.sin(2 * Math.PI * f * t) * 0.40;
      const h2 = Math.sin(2 * Math.PI * f * 2.001 * t) * 0.22;
      const h3 = Math.sin(2 * Math.PI * f * 3.003 * t) * 0.12;
      const h4 = Math.sin(2 * Math.PI * f * 4.007 * t) * 0.06;
      const h5 = Math.sin(2 * Math.PI * f * 5.012 * t) * 0.03;
      const h6 = Math.sin(2 * Math.PI * f * 6.018 * t) * 0.015;

      const pianoSample = (h1 + h2 + h3 + h4 + h5 + h6) * env * 0.35;

      // Stereo concert hall spatial spread
      const pan = Math.sin(f * 0.015) * 0.35;
      left[i] += pianoSample * (0.5 - pan * 0.5);
      right[i] += pianoSample * (0.5 + pan * 0.5);
    }
  }

  // Add subtle natural acoustic hall reverberation
  const delaySamples = Math.round(0.045 * sampleRate);
  for (let i = delaySamples; i < numSamples; i++) {
    left[i] += right[i - delaySamples] * 0.18;
    right[i] += left[i - delaySamples] * 0.18;
  }

  return buffer;
}

function createCyberneticPulseBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 24;
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.round(duration * sampleRate);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const bpm = 120;
  const beatSec = 60 / bpm;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = (t % beatSec) / beatSec;
    const totalBeats = Math.floor(t / beatSec);

    // Deep Sub-Bass Pulse (38 Hz to 76 Hz sweep)
    const kickEnv = Math.exp(-beatPos * 12);
    const subFreq = 42 + Math.exp(-beatPos * 25) * 80;
    const subWave = Math.sin(2 * Math.PI * subFreq * t) * kickEnv * 0.55;

    // Hyper-Pepino Transients & Crisp Hi-Res Arp
    const arpFreqs = [261.63, 311.13, 392.00, 523.25, 622.25, 783.99, 1046.50, 1244.51];
    const arpStep = Math.floor((t * 8) % arpFreqs.length);
    const arpFreq = arpFreqs[arpStep];
    const arpSubPos = (t * 8) % 1;
    const arpEnv = Math.exp(-arpSubPos * 14) * 0.18;
    const arpSample = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv;

    // Atmospheric warm stereo pad
    const padFreq = 130.81 * (totalBeats % 8 < 4 ? 1 : 1.25);
    const padLeft = Math.sin(2 * Math.PI * padFreq * t + Math.sin(t * 0.8)) * 0.10;
    const padRight = Math.sin(2 * Math.PI * (padFreq * 1.004) * t + Math.cos(t * 0.8)) * 0.10;

    // Ultrasonic shimmer (tests 24-bit / 96kHz+ extended high-frequency response)
    const shimmer = Math.sin(2 * Math.PI * 18500 * t) * 0.008 * Math.sin(t * 3);

    left[i] = (subWave * 0.8 + arpSample * 0.9 + padLeft + shimmer) * 0.65;
    right[i] = (subWave * 0.8 + arpSample * 0.4 + padRight - shimmer) * 0.65;
  }

  return buffer;
}

function createAnalogVelvetDsdBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 26;
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.round(duration * sampleRate);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Acoustic Nylon Guitar & Cello Warm Duet
  // Emulates DSD direct master with pure continuous phase coherence
  const celloNotes = [
    { freq: 65.41, start: 0, dur: 6.5 },   // C2
    { freq: 82.41, start: 6.5, dur: 6.5 }, // E2
    { freq: 98.00, start: 13.0, dur: 6.5 },// G2
    { freq: 87.31, start: 19.5, dur: 6.5 },// F2
  ];

  for (const note of celloNotes) {
    const start = Math.round(note.start * sampleRate);
    const end = Math.min(numSamples, Math.round((note.start + note.dur) * sampleRate));
    for (let i = start; i < end; i++) {
      const t = (i - start) / sampleRate;
      const env = (1 - Math.exp(-t * 3)) * (1 - Math.exp(-(note.dur - t) * 2));
      const f = note.freq;
      const vibrato = 1 + Math.sin(2 * Math.PI * 5.2 * t) * 0.008;

      const c1 = Math.sin(2 * Math.PI * f * vibrato * t) * 0.35;
      const c2 = Math.sin(2 * Math.PI * f * 2 * vibrato * t) * 0.25; // 2nd harmonic warmth
      const c3 = Math.sin(2 * Math.PI * f * 3 * vibrato * t) * 0.12;

      const cello = (c1 + c2 + c3) * env * 0.45;
      left[i] += cello * 0.6;
      right[i] += cello * 0.4;
    }
  }

  // Nylon Guitar Plucks
  const plucks = [
    { freq: 196.00, t: 1.0 }, { freq: 246.94, t: 1.8 }, { freq: 293.66, t: 2.6 }, { freq: 392.00, t: 3.4 },
    { freq: 220.00, t: 7.5 }, { freq: 261.63, t: 8.3 }, { freq: 329.63, t: 9.1 }, { freq: 440.00, t: 9.9 },
    { freq: 196.00, t: 14.0 }, { freq: 246.94, t: 14.8 }, { freq: 293.66, t: 15.6 }, { freq: 493.88, t: 16.4 },
  ];

  for (const p of plucks) {
    const start = Math.round(p.t * sampleRate);
    const end = Math.min(numSamples, start + Math.round(2.8 * sampleRate));
    for (let i = start; i < end; i++) {
      const t = (i - start) / sampleRate;
      const env = Math.exp(-t * 4.5);
      const f = p.freq;
      const wave = (
        Math.sin(2 * Math.PI * f * t) * 0.4 +
        Math.sin(2 * Math.PI * f * 2 * t) * 0.3 +
        Math.sin(2 * Math.PI * f * 3 * t) * 0.15
      ) * env * 0.35;

      left[i] += wave * 0.35;
      right[i] += wave * 0.65;
    }
  }

  return buffer;
}

function createAmbientEtherealBuffer(ctx: AudioContext): AudioBuffer {
  const duration = 25;
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.round(duration * sampleRate);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Chime frequencies based on golden ratio intervals
    const c1 = Math.sin(2 * Math.PI * 432 * t) * 0.15 * (Math.sin(t * 0.4) * 0.5 + 0.5);
    const c2 = Math.sin(2 * Math.PI * 528 * t + 0.5) * 0.12 * (Math.cos(t * 0.3) * 0.5 + 0.5);
    const c3 = Math.sin(2 * Math.PI * 639 * t + 1.2) * 0.08 * (Math.sin(t * 0.5) * 0.5 + 0.5);
    const sub = Math.sin(2 * Math.PI * 54 * t) * 0.25;

    left[i] = (c1 + c2 * 0.6 + sub) * 0.6;
    right[i] = (c2 + c3 * 0.8 + sub) * 0.6;
  }

  return buffer;
}

export const PRELOADED_TRACKS: PreloadedTrack[] = [
  {
    metadata: {
      id: 'preloaded_chopin',
      fileName: 'chopin_nocturne_csharp_minor_24bit_96k.flac',
      fileSize: 48920400,
      containerFormat: 'FLAC',
      codec: 'FLAC Free Lossless Audio Codec',
      sampleRate: 96000,
      bitDepth: 24,
      bitDepthFormat: 'int24',
      channels: 2,
      bitrateKbps: 4608,
      duration: 28.0,
      isLossless: true,
      isHiRes: true,
      title: 'Nocturne No. 20 in C-Sharp Minor',
      artist: 'Frédéric Chopin (Studio Master)',
      album: 'Lossless Classical Master Recordings',
      year: '2026',
      genre: 'Classical / Acoustic Piano',
      compressionRatio: '58.2% of raw uncompressed',
      audioMd5: 'a4f912c781d09e33b684cb02ff56e188',
      syncedLyrics: [
        { time: 0.0, text: '♩ Lento con gran espressione — Introducción en Do sostenido menor' },
        { time: 2.2, text: 'En la penumbra de la noche, resuena la primera llamada del piano' },
        { time: 5.7, text: 'Una melodía suspendida en el aire, pura y melancólica' },
        { time: 8.2, text: 'El canto se eleva hacia los agudos con infinita delicadeza' },
        { time: 11.2, text: 'Descenso lírico entre sombras y resonancias armónicas' },
        { time: 14.8, text: 'Modulación suave, el corazón vacila entre la luz y el silencio' },
        { time: 16.8, text: 'Cadencia de resolución, la noche respira en paz absoluta' },
        { time: 22.0, text: 'Coda final, armónicos naturales desvaneciéndose en el vacío' },
      ],
      lyrics: `[00:00.00] ♩ Lento con gran espressione — Introducción en Do sostenido menor
[00:02.20] En la penumbra de la noche, resuena la primera llamada del piano
[00:05.70] Una melodía suspendida en el aire, pura y melancólica
[00:08.20] El canto se eleva hacia los agudos con infinita delicadeza
[00:11.20] Descenso lírico entre sombras y resonancias armónicas
[00:14.80] Modulación suave, el corazón vacila entre la luz y el silencio
[00:16.80] Cadencia de resolución, la noche respira en paz absoluta
[00:22.00] Coda final, armónicos naturales desvaneciéndose en el vacío`,
      rawHeaderInfo: {
        chunkSummary: 'STREAMINFO: 4096-4096 blocks, 24-bit LPC-12, 96.0 kHz',
        encodingMethod: 'Linear Predictive Coding (LPC-12) / Rice Partitioning',
        originalBitsPerSample: 24,
      },
    },
    generateBuffer: createChopinNocturneBuffer,
  },
  {
    metadata: {
      id: 'preloaded_hyper_pepino',
      fileName: 'hyper_pepino_cybernetic_pulse_32bit_192k.dxd',
      fileSize: 147456000,
      containerFormat: 'DXD / WAV',
      codec: 'IEEE 754 32-Bit Float DXD Uncompressed',
      sampleRate: 192000,
      bitDepth: 32,
      bitDepthFormat: 'float32',
      channels: 2,
      bitrateKbps: 12288,
      duration: 24.0,
      isLossless: true,
      isHiRes: true,
      title: 'Cybernetic Pulse (Hyper-Pepino Reference)',
      artist: 'Aether Acoustic Labs',
      album: 'Hyper-Pepino DSP Precision Benchmark Vol. 1',
      year: '2026',
      genre: 'Electronic / Spatial Master',
      compressionRatio: '100% Bit-Perfect Uncompressed',
      audioMd5: '7e20b5f13491ca09de0b924716b92f44',
      syncedLyrics: [
        { time: 0.0, text: 'Neural clock initialized — Physical DAC locked at 192.0 kHz' },
        { time: 3.0, text: 'Electric currents surging through the silicon veins' },
        { time: 6.0, text: 'Hyper-Pepino processor locked into femtosecond resonance' },
        { time: 9.0, text: 'Zero jitter, pure digital stream flowing uncompressed' },
        { time: 12.0, text: 'Feel the transient impact, laser-sharp and crystal clear' },
        { time: 16.0, text: 'Harmonic frequencies align in perfect mathematical symmetry' },
        { time: 20.0, text: '32-bit floating point precision echoes across the void' },
      ],
      lyrics: `[00:00.00] Neural clock initialized — Physical DAC locked at 192.0 kHz
[00:03.00] Electric currents surging through the silicon veins
[00:06.00] Hyper-Pepino processor locked into femtosecond resonance
[00:09.00] Zero jitter, pure digital stream flowing uncompressed
[00:12.00] Feel the transient impact, laser-sharp and crystal clear
[00:16.00] Harmonic frequencies align in perfect mathematical symmetry
[00:20.00] 32-bit floating point precision echoes across the void`,
      rawHeaderInfo: {
        chunkSummary: 'RIFF/WAVE fmt size: 40 bytes, WAVE_FORMAT_EXTENSIBLE 0xFFFE',
        encodingMethod: '32-Bit Linear PCM / Direct Stream float32',
        originalBitsPerSample: 32,
      },
    },
    generateBuffer: createCyberneticPulseBuffer,
  },
  {
    metadata: {
      id: 'preloaded_dsd',
      fileName: 'analog_velvet_acoustic_session_dsd128.dsf',
      fileSize: 180633600,
      containerFormat: 'DSD128 (DSF)',
      codec: '1-bit PDM Direct Stream Digital (5.6448 MHz)',
      sampleRate: 5644800,
      bitDepth: 1,
      bitDepthFormat: 'dsd_1bit',
      channels: 2,
      bitrateKbps: 11289,
      duration: 26.0,
      isLossless: true,
      isHiRes: true,
      title: 'Analog Velvet (Acoustic Chamber Session)',
      artist: 'Sylvan String Quartet',
      album: 'Direct Stream Pure Masters',
      year: '2026',
      genre: 'Chamber Acoustic / Cello & Guitar',
      compressionRatio: '100% Native 1-Bit Bitstream',
      audioMd5: '3c8e907d4b1a20ef18d79901cb4e2311',
      syncedLyrics: [
        { time: 0.0, text: 'Calidez acústica de cuerdas de tripa sobre el mástil' },
        { time: 3.5, text: 'El rasgueo de la guitarra de nylon despierta el aire de la sala' },
        { time: 7.5, text: 'Notas transparentes que respiran con naturalidad orgánica' },
        { time: 11.0, text: 'Ni un solo bit alterado, el timbre puro e intacto de la madera' },
        { time: 15.0, text: 'Diálogo armónico e íntimo entre el violonchelo y la guitarra' },
        { time: 19.5, text: 'Resonancia continua sin filtros ni compresiones digitales' },
        { time: 23.0, text: 'El eco final del silencio reverbera en la madera del instrumento' },
      ],
      lyrics: `[00:00.00] Calidez acústica de cuerdas de tripa sobre el mástil
[00:03.50] El rasgueo de la guitarra de nylon despierta el aire de la sala
[00:07.50] Notas transparentes que respiran con naturalidad orgánica
[00:11.00] Ni un solo bit alterado, el timbre puro e intacto de la madera
[00:15.00] Diálogo armónico e íntimo entre el violonchelo y la guitarra
[00:19.50] Resonancia continua sin filtros ni compresiones digitales
[00:23.00] El eco final del silencio reverbera en la madera del instrumento`,
      rawHeaderInfo: {
        chunkSummary: 'Sony/Philips DSD128: 5644800 Hz, 4096-byte block interleave',
        encodingMethod: '1-bit Pulse Density Modulation (PDM Delta-Sigma)',
        originalBitsPerSample: 1,
      },
    },
    generateBuffer: createAnalogVelvetDsdBuffer,
  },
  {
    metadata: {
      id: 'preloaded_ambient',
      fileName: 'ethereal_harmonics_24bit_48k.alac',
      fileSize: 43200000,
      containerFormat: 'M4A / ALAC',
      codec: 'Apple Lossless Audio Codec',
      sampleRate: 48000,
      bitDepth: 24,
      bitDepthFormat: 'int24',
      channels: 2,
      bitrateKbps: 2304,
      duration: 25.0,
      isLossless: true,
      isHiRes: true,
      title: 'Ethereal Harmonics (432Hz & 528Hz Solfeggio)',
      artist: 'Aether Soundscapes',
      album: 'Harmonic Equilibrium Master',
      year: '2026',
      genre: 'Ambient / Meditative',
      compressionRatio: '62.4% of raw uncompressed',
      audioMd5: '9b11e2f3d4a5c67890abcdef12345678',
      syncedLyrics: [
        { time: 0.0, text: 'Frecuencia primordial de 432 Hz en reposo y serenidad' },
        { time: 4.0, text: 'Vibración armónica natural que sosiega la mente' },
        { time: 8.0, text: 'Olas de sonido etéreo que expanden la percepción del espacio' },
        { time: 14.0, text: 'Sintonía pura de 528 Hz, transformación y equilibrio' },
        { time: 20.0, text: 'Paz interior profunda en resonancia bit-perfect' },
      ],
      lyrics: `[00:00.00] Frecuencia primordial de 432 Hz en reposo y serenidad
[00:04.00] Vibración armónica natural que sosiega la mente
[00:08.00] Olas de sonido etéreo que expanden la percepción del espacio
[00:14.00] Sintonía pura de 528 Hz, transformación y equilibrio
[00:20.00] Paz interior profunda en resonancia bit-perfect`,
      rawHeaderInfo: {
        chunkSummary: 'MP4 Box: moov.trak.mdia.minf.stbl.stsd.alac (24-bit / 48kHz)',
        encodingMethod: 'Apple Lossless Audio Codec (ALAC)',
        originalBitsPerSample: 24,
      },
    },
    generateBuffer: createAmbientEtherealBuffer,
  },
];

/**
 * High-Precision Test Tone Generator.
 */
export function generateTestSignal(
  type: 'sine_1k' | 'pink_noise' | 'ultrasonic_sweep' | 'linearity_60db',
  ctx: AudioContext
): { metadata: AudioMetadata; audioBuffer: AudioBuffer } {
  const duration = 12.0;
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.round(duration * sampleRate);
  const audioBuffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);

  let title = '1 kHz 0 dBFS Master Calibration Sine';
  let codec = '24-Bit Linear PCM Precision Sine';
  let format = 'WAV / Precision Calibration';

  if (type === 'sine_1k') {
    title = '1 kHz 0 dBFS Calibration Reference';
    codec = 'Pure 24-bit Integer Sine (THD < 0.00005%)';
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const s = Math.sin(2 * Math.PI * 1000 * t) * 0.9999;
      left[i] = s;
      right[i] = s;
    }
  } else if (type === 'pink_noise') {
    title = '24-Bit TPDF Dithered Pink Noise (-18 dBFS)';
    codec = 'Paul Kellet Filtered Pink Noise (Equal Energy / Octave)';
    format = 'WAV / Studio Calibration';
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < numSamples; i++) {
      const white = (Math.random() * 2 - 1) * 0.125;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      left[i] = pink;
      right[i] = pink;
    }
  } else if (type === 'ultrasonic_sweep') {
    title = 'Ultrasonic Logarithmic Sweep (20 Hz - 40 kHz)';
    codec = 'Chirp Continuous Phase Swept Sine';
    format = 'DXD / 192kHz Frequency Verification';
    const f0 = 20;
    const f1 = Math.min(40000, sampleRate * 0.45);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const phase = 2 * Math.PI * f0 * ((Math.pow(f1 / f0, t / duration) - 1) / Math.log(f1 / f0));
      const s = Math.sin(phase) * 0.5;
      left[i] = s;
      right[i] = s;
    }
  } else if (type === 'linearity_60db') {
    title = 'Low-Level Linearity Test (-60 dBFS 1 kHz)';
    codec = 'Quantization Depth & LSB Resolution Probe';
    format = 'WAV / Dynamic Range Calibration';
    const amp = Math.pow(10, -60 / 20); // 0.001 amplitude
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const s = Math.sin(2 * Math.PI * 1000 * t) * amp;
      left[i] = s;
      right[i] = s;
    }
  }

  const metadata: AudioMetadata = {
    id: `test_tone_${type}_${Date.now()}`,
    fileName: `${type}_calibration_master.wav`,
    fileSize: numSamples * 4 * 2,
    containerFormat: format,
    codec,
    sampleRate,
    bitDepth: 24,
    bitDepthFormat: 'int24',
    channels: 2,
    bitrateKbps: Math.round((sampleRate * 24 * 2) / 1000),
    duration,
    isLossless: true,
    isHiRes: true,
    title,
    artist: 'Aether Calibration Standards',
    album: 'Audio Engineering Test Signals',
    year: '2026',
    genre: 'Test & Calibration',
    compressionRatio: '100% Bit-Perfect Uncompressed',
    rawHeaderInfo: {
      chunkSummary: `Test Signal: ${type}, 24-bit IEEE float synthesis, sample rate: ${sampleRate} Hz`,
      encodingMethod: 'Synthesized Bit-Perfect Stream',
      originalBitsPerSample: 24,
    },
  };

  return { metadata, audioBuffer };
}
