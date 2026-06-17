-- Add human-readable ticket numbers for SupportFlow tickets.
-- Run this once in the Supabase SQL editor.

create sequence if not exists public.ticket_number_seq;

alter table public.tickets
add column if not exists ticket_number bigint;

with numbered_tickets as (
  select
    id,
    row_number() over (order by created_at asc, id asc) as row_number
  from public.tickets
  where ticket_number is null
)
update public.tickets
set ticket_number = numbered_tickets.row_number
from numbered_tickets
where tickets.id = numbered_tickets.id;

select setval(
  'public.ticket_number_seq',
  greatest(coalesce((select max(ticket_number) from public.tickets), 0), 1),
  true
);

alter table public.tickets
alter column ticket_number set default nextval('public.ticket_number_seq');

alter table public.tickets
alter column ticket_number set not null;

create unique index if not exists tickets_ticket_number_key
on public.tickets(ticket_number);

drop policy if exists "Agents can view assigned ticket customer profiles"
on public.profiles;

drop policy if exists "Admins can view support profiles"
on public.profiles;

drop policy if exists "Profiles are visible to the owner"
on public.profiles;

drop policy if exists "Profiles are visible by support context"
on public.profiles;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.can_view_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    auth.uid() = target_profile_id
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
    or (
      exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'agent'
      )
      and exists (
        select 1
        from public.tickets
        where customer_id = target_profile_id
        and assignee_id = auth.uid()
      )
    )
    or exists (
      select 1
      from public.tickets
      where customer_id = auth.uid()
      and assignee_id = target_profile_id
    )
$$;

create policy "Profiles are visible by support context"
on public.profiles
for select
to authenticated
using (public.can_view_profile(id));
