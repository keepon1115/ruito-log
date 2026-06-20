'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { chime } from '@/lib/sound';
import { AIUEO, AIUEO_ROWS, entryOfTheDay, type AiueoEntry } from '@/lib/aiueo';

type Face = 'charm' | 'trivia';
const STAMP_KEY = 'ruito.aiueoStamps';

/** Opened-kana stamps persist device-local (cosmetic, free-tier) — same pattern as sprite moods. */
function useStamps() {
  // SSR-safe: start empty, hydrate after mount so server/client markup matches.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STAMP_KEY);
      if (raw) setOpened(new Set(JSON.parse(raw)));
    } catch {
      /* ignore corrupt/blocked storage */
    }
  }, []);
  const open = (kana: string) =>
    setOpened((prev) => {
      if (prev.has(kana)) return prev;
      const next = new Set(prev).add(kana);
      try {
        localStorage.setItem(STAMP_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  return [opened, open] as const;
}

export default function ZukanScreen({ active }: { active: boolean }) {
  const { child } = useStore();
  const [face, setFace] = useState<Face>('charm');
  const [opened, open] = useStamps();

  // The day's headline kana (deterministic per family + date). Stable for SSR.
  const today = useMemo(() => entryOfTheDay(child.birthday), [child.birthday]);
  // Currently focused entry shown in the reveal card. Defaults to today's.
  const [focus, setFocus] = useState<AiueoEntry>(today);
  useEffect(() => setFocus(today), [today]);

  // Brief flip pulse when the face or focused entry changes.
  const [flip, setFlip] = useState(0);
  const flipTimer = useRef<ReturnType<typeof setTimeout>>();
  const pulse = () => {
    setFlip((n) => n + 1);
    clearTimeout(flipTimer.current);
    flipTimer.current = setTimeout(() => setFlip(0), 10);
  };

  const pick = (e: AiueoEntry) => {
    chime();
    setFocus(e);
    open(e.kana);
    pulse();
  };
  const toggle = (f: Face) => {
    if (f === face) return;
    setFace(f);
    pulse();
  };

  const text = face === 'charm' ? focus.charm : focus.trivia;
  const isToday = focus.kana === today.kana;
  const collected = opened.size;
  const total = AIUEO.length;
  const pct = Math.round((collected / total) * 100);

  return (
    <section className={`screen ${active ? 'active' : ''}`} id="s-zukan" aria-hidden={!active}>
      <div className="eyebrow">baby encyclopedia</div>
      <h2 className="title">あかちゃんずかん</h2>

      <div className="cats" role="tablist" aria-label="図鑑の面">
        <button role="tab" aria-selected={face === 'charm'} className={`cat ${face === 'charm' ? 'on' : ''}`} onClick={() => toggle('charm')}>
          ❤️ みりょく
        </button>
        <button role="tab" aria-selected={face === 'trivia'} className={`cat ${face === 'trivia' ? 'on' : ''}`} onClick={() => toggle('trivia')}>
          🔬 ものしり
        </button>
      </div>

      {/* reveal card — shows today's kana by default, or whichever tile is tapped */}
      <div
        key={flip}
        className={`zk-reveal ${face} ${flip ? 'flip' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${focus.kana} の${face === 'charm' ? '魅力' : '雑学'}を読み上げ`}
        onClick={() => pick(focus)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(focus); } }}
      >
        <div className="zk-tile big">{focus.kana}</div>
        <div className="zk-body">
          {isToday && <div className="zk-badge">きょうのいちもじ</div>}
          <p className="zk-text">{text}</p>
        </div>
      </div>

      {/* 五十音グリッド */}
      <div className="zk-grid" role="list" aria-label="五十音">
        {AIUEO_ROWS.map((row, ri) => (
          <div className="zk-row" key={ri}>
            {row.map((e) => {
              const isOpen = opened.has(e.kana);
              const isFocus = e.kana === focus.kana;
              const isDay = e.kana === today.kana;
              return (
                <button
                  key={e.kana}
                  role="listitem"
                  className={`zk-cell ${isOpen ? 'open' : ''} ${isFocus ? 'focus' : ''} ${isDay ? 'today' : ''}`}
                  aria-label={`${e.kana}${isOpen ? '・あけた' : ''}`}
                  aria-pressed={isFocus}
                  onClick={() => pick(e)}
                >
                  {e.kana}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="zk-progress">
        <div className="zk-pbar"><i style={{ width: `${pct}%` }} /></div>
        <div className="zk-pnum">あつめた {collected} / {total}</div>
      </div>

      {face === 'trivia' && <p className="zk-disclaimer">※諸説あるものや、条件付きの研究結果を含みます</p>}
      <p className="hint">もじをタップすると、その日の発見がめくれます</p>
    </section>
  );
}
