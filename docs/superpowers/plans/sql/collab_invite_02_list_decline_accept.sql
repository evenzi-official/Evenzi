-- collab_invite_02: list_my_pending_invites, decline_event_invite, extend accept_event_invite,
-- owner-delete trigger to mark invite notifications read.

create or replace function public.list_my_pending_invites()
returns table (
  id uuid,
  event_id uuid,
  event_name text,
  role text,
  invited_at timestamptz,
  owner_display_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;

  if v_confirmed is null then
    raise exception 'email not confirmed';
  end if;
  if v_email is null or length(trim(v_email)) = 0 then
    return;
  end if;

  return query
  select
    c.id,
    c.event_id,
    e.name,
    c.role,
    c.invited_at,
    coalesce(nullif(trim(p.display_name), ''), split_part(ou.email, '@', 1), 'Host')
  from public.event_collaborators c
  join public.events e on e.id = c.event_id and e.deleted_at is null
  left join public.user_profiles p on p.id = e.user_id
  left join auth.users ou on ou.id = e.user_id
  where c.status = 'pending'
    and lower(trim(c.invited_email)) = lower(trim(v_email))
  order by c.invited_at desc;
end;
$$;

revoke all on function public.list_my_pending_invites() from public, anon;
grant execute on function public.list_my_pending_invites() to authenticated;

create or replace function public.decline_event_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_collab_id uuid;
  v_event_id uuid;
  v_invited_email text;
  v_status text;
  v_deleted_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;

  if v_confirmed is null then
    raise exception 'email not confirmed';
  end if;

  select c.id, c.event_id, c.invited_email, c.status, e.deleted_at
    into v_collab_id, v_event_id, v_invited_email, v_status, v_deleted_at
  from public.event_collaborators c
  join public.events e on e.id = c.event_id
  where c.id = p_token;

  if v_collab_id is null then
    raise exception 'invalid invite';
  end if;
  if v_deleted_at is not null then
    raise exception 'event deleted';
  end if;
  if v_status is distinct from 'pending' then
    raise exception 'not pending';
  end if;
  if lower(trim(coalesce(v_invited_email, ''))) is distinct from lower(trim(coalesce(v_email, ''))) then
    raise exception 'wrong account';
  end if;

  delete from public.event_collaborators
  where id = p_token
    and status = 'pending'
    and lower(trim(invited_email)) = lower(trim(v_email));

  if not found then
    raise exception 'invalid invite';
  end if;

  begin
    perform public.mark_collab_invite_notifications_read(v_uid, v_event_id);
  exception when others then
    raise warning 'decline_event_invite mark read failed: %', sqlerrm;
  end;

  return v_event_id;
end;
$$;

revoke all on function public.decline_event_invite(uuid) from public, anon;
grant execute on function public.decline_event_invite(uuid) to authenticated;

create or replace function public.accept_event_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_collab_id uuid;
  v_event_id uuid;
  v_invited_email text;
  v_status text;
  v_deleted_at timestamptz;
  v_event_name text;
  v_display text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;

  if v_confirmed is null then
    raise exception 'email not confirmed';
  end if;

  select c.id, c.event_id, c.invited_email, c.status, e.deleted_at
    into v_collab_id, v_event_id, v_invited_email, v_status, v_deleted_at
  from public.event_collaborators c
  join public.events e on e.id = c.event_id
  where c.id = p_token;

  if v_collab_id is null then
    raise exception 'invalid invite';
  end if;
  if v_deleted_at is not null then
    raise exception 'event deleted';
  end if;
  if v_status = 'active' then
    begin
      perform public.mark_collab_invite_notifications_read(v_uid, v_event_id);
    exception when others then
      null;
    end;
    return v_event_id;
  end if;
  if v_status is distinct from 'pending' then
    raise exception 'not pending';
  end if;
  if lower(trim(coalesce(v_invited_email, ''))) is distinct from lower(trim(coalesce(v_email, ''))) then
    raise exception 'wrong account';
  end if;

  update public.event_collaborators
    set status = 'active',
        user_id = v_uid,
        accepted_at = now(),
        updated_at = now()
  where id = p_token;

  select e.name into v_event_name from public.events e where e.id = v_event_id;
  select coalesce(nullif(trim(p.display_name), ''), v_email, 'A co-planner')
    into v_display
  from public.user_profiles p
  where p.id = v_uid;

  v_display := coalesce(v_display, v_email, 'A co-planner');

  begin
    perform public._notify_event_recipients(
      v_event_id,
      v_uid,
      'collaborator_added',
      left(v_display, 200),
      left(format('joined %s', coalesce(v_event_name, 'the event')), 500),
      '/events/' || v_event_id::text || '/settings/admins'
    );
  exception when others then
    raise warning 'accept_event_invite notify failed: %', sqlerrm;
  end;

  begin
    perform public.mark_collab_invite_notifications_read(v_uid, v_event_id);
  exception when others then
    raise warning 'accept_event_invite mark read failed: %', sqlerrm;
  end;

  return v_event_id;
end;
$$;

create or replace function public.trg_pending_collab_delete_mark_invite_read()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitee uuid;
begin
  if tg_op = 'DELETE' and old.status = 'pending' and old.invited_email is not null then
    select u.id into v_invitee
    from auth.users u
    where lower(trim(u.email)) = lower(trim(old.invited_email))
    limit 1;
    if v_invitee is not null then
      begin
        perform public.mark_collab_invite_notifications_read(v_invitee, old.event_id);
      exception when others then
        raise warning 'pending collab delete mark read failed: %', sqlerrm;
      end;
    end if;
  end if;
  return old;
end;
$$;

drop trigger if exists trg_pending_collab_delete_mark_invite_read on public.event_collaborators;
create trigger trg_pending_collab_delete_mark_invite_read
  after delete on public.event_collaborators
  for each row
  execute function public.trg_pending_collab_delete_mark_invite_read();

revoke all on function public.trg_pending_collab_delete_mark_invite_read() from public, anon, authenticated;
