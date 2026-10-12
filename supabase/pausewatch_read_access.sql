-- Read-only access to the Pause watch app's data for the signed-in user.
-- Run once in the Supabase SQL editor (SQL Editor -> New query -> paste -> Run).
-- Then expose the schema: Project Settings -> API -> Exposed schemas -> add `pausewatch`.
--
-- Writes still come only from the watch's ingest endpoint, which bypasses RLS,
-- so this grants SELECT and nothing else. `anon` gets no access.

grant usage on schema pausewatch to authenticated;

grant select on pausewatch.brands to authenticated;
grant select on pausewatch.smoke_log to authenticated;
grant select on pausewatch.daily_summary to authenticated;

create policy "authenticated read" on pausewatch.brands
  for select to authenticated using (true);

-- Soft-deleted logs never reach the app, matching what daily_summary counts
create policy "authenticated read" on pausewatch.smoke_log
  for select to authenticated using (not deleted);

-- Run the view as the caller so it follows the policies above
alter view pausewatch.daily_summary set (security_invoker = true);
