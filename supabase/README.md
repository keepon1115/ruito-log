# Supabase setup (free tier)

The app runs on **in-memory mock data** until these env vars exist, so you can develop the UI first and connect the backend whenever you're ready.

## 1. Create a project
1. Go to https://supabase.com → **New project** (free tier is enough).
2. Wait for it to provision.

## 2. Create the schema + Storage buckets
1. Dashboard → **SQL Editor → New query**.
2. Paste the contents of [`schema.sql`](./schema.sql) and **Run**.
   - Creates `children`, `clips`, `free_collections` (matching the data model).
   - Enables RLS with **anon-open** policies (no-login family app).
   - Creates two **private** Storage buckets: `audio`, `images`.
   - Seeds one child (るいと) — edit the row or via the プロフ screen.

## 3. Wire env vars
1. Dashboard → **Project Settings → API**. Copy the **Project URL** and **anon public** key.
2. In the repo: `cp .env.local.example .env.local` and fill both values.
3. Restart `npm run dev`. The app now reads/writes Supabase and persists across reloads.

## 4. Deploy (Vercel free tier)
Add the same two env vars in Vercel → Project → Settings → Environment Variables, then deploy.

## Privacy model (important)
This deployment has **no login** (per your choice). The anon key has full read/write,
and media is served via **signed URLs** from private buckets. That means:

- 🔒 Privacy depends on **keeping the deployed URL private** — don't share it publicly.
- Media isn't directly browsable (private buckets), but anyone with the app URL can use the app.
- To harden later: enable Supabase **Auth** (e.g. magic-link), invite family emails, then
  swap the `anon_*` RLS policies in `schema.sql` for `authenticated`-only checks and add a
  login screen. The schema and data layer are already structured for this.
