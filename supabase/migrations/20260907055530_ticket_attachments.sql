begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('ticket-attachments','ticket-attachments',false,3145728,array['image/jpeg','image/png','image/webp','application/pdf']);
update supportflow_private.submission_requests set payload=payload || jsonb_build_object('attachmentIds','[]'::jsonb) where not (payload ? 'attachmentIds');
-- Objects are served by authenticated API routes; no direct client storage grants/policies.
create table public.ticket_attachments (
 id uuid primary key,
 owner_id uuid not null references public.profiles(id) on delete cascade,
 upload_ticket_id uuid references public.tickets(id) on delete cascade,
 ticket_id uuid references public.tickets(id) on delete cascade,
 reply_id uuid references public.ticket_replies(id) on delete cascade,
 is_internal boolean not null default false,
 name text not null check(length(name) between 1 and 180),
 mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
 size integer not null check(size between 1 and 3145728),
 object_path text not null unique,
 sha256 text not null,
 created_at timestamptz not null default now()
);
create index ticket_attachments_ticket_idx on public.ticket_attachments(ticket_id,reply_id);
create index ticket_attachments_staging_idx on public.ticket_attachments(owner_id,created_at) where ticket_id is null;
alter table public.ticket_attachments enable row level security;
revoke all on public.ticket_attachments from public,anon,authenticated;
grant select on public.ticket_attachments to authenticated;
grant all on public.ticket_attachments to service_role;
create policy attachment_visibility on public.ticket_attachments for select to authenticated using (
 (ticket_attachments.ticket_id is not null
  and exists(select 1 from public.tickets t where t.id=ticket_attachments.ticket_id and (
    public.current_user_role()='admin'
    or (public.current_user_role()='agent' and t.assignee_id=auth.uid())
    or (public.current_user_role()='customer' and t.customer_id=auth.uid() and not ticket_attachments.is_internal)
  )))
 or (ticket_attachments.ticket_id is null and ticket_attachments.owner_id=auth.uid()
   and (not ticket_attachments.is_internal or public.current_user_role() in ('admin','agent'))
   and ((ticket_attachments.upload_ticket_id is null and public.current_user_role()='customer')
     or exists(select 1 from public.tickets t where t.id=ticket_attachments.upload_ticket_id and (
       public.current_user_role()='admin'
       or (public.current_user_role()='agent' and t.assignee_id=auth.uid())
       or (public.current_user_role()='customer' and t.customer_id=auth.uid())
     ))))
);

create function supportflow_private.attach_files(p_ids uuid[],p_ticket uuid,p_reply uuid,p_internal boolean)
returns void language plpgsql set search_path='' as $$
declare selected_count integer;
begin
 if coalesce(cardinality(p_ids),0)=0 then return; end if;
 if cardinality(p_ids)>5 or array_position(p_ids,null) is not null then
   raise exception '첨부파일은 최대 5개까지 등록할 수 있습니다.' using errcode='22023';
 end if;
 perform 1 from public.ticket_attachments where id=any(p_ids) order by id for update;
 select count(*) into selected_count from public.ticket_attachments
 where id=any(p_ids) and owner_id=auth.uid() and ticket_id is null and is_internal=p_internal
 and created_at > now()-interval '24 hours'
 and ((p_reply is null and upload_ticket_id is null) or (p_reply is not null and upload_ticket_id=p_ticket));
 if selected_count <> cardinality(p_ids) then
   raise exception '첨부파일이 만료되었거나 이미 사용되었습니다. 파일을 다시 선택해 주세요.' using errcode='22023';
 end if;
 update public.ticket_attachments set ticket_id=p_ticket,reply_id=p_reply where id=any(p_ids);
end;
$$;
revoke all on function supportflow_private.attach_files(uuid[],uuid,uuid,boolean) from public,anon,authenticated;
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

create or replace function supportflow_private.create_ticket(p_request_id uuid,p_title text,p_content text,p_category text,p_attachment_ids uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid();
  payload jsonb := jsonb_build_object('title',btrim(p_title),'content',btrim(p_content),'category',p_category,'attachmentIds',to_jsonb(coalesce(p_attachment_ids,'{}'::uuid[])));
  cached supportflow_private.submission_requests;
  ticket public.tickets;
begin
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='customer') then
    raise exception '고객 계정으로 로그인해 주세요.' using errcode='42501';
  end if;
  if p_request_id is null or coalesce(length(btrim(p_title)),0) not between 5 and 120 or coalesce(length(btrim(p_content)),0) not between 20 and 4000
    or p_category is null or p_category not in ('account','billing','technical','product','other') then
    raise exception '문의 입력값이 올바르지 않습니다.' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text || p_request_id::text,0));
  select * into cached from supportflow_private.submission_requests where actor_id=actor and request_id=p_request_id;
  if found then
    if cached.action <> 'create' or cached.payload <> payload then
      raise exception '같은 요청 번호로 다른 내용을 보낼 수 없습니다.' using errcode='22023';
    end if;
    if not exists(select 1 from public.tickets where id=cached.ticket_id and customer_id=actor) then
      raise exception '문의 접근 권한이 없습니다.' using errcode='42501';
    end if;
    return cached.result || jsonb_build_object('replayed',true);
  end if;
  insert into public.tickets(title,content,category,customer_id)
    values(btrim(p_title),btrim(p_content),p_category,actor) returning * into ticket;
  perform supportflow_private.attach_files(p_attachment_ids,ticket.id,null,false);
  insert into supportflow_private.submission_requests(actor_id,request_id,action,ticket_id,payload,result)
    values(actor,p_request_id,'create',ticket.id,payload,jsonb_build_object('id',ticket.id));
  return jsonb_build_object('id',ticket.id,'replayed',false);
end;
$$;

revoke all on function supportflow_private.create_ticket(uuid,text,text,text,uuid[]) from public,anon;
grant execute on function supportflow_private.create_ticket(uuid,text,text,text,uuid[]) to authenticated;
-- Preserve the four-argument endpoint for old clients while routing all new calls through one implementation.
create or replace function supportflow_private.create_ticket(p_request_id uuid,p_title text,p_content text,p_category text)
returns jsonb language sql security invoker set search_path='' as $$
 select supportflow_private.create_ticket(p_request_id,p_title,p_content,p_category,'{}'::uuid[])
$$;
create function public.submit_support_ticket(p_request_id uuid,p_title text,p_content text,p_category text,p_attachment_ids uuid[])
returns jsonb language sql security invoker set search_path='' as $$
 select supportflow_private.create_ticket(p_request_id,p_title,p_content,p_category,p_attachment_ids)
$$;
revoke all on function public.submit_support_ticket(uuid,text,text,text,uuid[]) from public,anon;
grant execute on function public.submit_support_ticket(uuid,text,text,text,uuid[]) to authenticated;
commit;
