-- notifications_01_table_and_rpc
-- Apply via Supabase MCP apply_migration OR SQL editor on project smjkbmkxweevqpvygabe
-- Then: get_advisors(security); regenerate lib/supabase/database.types.ts; update DATA-MODEL.md

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null check (type in ('rsvp_received','collaborator_added','expense_recorded','invites_sent')),
  title text not null,
  body text not null,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_notifications_user_recent on public.notifications(user_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;
alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create trigger trg_notifications_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

create or replace function public._notify_event_recipients(
  p_event_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_path text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_type not in ('rsvp_received','collaborator_added','expense_recorded','invites_sent') then
    raise exception 'invalid notification type';
  end if;
  if p_link_path is not null and p_link_path !~ '^/events/[0-9a-f-]{36}(/[a-zA-Z0-9/_-]*)?$' then
    raise exception 'invalid link_path';
  end if;
  if char_length(p_title) > 200 or char_length(p_body) > 500 then
    raise exception 'title/body too long';
  end if;
  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.deleted_at is null
  ) then
    return;
  end if;

  insert into public.notifications (user_id, event_id, type, title, body, link_path)
  select r.uid, p_event_id, p_type, p_title, p_body, p_link_path
  from (
    select e.user_id as uid from public.events e where e.id = p_event_id
    union
    select c.user_id from public.event_collaborators c
      where c.event_id = p_event_id and c.status = 'active' and c.user_id is not null
  ) r
  where r.uid is distinct from p_actor_id;
end;
$$;

revoke all on function public._notify_event_recipients(uuid,uuid,text,text,text,text) from public, anon, authenticated;

create or replace function public.notify_recipients(
  p_event_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link_path text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is distinct from p_actor_id then
    raise exception 'actor mismatch';
  end if;
  if not exists (
    select 1 from public.events e
    where e.id = p_event_id and e.deleted_at is null
      and (
        e.user_id = (select auth.uid())
        or exists (
          select 1 from public.event_collaborators c
          where c.event_id = p_event_id and c.user_id = (select auth.uid()) and c.status = 'active'
        )
      )
  ) then
    raise exception 'not allowed';
  end if;
  perform public._notify_event_recipients(p_event_id, p_actor_id, p_type, p_title, p_body, p_link_path);
end;
$$;

revoke all on function public.notify_recipients(uuid,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.notify_recipients(uuid,uuid,text,text,text,text) to authenticated;
