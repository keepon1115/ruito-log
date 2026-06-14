-- るいとの成長日記 — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor → New query → Run.
-- Designed for a private, no-login family deployment. See supabase/README.md.

-- ─── tables ───────────────────────────────────────────────────────────────
create table if not exists children (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  birthday    date not null,
  height_cm   numeric(5,1),
  weight_kg   numeric(5,1),
  created_at  timestamptz not null default now()
);

create table if not exists free_collections (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references children(id) on delete cascade,
  title       text not null,
  icon        text,
  gradient    text,
  created_at  timestamptz not null default now()
);

create table if not exists clips (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references children(id) on delete cascade,
  audio_url     text,        -- Storage object path in bucket `audio` (served via signed URL)
  image_url     text,        -- Storage object path in bucket `images` (served via signed URL)
  caption       text,
  recorded_at   timestamptz not null default now(),
  category      text not null check (category in ('kimochi','kotoba','namae','free')),
  kimochi_level int check (kimochi_level between 1 and 6),   -- 1=メッチャうれしい … 6=メッチャかなしい
  label         text,                                        -- ことば/なまえ (例: いちご, まま)
  collection_id uuid references free_collections(id) on delete set null,
  gradient      text,        -- optional placeholder visual when no image
  icon          text,        -- optional emoji for jiten cards
  created_at    timestamptz not null default now()
);

create index if not exists clips_child_cat_idx on clips (child_id, category);
create index if not exists clips_collection_idx on clips (collection_id);
create index if not exists clips_recorded_idx   on clips (recorded_at desc);

-- ─── row level security ─────────────────────────────────────────────────────
-- NOTE: no-login deployment → anon key has full access. Privacy relies on the
-- deployed URL staying private. To lock down later: add Supabase Auth, then
-- replace these policies with `auth.role() = 'authenticated'` checks.
alter table children         enable row level security;
alter table free_collections enable row level security;
alter table clips            enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='children' and policyname='anon_all_children') then
    create policy anon_all_children on children for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='free_collections' and policyname='anon_all_free') then
    create policy anon_all_free on free_collections for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='clips' and policyname='anon_all_clips') then
    create policy anon_all_clips on clips for all to anon using (true) with check (true);
  end if;
end $$;

-- ─── storage buckets (private) ──────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('audio','audio',false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('images','images',false)
  on conflict (id) do nothing;

-- allow anon to read/write objects in these buckets (no-login family app)
do $$
begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='anon_media_rw') then
    create policy anon_media_rw on storage.objects for all to anon
      using (bucket_id in ('audio','images'))
      with check (bucket_id in ('audio','images'));
  end if;
end $$;

-- ─── seed the child (edit to taste; the app reads the first child row) ───────
insert into children (name, birthday, height_cm, weight_kg)
select 'るいと', '2025-12-09', 67.4, 7.8
where not exists (select 1 from children);
