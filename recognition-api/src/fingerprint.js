const FFT = require('fft.js');

// Tuning constants — changing these invalidates existing fingerprints
const WINDOW_SIZE = 1024;       // FFT window size (samples)
const HOP_SIZE = 32;            // samples between successive frames (~4ms at 8kHz)
const PEAKS_PER_FRAME = 5;      // strongest peaks to keep per time frame
const FAN_OUT = 15;             // anchor-point pairs per peak
const MIN_DELTA = 1;            // min frame gap between paired peaks
const MAX_DELTA = 200;          // max frame gap (~800ms at 8kHz/32 hop)

// Build a Hann window once
const HANN = new Float32Array(WINDOW_SIZE);
for (let i = 0; i < WINDOW_SIZE; i++) {
  HANN[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (WINDOW_SIZE - 1)));
}

// Short-time Fourier transform → log-magnitude spectrogram
// samples: number[]  →  frames: Float32Array[]
function buildSpectrogram(samples) {
  const fftInst = new FFT(WINDOW_SIZE);
  const frames = [];
  const numFrames = Math.max(0, Math.floor((samples.length - WINDOW_SIZE) / HOP_SIZE) + 1);

  for (let i = 0; i < numFrames; i++) {
    const start = i * HOP_SIZE;
    const input = new Array(WINDOW_SIZE);
    for (let j = 0; j < WINDOW_SIZE; j++) {
      const s = start + j < samples.length ? samples[start + j] : 0;
      input[j] = s * HANN[j];
    }

    const out = fftInst.createComplexArray();
    fftInst.realTransform(out, input);

    const mags = new Float32Array(WINDOW_SIZE / 2);
    for (let j = 0; j < WINDOW_SIZE / 2; j++) {
      const re = out[2 * j];
      const im = out[2 * j + 1];
      // log1p smooths out amplitude spikes and brings near-zero mags to 0
      mags[j] = Math.log1p(Math.sqrt(re * re + im * im));
    }
    frames.push(mags);
  }
  return frames;
}

// Find the top PEAKS_PER_FRAME local-maxima peaks per frame
// Returns [{t, f, mag}]
function findPeaks(spectrogram) {
  const peaks = [];
  for (let t = 0; t < spectrogram.length; t++) {
    const frame = spectrogram[t];
    const candidates = [];
    for (let f = 1; f < frame.length - 1; f++) {
      if (frame[f] > frame[f - 1] && frame[f] > frame[f + 1]) {
        candidates.push({ t, f, mag: frame[f] });
      }
    }
    candidates.sort((a, b) => b.mag - a.mag);
    for (const p of candidates.slice(0, PEAKS_PER_FRAME)) peaks.push(p);
  }
  return peaks;
}

// Pair each peak with the next FAN_OUT peaks in the time window.
// Returns [{hash: number (uint32), offset: number (frame index)}]
function generateHashes(peaks) {
  peaks.sort((a, b) => a.t - b.t || a.f - b.f);
  const hashes = [];

  for (let i = 0; i < peaks.length; i++) {
    const anchor = peaks[i];
    let count = 0;
    for (let j = i + 1; j < peaks.length && count < FAN_OUT; j++) {
      const point = peaks[j];
      const dt = point.t - anchor.t;
      if (dt < MIN_DELTA) continue;
      if (dt > MAX_DELTA) break;

      // Pack into 32 bits: anchor_freq[9] | point_freq[9] | time_delta[12] | unused[2]
      const hash = (((anchor.f & 0x1ff) << 23) |
                    ((point.f  & 0x1ff) << 14) |
                    ((dt       & 0xfff) <<  2)) >>> 0;
      hashes.push({ hash, offset: anchor.t });
      count++;
    }
  }
  return hashes;
}

// Full pipeline: raw float32 samples → [{hash, offset}]
function fingerprintSamples(samples) {
  const spec = buildSpectrogram(samples);
  const peaks = findPeaks(spec);
  return generateHashes(peaks);
}

module.exports = { fingerprintSamples, WINDOW_SIZE, HOP_SIZE };
