-- SupportFlow initial Supabase schema.
-- Run this in the Supabase SQL editor before connecting real auth flows.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'agent', 'admin');
create type public.ticket_status as enum (
  'open',
  'in_progress',
  'resolved',
  'closed'
);
create type public.ticket_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  category text not null,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ticket_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  before_value text,
  after_value text,
  created_at timestamptz not null default now()
);

create index tickets_customer_id_idx on public.tickets(customer_id);
create index tickets_assignee_id_idx on public.tickets(assignee_id);
create index tickets_status_idx on public.tickets(status);
create index tickets_priority_idx on public.tickets(priority);
create index tickets_created_at_idx on public.tickets(created_at desc);
create index ticket_replies_ticket_id_idx on public.ticket_replies(ticket_id);
create index ticket_logs_ticket_id_idx on public.ticket_logs(ticket_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tickets_set_updated_at
before update on public.tickets
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;
alter table public.ticket_logs enable row level security;
