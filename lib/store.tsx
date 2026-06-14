'use client';
// App store. Seeds with deterministic mock data for SSR / no-backend use; when
// Supabase is configured it hydrates from and persists to the DB on mount.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Child, Clip, FreeCollection, SpriteMood } from './types';
import * as data from './data';

const MOODS_KEY = 'ruito.spriteMoods';

const CHILD_ID = 'demo-child';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const initialChild: Child = {
  id: CHILD_ID,
  name: 'るいと',
  birthday: '2025-12-09',
  height_cm: 67.4,
  weight_kg: 7.8,
};

// ---- seed clips (mirrors mock arrays) -------------------------------------
const photoSeed = [
  { gradient: 'linear-gradient(135deg,#FAD0C4,#FFD1A9)', caption: 'はじめて声を出して笑った', recorded_at: '2026-04-02' },
  { gradient: 'linear-gradient(135deg,#A0E9E2,#8FD3F4)', caption: 'おふろで「あー」って言った', recorded_at: '2026-05-18' },
  { gradient: 'linear-gradient(135deg,#F8B6CE,#F49AC1)', caption: 'ねむい時の小さなうなり声', recorded_at: '2026-05-30' },
  { gradient: 'linear-gradient(135deg,#FFE3A3,#FFC36E)', caption: 'パパを見つけて喃語', recorded_at: '2026-06-07' },
  { gradient: 'linear-gradient(135deg,#C2F0DD,#9BE7C4)', caption: 'くしゃみのあとの「ふぁっ」', recorded_at: '2026-06-13' },
];
const feelSeed = [
  { level: 1, gradient: 'linear-gradient(135deg,#FFE08A,#FFC36E)' },
  { level: 2, gradient: 'linear-gradient(135deg,#FFD0A6,#FFB3C9)' },
  { level: 3, gradient: 'linear-gradient(135deg,#F8C3D8,#F49AC1)' },
  { level: 4, gradient: 'linear-gradient(135deg,#CDE7E5,#A7DAD7)' },
  { level: 5, gradient: 'linear-gradient(135deg,#A9D8DA,#7FC5C9)' },
  { level: 6, gradient: 'linear-gradient(135deg,#8FCAD0,#5BC8C4)' },
];
const kotobaSeed = [
  { w: 'くるま', ic: '🚗', g: 'linear-gradient(135deg,#BEE3F8,#9FCEF0)' },
  { w: 'いちご', ic: '🍓', g: 'linear-gradient(135deg,#FAC2D2,#F49AC1)' },
  { w: 'りんご', ic: '🍎', g: 'linear-gradient(135deg,#FBC9B6,#F6A98C)' },
  { w: 'バナナ', ic: '🍌', g: 'linear-gradient(135deg,#FFE7A0,#FFD36E)' },
  { w: 'わんわん', ic: '🐶', g: 'linear-gradient(135deg,#E7D9C7,#D8C4A8)' },
  { w: 'でんしゃ', ic: '🚃', g: 'linear-gradient(135deg,#BFEAE6,#8FD7D2)' },
];
const namaeSeed = [
  { w: 'まま', ic: '🤱', g: 'linear-gradient(135deg,#FAC2D2,#F49AC1)' },
  { w: 'ぱぱ', ic: '🧔', g: 'linear-gradient(135deg,#BFEAE6,#7FC5C9)' },
  { w: 'ばあば', ic: '👵', g: 'linear-gradient(135deg,#FBD9E4,#F3B6CC)' },
  { w: 'じいじ', ic: '👴', g: 'linear-gradient(135deg,#CFE9E6,#A7DAD7)' },
];
const freeColSeed = [
  { title: 'おかお', ic: '😊', g: 'linear-gradient(135deg,#FBD9E4,#F49AC1)' },
  { title: 'はじめて', ic: '✨', g: 'linear-gradient(135deg,#FFE7A0,#FFD36E)' },
  { title: 'おそとデビュー', ic: '🌿', g: 'linear-gradient(135deg,#C2F0DD,#8FD7D2)' },
];

