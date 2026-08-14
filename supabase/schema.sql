create extension if not exists pgcrypto;

create table if not exists statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position integer not null default 0,
  color text not null default '#6b7280',
  created_at timestamptz not null default now()
  );

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  project text default '',
  assignee text default '',
  deadline date,
  urgent boolean not null default false,
  status_id uuid references statuses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  );

create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  action text not null,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
  );

insert into statuses (name, position, color)
select * from (values
  ('Nou', 0, '#64748b'),
  ('În lucru', 1, '#3b82f6'),
  ('Blocat', 2, '#ef4444'),
  ('Parțial finalizat', 3, '#eab308'),
  ('Gata', 4, '#22c55e')
  ) as seed(name, position, color)
where not exists (select 1 from statuses);

alter table statuses enable row level security;
alter table tasks enable row level security;
alter table task_activity enable row level security;

drop policy if exists "allow all statuses" on statuses;
drop policy if exists "allow all tasks" on tasks;
drop policy if exists "allow all activity" on task_activity;

create policy "allow all statuses" on statuses for all using (true) with check (true);
create policy "allow all tasks" on tasks for all using (true) with check (true);
create policy "allow all activity" on task_activity for all using (true) with check (true);
