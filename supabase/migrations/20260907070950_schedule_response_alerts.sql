begin;
-- Supabase Postgres provides pg_cron. Lightweight PGlite tests exercise the worker
-- directly because that test runtime does not ship the scheduler extension.
do $schedule$
begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  create extension if not exists pg_cron;
  perform cron.schedule('supportflow-response-alerts','* * * * *','select supportflow_private.dispatch_response_alerts();');
 end if;
end;
$schedule$;
commit;
