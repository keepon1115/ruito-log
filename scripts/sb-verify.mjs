import { readFileSync } from 'node:fs';
const TOKEN = JSON.parse(readFileSync('C:/Users/skawa/.cursor/mcp.json', 'utf8')).mcpServers.supabase.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SB_REF || 'qsaghliucxtdsbbjoinj';
async function q(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return r.json();
}
console.log('public tables:', JSON.stringify(await q(`select table_name from information_schema.tables where table_schema = 'public' order by 1`)));
console.log('rls policies:', JSON.stringify(await q(`select tablename, policyname from pg_policies where schemaname in ('public','storage') order by 1,2`)));
console.log('rls enabled:', JSON.stringify(await q(`select relname, relrowsecurity from pg_class where relname in ('children','clips','free_collections')`)));
