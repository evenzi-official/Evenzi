-- collab_invite_01: widen notifications.type CHECK + notify_user_by_email + mark_collab_invite_notifications_read
-- Do NOT change _notify_event_recipients / notify_recipients allowlists.

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type = any (array[
    'rsvp_received'::text,
    'collaborator_added'::text,
    'expense_recorded'::text,
    'invites_sent'::text,
    'collab_invite_received'::text
  ]));

create or replace function public.mark_collab_invite_notifications_read(
  p_user_id uuid,
  p_event_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or p_event_id is null then
    return;
  end if;
  update public.notifications n
     set read_at = now(),
         updated_at = now()
   where n.user_id = p_user_id
     and n.event_id = p_event_id
     and n.type = 'collab_invite_received'
     and n.read_at is null;
end;
$$;

revoke all on function public.mark_collab_invite_notifications_read(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mark_collab_invite_notifications_read(uuid, uuid) to service_role;

create or replace function public.notify_user_by_email(
  p_event_id uuid,
  p_actor_id uuid,
  p_email text,
  p_title text,
  p_body text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invitee uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if v_uid is distinct from p_actor_id then
    raise exception 'actor mismatch';
  end if;
  if not public.can_write_event(p_event_id, 'admins') then
    raise exception 'not allowed';
  end if;
  if char_length(coalesce(p_title, '')) > 200 or char_length(coalesce(p_body, '')) > 500 then
    raise exception 'title/body too long';
  end if;
  if not exists (
    select 1 from public.event_collaborators c
    where c.event_id = p_event_id
      and c.status = 'pending'
      and lower(trim(c.invited_email)) = lower(trim(p_email))
  ) then
    raise exception 'no pending invite';
  end if;

  select u.id into v_invitee
  from auth.users u
  where lower(trim(u.email)) = lower(trim(p_email))
  limit 1;

  if v_invitee is null then
    return;
  end if;
  if v_invitee is not distinct from p_actor_id then
    return;
  end if;

  perform public.mark_collab_invite_notifications_read(v_invitee, p_event_id);

  insert into public.notifications (user_id, event_id, type, title, body, link_path)
  values (
    v_invitee,
    p_event_id,
    'collab_invite_received',
    left(p_title, 200),
    left(p_body, 500),
    null
  );
end;
$$;

revoke all on function public.notify_user_by_email(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.notify_user_by_email(uuid, uuid, text, text, text) to authenticated;
