const AUDD_API_KEY = 'ef99f8a71c9bc9511f91c4391a0451ba';

let mediaRecorder = null;
let audioChunks = [];

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const mimeType = getSupportedMimeType();
  const options = mimeType ? { mimeType } : {};

  mediaRecorder = new MediaRecorder(stream, options);
  audioChunks = [];

  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  });

  mediaRecorder.start(100);
}

export async function stopAndRecognize() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('Recorder not active'));
      return;
    }

    mediaRecorder.addEventListener('stop', async () => {
      try {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks, { type: mimeType });
        // Release mic immediately so other audio can resume
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());

        console.log('[Soundify] Recorded blob:', blob.size, 'bytes, type:', mimeType);

        if (blob.size < 1000) {
          reject(new Error('Recording too short or empty'));
          return;
        }

        const formData = new FormData();
        formData.append('api_token', AUDD_API_KEY);
        formData.append('return', 'spotify');
        formData.append('file', blob, 'audio.webm');

        const res = await fetch('https://api.audd.io/', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`AudD HTTP ${res.status}`);
        const data = await res.json();
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });

    mediaRecorder.stop();
  });
}
