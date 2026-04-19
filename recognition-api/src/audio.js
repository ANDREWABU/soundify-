const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const TARGET_SAMPLE_RATE = 8000;

// Decode any audio format to mono float32 PCM at 8000 Hz using ffmpeg
function decodeAudio(inputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, [
      '-i', inputPath,
      '-ar', String(TARGET_SAMPLE_RATE),
      '-ac', '1',
      '-f', 'f32le',
      '-loglevel', 'error',
      'pipe:1',
    ]);

    const chunks = [];
    ffmpeg.stdout.on('data', chunk => chunks.push(chunk));

    let stderr = '';
    ffmpeg.stderr.on('data', d => { stderr += d.toString(); });

    ffmpeg.on('close', code => {
      if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${stderr}`));
      const buf = Buffer.concat(chunks);
      const samples = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
      resolve(Array.from(samples));
    });

    ffmpeg.on('error', err => reject(new Error(`ffmpeg spawn failed: ${err.message}`)));
  });
}

// Write a buffer to a temp file and return its path
async function bufferToTempFile(buffer, ext = '.webm') {
  const tmpPath = path.join(os.tmpdir(), `soundify_${crypto.randomBytes(8).toString('hex')}${ext}`);
  await fs.promises.writeFile(tmpPath, buffer);
  return tmpPath;
}

async function cleanupTemp(filePath) {
  try { await fs.promises.unlink(filePath); } catch (_) {}
}

module.exports = { decodeAudio, bufferToTempFile, cleanupTemp, TARGET_SAMPLE_RATE };
