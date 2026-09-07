begin;
create table public.reply_templates (
 id uuid primary key,
 title text not null check(length(title) between 1 and 80),
 category text not null check(length(category) between 1 and 40),
 content text not null check(length(content) between 3 and 4000),
 is_active boolean not null default true,
 created_by uuid not null references public.profiles(id),
 updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index reply_templates_active_idx on public.reply_templates(is_active,updated_at desc);
alter table public.reply_templates enable row level security;
revoke all on public.reply_templates from public,anon,authenticated;
grant select on public.reply_templates to authenticated;
create policy template_read on public.reply_templates for select to authenticated using (
 public.current_user_role()='admin' or (public.current_user_role()='agent' and is_active)
);
create table supportflow_private.reply_template_events (
 id bigint generated always as identity primary key,
 template_id uuid not null references public.reply_templates(id),
 actor_id uuid not null references public.profiles(id),
 action text not null,
 created_at timestamptz not null default now()
);
alter table supportflow_private.reply_template_events enable row level security;
revoke all on supportflow_private.reply_template_events from public,anon,authenticated;

create function supportflow_private.save_reply_template(p_id uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous public.reply_templates; saved public.reply_templates;
 v_title text:=btrim(p_payload->>'title'); v_category text:=btrim(p_payload->>'category'); v_content text:=btrim(p_payload->>'content');
 active boolean:=coalesce((p_payload->>'isActive')::boolean,true);
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='admin') then
  raise exception '관리자만 답변 템플릿을 관리할 수 있습니다.' using errcode='42501';
 end if;
 if p_id is null or coalesce(length(v_title),0) not between 1 and 80 or coalesce(length(v_category),0) not between 1 and 40 or coalesce(length(v_content),0) not between 3 and 4000 then
  raise exception '템플릿 입력값을 확인해 주세요.' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into previous from public.reply_templates where id=p_id for update;
 if found then
  if previous.title=v_title and previous.category=v_category and previous.content=v_content and previous.is_active=active then return to_jsonb(previous); end if;
  if previous.updated_at is distinct from (p_payload->>'updatedAt')::timestamptz then
   raise exception '다른 관리자가 수정했습니다. 목록을 새로고침하고 다시 편집해 주세요.' using errcode='40001';
  end if;
  update public.reply_templates t set title=v_title,category=v_category,content=v_content,is_active=active,updated_by=actor,
   updated_at=greatest(clock_timestamp(),previous.updated_at + interval '1 microsecond')
   where id=p_id returning * into saved;
 else
  if p_payload->>'updatedAt' is not null then raise exception '템플릿을 찾을 수 없습니다.' using errcode='22023'; end if;
  insert into public.reply_templates(id,title,category,content,is_active,created_by,updated_by)
   values(p_id,v_title,v_category,v_content,active,actor,actor) returning * into saved;
 end if;
 insert into supportflow_private.reply_template_events(template_id,actor_id,action)
 values(p_id,actor,case when previous.id is null then 'created' when previous.is_active and not active then 'deactivated' else 'updated' end);
 return to_jsonb(saved);
end;
$$;
revoke all on function supportflow_private.save_reply_template(uuid,jsonb) from public,anon;
grant execute on function supportflow_private.save_reply_template(uuid,jsonb) to authenticated;
create function public.save_reply_template(p_id uuid,p_payload jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select supportflow_private.save_reply_template(p_id,p_payload) $$;
revoke all on function public.save_reply_template(uuid,jsonb) from public,anon;
grant execute on function public.save_reply_template(uuid,jsonb) to authenticated;

create table public.ticket_feedback (
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references public.tickets(id) on delete cascade,
 reply_id uuid not null unique references public.ticket_replies(id) on delete cascade,
 customer_id uuid not null references public.profiles(id),
 responder_id uuid not null references public.profiles(id),
 helpful boolean not null,
 comment text not null default '' check(length(comment)<=2000),
 created_at timestamptz not null default now()
);
create index ticket_feedback_ticket_idx on public.ticket_feedback(ticket_id);
create index ticket_feedback_rating_idx on public.ticket_feedback(helpful,created_at desc);
alter table public.ticket_feedback enable row level security;
revoke all on public.ticket_feedback from public,anon,authenticated;
grant select on public.ticket_feedback to authenticated;
create policy feedback_read on public.ticket_feedback for select to authenticated using (
 exists(select 1 from public.tickets t where t.id=ticket_feedback.ticket_id and (
  public.current_user_role()='admin'
  or (public.current_user_role()='agent' and t.assignee_id=auth.uid())
  or (public.current_user_role()='customer' and t.customer_id=auth.uid() and ticket_feedback.customer_id=auth.uid())
 ))
);
create function supportflow_private.submit_ticket_feedback(p_ticket_id uuid,p_reply_id uuid,p_helpful boolean,p_comment text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); ticket public.tickets; latest public.ticket_replies; saved public.ticket_feedback; note text:=btrim(coalesce(p_comment,''));
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor and role='customer') then
  raise exception '고객 계정만 답변을 평가할 수 있습니다.' using errcode='42501';
 end if;
 select * into ticket from public.tickets where id=p_ticket_id for update;
 if ticket.id is null or ticket.customer_id<>actor then raise exception '문의 접근 권한이 없습니다.' using errcode='42501'; end if;
 if p_helpful is null or length(note)>2000 or (not p_helpful and length(note)<3) then
  raise exception '해결되지 않은 내용을 3자 이상 2000자 이하로 알려 주세요.' using errcode='22023';
 end if;
 select * into saved from public.ticket_feedback where reply_id=p_reply_id and ticket_id=ticket.id;
 if found then
  if saved.helpful=p_helpful and saved.comment=note then return to_jsonb(saved); end if;
  raise exception '이 답변에 대한 평가는 이미 등록되었습니다.' using errcode='22023';
 end if;
 select * into latest from public.ticket_replies where ticket_id=ticket.id and not is_internal order by reply_order desc limit 1;
 if latest.id is null or latest.id is distinct from p_reply_id or latest.author_role='customer' or ticket.status not in ('resolved','closed') then
  raise exception '대화가 변경되었습니다. 최신 답변을 확인한 뒤 평가해 주세요.' using errcode='40001';
 end if;
 insert into public.ticket_feedback(ticket_id,reply_id,customer_id,responder_id,helpful,comment)
 values(ticket.id,latest.id,actor,latest.author_id,p_helpful,note) returning * into saved;
 if not p_helpful then
  perform supportflow_private.ticket_command(ticket.id,'reply',jsonb_build_object('content','아직 해결되지 않았어요.' || E'\n\n' || note,'isInternal',false,'source','manual','requestId',saved.id,'attachmentIds','[]'::jsonb));
 end if;
 insert into public.ticket_logs(ticket_id,actor_id,action,after_value)
 values(ticket.id,actor,'customer_feedback_submitted',case when p_helpful then 'helpful' else 'unresolved' end);
 return to_jsonb(saved);
end;
$$;
revoke all on function supportflow_private.submit_ticket_feedback(uuid,uuid,boolean,text) from public,anon;
grant execute on function supportflow_private.submit_ticket_feedback(uuid,uuid,boolean,text) to authenticated;
create function public.submit_ticket_feedback(p_ticket_id uuid,p_reply_id uuid,p_helpful boolean,p_comment text default '')
returns jsonb language sql security invoker set search_path='' as $$ select supportflow_private.submit_ticket_feedback(p_ticket_id,p_reply_id,p_helpful,p_comment) $$;
revoke all on function public.submit_ticket_feedback(uuid,uuid,boolean,text) from public,anon;
grant execute on function public.submit_ticket_feedback(uuid,uuid,boolean,text) to authenticated;
create function public.support_feedback_stats()
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('total',count(*),'helpful',count(*) filter(where helpful),'unresolved',count(*) filter(where not helpful)) from public.ticket_feedback
$$;
revoke all on function public.support_feedback_stats() from public,anon;
grant execute on function public.support_feedback_stats() to authenticated;
commit;
