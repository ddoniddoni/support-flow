-- SupportFlow demo auth accounts.
-- Run this after docs/SUPABASE_SCHEMA.sql in the Supabase SQL editor.
-- It creates or updates three login-ready demo users.

create extension if not exists "pgcrypto";

create temp table seed_demo_users (
  desired_id uuid primary key,
  email text not null unique,
  name text not null,
  role public.user_role not null
) on commit drop;

insert into seed_demo_users (desired_id, email, name, role)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'customer@test.com',
    'Demo Customer',
    'customer'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'agent@test.com',
    'Demo Agent',
    'agent'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'admin@test.com',
    'Demo Admin',
    'admin'
  );

with resolved_users as (
  select
    coalesce(auth_users.id, seed_demo_users.desired_id) as id,
    seed_demo_users.email,
    seed_demo_users.name,
    seed_demo_users.role
  from seed_demo_users
  left join auth.users auth_users
    on lower(auth_users.email) = lower(seed_demo_users.email)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  resolved_users.id,
  'authenticated',
  'authenticated',
  resolved_users.email,
  crypt('11111111', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('name', resolved_users.name, 'role', resolved_users.role),
  now(),
  now(),
  '',
  '',
  '',
  ''
from resolved_users
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  auth_users.id,
  auth_users.id::text,
  jsonb_build_object('sub', auth_users.id::text, 'email', auth_users.email),
  'email',
  now(),
  now(),
  now()
from auth.users auth_users
join seed_demo_users
  on lower(seed_demo_users.email) = lower(auth_users.email)
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, email, name, role)
select
  auth_users.id,
  seed_demo_users.email,
  seed_demo_users.name,
  seed_demo_users.role
from seed_demo_users
join auth.users auth_users
  on lower(auth_users.email) = lower(seed_demo_users.email)
on conflict (id) do update
set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role;
