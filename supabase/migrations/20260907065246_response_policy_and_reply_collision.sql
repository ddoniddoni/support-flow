begin;
-- Policies are immutable: each waiting period keeps the schedule it started with.
create table public.response_policies (
 id uuid primary key,
 calendar jsonb not null,
 targets jsonb not null,
 warning_minutes integer not null check(warning_minutes between 1 and 10079),
 alerts_enabled boolean not null,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
create table public.response_settings (
 singleton boolean primary key default true check(singleton),
 policy_id uuid not null references public.response_policies(id),
 alerts_enabled boolean not null default true
);
alter table public.response_policies enable row level security;
alter table public.response_settings enable row level security;
revoke all on public.response_policies,public.response_settings from public,anon,authenticated;
grant select on public.response_policies,public.response_settings to authenticated;
create policy response_policy_admin_read on public.response_policies for select to authenticated using(public.current_user_role()='admin');
create policy response_settings_admin_read on public.response_settings for select to authenticated using(public.current_user_role()='admin');
with initial as (
 insert into public.response_policies(id,calendar,targets,warning_minutes,alerts_enabled)
 values(gen_random_uuid(),'{"mode":"calendar","timeZone":"Asia/Seoul","days":[{"day":1,"start":"09:00","end":"18:00"},{"day":2,"start":"09:00","end":"18:00"},{"day":3,"start":"09:00","end":"18:00"},{"day":4,"start":"09:00","end":"18:00"},{"day":5,"start":"09:00","end":"18:00"}],"holidays":[]}',
 '{"low":2880,"medium":1440,"high":480,"urgent":240}',60,true) returning id
) insert into public.response_settings(policy_id) select id from initial;

create function supportflow_private.validate_response_policy(p_calendar jsonb,p_targets jsonb,p_warning integer)
returns void language plpgsql set search_path='' as $$
declare item jsonb; target_key text; minutes integer; day_count integer; date_text text;
begin
 if p_calendar->>'mode' is null or p_calendar->>'mode' not in ('calendar','business')
  or not exists(select 1 from pg_timezone_names where name=p_calendar->>'timeZone')
  or jsonb_typeof(p_calendar->'days') is distinct from 'array'
  or jsonb_typeof(p_calendar->'holidays') is distinct from 'array'
  or jsonb_array_length(p_calendar->'holidays')>366 then
  raise exception '운영시간, 시간대, 휴일 설정을 확인해 주세요.' using errcode='22023';
 end if;
 day_count:=jsonb_array_length(p_calendar->'days');
 if day_count not between 1 and 7 or (select count(distinct x->>'day') from jsonb_array_elements(p_calendar->'days') x)<>day_count then
  raise exception '운영 요일을 중복 없이 하나 이상 설정해 주세요.' using errcode='22023';
 end if;
 for item in select value from jsonb_array_elements(p_calendar->'days') loop
  if (item->>'day')::integer not between 1 and 7 or item->>'day' is null
   or coalesce(item->>'start','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
   or coalesce(item->>'end','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
   raise exception '요일과 운영 시각을 확인해 주세요.' using errcode='22023';
  end if;
  if (item->>'end')::time - (item->>'start')::time < interval '1 hour' then
   raise exception '운영 구간은 같은 날 안에서 최소 1시간이어야 합니다.' using errcode='22023';
  end if;
 end loop;
 for date_text in select jsonb_array_elements_text(p_calendar->'holidays') loop
  if date_text !~ '^\d{4}-\d{2}-\d{2}$' or to_char(date_text::date,'YYYY-MM-DD')<>date_text then
   raise exception '휴일은 유효한 YYYY-MM-DD 날짜로 입력해 주세요.' using errcode='22023';
  end if;
 end loop;
 foreach target_key in array array['urgent','high','medium','low'] loop
  minutes:=(p_targets->>target_key)::integer;
  if minutes is null or minutes not between 15 and 10080 or p_warning is null or p_warning<1 or p_warning>=minutes then
   raise exception '목표는 15분~168시간, 사전 알림은 가장 짧은 목표보다 짧게 설정해 주세요.' using errcode='22023';
  end if;
 end loop;
 if (p_targets->>'urgent')::integer > (p_targets->>'high')::integer or (p_targets->>'high')::integer > (p_targets->>'medium')::integer or (p_targets->>'medium')::integer > (p_targets->>'low')::integer then
  raise exception '높은 우선순위의 목표 시간을 더 짧거나 같게 설정해 주세요.' using errcode='22023';
 end if;
end;$$;
revoke all on function supportflow_private.validate_response_policy(jsonb,jsonb,integer) from public,anon,authenticated;

create function supportflow_private.save_response_policy(p_id uuid,p_expected_id uuid,p_calendar jsonb,p_targets jsonb,p_warning integer,p_alerts boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); current_id uuid; previous public.response_policies;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='admin') then raise exception '관리자만 응답 정책을 변경할 수 있습니다.' using errcode='42501'; end if;
 if p_id is null or p_alerts is null then raise exception '설정값을 확인해 주세요.' using errcode='22023'; end if;
 perform supportflow_private.validate_response_policy(p_calendar,p_targets,p_warning);
 select policy_id into current_id from public.response_settings where singleton for update;
 select * into previous from public.response_policies where id=p_id;
 if found then
  if previous.calendar=p_calendar and previous.targets=p_targets and previous.warning_minutes=p_warning and previous.alerts_enabled=p_alerts and previous.created_by=actor then return previous.id; end if;
  raise exception '같은 요청 번호로 다른 설정을 저장할 수 없습니다.' using errcode='22023';
 end if;
 if current_id is distinct from p_expected_id then raise exception '다른 관리자가 정책을 변경했습니다. 최신 설정을 불러와 다시 확인해 주세요.' using errcode='40001'; end if;
 insert into public.response_policies(id,calendar,targets,warning_minutes,alerts_enabled,created_by)
 values(p_id,p_calendar,p_targets,p_warning,p_alerts,actor);
 update public.response_settings set policy_id=p_id,alerts_enabled=p_alerts where singleton;
 return p_id;
end;$$;
revoke all on function supportflow_private.save_response_policy(uuid,uuid,jsonb,jsonb,integer,boolean) from public,anon;
grant execute on function supportflow_private.save_response_policy(uuid,uuid,jsonb,jsonb,integer,boolean) to authenticated;
create function public.save_response_policy(p_id uuid,p_expected_id uuid,p_calendar jsonb,p_targets jsonb,p_warning integer,p_alerts boolean)
returns uuid language sql security invoker set search_path='' as $$ select supportflow_private.save_response_policy(p_id,p_expected_id,p_calendar,p_targets,p_warning,p_alerts) $$;
revoke all on function public.save_response_policy(uuid,uuid,jsonb,jsonb,integer,boolean) from public,anon;
grant execute on function public.save_response_policy(uuid,uuid,jsonb,jsonb,integer,boolean) to authenticated;

-- Calendar arithmetic runs once in Postgres. AT TIME ZONE handles DST boundaries.
create function supportflow_private.response_deadline(p_start timestamptz,p_minutes integer,p_calendar jsonb)
returns timestamptz language plpgsql stable set search_path='' as $$
declare remaining double precision:=p_minutes*60; day_date date; day_rule jsonb; starts timestamptz; ends timestamptz; available double precision; zone text:=p_calendar->>'timeZone';
begin
 if p_start is null then return null; end if;
 if p_calendar->>'mode'='calendar' then return p_start+make_interval(mins=>p_minutes); end if;
 day_date:=(p_start at time zone zone)::date;
 for counter in 0..3660 loop
  select x into day_rule from jsonb_array_elements(p_calendar->'days') x where (x->>'day')::integer=extract(isodow from day_date);
  if day_rule is not null and not (p_calendar->'holidays' ? day_date::text) then
   starts:=greatest(p_start,(day_date+(day_rule->>'start')::time) at time zone zone);
   ends:=(day_date+(day_rule->>'end')::time) at time zone zone;
   available:=greatest(0,extract(epoch from ends-starts));
   if available>0 and available>=remaining then return starts+make_interval(secs=>remaining); end if;
   remaining:=remaining-available;
  end if;
  day_date:=day_date+1;
 end loop;
 raise exception '운영일 내 응답 기한을 계산할 수 없습니다.' using errcode='22023';
end;$$;
create function supportflow_private.response_minutes_between(p_from timestamptz,p_to timestamptz,p_calendar jsonb)
returns numeric language plpgsql stable set search_path='' as $$
declare first_at timestamptz:=least(p_from,p_to); last_at timestamptz:=greatest(p_from,p_to); day_date date; day_rule jsonb; starts timestamptz; ends timestamptz; seconds double precision:=0; zone text:=p_calendar->>'timeZone';
begin
 if p_from is null or p_to is null then return null; end if;
 if p_calendar->>'mode'='calendar' then return extract(epoch from p_to-p_from)/60; end if;
 day_date:=(first_at at time zone zone)::date;
 while day_date <= (last_at at time zone zone)::date loop
  select x into day_rule from jsonb_array_elements(p_calendar->'days') x where (x->>'day')::integer=extract(isodow from day_date);
  if day_rule is not null and not (p_calendar->'holidays' ? day_date::text) then
   starts:=greatest(first_at,(day_date+(day_rule->>'start')::time) at time zone zone);
   ends:=least(last_at,(day_date+(day_rule->>'end')::time) at time zone zone);
   seconds:=seconds+greatest(0,extract(epoch from ends-starts));
  end if;
  day_date:=day_date+1;
 end loop;
 return seconds/60 * case when p_to>=p_from then 1 else -1 end;
end;$$;
revoke all on function supportflow_private.response_deadline(timestamptz,integer,jsonb) from public,anon,authenticated;
revoke all on function supportflow_private.response_minutes_between(timestamptz,timestamptz,jsonb) from public,anon;
grant execute on function supportflow_private.response_minutes_between(timestamptz,timestamptz,jsonb) to authenticated,service_role;

alter table public.tickets add column response_due_at timestamptz,
 add column response_warning_at timestamptz,
 add column response_policy_id uuid references public.response_policies(id),
 add column response_calendar jsonb,
 add column response_target_minutes integer,
 add column response_cycle uuid;
create index tickets_response_due_idx on public.tickets(response_due_at) where status in ('open','in_progress');
create index tickets_response_warning_idx on public.tickets(response_warning_at) where status in ('open','in_progress');

create function supportflow_private.set_response_deadline() returns trigger
language plpgsql security definer set search_path='' as $$
declare policy public.response_policies;
begin
 if new.status in ('resolved','closed') then new.response_due_at:=null; new.response_warning_at:=null; return new; end if;
 if tg_op='INSERT' or new.response_policy_id is null or new.response_started_at is distinct from old.response_started_at then
  select p.* into policy from public.response_settings s join public.response_policies p on p.id=s.policy_id where s.singleton;
  new.response_policy_id:=policy.id; new.response_calendar:=policy.calendar; new.response_cycle:=gen_random_uuid();
 elsif new.priority is distinct from old.priority then
  select * into policy from public.response_policies where id=new.response_policy_id;
 else return new;
 end if;
 new.response_target_minutes:=(policy.targets->>new.priority::text)::integer;
 new.response_due_at:=supportflow_private.response_deadline(new.response_started_at,new.response_target_minutes,policy.calendar);
 new.response_warning_at:=supportflow_private.response_deadline(new.response_started_at,new.response_target_minutes-policy.warning_minutes,policy.calendar);
 return new;
end;$$;
revoke all on function supportflow_private.set_response_deadline() from public,anon,authenticated;
-- Runs AFTER track_response_start by trigger name, while still BEFORE the write.
create trigger zz_set_response_deadline before insert or update on public.tickets for each row execute function supportflow_private.set_response_deadline();
alter table public.tickets disable trigger tickets_set_updated_at;
update public.tickets set response_policy_id=null where status in ('open','in_progress');
alter table public.tickets enable trigger tickets_set_updated_at;

alter table public.support_notifications drop constraint support_notifications_kind_check;
alter table public.support_notifications add constraint support_notifications_kind_check check(kind in ('assigned','customer_message','staff_reply','response_warning','response_breached'));
alter table public.support_notifications add column response_cycle uuid, add column response_due_at timestamptz;
create table supportflow_private.response_alert_dispatches (
 ticket_id uuid not null references public.tickets(id) on delete cascade,
 cycle uuid not null, recipient_id uuid not null references public.profiles(id) on delete cascade,
 stage text not null check(stage in ('response_warning','response_breached')),
 created_at timestamptz not null default now(), primary key(cycle,recipient_id,stage)
);
create table supportflow_private.response_alert_health (
 singleton boolean primary key default true check(singleton),last_succeeded_at timestamptz,processed integer not null default 0
);
insert into supportflow_private.response_alert_health(singleton) values(true);
alter table supportflow_private.response_alert_dispatches enable row level security;
alter table supportflow_private.response_alert_health enable row level security;
revoke all on supportflow_private.response_alert_dispatches,supportflow_private.response_alert_health from public,anon,authenticated;

create function supportflow_private.dispatch_response_alerts(p_now timestamptz default clock_timestamp()) returns integer
language plpgsql security definer set search_path='' as $$
declare ticket public.tickets; recipient uuid; alert_stage text; inserted integer; total integer:=0;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('supportflow.response-alerts',0)) then return 0; end if;
 if (select alerts_enabled from public.response_settings where singleton) then
  for ticket in select t.* from public.tickets t
   where t.status in ('open','in_progress') and t.response_warning_at<=p_now
    and exists(select 1 from public.profiles p where
     ((t.response_due_at<=p_now and (p.role='admin' or (p.role='agent' and p.id=t.assignee_id)))
      or (t.response_due_at>p_now and ((p.role='agent' and p.id=t.assignee_id) or (t.assignee_id is null and p.role='admin'))))
     and not exists(select 1 from supportflow_private.response_alert_dispatches d where d.cycle=t.response_cycle and d.recipient_id=p.id and d.stage=case when t.response_due_at<=p_now then 'response_breached' else 'response_warning' end))
   order by t.response_due_at,t.id limit 200 for update skip locked
  loop
   alert_stage:=case when ticket.response_due_at<=p_now then 'response_breached' else 'response_warning' end;
   for recipient in select id from public.profiles p where
    (alert_stage='response_breached' and (p.role='admin' or (p.role='agent' and p.id=ticket.assignee_id)))
    or (alert_stage='response_warning' and ((p.role='agent' and p.id=ticket.assignee_id) or (ticket.assignee_id is null and p.role='admin')))
   loop
    insert into supportflow_private.response_alert_dispatches(ticket_id,cycle,recipient_id,stage,created_at)
     values(ticket.id,ticket.response_cycle,recipient,alert_stage,p_now) on conflict do nothing;
    get diagnostics inserted=row_count;
    if inserted>0 then
     insert into public.support_notifications(recipient_id,ticket_id,kind,response_cycle,response_due_at,created_at)
      values(recipient,ticket.id,alert_stage,ticket.response_cycle,ticket.response_due_at,p_now);
     total:=total+1;
    end if;
   end loop;
  end loop;
 end if;
 -- Presence cleanup is independent of whether response notifications are enabled.
 delete from supportflow_private.reply_presence where expires_at<p_now;
 update supportflow_private.response_alert_health set last_succeeded_at=p_now,processed=total where singleton;
 return total;
end;$$;
revoke all on function supportflow_private.dispatch_response_alerts(timestamptz) from public,anon,authenticated;

create function supportflow_private.finish_response_alerts() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in ('resolved','closed') or new.response_cycle is distinct from old.response_cycle or new.priority is distinct from old.priority then
  update public.support_notifications set read_at=coalesce(read_at,now()) where ticket_id=new.id and kind in ('response_warning','response_breached') and read_at is null;
 end if;
 return new;
end;$$;
revoke all on function supportflow_private.finish_response_alerts() from public,anon,authenticated;
create trigger finish_response_alerts after update on public.tickets for each row execute function supportflow_private.finish_response_alerts();

create function supportflow_private.response_scheduler_health() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception '관리자만 조회할 수 있습니다.' using errcode='42501'; end if;
 return (select to_jsonb(h)-'singleton' from supportflow_private.response_alert_health h where singleton);
end;$$;
revoke all on function supportflow_private.response_scheduler_health() from public,anon;
grant execute on function supportflow_private.response_scheduler_health() to authenticated;
create function public.response_scheduler_health() returns jsonb language sql security invoker set search_path='' as $$ select supportflow_private.response_scheduler_health() $$;
revoke all on function public.response_scheduler_health() from public,anon;
grant execute on function public.response_scheduler_health() to authenticated;

-- Typing presence is staff-only, contains no draft text and expires after 45 seconds.
create table supportflow_private.reply_presence (
 ticket_id uuid not null references public.tickets(id) on delete cascade,
 actor_id uuid not null references public.profiles(id) on delete cascade,
 session_id uuid not null,
 expires_at timestamptz not null,
 primary key(ticket_id,actor_id,session_id)
);
create index reply_presence_expiry_idx on supportflow_private.reply_presence(expires_at);
alter table supportflow_private.reply_presence enable row level security;
revoke all on supportflow_private.reply_presence from public,anon,authenticated;
create function supportflow_private.reply_collaboration(p_ticket_id uuid,p_session_id uuid,p_typing boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); actor_role public.user_role; ticket public.tickets; participants jsonb; latest_order bigint;
begin
 select role into actor_role from public.profiles where id=actor;
 select * into ticket from public.tickets where id=p_ticket_id;
 if actor is null or actor_role not in ('admin','agent') or actor_role is null or ticket.id is null or (actor_role='agent' and ticket.assignee_id is distinct from actor) then
  raise exception '문의 접근 권한이 없습니다.' using errcode='42501';
 end if;
 if p_session_id is null or p_typing is null then raise exception '작성 세션을 확인해 주세요.' using errcode='22023'; end if;
 if p_typing then
  insert into supportflow_private.reply_presence(ticket_id,actor_id,session_id,expires_at) values(ticket.id,actor,p_session_id,clock_timestamp()+interval '45 seconds')
   on conflict(ticket_id,actor_id,session_id) do update set expires_at=excluded.expires_at;
 else delete from supportflow_private.reply_presence where ticket_id=ticket.id and actor_id=actor and session_id=p_session_id;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('actorId',p.id,'name',p.name,'sessionId',r.session_id)), '[]'::jsonb) into participants
 from supportflow_private.reply_presence r join public.profiles p on p.id=r.actor_id
 where r.ticket_id=ticket.id and r.expires_at>clock_timestamp() and (r.actor_id<>actor or r.session_id<>p_session_id)
  and (p.role='admin' or (p.role='agent' and p.id=ticket.assignee_id));
 select coalesce(max(reply_order),0) into latest_order from public.ticket_replies where ticket_id=ticket.id and not is_internal;
 return jsonb_build_object('latestReplyOrder',latest_order,'participants',participants);
