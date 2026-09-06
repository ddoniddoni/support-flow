begin;

-- A null actor denotes an explicitly labelled system correction, never a user action.
alter table public.ticket_logs alter column actor_id drop not null;

with corrected as (
  update public.tickets t set status = 'open'
  where t.status = 'resolved'
    and not exists (select 1 from public.ticket_replies r where r.ticket_id = t.id and not r.is_internal)
  returning t.id
)
insert into public.ticket_logs(ticket_id, actor_id, action, before_value, after_value)
select id, null, 'resolution_corrected_without_reply', 'resolved', 'open' from corrected;

create function supportflow_private.require_public_reply_for_resolution()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'resolved' and not exists (
    select 1 from public.ticket_replies r
    where r.ticket_id = new.id and not r.is_internal
  ) then
    raise exception '고객 공개 답변을 등록한 뒤 답변 완료로 변경할 수 있습니다.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function supportflow_private.require_public_reply_for_resolution() from public, anon, authenticated;

create trigger require_public_reply_for_resolution
before insert or update of status on public.tickets
for each row execute function supportflow_private.require_public_reply_for_resolution();

commit;
