'use client';
import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { chime } from '@/lib/sound';
import type { Clip } from '@/lib/types';

type Cat = 'c-kimochi' | 'c-kotoba' | 'c-namae' | 'c-free';

const KIMOCHI = [
  { level: 1, l: 'メッチャうれしい', ic: '🌟', g: 'linear-gradient(135deg,#FFE08A,#FFC36E)' },
  { level: 2, l: 'チョーうれしい', ic: '😆', g: 'linear-gradient(135deg,#FFD0A6,#FFB3C9)' },
  { level: 3, l: 'うれしい', ic: '🙂', g: 'linear-gradient(135deg,#F8C3D8,#F49AC1)' },
  { level: 4, l: 'かなしい', ic: '🥲', g: 'linear-gradient(135deg,#CDE7E5,#A7DAD7)' },
  { level: 5, l: 'チョーかなしい', ic: '😢', g: 'linear-gradient(135deg,#A9D8DA,#7FC5C9)' },
  { level: 6, l: 'メッチャかなしい', ic: '😭', g: 'linear-gradient(135deg,#8FCAD0,#5BC8C4)' },
];

/** A tappable card that flashes its "playing" animation + chime. */
function usePlayFlash(ms: number) {
  const [id, setId] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>();
  const fire = (key: string) => {
    chime();
    setId(key);
    clearTimeout(t.current);
    t.current = setTimeout(() => setId(null), ms);
  };
  return [id, fire] as const;
}

function WordGrid({ clips, lead }: { clips: Clip[]; lead?: React.ReactNode }) {
  // group by label
  const groups = useMemo(() => {
    const m = new Map<string, { label: string; icon?: string; gradient?: string; count: number }>();
    clips.forEach((c) => {
      if (!c.label) return;
      const g = m.get(c.label) ?? { label: c.label, icon: c.icon, gradient: c.gradient, count: 0 };
      g.count += 1;
      m.set(c.label, g);
    });
    return [...m.values()];
  }, [clips]);
  const [playing, fire] = usePlayFlash(1800);

  return (
    <div className="wordgrid">
      {lead}
      {groups.map((g) => (
        <div
          key={g.label}
          className={`word ${playing === g.label ? 'playing' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => fire(g.label)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(g.label); } }}
        >
          <div className="pic" style={g.gradient ? { background: g.gradient } : undefined}>{g.icon}</div>
          <div className="pmark">▶</div>
          <div className="lab"><span className="w">{g.label}</span><span className="n">{g.count}件</span></div>
        </div>
      ))}
    </div>
  );
}

export default function JitenScreen({ active }: { active: boolean }) {
  const { clips, collections, addFreeCollection } = useStore();
  const [cat, setCat] = useState<Cat>('c-kimochi');
  const [playing, fire] = usePlayFlash(2200);

  const kimochiClips = clips.filter((c) => c.category === 'kimochi');
  const kotobaClips = clips.filter((c) => c.category === 'kotoba');
  const namaeClips = clips.filter((c) => c.category === 'namae');

  const freeCount = (colId: string) => clips.filter((c) => c.collection_id === colId).length;
  // free clips not filed under any collection — still belong in じてん so they don't get lost
  const looseFree = clips.filter(
    (c) => c.category === 'free' && !c.collection_id && (c.caption || c.image_url || c.gradient),
  );

  const addFree = () => {
    const t = typeof window !== 'undefined' ? window.prompt('あたらしいタイトルを入れてください', '') : '';
    if (t && t.trim()) addFreeCollection(t.trim()).catch((e) => alert('追加に失敗しました: ' + (e?.message ?? e)));
  };

  const tabs: Array<{ id: Cat; label: string }> = [
    { id: 'c-kimochi', label: 'きもち' },
    { id: 'c-kotoba', label: 'ことば' },
    { id: 'c-namae', label: 'なまえ' },
    { id: 'c-free', label: 'フリー' },
  ];

  return (
    <section className={`screen ${active ? 'active' : ''}`} id="s-jiten" aria-hidden={!active}>
      <div className="eyebrow">ruito dictionary</div>
      <h2 className="title">るいとじてん</h2>

      <div className="cats" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={cat === t.id} className={`cat ${cat === t.id ? 'on' : ''}`} onClick={() => setCat(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={`catview ${cat === 'c-kimochi' ? 'on' : ''}`}>
        <div className="scale-note"><span>うれしい ▲</span><span>▼ かなしい</span></div>
        <div>
          {KIMOCHI.map((f) => {
            const count = kimochiClips.filter((c) => c.kimochi_level === f.level).length;
            const key = `k${f.level}`;
            return (
              <div
                key={f.level}
                className={`feel ${playing === key ? 'playing' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => fire(key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(key); } }}
              >
                <div className="thumb" style={{ background: f.g }}>{f.ic}</div>
                <div className="info"><div className="l">{f.l}</div><div className="c">▶ {count} 件の声</div></div>
                <div className="mini-bars">{Array.from({ length: 7 }).map((_, i) => <i key={i} />)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`catview ${cat === 'c-kotoba' ? 'on' : ''}`}>
        <WordGrid clips={kotobaClips} />
      </div>

      <div className={`catview ${cat === 'c-namae' ? 'on' : ''}`}>
        <WordGrid clips={namaeClips} />
      </div>

      <div className={`catview ${cat === 'c-free' ? 'on' : ''}`}>
        <div className="scale-note"><span>自分でタイトルを決めて集められます</span></div>
        <div className="wordgrid">
          <div
            className="word add"
            role="button"
            tabIndex={0}
            onClick={addFree}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addFree(); } }}
          >
            <span className="plus">＋</span>あたらしく つくる
          </div>
          {collections.map((c) => (
            <div
              key={c.id}
              className={`word ${playing === c.id ? 'playing' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fire(c.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(c.id); } }}
            >
              <div className="pic" style={c.gradient ? { background: c.gradient } : undefined}>{c.icon}</div>
              <div className="pmark">▶</div>
              <div className="lab"><span className="w">{c.title}</span><span className="n">{freeCount(c.id)}件</span></div>
            </div>
          ))}
          {looseFree.map((c) => (
            <div
              key={c.id}
              className={`word ${playing === c.id ? 'playing' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fire(c.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(c.id); } }}
            >
              <div className="pic" style={{ background: c.gradient ?? 'linear-gradient(135deg,#E7DDF0,#C9B8E6)' }}>{c.icon ?? '🎁'}</div>
              <div className="pmark">▶</div>
              <div className="lab"><span className="w">{c.caption ?? 'フリー'}</span><span className="n">1件</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
