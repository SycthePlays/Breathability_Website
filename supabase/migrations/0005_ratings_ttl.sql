-- Walk ratings live for 24 hours.
--
-- Layer 1 (authoritative): the public read policy only exposes rows less
-- than 24h old — even a direct REST query with the anon key can't see
-- expired pins, no matter what the app code does.
drop policy if exists "Public read access" on walk_ratings;
create policy "Public read access" on walk_ratings
  for select using (created_at > now() - interval '24 hours');

-- Layer 2 (housekeeping): hourly pg_cron purge actually deletes expired
-- rows so the table doesn't grow forever. Best-effort — if pg_cron isn't
-- available on this instance, the RLS window above still hides expired
-- pins and this block just logs a notice instead of failing the migration.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'purge-expired-walk-ratings',
    '17 * * * *', -- minute 17 of every hour
    $job$ delete from walk_ratings where created_at < now() - interval '24 hours' $job$
  );
exception when others then
  raise notice 'pg_cron unavailable (%): relying on the RLS visibility window only', sqlerrm;
end $$;
