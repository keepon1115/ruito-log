'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Category } from '@/lib/types';
import * as data from '@/lib/data';
import Waveform from './Waveform';

const RAND_GRADIENTS = [
  'linear-gradient(135deg,#FAD0C4,#FFD1A9)',
  'linear-gradient(135deg,#A0E9E2,#8FD3F4)',
  'linear-gradient(135deg,#F8B6CE,#F49AC1)',
  'linear-gradient(135deg,#FFE3A3,#FFC36E)',
  'linear-gradient(135deg,#C2F0DD,#9BE7C4)',
];

const KIMOCHI_LEVELS = ['メッチャうれしい', 'チョーうれしい', 'うれしい', 'かなしい', 'チョーかなしい', 'メッチャかなしい'];

interface Extracted {
  url: string;
  ext: string;
  mime: string;
  blob: Blob;
}

export default function PostScreen({ active }: { active: boolean }) {
  const { collections, addClip, addFreeCollection, backed } = useStore();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audio, setAudio] = useState<Extracted | null>(null);
  const [fallback, setFallback] = useState(false); // play original track (extraction failed)
  const [sel, setSel] = useState({ start: 0, end: 0 });

  const [imageName, setImageName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<Category>('kimochi');
  const [kimochiLevel, setKimochiLevel] = useState(3);
  const [label, setLabel] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const onVideo = async (f: File | null) => {
    if (!f) return;
    setVideoFile(f);
    setVideoName(f.name);
    setAudio(null);
    setFallback(false);
    setExtracting(true);
    setProgress(0);
    try {
      const { extractAudio } = await import('@/lib/ffmpeg');
      const res = await extractAudio(f, setProgress);
      setAudio({ url: res.url, ext: res.ext, mime: res.mime, blob: res.blob });
    } catch (e) {
      console.warn('[ruito] extractAudio failed → using original audio track:', e);
      // fallback: play the video's own audio track (spec-approved)
      setFallback(true);
      setAudio({ url: URL.createObjectURL(f), ext: f.name.split('.').pop() || 'mp4', mime: f.type || 'video/mp4', blob: f });
    } finally {
      setExtracting(false);
    }
  };

  const onImage = (f: File | null) => {
    if (!f) return;
    setImageName(f.name);
    setImageFile(f);
    setImageUrl(URL.createObjectURL(f));
  };

  const canSave =
    !!audio &&
    !extracting &&
    (category === 'kotoba' || category === 'namae' ? label.trim() !== '' : true);

  const save = async () => {
    if (!canSave || saving || !audio) return;
    setSaving(true);
    try {
      // produce the final audio: trim the selected region unless we're on the fallback path
      let audioBlob = audio.blob;
      let audioExt = audio.ext;
      if (!fallback) {
        const { trimAudio } = await import('@/lib/ffmpeg');
        const trimmed = await trimAudio(sel.start, sel.end, setProgress);
        audioBlob = trimmed.blob;
        audioExt = trimmed.ext;
      }

      let audio_url: string | null;
      let image_url: string | null = imageUrl;
      if (backed) {
        audio_url = await data.uploadMedia(data.BUCKET_AUDIO, audioBlob, audioExt);
        if (imageFile) {
          const ext = imageFile.name.split('.').pop() || 'jpg';
          image_url = await data.uploadMedia(data.BUCKET_IMAGES, imageFile, ext);
        }
      } else {
        audio_url = URL.createObjectURL(audioBlob); // in-session playback only
      }

      await addClip({
        audio_url,
        image_url,
        caption: caption.trim() || null,
        recorded_at: new Date().toISOString(),
        category,
        kimochi_level: category === 'kimochi' ? kimochiLevel : null,
        label: category === 'kotoba' || category === 'namae' ? label.trim() : null,
        collection_id: category === 'free' ? collectionId || null : null,
        gradient: image_url ? undefined : RAND_GRADIENTS[Math.floor(Math.random() * RAND_GRADIENTS.length)],
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
      // reset the flow
      setVideoFile(null);
      setVideoName(null);
      setAudio(null);
      setFallback(false);
      setCaption('');
      setLabel('');
      setImageFile(null);
      setImageName(null);
      setImageUrl(null);
    } catch (e: any) {
      alert('保存に失敗しました: ' + (e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const catBtn = (id: Category, lab: string) => (
    <button className={category === id ? 'on' : ''} onClick={() => setCategory(id)} type="button">{lab}</button>
  );

  return (
    <section className={`screen ${active ? 'active' : ''}`} id="s-post" aria-hidden={!active}>
      <div className="eyebrow">new memory</div>
      <h2 className="title">声を残す</h2>

      {/* step 1 */}
      <div className="step">
        <div className="num">1</div>
        <div className="body">
          <div className="h">動画をアップロード</div>
          <label className={`drop ${videoName ? 'filled' : ''}`}>
            <input type="file" accept="video/mp4,video/*" hidden onChange={(e) => onVideo(e.target.files?.[0] ?? null)} />
            <div className="ic">🎬</div>
            <div className="d1">{videoName ?? 'mp4をえらぶ'}</div>
            <div className="d2">音だけを自動で取り出します</div>
          </label>
        </div>
      </div>
      <div className="convert">
        <span className={`chip ${videoName ? 'on' : ''}`}>mp4</span> →{' '}
        <span className={`chip ${audio && !fallback ? 'on' : ''}`}>{extracting ? `抽出中 ${Math.round(progress * 100)}%` : '音声を抽出'}</span> →{' '}
        <span className={`chip ${audio ? 'on' : ''}`}>波形へ</span>
      </div>

      {/* step 2 */}
      <div className="step">
        <div className="num">2</div>
        <div className="body">
          <div className="h">いる部分だけ切り出す</div>
          {extracting && <div className="editor"><div className="convert">⏳ 音声を取り出しています… {Math.round(progress * 100)}%</div></div>}
          {!extracting && audio && !fallback && <Waveform url={audio.url} onRegion={(s, e) => setSel({ start: s, end: e })} />}
          {!extracting && audio && fallback && (
            <div className="editor">
              <div className="convert">音声抽出が使えないため、動画の音をそのまま使います</div>
              <audio src={audio.url} controls style={{ width: '100%' }} />
            </div>
          )}
          {!audio && !extracting && <div className="editor"><div className="convert">まず動画をえらんでください</div></div>}
        </div>
      </div>

      {/* step 3 */}
      <div className="step">
        <div className="num">3</div>
        <div className="body">
          <div className="h">合う写真をつける ＆ ふりわけ</div>
          <label className={`drop ${imageName ? 'filled' : ''}`}>
            <input type="file" accept="image/*" hidden onChange={(e) => onImage(e.target.files?.[0] ?? null)} />
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="thumb-prev" src={imageUrl} alt="プレビュー" />
            ) : (
              <div className="ic">🖼️</div>
            )}
            <div className="d1">{imageName ?? '画像をえらぶ'}</div>
            <div className="d2">じてん（きもち / ことば / なまえ / フリー）に登録できます</div>
          </label>

          <div className="pickrow">
            {catBtn('kimochi', 'きもち')}
            {catBtn('kotoba', 'ことば')}
            {catBtn('namae', 'なまえ')}
            {catBtn('free', 'フリー')}
          </div>

          {category === 'kimochi' && (
            <div className="pickrow">
              {KIMOCHI_LEVELS.map((l, i) => (
                <button key={i} type="button" className={kimochiLevel === i + 1 ? 'on' : ''} onClick={() => setKimochiLevel(i + 1)}>{l}</button>
              ))}
            </div>
          )}

          {(category === 'kotoba' || category === 'namae') && (
            <input className="textinp" placeholder="ことば（例：いちご / まま）" value={label} onChange={(e) => setLabel(e.target.value)} />
          )}

          {category === 'free' && (
            <div className="pickrow">
              {collections.map((c) => (
                <button key={c.id} type="button" className={collectionId === c.id ? 'on' : ''} onClick={() => setCollectionId(c.id)}>{c.title}</button>
              ))}
              <button
                type="button"
                onClick={async () => {
                  const t = window.prompt('あたらしいコレクション名', '');
                  if (t && t.trim()) setCollectionId((await addFreeCollection(t.trim())).id);
                }}
              >
                ＋ あたらしく
              </button>
            </div>
          )}

          <input className="textinp" placeholder="ひとことキャプション（任意）" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
      </div>

      <button className="save-btn" type="button" onClick={save} disabled={!canSave || saving}>
        {saved ? 'ほぞんしました ♡' : saving ? 'ほぞん中…' : 'この思い出を保存'}
      </button>
    </section>
  );
}
