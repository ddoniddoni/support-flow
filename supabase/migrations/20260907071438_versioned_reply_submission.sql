begin;
-- Expand/contract rollout: older deployed clients keep the existing endpoint.
-- The current UI uses this versioned endpoint and cannot omit its conversation version.
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
    if not internal and actor_role in ('admin','agent') and p_payload ? 'expectedReplyOrder' then
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




create function public.submit_ticket_reply(p_ticket_id uuid,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if public.current_user_role() in ('admin','agent') and not coalesce((p_payload->>'isInternal')::boolean,false) and p_payload->>'expectedReplyOrder' is null then
  raise exception '최신 대화를 확인한 뒤 다시 전송해 주세요.' using errcode='40001',detail='reply_conflict';
 end if;
 return supportflow_private.ticket_command(p_ticket_id,'reply',p_payload);
end;$$;
revoke all on function public.submit_ticket_reply(uuid,jsonb) from public,anon;
grant execute on function public.submit_ticket_reply(uuid,jsonb) to authenticated;
commit;
