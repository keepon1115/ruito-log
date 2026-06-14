// Domain model — mirrors the planned Supabase schema so the Phase 2 swap is mechanical.

export type Category = 'kimochi' | 'kotoba' | 'namae' | 'free';

export interface Child {
  id: string;
  name: string;
  birthday: string; // ISO date 'YYYY-MM-DD'
  height_cm: number;
  weight_kg: number;
  created_at?: string;
}

export interface Clip {
  id: string;
  child_id: string;
  audio_url: string | null;
  image_url: string | null;
  caption: string | null;
  recorded_at: string; // ISO datetime
  category: Category;
  kimochi_level: number | null; // 1=メッチャうれしい … 6=メッチャかなしい
  label: string | null; // ことば/なまえ (例: いちご, まま)
  collection_id: string | null; // フリー collection ref
  // Phase-1 placeholder visuals (no real image yet). Dropped once image_url is real.
  gradient?: string;
  icon?: string;
}

export interface FreeCollection {
  id: string;
  child_id: string;
  title: string;
  icon?: string;
  gradient?: string;
}

// User-authored sprite behaviours: a phrase (言葉) shown with a face (表情) + motion (動作).
export type SpriteFace = 'smile' | 'big' | 'closed' | 'neutral';
export type SpriteAction = 'bob' | 'hop' | 'shake' | 'squish' | 'breathe';
export type SpriteFx = '' | 'hearts' | 'tears' | 'zzz' | 'poop';

export interface SpriteMood {
  id: string;
  emoji: string; // small tag emoji for the list
  bubble: string; // 言葉 — speech bubble text
  mood: string; // status caption under the name
  face: SpriteFace; // 表情
  action: SpriteAction; // 動作
  fx: SpriteFx; // floating effect
}