end;$$;
revoke all on function supportflow_private.reply_collaboration(uuid,uuid,boolean) from public,anon;
grant execute on function supportflow_private.reply_collaboration(uuid,uuid,boolean) to authenticated;
create function public.reply_collaboration(p_ticket_id uuid,p_session_id uuid,p_typing boolean)
returns jsonb language sql security invoker set search_path='' as $$ select supportflow_private.reply_collaboration(p_ticket_id,p_session_id,p_typing) $$;
revoke all on function public.reply_collaboration(uuid,uuid,boolean) from public,anon;
grant execute on function public.reply_collaboration(uuid,uuid,boolean) to authenticated;

grant select(response_due_at,response_warning_at,response_policy_id,response_calendar,response_target_minutes,response_cycle) on public.tickets to authenticated;
create or replace view public.ticket_workspace with (security_invoker = true) as
select t.id, t.title, t.content, t.status, t.priority, t.category, t.ticket_number,
  t.customer_id, t.assignee_id, t.created_at, t.updated_at,
  a.id as latest_ai_analysis_id, coalesce(a.needs_review, false) as ai_needs_review,
  case when a.review_decision = 'rejected' then null else a.sentiment end as ai_sentiment,
  case when a.review_decision = 'rejected' then null else a.urgency end as ai_urgency,
  case when a.review_decision = 'rejected' then null else a.confidence end as ai_confidence,
  a.review_decision as ai_review_decision,
  case (case when a.review_decision = 'rejected' then null else a.urgency end) when 'critical' then 4 when 'high' then 3 when 'medium' then 2 when 'low' then 1 else 0 end as ai_urgency_rank,
  case t.priority when 'urgent' then 4 when 'high' then 3 when 'medium' then 2 else 1 end as priority_rank,
  case when c.id is null then null else jsonb_build_object('id', c.id, 'name', c.name, 'email', c.email) end as customer,
  case when s.id is null or public.current_user_role() = 'customer' then null
    else jsonb_build_object('id', s.id, 'name', s.name, 'email', s.email) end as assignee,
  case when a.id is null or a.review_decision = 'rejected' then null else jsonb_build_object('intent', a.intent, 'summary', a.summary, 'tags', a.tags) end as latest_ai_analysis,
  case when a.id is null then null else to_jsonb(a) - 'raw_response' end as ai_analysis, t.response_started_at, t.response_due_at,t.response_warning_at,t.response_policy_id,t.response_calendar,t.response_target_minutes,t.response_cycle,
  supportflow_private.response_minutes_between(now(),t.response_due_at,t.response_calendar) as response_remaining_minutes
