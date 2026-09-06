begin;
create table public.support_notifications (
 id bigint generated always as identity primary key,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 ticket_id uuid not null references public.tickets(id) on delete cascade,
 reply_id uuid references public.ticket_replies(id) on delete cascade,
 kind text not null check(kind in ('assigned','customer_message','staff_reply')),
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index notifications_recipient_created_idx on public.support_notifications(recipient_id,created_at desc,id desc);
create index notifications_unread_ticket_idx on public.support_notifications(recipient_id,ticket_id) where read_at is null;
alter table public.support_notifications enable row level security;
revoke all on public.support_notifications from public,anon,authenticated;
grant select on public.support_notifications to authenticated;
grant update(read_at) on public.support_notifications to authenticated;
create policy "Recipients read accessible ticket notifications" on public.support_notifications for select to authenticated
using(recipient_id=(select auth.uid()) and exists(select 1 from public.tickets t where t.id=ticket_id));
create policy "Recipients mark accessible notifications read" on public.support_notifications for update to authenticated
using(recipient_id=(select auth.uid()) and exists(select 1 from public.tickets t where t.id=ticket_id))
with check(recipient_id=(select auth.uid()) and exists(select 1 from public.tickets t where t.id=ticket_id));

create function supportflow_private.notify_ticket_assignment() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.assignee_id is distinct from old.assignee_id then
  update public.support_notifications set read_at=now() where ticket_id=new.id and recipient_id=old.assignee_id and read_at is null;
 end if;
 if new.assignee_id is not null and (tg_op='INSERT' or new.assignee_id is distinct from old.assignee_id) then
  insert into public.support_notifications(recipient_id,ticket_id,kind) values(new.assignee_id,new.id,'assigned');
 end if;
 return new;
end;$$;
revoke all on function supportflow_private.notify_ticket_assignment() from public,anon,authenticated;
create trigger notify_ticket_assignment after insert or update of assignee_id on public.tickets
for each row execute function supportflow_private.notify_ticket_assignment();

create function supportflow_private.notify_ticket_message() returns trigger
language plpgsql security definer set search_path='' as $$
declare ticket public.tickets;
begin
 if new.is_internal then return new; end if;
 select * into ticket from public.tickets where id=new.ticket_id;
 if new.author_role='customer' then
  if ticket.assignee_id is not null then
   insert into public.support_notifications(recipient_id,ticket_id,reply_id,kind)
   select ticket.assignee_id,ticket.id,new.id,'customer_message' where ticket.assignee_id<>new.author_id;
  else
   insert into public.support_notifications(recipient_id,ticket_id,reply_id,kind)
   select id,ticket.id,new.id,'customer_message' from public.profiles where role='admin' and id<>new.author_id;
  end if;
 elsif ticket.customer_id<>new.author_id then
  insert into public.support_notifications(recipient_id,ticket_id,reply_id,kind)
  values(ticket.customer_id,ticket.id,new.id,'staff_reply');
 end if;
 return new;
end;$$;
revoke all on function supportflow_private.notify_ticket_message() from public,anon,authenticated;
create trigger notify_ticket_message after insert on public.ticket_replies
for each row execute function supportflow_private.notify_ticket_message();

create function public.unread_ticket_notifications(p_ticket_ids uuid[])
returns table(ticket_id uuid, unread_count bigint) language sql security invoker set search_path='' as $$
 select n.ticket_id,count(*) from public.support_notifications n
 where n.read_at is null and n.ticket_id=any(p_ticket_ids[1:100]) group by n.ticket_id;
$$;
revoke all on function public.unread_ticket_notifications(uuid[]) from public,anon;
grant execute on function public.unread_ticket_notifications(uuid[]) to authenticated;

create function public.read_ticket_notifications(p_ticket_id uuid,p_reply_order bigint)
returns integer language plpgsql security invoker set search_path='' as $$
declare changed integer;
begin
 update public.support_notifications n set read_at=now()
 where n.ticket_id=p_ticket_id and n.read_at is null and (n.reply_id is null or exists(
  select 1 from public.ticket_replies r where r.id=n.reply_id and r.reply_order<=p_reply_order
 ));
 get diagnostics changed=row_count;
 return changed;
end;$$;
revoke all on function public.read_ticket_notifications(uuid,bigint) from public,anon;
grant execute on function public.read_ticket_notifications(uuid,bigint) to authenticated;
commit;
