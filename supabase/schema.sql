create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique default upper(encode(gen_random_bytes(5), 'hex')),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.bookmarks (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  url text not null,
  category_id text not null check (category_id in ('tmall', 'jd', 'dewu')),
  note text check (note is null or char_length(note) <= 200),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.bookmarks enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.my_workspaces()
returns table (id uuid, name text, invite_code text)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.name, w.invite_code
  from public.workspaces w
  join public.workspace_members m on m.workspace_id = w.id
  where m.user_id = auth.uid()
  order by m.joined_at;
$$;

create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if char_length(trim(workspace_name)) not between 1 and 40 then raise exception 'INVALID_NAME'; end if;
  insert into public.workspaces (name, owner_id) values (trim(workspace_name), auth.uid()) returning id into new_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create or replace function public.join_workspace(invite_code_input text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select id into target_id from public.workspaces where invite_code = upper(trim(invite_code_input));
  if target_id is null then raise exception 'INVALID_INVITE_CODE'; end if;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (target_id, auth.uid(), 'member') on conflict do nothing;
  return target_id;
end;
$$;

drop policy if exists "members can read workspaces" on public.workspaces;
create policy "members can read workspaces" on public.workspaces for select to authenticated
using (public.is_workspace_member(id));

drop policy if exists "members can read memberships" on public.workspace_members;
create policy "members can read memberships" on public.workspace_members for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "members can read bookmarks" on public.bookmarks;
create policy "members can read bookmarks" on public.bookmarks for select to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "members can add bookmarks" on public.bookmarks;
create policy "members can add bookmarks" on public.bookmarks for insert to authenticated
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "members can update bookmarks" on public.bookmarks;
create policy "members can update bookmarks" on public.bookmarks for update to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "members can delete bookmarks" on public.bookmarks;
create policy "members can delete bookmarks" on public.bookmarks for delete to authenticated
using (public.is_workspace_member(workspace_id));

revoke all on public.workspaces, public.workspace_members, public.bookmarks from anon;
revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.my_workspaces() from public, anon;
revoke all on function public.create_workspace(text) from public, anon;
revoke all on function public.join_workspace(text) from public, anon;
grant select on public.workspaces, public.workspace_members to authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.my_workspaces() to authenticated;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.join_workspace(text) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookmarks'
  ) then
    alter publication supabase_realtime add table public.bookmarks;
  end if;
end $$;
