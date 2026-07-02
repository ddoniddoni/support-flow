-- SupportFlow v2 AI schema migration.
-- Run this after docs/SUPABASE_SCHEMA.sql on an existing project.

create type public.ai_category as enum (
  'technical',
  'billing',
  'account',
  'product',
  'shipping',
  'refund',
  'complaint',
  'other'
);

create type public.ai_sentiment as enum (
  'positive',
  'neutral',
  'negative'
);

create type public.ai_urgency as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.ai_intent as enum (
  'question',
  'complaint',
  'refund_request',
  'bug_report',
  'account_help',
  'billing_issue',
  'cancellation_request',
  'feature_request',
  'praise',
  'other'
);

create type public.ai_validation_status as enum (
  'valid',
  'fallback',
  'invalid'
);

create type public.ai_review_decision as enum (
  'approved',
  'corrected',
  'rejected'
);

create table public.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  provider text not null,
  model text,
  prompt_text text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name, version, provider)
);

create table public.ticket_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  prompt_version_id uuid references public.ai_prompt_versions(id) on delete set null,
  provider text not null,
  model text,
  category public.ai_category not null,
  sentiment public.ai_sentiment not null,
  urgency public.ai_urgency not null,
  intent public.ai_intent not null,
  suggested_priority public.ticket_priority,
  suggested_status public.ticket_status,
  suggested_assignee_role text,
  tags text[] not null default '{}',
  summary text not null,
  reason text not null,
  reply_draft text,
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  needs_review boolean not null default false,
  escalation_reason text,
  raw_response jsonb not null default '{}'::jsonb,
  validation_status public.ai_validation_status not null default 'valid',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.ticket_ai_review_events (
  id uuid primary key default gen_random_uuid(),
  ticket_ai_analysis_id uuid not null references public.ticket_ai_analyses(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  decision public.ai_review_decision not null,
  before_value jsonb,
  after_value jsonb,
  note text,
  created_at timestamptz not null default now()
);

alter table public.tickets
add column latest_ai_analysis_id uuid references public.ticket_ai_analyses(id) on delete set null,
add column ai_needs_review boolean not null default false,
add column ai_sentiment public.ai_sentiment,
add column ai_urgency public.ai_urgency,
add column ai_confidence numeric(4, 3) check (
  ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)
);

create index ai_prompt_versions_active_idx
on public.ai_prompt_versions(is_active)
where is_active = true;

create index ticket_ai_analyses_ticket_id_idx
on public.ticket_ai_analyses(ticket_id);

create index ticket_ai_analyses_needs_review_idx
on public.ticket_ai_analyses(needs_review);

create index ticket_ai_analyses_sentiment_idx
on public.ticket_ai_analyses(sentiment);

create index ticket_ai_analyses_urgency_idx
on public.ticket_ai_analyses(urgency);

create index ticket_ai_analyses_confidence_idx
on public.ticket_ai_analyses(confidence);

create index ticket_ai_analyses_created_at_idx
on public.ticket_ai_analyses(created_at desc);

create index ticket_ai_review_events_analysis_id_idx
on public.ticket_ai_review_events(ticket_ai_analysis_id);

create index ticket_ai_review_events_ticket_id_idx
on public.ticket_ai_review_events(ticket_id);

create index ticket_ai_review_events_created_at_idx
on public.ticket_ai_review_events(created_at desc);

create index tickets_ai_needs_review_idx
on public.tickets(ai_needs_review);

create index tickets_ai_sentiment_idx
on public.tickets(ai_sentiment);

create index tickets_ai_urgency_idx
on public.tickets(ai_urgency);

create index tickets_ai_confidence_idx
on public.tickets(ai_confidence);

insert into public.ai_prompt_versions (
  name,
  version,
  provider,
  model,
  prompt_text,
  is_active
)
values (
  'ticket-triage',
  '2026-07-03',
  'mock',
  'mock-ticket-triage-v1',
  'Analyze the support ticket and return validated JSON with category, sentiment, urgency, intent, suggested operations, summary, reason, reply draft, confidence, and review requirement.',
  true
);

alter table public.ai_prompt_versions enable row level security;
alter table public.ticket_ai_analyses enable row level security;
alter table public.ticket_ai_review_events enable row level security;

grant select on public.ai_prompt_versions to authenticated;
grant select, insert, update on public.ticket_ai_analyses to authenticated;
grant select, insert on public.ticket_ai_review_events to authenticated;

create policy "Support can view AI prompt versions"
on public.ai_prompt_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role in ('agent', 'admin')
  )
);

create policy "Admins can manage AI prompt versions"
on public.ai_prompt_versions
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Agents can view AI analyses on assigned tickets"
on public.ticket_ai_analyses
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets
    join public.profiles on profiles.id = auth.uid()
    where tickets.id = ticket_ai_analyses.ticket_id
    and tickets.assignee_id = auth.uid()
    and profiles.role = 'agent'
  )
);

create policy "Admins can view all AI analyses"
on public.ticket_ai_analyses
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Agents can create AI analyses on assigned tickets"
on public.ticket_ai_analyses
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.tickets
    join public.profiles on profiles.id = auth.uid()
    where tickets.id = ticket_ai_analyses.ticket_id
    and tickets.assignee_id = auth.uid()
    and profiles.role = 'agent'
  )
);

create policy "Admins can create AI analyses"
on public.ticket_ai_analyses
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Agents can update assigned AI analyses"
on public.ticket_ai_analyses
for update
to authenticated
using (
  exists (
    select 1
    from public.tickets
    join public.profiles on profiles.id = auth.uid()
    where tickets.id = ticket_ai_analyses.ticket_id
    and tickets.assignee_id = auth.uid()
    and profiles.role = 'agent'
  )
)
with check (
  exists (
    select 1
    from public.tickets
    join public.profiles on profiles.id = auth.uid()
    where tickets.id = ticket_ai_analyses.ticket_id
    and tickets.assignee_id = auth.uid()
    and profiles.role = 'agent'
  )
);

create policy "Admins can update AI analyses"
on public.ticket_ai_analyses
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Agents can view assigned AI review events"
on public.ticket_ai_review_events
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets
    join public.profiles on profiles.id = auth.uid()
    where tickets.id = ticket_ai_review_events.ticket_id
    and tickets.assignee_id = auth.uid()
    and profiles.role = 'agent'
  )
);

create policy "Admins can view all AI review events"
on public.ticket_ai_review_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Agents can create assigned AI review events"
on public.ticket_ai_review_events
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.tickets
    join public.profiles on profiles.id = auth.uid()
    where tickets.id = ticket_ai_review_events.ticket_id
    and tickets.assignee_id = auth.uid()
    and profiles.role = 'agent'
  )
);

create policy "Admins can create AI review events"
on public.ticket_ai_review_events
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
