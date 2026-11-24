'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { ageInDays, growthStage, formatDotDate } from '@/lib/age';
import { chime } from '@/lib/sound';
import * as data from '@/lib/data';
import Sprite from './Sprite';

export default function HomeScreen({ active }: { active: boolean }) {
  const { child, clips } = useStore();
  const [mood, setMood] = useState('ごきげん');

  const days = ageInDays(child.birthday);
  const stage = growthStage(child.birthday);

  // memory cards = clips that carry a photo + caption
  // a memory card needs a caption + something to show (a real photo or a placeholder gradient)
  const memories = useMemo(() => clips.filter((c) => c.caption && (c.image_url || c.gradient)), [clips]);
  // Start deterministic (index 0) for SSR, then pick a random card after mount to avoid hydration mismatch.
  const [idx, setIdx] = useState(0);
  // Re-pick a valid random card whenever the memory set changes (e.g. after Supabase hydration),
  // so the index can never point past the current array (which would render the empty state).
  useEffect(() => {
    setIdx(memories.length ? Math.floor(Math.random() * memories.length) : 0);
  }, [memories.length]);
  const mem = memories.length ? memories[Math.min(idx, memories.length - 1)] : null;

  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // resolve a signed URL for stored images (paths); object/blob URLs used as-is
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setPhotoUrl(null);
    if (mem?.image_url) {
      if (data.isStoragePath(mem.image_url)) {
        data.signedUrl(data.BUCKET_IMAGES, mem.image_url).then((u) => alive && setPhotoUrl(u));
      } else {
        setPhotoUrl(mem.image_url); // blob:/http: already usable
      }
    }
    return () => {
      alive = false;
    };
  }, [mem?.id, mem?.image_url]);

  const shuffle = () => {
    if (memories.length <= 1) return;
    let n = idx;
    while (n === idx) n = Math.floor(Math.random() * memories.length);
    setIdx(n);
  };

  const play = async () => {
    if (!mem) return;
    chime();
    // when a real audio clip exists, resolve its signed URL and play it
    if (mem.audio_url && audioRef.current) {
      const src = data.isStoragePath(mem.audio_url)
        ? await data.signedUrl(data.BUCKET_AUDIO, mem.audio_url)
        : mem.audio_url;
      if (src) {
        audioRef.current.src = src;
        audioRef.current.play().catch(() => {});
      }
    }
    setPlaying(true);
    clearTimeout(playTimer.current);
    playTimer.current = setTimeout(() => setPlaying(false), 2600);
  };

  return (
    <section className={`screen ${active ? 'active' : ''}`} id="s-top" aria-hidden={!active}>
      <div className="eyebrow">growth diary</div>
      <h2 className="title">{child.name}の今日</h2>

      <div className="hero">
        <Sprite stage={stage} onMood={setMood} />
        <div className="name-row">
          <span className="nm">{child.name}</span>
          <span className="age">生後{days}日</span>
        </div>
        <div className="mood">{mood}</div>
        <div className="stats">
          <div className="stat"><div className="lab">うまれて</div><div className="val">{days}<small>日</small></div></div>
          <div className="stat"><div className="lab">しんちょう</div><div className="val">{child.height_cm}<small>cm</small></div></div>
          <div className="stat"><div className="lab">たいじゅう</div><div className="val">{child.weight_kg}<small>kg</small></div></div>
        </div>
        <div className="care-hint">スプライトをタップしてお世話できます</div>
      </div>

      <div className="mem-head">
        <div className="t">きょう出てきた思い出</div>
        <button className="shuffle" onClick={shuffle}>🎲 シャッフル</button>
      </div>

      {mem ? (
        <div
          className={`card ${playing ? 'playing' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="写真をタップして声を再生"
          onClick={play}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } }}
        >
          <div className="photo" style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : { background: mem.gradient }} />
          <div className="play-badge">▶</div>
          <div className="meta">
            <div className="date">{formatDotDate(mem.recorded_at)}</div>
            <div className="cap">{mem.caption}</div>
          </div>
          <div className="wave-ov">
            <span className="pp">♪</span>
            <div className="bars">{Array.from({ length: 12 }).map((_, i) => <span key={i} />)}</div>
            <span className="tlab">声、流れてます</span>
          </div>
          <audio ref={audioRef} hidden />
        </div>
      ) : (
        <div className="empty">まだ思い出がありません。「のこす」から声を残しましょう。</div>
      )}

      <div className="hint">写真をタップすると、その日の{child.name}の声が流れます</div>
    </section>
  );
}
