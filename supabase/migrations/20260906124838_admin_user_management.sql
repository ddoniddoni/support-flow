begin;

create table public.user_management_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid references public.profiles(id) on delete set null,
  target_email text not null,
  action text not null check (action in ('user_created','role_changed')),
  previous_role public.user_role,
  next_role public.user_role not null,
  created_at timestamptz not null default now()
);
alter table public.user_management_events enable row level security;
revoke all on public.user_management_events from public, anon, authenticated;
grant select on public.user_management_events to authenticated;
create policy "Admins can read user management events" on public.user_management_events
  for select to authenticated using (public.current_user_role() = 'admin');
create index user_management_events_created_idx on public.user_management_events(created_at desc, id desc);

-- Serialize role changes and re-check the actor inside the same transaction.
create function supportflow_private.manage_user_role(p_actor uuid, p_target uuid, p_role public.user_role, p_created boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target public.profiles;
begin
  if current_setting('role',true) is distinct from 'service_role' then
    if p_created then raise exception '서버에서만 계정을 등록할 수 있습니다.' using errcode='42501'; end if;
    p_actor := auth.uid();
  end if;
  perform pg_advisory_xact_lock(739201, 1);
  if p_actor is null or not exists(select 1 from public.profiles where id=p_actor and role='admin') then
    raise exception '관리자만 사용자를 관리할 수 있습니다.' using errcode='42501';
  end if;
  if p_actor=p_target then
    raise exception '본인의 역할은 변경할 수 없습니다.' using errcode='22023';
  end if;
  if p_role is null then raise exception '역할을 선택해 주세요.' using errcode='22023'; end if;
  select * into target from public.profiles where id=p_target for update;
  if target.id is null then raise exception '사용자를 찾을 수 없습니다.' using errcode='P0002'; end if;
  if p_created and exists(select 1 from public.user_management_events where target_id=p_target) then
    raise exception '이미 등록 처리된 사용자입니다.' using errcode='23505';
  end if;
  if target.role='agent' and p_role<>'agent' and exists(select 1 from public.tickets where assignee_id=p_target) then
    raise exception '배정된 문의를 다른 상담원에게 이관한 뒤 역할을 변경해 주세요.' using errcode='23514';
  end if;
  if not p_created and target.role=p_role then return to_jsonb(target); end if;
  update public.profiles set role=p_role where id=p_target;
  insert into public.user_management_events(actor_id,target_id,target_email,action,previous_role,next_role)
  values(p_actor,p_target,target.email,case when p_created then 'user_created' else 'role_changed' end,
    case when p_created then null else target.role end,p_role);
  return jsonb_build_object('id',target.id,'name',target.name,'email',target.email,'role',p_role,'created_at',target.created_at);
end;
$$;
revoke all on function supportflow_private.manage_user_role(uuid,uuid,public.user_role,boolean) from public,anon;
grant execute on function supportflow_private.manage_user_role(uuid,uuid,public.user_role,boolean) to authenticated,service_role;

-- Actor identity always comes from the authenticated session for role changes.
create function public.admin_change_user_role(p_target uuid,p_role public.user_role)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  return supportflow_private.manage_user_role(auth.uid(),p_target,p_role,false);
end;
$$;
revoke all on function public.admin_change_user_role(uuid,public.user_role) from public,anon;
grant execute on function public.admin_change_user_role(uuid,public.user_role) to authenticated;

-- Only the server Auth Admin API can finalize a newly created account.
create function public.admin_finalize_user(p_actor uuid,p_target uuid,p_role public.user_role)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  return supportflow_private.manage_user_role(p_actor,p_target,p_role,true);
end;
$$;
revoke all on function public.admin_finalize_user(uuid,uuid,public.user_role) from public,anon,authenticated;
grant execute on function public.admin_finalize_user(uuid,uuid,public.user_role) to service_role;

-- Prevent a simultaneous ticket assignment from racing a role change.
create function supportflow_private.check_assignee_role()
returns trigger language plpgsql security definer set search_path = '' as $$
declare assignee_role public.user_role;
begin
  if new.assignee_id is not null then
    select role into assignee_role from public.profiles where id=new.assignee_id for update;
    if assignee_role is distinct from 'agent'::public.user_role then
      raise exception '상담원 계정만 담당자로 배정할 수 있습니다.' using errcode='23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function supportflow_private.check_assignee_role() from public,anon,authenticated;
create trigger tickets_check_assignee_role before insert or update of assignee_id on public.tickets
  for each row execute function supportflow_private.check_assignee_role();

commit;
