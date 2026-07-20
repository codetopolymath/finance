-- Focus feature schema: tasks, focus_sessions, pause_events
-- Run this once in the Supabase SQL editor (SQL Editor -> New query -> paste -> Run).
-- Single-user app: RLS policies below just require an authenticated session,
-- mirroring the existing `transactions` table's policy shape.

create table if not exists tasks (
  id bigint generated always as identity primary key,
  title text not null check (char_length(trim(title)) > 0),
  notes text,
  status text not null default 'open' check (status in ('open', 'done', 'snoozed')),
  is_frog boolean not null default false,
  due_date date,
  snooze_count integer not null default 0,
  budget_minutes integer check (budget_minutes is null or budget_minutes > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists focus_sessions (
  id bigint generated always as identity primary key,
  task_id bigint not null references tasks (id) on delete cascade,
  kind text not null check (kind in ('work', 'break')),
  planned_minutes integer not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'running' check (status in ('running', 'paused', 'completed', 'abandoned'))
);

-- Structural single-tasking enforcement: at most one row across the whole
-- table may be running/paused at a time, not just one per task.
create unique index if not exists one_active_focus_session
  on focus_sessions ((true))
  where status in ('running', 'paused');

create table if not exists pause_events (
  id bigint generated always as identity primary key,
  session_id bigint not null references focus_sessions (id) on delete cascade,
  paused_at timestamptz not null default now(),
  resumed_at timestamptz,
  reason text not null check (reason in ('blocked', 'urgent', 'other')),
  note text
);

alter table tasks enable row level security;
alter table focus_sessions enable row level security;
alter table pause_events enable row level security;

create policy "authenticated full access" on tasks
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on focus_sessions
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on pause_events
  for all to authenticated using (true) with check (true);
