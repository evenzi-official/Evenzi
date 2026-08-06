-- notifications_02_submit_rsvp_notify
-- Amends live public.submit_rsvp to call _notify_event_recipients after a successful RSVP update.
-- Requires notifications_01 applied first.
-- Apply via Supabase MCP apply_migration OR SQL editor.

create or replace function public.submit_rsvp(
  p_token text,
  p_sub_event_id uuid,
  p_response_status text,
  p_plus_one_count integer default null,
  p_dietary_notes text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest_id uuid;
  v_event_id uuid;
  v_guest_name text;
  v_sub_label text;
  v_title text;
  v_body text;
begin
  select gt.guest_id, gt.event_id
    into v_guest_id, v_event_id
  from public.guest_tokens gt
  where gt.token = p_token
    and (gt.expires_at is null or gt.expires_at > now());

  if v_guest_id is null then
    raise exception 'invalid session';
  end if;

  if not exists (
    select 1 from public.event_guest_sub_events
    where guest_id = v_guest_id
      and sub_event_id = p_sub_event_id
      and event_id = v_event_id
  ) then
    raise exception 'guest is not tagged to this sub-event';
  end if;

  update public.event_guest_sub_events
    set response_status = p_response_status,
        plus_one_count = p_plus_one_count,
        dietary_notes = p_dietary_notes,
        responded_at = now()
  where guest_id = v_guest_id
    and sub_event_id = p_sub_event_id;

  select g.name into v_guest_name from public.event_guests g where g.id = v_guest_id;
  select coalesce(nullif(trim(se.custom_name), ''), est.name, 'the event')
    into v_sub_label
  from public.event_sub_events se
  left join config.event_sub_types est on est.id = se.event_sub_type_id
  where se.id = p_sub_event_id;

  v_title := coalesce(nullif(trim(v_guest_name), ''), 'A guest');
  v_body := format('%s for %s', coalesce(p_response_status, 'responded'), coalesce(v_sub_label, 'the event'));

  begin
    perform public._notify_event_recipients(
      v_event_id,
      null, -- guest actor: notify all hosts/co-hosts
      'rsvp_received',
      left(v_title, 200),
      left(v_body, 500),
      '/events/' || v_event_id::text || '/guests'
    );
  exception when others then
    -- never fail the RSVP because notify failed
    raise warning 'submit_rsvp notify failed: %', sqlerrm;
  end;
end;
$$;

revoke all on function public.submit_rsvp(text, uuid, text, integer, text) from public;
grant execute on function public.submit_rsvp(text, uuid, text, integer, text) to anon, authenticated;