function buildSeed(): { clips: Clip[]; collections: FreeCollection[] } {
  const clips: Clip[] = [];
  let seq = 0;
  const base = (p: Partial<Clip>): Clip => ({
    id: `seed-${seq++}`,
    child_id: CHILD_ID,
    audio_url: null,
    image_url: null,
    caption: null,
    recorded_at: '2026-06-01',
    category: 'free',
    kimochi_level: null,
    label: null,
    collection_id: null,
    ...p,
  });

  photoSeed.forEach((p) =>
    clips.push(base({ category: 'free', gradient: p.gradient, caption: p.caption, recorded_at: p.recorded_at })),
  );
  feelSeed.forEach((f) =>
    clips.push(base({ category: 'kimochi', kimochi_level: f.level, gradient: f.gradient, recorded_at: '2026-05-20' })),
  );
  kotobaSeed.forEach((k) =>
    clips.push(base({ category: 'kotoba', label: k.w, icon: k.ic, gradient: k.g, recorded_at: '2026-05-22' })),
  );
  namaeSeed.forEach((k) =>
    clips.push(base({ category: 'namae', label: k.w, icon: k.ic, gradient: k.g, recorded_at: '2026-05-24' })),
  );

  const collections: FreeCollection[] = freeColSeed.map((c, i) => ({
    id: `col-${i}`,
    child_id: CHILD_ID,
    title: c.title,
    icon: c.ic,
    gradient: c.g,
  }));
  collections.forEach((c) =>
    clips.push(base({ category: 'free', collection_id: c.id, gradient: c.gradient, icon: c.icon, recorded_at: '2026-05-26' })),
  );

  return { clips, collections };
}

interface Store {
  child: Child;
  clips: Clip[];
  collections: FreeCollection[];
  spriteMoods: SpriteMood[];
  backed: boolean; // true once data is loaded from Supabase
  updateProfile: (p: Partial<Child>) => Promise<void>;
  addFreeCollection: (title: string) => Promise<FreeCollection>;
  addClip: (c: Omit<Clip, 'id' | 'child_id'>) => Promise<void>;
  addSpriteMood: (m: Omit<SpriteMood, 'id'>) => void;
  removeSpriteMood: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const seed = useMemo(buildSeed, []);
  const [child, setChild] = useState<Child>(initialChild);
  const [clips, setClips] = useState<Clip[]>(seed.clips);
  const [collections, setCollections] = useState<FreeCollection[]>(seed.collections);
  const [spriteMoods, setSpriteMoods] = useState<SpriteMood[]>([]);
  const [backed, setBacked] = useState(false);

  // Sprite moods persist locally (no DB table needed); load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOODS_KEY);
      if (raw) setSpriteMoods(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
  }, []);
  const persistMoods = (next: SpriteMood[]) => {
    setSpriteMoods(next);
    try {
      localStorage.setItem(MOODS_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in memory only */
    }
  };

  // Hydrate from Supabase when configured + seeded.
  useEffect(() => {
    if (!data.isSupabaseConfigured) return;
    let alive = true;
    data
      .fetchAll()
      .then((res) => {
        if (!alive || !res) return;
        setChild(res.child);
        setClips(res.clips);
        setCollections(res.collections);
        setBacked(true);
      })
      .catch((e) => console.warn('[ruito] Supabase load failed, using mock:', e?.message));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<Store>(
    () => ({
      child,
      clips,
      collections,
      spriteMoods,
      backed,
      addSpriteMood: (m) => persistMoods([...spriteMoods, { ...m, id: uid() }]),
      removeSpriteMood: (id) => persistMoods(spriteMoods.filter((m) => m.id !== id)),
      updateProfile: async (p) => {
        setChild((c) => ({ ...c, ...p }));
        if (backed) await data.updateChild(child.id, p).catch((e) => console.warn('[ruito] updateChild', e?.message));
      },
      addFreeCollection: async (title) => {
        if (backed) {
          const col = await data.createCollection(child.id, title);
          setCollections((cs) => [col, ...cs]);
          return col;
        }
        const col: FreeCollection = {
          id: uid(),
          child_id: child.id,
          title,
          icon: '📦',
          gradient: 'linear-gradient(135deg,#E7DDF0,#C9B8E6)',
        };
        setCollections((cs) => [col, ...cs]);
        return col;
      },
      addClip: async (c) => {
        if (backed) {
          const saved = await data.createClip(child.id, c);
          setClips((cs) => [saved, ...cs]);
          return;
        }
        setClips((cs) => [{ ...c, id: uid(), child_id: child.id }, ...cs]);
      },
    }),
    [child, clips, collections, spriteMoods, backed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used within StoreProvider');
  return s;
}
