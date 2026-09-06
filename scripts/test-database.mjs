import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, delimiter } from 'node:path';
const require = createRequire(import.meta.url);
// npm exec supplies an isolated test dependency, without changing the app lockfile.
const { PGlite } = require(require.resolve('@electric-sql/pglite', {
  paths: process.env.PATH.split(delimiter).map(dirname),
}));
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`);
for (const file of ['docs/SUPABASE_SCHEMA.sql', 'docs/AI_SCHEMA_MIGRATION.sql']) {
  // gen_random_uuid is built into Postgres; PGlite doesn't bundle pgcrypto.
  await db.exec((await readFile(file, 'utf8')).replace('create extension if not exists "pgcrypto";', ''));
}
{
  for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) {
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
  }
}
const customer = '00000000-0000-4000-8000-000000000001';
const agent = '00000000-0000-4000-8000-000000000002';
const admin = '00000000-0000-4000-8000-000000000003';
const other = '00000000-0000-4000-8000-000000000004';
await db.exec(`insert into auth.users values
 ('${customer}', 'customer@example.test', '{"role":"admin","name":"Customer"}'),
 ('${agent}', 'agent@example.test', '{"name":"Agent"}'),
 ('${admin}', 'admin@example.test', '{"name":"Admin"}'),
 ('${other}', 'other@example.test', '{"name":"Other"}');`);
let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (e) { failures++; console.error(`FAIL ${name}: ${e.message}`); }
}
async function asUser(id, fn, role = 'authenticated') {
  await db.exec(`begin; set local role ${role}; select set_config('request.jwt.claim.sub', '${id}', true);`);
  try { return await fn(); } finally { await db.exec('rollback'); }
}
await check('signup cannot choose a privileged role', async () => {
  const { rows } = await db.query('select role from profiles where id=$1', [customer]);
  assert.equal(rows[0].role, 'customer');
});
await db.exec(`update profiles set role='customer' where id='${customer}';
update profiles set role='agent' where id='${agent}'; update profiles set role='admin' where id='${admin}';`);
await check('customer cannot promote their own profile', () => asUser(customer, async () => {
  await assert.rejects(db.query("update profiles set role='admin' where id=$1", [customer]), /permission denied/);
}));
await check('customer can update their display name', () => asUser(customer, async () => {
  const { rows } = await db.query("update profiles set name='Changed' where id=$1 returning name", [customer]);
  assert.equal(rows[0].name, 'Changed');
}));
{
  const { runWorkflowTests } = await import('../tests/database/workflow.mjs');
  await runWorkflowTests({ db, check, asUser, customer, agent, admin, other });
}
await db.close();
assert.equal(failures, 0, `${failures} database regression(s)`);
