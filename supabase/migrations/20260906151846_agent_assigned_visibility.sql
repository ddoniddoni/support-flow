begin;
-- Ownership policies from a former customer role must not expand agent access.
-- Restrictive policies intersect all permissive SELECT policies, including future ones.
create policy "Agents only see current assignments"
on public.tickets as restrictive for select to authenticated
using (
  (select public.current_user_role()) <> 'agent'
  or assignee_id = (select auth.uid())
);
commit;
