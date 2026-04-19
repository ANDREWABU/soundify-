const RECOGNITION_API_URL = import.meta.env.VITE_RECOGNITION_API_URL || 'http://localhost:3001';

let mediaRecorder = null;
let audioChunks = [];

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function attachRecorder(stream) {
  const mimeType = getSupportedMimeType();
  const options = mimeType ? { mimeType } : {};
  mediaRecorder = new MediaRecorder(stream, options);
  audioChunks = [];
  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  });
  mediaRecorder.start(100);
}

// Capture from microphone
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  attachRecorder(stream);
}

// Capture whatever audio is currently playing (tab audio / system audio).
// The browser will show a "Share your screen" picker — user must select a tab
// or window and check "Share audio / Share tab audio".
export async function startSystemAudioCapture() {
  // Some browsers require video:true to allow audio in getDisplayMedia
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { width: 1, height: 1 },
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });

  // Drop the video track immediately — we only need audio
  stream.getVideoTracks().forEach((t) => t.stop());

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('No audio track captured. Make sure to check "Share audio" in the picker.');
  }

  attachRecorder(new MediaStream(audioTracks));
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
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());

        console.log('[Soundify] Recorded blob:', blob.size, 'bytes, type:', mimeType);

        if (blob.size < 1000) {
          reject(new Error('Recording too short or empty'));
          return;
        }

        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');

        const res = await fetch(`${RECOGNITION_API_URL}/recognize`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`Recognition API HTTP ${res.status}`);
        const data = await res.json();

        if (data.result === 'no_match') {
          resolve({ status: 'error', error: { error_code: 901, error_message: 'No result' } });
          return;
        }

        resolve({
          status: 'success',
          result: {
            title:      data.song.title,
            artist:     data.song.artist,
            album:      data.song.album,
            score:      data.score,
            confidence: data.confidence,
            spotify:    data.song.spotify ?? null,
          },
        });
      } catch (err) {
        reject(err);
      }
    });

    mediaRecorder.stop();
  });
}

// Add a song to the recognition database (call from an admin/ingest UI)
export async function ingestSong(audioFile, { title, artist, album }) {
  const formData = new FormData();
  formData.append('audio', audioFile, audioFile.name);
  formData.append('title', title);
  if (artist) formData.append('artist', artist);
  if (album)  formData.append('album', album);

  const res = await fetch(`${RECOGNITION_API_URL}/songs/ingest`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Ingest HTTP ${res.status}`);
  return res.json();
}

// List all songs in the recognition database
export async function listRecognitionSongs() {
  const res = await fetch(`${RECOGNITION_API_URL}/songs`);
  if (!res.ok) throw new Error(`List songs HTTP ${res.status}`);
  return res.json();
}
