import {readFile} from 'node:fs/promises';
// Reconstruct table columns/constraints from the user's reference, never run it on Supabase.
// The export omits full enum definitions: use its default labels plus existing app roles.
export async function suppliedSchema(db) {
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated,anon;`);
  const source=await readFile(new URL('../supabase/reference/20260905-user-schema.sql',import.meta.url),'utf8');
  const enums=new Map();
  for(const m of source.matchAll(/USER-DEFINED NOT NULL DEFAULT '([^']+)'::(\w+)/g))enums.set(m[2],[m[1]]);
  enums.set('user_role',['employee','admin','project_coordinator','team_lead']);
  for(const [name,values] of enums)await db.exec(`create type public.${name} as enum (${values.map(v=>`'${v}'`).join(',')});`);
  const constraints=[];
  for(const m of source.matchAll(/CREATE TABLE public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    const columns=[];
    for(let line of m[2].split('\n').map(l=>l.trim().replace(/,$/,'' )).filter(Boolean)) {
      if(line.startsWith('CONSTRAINT ')){constraints.push(`alter table public.${m[1]} add ${line};`);continue;}
      line=line.replace(/USER-DEFINED(?= NOT NULL DEFAULT '[^']+'::(\w+))/,(_match,type)=>`public.${type}`);
      // activity_type has no exported type name/default; no migration depends on its labels.
      line=line.replace('USER-DEFINED','text');columns.push(line);
    }
    await db.exec(`create table public.${m[1]} (${columns.join(',\n')});`);
  }
  // Add keys before cross-table foreign keys, resolving the original cyclic table order.
  for(const s of constraints.filter(s=>!s.includes('FOREIGN KEY')))await db.exec(s);
  for(const s of constraints.filter(s=>s.includes('FOREIGN KEY')))await db.exec(s);
  await db.exec(`grant all on all tables in schema public to authenticated;
    alter table public.profiles enable row level security;
    create policy fixture_legacy_profiles on public.profiles for all to authenticated using(true) with check(true);
    alter table public.notifications enable row level security;
    create policy fixture_legacy_notifications on public.notifications for all to authenticated using(true) with check(true);`);
}
