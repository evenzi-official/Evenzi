-- notifications_03_accept_event_invite
-- Invitees cannot SELECT/UPDATE event_collaborators (owner-only RLS).
-- These DEFINER RPCs are the accept path for /auth/accept-invite.

create or replace function public.get_pending_invite(p_token uuid)
returns table (
  id uuid,
  event_id uuid,
  event_name text,
  invited_email text,
  role text,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select c.id, c.event_id, e.name, c.invited_email, c.role, c.status
  from public.event_collaborators c
  join public.events e on e.id = c.event_id and e.deleted_at is null
  where c.id = p_token;
end;
$$;

revoke all on function public.get_pending_invite(uuid) from public;
grant execute on function public.get_pending_invite(uuid) to anon, authenticated;

create or replace function public.accept_event_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_collab_id uuid;
  v_event_id uuid;
  v_invited_email text;
  v_status text;
  v_event_name text;
  v_display text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  select c.id, c.event_id, c.invited_email, c.status
    into v_collab_id, v_event_id, v_invited_email, v_status
  from public.event_collaborators c
  where c.id = p_token;

  if v_collab_id is null then
    raise exception 'invalid invite';
  end if;

  if v_status = 'active' then
    return v_event_id;
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

  return v_event_id;
end;
$$;

revoke all on function public.accept_event_invite(uuid) from public;
grant execute on function public.accept_event_invite(uuid) to authenticated;
