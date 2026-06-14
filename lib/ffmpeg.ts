// ffmpeg.wasm (single-thread core, no cross-origin isolation needed).
// Extracts audio from an uploaded mp4 and trims a selected region — all in-browser.
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CORE_VER = '0.12.10';
// UMD core: its worker loads ffmpeg-core.js via importScripts(), which accepts the
// toBlobURL blob URL. (The ESM core fails with "Cannot find module 'blob:…'".)
const BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VER}/dist/umd`;
const INPUT = 'input.mp4';

let ff: FFmpeg | null = null;
let loaded = false;

export interface ExtractResult {
  blob: Blob;
  url: string; // object URL for playback/waveform
  mime: string;
  ext: string;
}

export async function loadFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (!ff) ff = new FFmpeg();
  if (onProgress) ff.on('progress', ({ progress }) => onProgress(Math.min(1, Math.max(0, progress))));
  if (!loaded) {
    await ff.load({
      coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    loaded = true;
  }
  return ff;
}

export function isFFmpegLoaded() {
  return loaded;
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(3);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.padStart(6, '0')}`;
};

// Try mp3 (small) first; fall back to wav (always available in the core).
const OUT_TRIES: Array<{ args: string[]; out: string; mime: string; ext: string }> = [
  { args: ['-vn', '-ac', '1', '-ar', '32000', '-acodec', 'libmp3lame', '-q:a', '5'], out: 'out.mp3', mime: 'audio/mpeg', ext: 'mp3' },
  { args: ['-vn', '-ac', '1', '-ar', '32000', '-acodec', 'pcm_s16le'], out: 'out.wav', mime: 'audio/wav', ext: 'wav' },
];

/** Extract the full audio track from an uploaded video; keeps the input in FS for later trim. */
export async function extractAudio(file: File, onProgress?: (ratio: number) => void): Promise<ExtractResult> {
  const f = await loadFFmpeg(onProgress);
  await f.writeFile(INPUT, await fetchFile(file));
  for (const t of OUT_TRIES) {
    try {
      await f.exec(['-i', INPUT, ...t.args, t.out]);
      const data = (await f.readFile(t.out)) as Uint8Array;
      if (!data?.length) continue;
      const blob = new Blob([data], { type: t.mime });
      return { blob, url: URL.createObjectURL(blob), mime: t.mime, ext: t.ext };
    } catch {
      /* try next encoder */
    }
  }
  throw new Error('音声の抽出に失敗しました');
}

/** Cut [start, end] (seconds) from the already-written input; returns the trimmed audio. */
export async function trimAudio(start: number, end: number, onProgress?: (ratio: number) => void): Promise<ExtractResult> {
  const f = await loadFFmpeg(onProgress);
  const dur = Math.max(0.1, end - start);
  for (const t of OUT_TRIES) {
    const out = `trim.${t.ext}`;
    try {
      await f.exec(['-ss', fmt(start), '-i', INPUT, '-t', fmt(dur), ...t.args, out]);
      const data = (await f.readFile(out)) as Uint8Array;
      if (!data?.length) continue;
      const blob = new Blob([data], { type: t.mime });
      return { blob, url: URL.createObjectURL(blob), mime: t.mime, ext: t.ext };
    } catch {
      /* try next encoder */
    }
  }
  throw new Error('音声の切り出しに失敗しました');
}
