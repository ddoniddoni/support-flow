begin;

create function supportflow_private.bulk_assign_tickets(p_ticket_ids uuid[], p_assignee_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  ids uuid[];
  row_ticket record;
  changed integer := 0;
  locked_count integer;
begin
  -- Serialize with role changes so the actor cannot lose admin access mid-batch.
  perform pg_advisory_xact_lock(739201, 1);
  if actor is null or not exists(select 1 from public.profiles where id=actor and role='admin') then
    raise exception '관리자만 문의를 일괄 배정할 수 있습니다.' using errcode='42501';
  end if;
  if coalesce(cardinality(p_ticket_ids),0) not between 1 and 100 or array_position(p_ticket_ids,null) is not null then
    raise exception '배정할 문의를 1건 이상 100건 이하 선택해 주세요.' using errcode='22023';
  end if;
  select array_agg(distinct id order by id) into ids from unnest(p_ticket_ids) id;
  if p_assignee_id is null or not exists(select 1 from public.profiles where id=p_assignee_id and role='agent') then
    raise exception '배정 가능한 상담원을 선택해 주세요.' using errcode='22023';
  end if;
  perform id from public.tickets where id=any(ids) order by id for update;
  get diagnostics locked_count = row_count;
  if locked_count <> cardinality(ids) then
    raise exception '선택한 문의 중 더 이상 존재하지 않는 문의가 있습니다. 새로고침해 주세요.' using errcode='P0002';
  end if;
  for row_ticket in select id,assignee_id from public.tickets where id=any(ids) order by id loop
    if row_ticket.assignee_id is distinct from p_assignee_id then
      -- Reuse the existing access checks and transactional activity logs.
      perform public.support_ticket_command(row_ticket.id,'update',jsonb_build_object('assigneeId',p_assignee_id));
      changed := changed + 1;
    end if;
  end loop;
  return jsonb_build_object('changed',changed,'unchanged',cardinality(ids)-changed);
end;
$$;
revoke all on function supportflow_private.bulk_assign_tickets(uuid[],uuid) from public, anon;
grant execute on function supportflow_private.bulk_assign_tickets(uuid[],uuid) to authenticated;

create function public.bulk_assign_tickets(p_ticket_ids uuid[],p_assignee_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select supportflow_private.bulk_assign_tickets(p_ticket_ids,p_assignee_id);
$$;
revoke all on function public.bulk_assign_tickets(uuid[],uuid) from public, anon;
grant execute on function public.bulk_assign_tickets(uuid[],uuid) to authenticated;
commit;