from public.tickets t
left join public.profiles c on c.id = t.customer_id
left join public.profiles s on s.id = t.assignee_id
left join lateral (
  select * from public.ticket_ai_analyses x where x.ticket_id = t.id
  order by x.created_at desc, x.id desc limit 1
) a on true;
create or replace function supportflow_private.ticket_command(p_ticket_id uuid, p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_role public.user_role;
  ticket public.tickets;
  analysis public.ticket_ai_analyses;
  previous_analysis public.ticket_ai_analyses;
  reply public.ticket_replies;
  new_status public.ticket_status;
  new_priority public.ticket_priority;
  new_assignee uuid;
  decision public.ai_review_decision;
  internal boolean;
  source text;
  note text;
  conversation_order bigint;
  v_request_id uuid;
  request_payload jsonb;
  cached supportflow_private.submission_requests;
  trusted_service boolean := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
    or current_setting('role', true) = 'service_role';
begin
  if trusted_service and p_action = 'save_analysis' then
    actor := (p_payload ->> 'actorId')::uuid;
  end if;
  select role into actor_role from public.profiles where id = actor;
  if actor is null or actor_role is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;
  select * into ticket from public.tickets where id = p_ticket_id for update;
  if ticket.id is null or (actor_role = 'agent' and ticket.assignee_id is distinct from actor)
    or (actor_role = 'customer' and not (trusted_service and p_action = 'save_analysis'
      and ticket.customer_id = actor and ticket.latest_ai_analysis_id is null)
      and not (p_action = 'reply' and ticket.customer_id = actor)) then
    raise exception '문의를 찾을 수 없거나 접근 권한이 없습니다.' using errcode = '42501';
  end if;

  if p_action = 'update' then
    if actor_role <> 'admin' and (p_payload ? 'priority' or p_payload ? 'assigneeId') then
      raise exception '담당자와 우선순위는 관리자만 변경할 수 있습니다.' using errcode = '42501';
    end if;
    new_status := coalesce((p_payload ->> 'status')::public.ticket_status, ticket.status);
    new_priority := coalesce((p_payload ->> 'priority')::public.ticket_priority, ticket.priority);
    new_assignee := case when p_payload ? 'assigneeId' then (p_payload ->> 'assigneeId')::uuid else ticket.assignee_id end;
    if new_assignee is not null and not exists (select 1 from public.profiles where id = new_assignee and role = 'agent') then
      raise exception '상담원 계정만 담당자로 배정할 수 있습니다.' using errcode = '22023';
    end if;
    if new_status is distinct from ticket.status then
      insert into public.ticket_logs(ticket_id,actor_id,action,before_value,after_value)
      values(ticket.id,actor,'status_changed',ticket.status::text,new_status::text);
    end if;
    if new_priority is distinct from ticket.priority then
      insert into public.ticket_logs(ticket_id,actor_id,action,before_value,after_value)
      values(ticket.id,actor,'priority_changed',ticket.priority::text,new_priority::text);
    end if;
    if new_assignee is distinct from ticket.assignee_id then
      insert into public.ticket_logs(ticket_id,actor_id,action,before_value,after_value)
      values(ticket.id,actor,'assignee_changed',ticket.assignee_id::text,new_assignee::text);
    end if;
    update public.tickets set status=new_status, priority=new_priority, assignee_id=new_assignee
    where id=ticket.id returning * into ticket;
    return to_jsonb(ticket);

  elsif p_action = 'reply' then
    v_request_id := (p_payload->>'requestId')::uuid;
    request_payload := jsonb_build_object('content',btrim(p_payload->>'content'),'isInternal',coalesce((p_payload->>'isInternal')::boolean,false),'source',coalesce(p_payload->>'source','manual'),'attachmentIds',coalesce(p_payload->'attachmentIds','[]'::jsonb));
    if v_request_id is not null then
      perform pg_advisory_xact_lock(hashtextextended(actor::text || v_request_id::text,0));
      select * into cached from supportflow_private.submission_requests where actor_id=actor and submission_requests.request_id=v_request_id;
      if found then
        if cached.action <> 'reply' or cached.ticket_id <> ticket.id or cached.payload <> request_payload then
          raise exception '같은 요청 번호로 다른 내용을 보낼 수 없습니다.' using errcode='22023';
        end if;
        return cached.result;
      end if;
    end if;
    if length(btrim(coalesce(p_payload->>'content',''))) not between 3 and 4000 then
      raise exception '답변은 3자 이상 4000자 이하로 입력해 주세요.' using errcode = '22023';
    end if;
    internal := coalesce((p_payload->>'isInternal')::boolean, false);
    source := coalesce(p_payload->>'source', 'manual');
    if source not in ('manual','ai_draft') then
      raise exception '잘못된 답변 출처입니다.' using errcode = '22023';
    end if;
    if actor_role = 'customer' and (internal or source <> 'manual') then
      raise exception '고객은 공개 메시지만 등록할 수 있습니다.' using errcode = '42501';
    end if;
    -- The ticket row is already locked. Check AFTER replay handling so a lost response
    -- can safely return the original answer even when the conversation has moved on.
    if not internal and actor_role in ('admin','agent') then
      select coalesce(max(reply_order),0) into conversation_order from public.ticket_replies where ticket_id=ticket.id and not is_internal;
      if p_payload->>'expectedReplyOrder' is null or conversation_order is distinct from (p_payload->>'expectedReplyOrder')::bigint then
        raise exception '새 메시지가 등록되었습니다. 작성 내용은 유지됩니다. 최신 대화를 확인한 뒤 다시 전송해 주세요.' using errcode='40001', detail='reply_conflict';
      end if;
    end if;
    insert into public.ticket_replies(ticket_id,author_id,content,is_internal,author_role)
    values(ticket.id,actor,btrim(p_payload->>'content'),internal,actor_role) returning * into reply;
    perform supportflow_private.attach_files(array(select jsonb_array_elements_text(coalesce(p_payload->'attachmentIds','[]'::jsonb))::uuid),ticket.id,reply.id,internal);
    insert into public.ticket_logs(ticket_id,actor_id,action,after_value)
    values(ticket.id,actor,case when internal then 'internal_note_added' when actor_role = 'customer' then 'customer_message_added' else 'reply_added' end,reply.id::text);
    if not internal and source='ai_draft' then
      insert into public.ticket_logs(ticket_id,actor_id,action,after_value)
      values(ticket.id,actor,'ai_draft_used_as_customer_reply',reply.id::text);
    end if;
    if not internal then
      new_status := case when actor_role = 'customer' then 'open'::public.ticket_status else 'resolved'::public.ticket_status end;
      update public.tickets set status=new_status where id=ticket.id;
      if ticket.status is distinct from new_status then
        insert into public.ticket_logs(ticket_id,actor_id,action,before_value,after_value)
        values(ticket.id,actor,'status_changed',ticket.status::text,new_status::text);
      end if;
    end if;
    if v_request_id is not null then
      insert into supportflow_private.submission_requests(actor_id,request_id,action,ticket_id,payload,result)
      values(actor,v_request_id,'reply',ticket.id,request_payload,to_jsonb(reply));
    end if;
    return to_jsonb(reply);

  elsif p_action = 'save_analysis' then
    select coalesce(max(reply_order),0) into conversation_order from public.ticket_replies
      where ticket_id=ticket.id and not is_internal;
    if conversation_order <> coalesce((p_payload->>'expectedReplyOrder')::bigint,0) then
      raise exception '대화가 변경되었습니다. 최신 대화로 다시 분석해 주세요.' using errcode='40001';
    end if;
    if ticket.latest_ai_analysis_id is distinct from (p_payload->>'expectedAnalysisId')::uuid then
      raise exception '다른 분석이 먼저 저장되었습니다. 새로고침 후 확인해 주세요.' using errcode = '40001';
    end if;
    analysis := jsonb_populate_record(null::public.ticket_ai_analyses, p_payload->'analysis');
    if length(btrim(coalesce(analysis.summary,''))) not between 1 and 500
      or length(btrim(coalesce(analysis.reason,''))) not between 1 and 700
      or length(coalesce(analysis.reply_draft,'')) > 2000
      or coalesce(cardinality(analysis.tags),0) > 8 then
      raise exception 'AI 분석 형식이 올바르지 않습니다.' using errcode = '22023';
    end if;
    insert into public.ticket_ai_analyses(ticket_id,prompt_version_id,provider,model,category,sentiment,urgency,intent,
      suggested_priority,suggested_status,suggested_assignee_role,tags,summary,reason,reply_draft,confidence,needs_review,
      escalation_reason,raw_response,validation_status,created_by,created_at,source_reply_order)
    values(ticket.id,analysis.prompt_version_id,analysis.provider,analysis.model,analysis.category,analysis.sentiment,
      analysis.urgency,analysis.intent,analysis.suggested_priority,analysis.suggested_status,analysis.suggested_assignee_role,
      coalesce(analysis.tags,'{}'),analysis.summary,analysis.reason,analysis.reply_draft,analysis.confidence,
      analysis.needs_review,analysis.escalation_reason,coalesce(analysis.raw_response,'{}'),analysis.validation_status,actor,clock_timestamp(),conversation_order)
    returning * into analysis;
    update public.tickets set latest_ai_analysis_id=analysis.id, ai_needs_review=analysis.needs_review,
      ai_sentiment=analysis.sentiment,ai_urgency=analysis.urgency,ai_confidence=analysis.confidence where id=ticket.id;
    insert into public.ticket_logs(ticket_id,actor_id,action,before_value,after_value)
    values(ticket.id,actor,case when ticket.latest_ai_analysis_id is null then 'ai_analysis_generated' else 'ai_analysis_regenerated' end,
      ticket.latest_ai_analysis_id::text,analysis.id::text);
    return to_jsonb(analysis) - 'raw_response';

  elsif p_action in ('review','request_review') then
    select * into analysis from public.ticket_ai_analyses
      where id=(p_payload->>'analysisId')::uuid and ticket_id=ticket.id for update;
    if analysis.id is null or analysis.id is distinct from ticket.latest_ai_analysis_id then
      raise exception '최신 분석이 변경되었습니다. 새로고침 후 다시 검토해 주세요.' using errcode = '40001';
    end if;
    if p_action='review' and p_payload->>'decision' in ('approved','corrected') and
      coalesce(analysis.source_reply_order,0) < (select coalesce(max(reply_order),0) from public.ticket_replies where ticket_id=ticket.id and not is_internal) then
      raise exception '대화가 변경되었습니다. 최신 대화로 다시 분석해 주세요.' using errcode='40001';
    end if;
    previous_analysis := analysis;
    note := nullif(btrim(p_payload->>'note'),'');
    if length(note)>500 then raise exception '메모는 500자 이하로 입력해 주세요.' using errcode='22023'; end if;
    if p_action='request_review' then
      update public.ticket_ai_analyses set needs_review=true, review_decision=null,
        escalation_reason=coalesce(note,'상담원이 검토를 요청했습니다.') where id=analysis.id returning * into analysis;
    else
      decision := (p_payload->>'decision')::public.ai_review_decision;
      if decision is null then raise exception '검토 결정을 선택해 주세요.' using errcode='22023'; end if;
      if decision='corrected' then
        if length(btrim(coalesce(p_payload#>>'{correction,summary}',''))) not between 1 and 500
          or length(btrim(coalesce(p_payload#>>'{correction,reason}',''))) not between 1 and 700
          or length(coalesce(p_payload#>>'{correction,replyDraft}',''))>2000 then
          raise exception '수정 내용 형식이 올바르지 않습니다.' using errcode='22023';
        end if;
        analysis.summary := btrim(p_payload#>>'{correction,summary}');
        analysis.reason := btrim(p_payload#>>'{correction,reason}');
        analysis.reply_draft := nullif(btrim(p_payload#>>'{correction,replyDraft}'),'');
        analysis.suggested_priority := (p_payload#>>'{correction,suggestedPriority}')::public.ticket_priority;
        analysis.suggested_status := (p_payload#>>'{correction,suggestedStatus}')::public.ticket_status;
      elsif decision='rejected' then
        analysis.reply_draft := null; analysis.suggested_priority := null; analysis.suggested_status := null;
      end if;
      update public.ticket_ai_analyses set summary=analysis.summary,reason=analysis.reason,reply_draft=analysis.reply_draft,
        suggested_priority=analysis.suggested_priority,suggested_status=analysis.suggested_status,
        needs_review=false, review_decision=decision,
        escalation_reason=case when decision='rejected' then coalesce(note,'AI 분석이 제외되었습니다.') else null end
      where id=analysis.id returning * into analysis;
      insert into public.ticket_ai_review_events(ticket_ai_analysis_id,ticket_id,reviewer_id,decision,before_value,after_value,note)
      values(analysis.id,ticket.id,actor,decision,to_jsonb(previous_analysis)-'raw_response',to_jsonb(analysis)-'raw_response',note);
    end if;
    update public.tickets set ai_needs_review=analysis.needs_review where id=ticket.id;
    insert into public.ticket_logs(ticket_id,actor_id,action,before_value,after_value)
    values(ticket.id,actor,case when p_action='request_review' then 'ai_analysis_sent_to_review' else 'ai_analysis_'||decision::text end,
      analysis.id::text,analysis.id::text);
    return to_jsonb(analysis)-'raw_response';
  end if;
  raise exception '지원하지 않는 작업입니다.' using errcode = '22023';
end;
$$;



create function supportflow_private.find_reply_submission(p_ticket_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); actor_role public.user_role; ticket public.tickets;
begin
 select role into actor_role from public.profiles where id=actor;
 select * into ticket from public.tickets where id=p_ticket_id;
 if actor is null or actor_role is null or ticket.id is null or (actor_role='agent' and ticket.assignee_id is distinct from actor) or (actor_role='customer' and ticket.customer_id<>actor) then
  raise exception '문의 접근 권한이 없습니다.' using errcode='42501';
 end if;
 return (select result from supportflow_private.submission_requests where actor_id=actor and request_id=p_request_id and ticket_id=ticket.id and action='reply');
end;$$;
revoke all on function supportflow_private.find_reply_submission(uuid,uuid) from public,anon;
grant execute on function supportflow_private.find_reply_submission(uuid,uuid) to authenticated;
create function public.find_reply_submission(p_ticket_id uuid,p_request_id uuid)
returns jsonb language sql security invoker set search_path='' as $$ select supportflow_private.find_reply_submission(p_ticket_id,p_request_id) $$;
revoke all on function public.find_reply_submission(uuid,uuid) from public,anon;
grant execute on function public.find_reply_submission(uuid,uuid) to authenticated;
commit;
