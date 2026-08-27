-- Goals feature schema: life/financial milestone checklist.
-- Run this once in the Supabase SQL editor (SQL Editor -> New query -> paste -> Run).
-- Single-user app: RLS policy just requires an authenticated session,
-- mirroring focus_schema.sql's `tasks` table.

create table if not exists goals (
  id bigint generated always as identity primary key,
  title text not null check (char_length(trim(title)) > 0),
  why text,
  status text not null default 'active' check (status in ('active', 'done')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table goals enable row level security;

create policy "authenticated full access" on goals
  for all to authenticated using (true) with check (true);

-- Optional folders for organizing goals. A goal with a null group_id is
-- ungrouped and shown as a standalone item — folders are opt-in, not required.
create table if not exists goal_groups (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table goal_groups enable row level security;

create policy "authenticated full access" on goal_groups
  for all to authenticated using (true) with check (true);

alter table goals add column if not exists group_id bigint references goal_groups(id) on delete set null;
