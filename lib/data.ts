// Async data layer over Supabase. All functions assume Supabase is configured;
// callers gate on `isSupabaseConfigured` and fall back to the mock store otherwise.
import { getSupabase, BUCKET_AUDIO, BUCKET_IMAGES, isSupabaseConfigured } from './supabase';
import type { Child, Clip, FreeCollection } from './types';

export { isSupabaseConfigured, BUCKET_AUDIO, BUCKET_IMAGES };

function rowToClip(r: any): Clip {
  return {
    id: r.id,
    child_id: r.child_id,
    audio_url: r.audio_url ?? null,
    image_url: r.image_url ?? null,
    caption: r.caption ?? null,
    recorded_at: r.recorded_at,
    category: r.category,
    kimochi_level: r.kimochi_level ?? null,
    label: r.label ?? null,
    collection_id: r.collection_id ?? null,
    gradient: r.gradient ?? undefined,
    icon: r.icon ?? undefined,
  };
}

function rowToChild(r: any): Child {
  return {
    id: r.id,
    name: r.name,
    birthday: r.birthday,
    height_cm: Number(r.height_cm),
    weight_kg: Number(r.weight_kg),
    created_at: r.created_at,
  };
}

export async function fetchAll(): Promise<{ child: Child; clips: Clip[]; collections: FreeCollection[] } | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: children, error: cErr } = await sb.from('children').select('*').order('created_at').limit(1);
  if (cErr) throw cErr;
  if (!children?.length) return null; // schema not seeded yet
  const child = rowToChild(children[0]);

  const [{ data: clips, error: clErr }, { data: cols, error: fErr }] = await Promise.all([
    sb.from('clips').select('*').eq('child_id', child.id).order('recorded_at', { ascending: false }),
    sb.from('free_collections').select('*').eq('child_id', child.id).order('created_at', { ascending: false }),
  ]);
  if (clErr) throw clErr;
  if (fErr) throw fErr;

  return {
    child,
    clips: (clips ?? []).map(rowToClip),
    collections: (cols ?? []).map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      title: r.title,
      icon: r.icon ?? undefined,
      gradient: r.gradient ?? undefined,
    })),
  };
}

export async function updateChild(id: string, patch: Partial<Child>): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('children').update({
    name: patch.name,
    birthday: patch.birthday,
    height_cm: patch.height_cm,
    weight_kg: patch.weight_kg,
  }).eq('id', id);
  if (error) throw error;
}

export async function createCollection(child_id: string, title: string): Promise<FreeCollection> {
  const sb = getSupabase();
  if (!sb) throw new Error('not configured');
  const row = { child_id, title, icon: '📦', gradient: 'linear-gradient(135deg,#E7DDF0,#C9B8E6)' };
  const { data, error } = await sb.from('free_collections').insert(row).select().single();
  if (error) throw error;
  return { id: data.id, child_id: data.child_id, title: data.title, icon: data.icon, gradient: data.gradient };
}

export async function createClip(child_id: string, input: Omit<Clip, 'id' | 'child_id'>): Promise<Clip> {
  const sb = getSupabase();
  if (!sb) throw new Error('not configured');
  const row = {
    child_id,
    audio_url: input.audio_url,
    image_url: input.image_url,
    caption: input.caption,
    recorded_at: input.recorded_at,
    category: input.category,
    kimochi_level: input.kimochi_level,
    label: input.label,
    collection_id: input.collection_id,
    gradient: input.gradient ?? null,
    icon: input.icon ?? null,
  };
  const { data, error } = await sb.from('clips').insert(row).select().single();
  if (error) throw error;
  return rowToClip(data);
}

/** Upload a file/blob to a private bucket, returns the object path. */
export async function uploadMedia(bucket: string, file: Blob, ext: string): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error('not configured');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    contentType: (file as File).type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Resolve a signed URL for a stored object path (default 2h). */
export async function signedUrl(bucket: string, path: string, expiresSec = 7200): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresSec);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** True when the string is a storage path (not a full/blob URL). */
export function isStoragePath(v: string | null | undefined): v is string {
  return !!v && !/^(https?:|blob:|data:)/.test(v);
}
