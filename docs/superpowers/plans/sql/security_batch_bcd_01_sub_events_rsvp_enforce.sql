-- security_batch_bcd_01_sub_events_collab_write + submit_rsvp guest-settings
-- Platform truth audit Stage 2 Batches B/C/D companion SQL:
--   P1-5: allow co-hosts (website write) to UPDATE event_sub_events.show_on_website
--   P1-7: enforce rsvp_enabled + max_plus_ones_per_invite in submit_rsvp

-- ── event_sub_events collab UPDATE (website capability) ─────────────────────
drop policy if exists collab_update_sub_events_website on public.event_sub_events;
create policy collab_update_sub_events_website
  on public.event_sub_events
  for update
  to authenticated
  using (public.can_write_event(event_id, 'website'))
  with check (public.can_write_event(event_id, 'website'));

-- ── submit_rsvp: rsvp_enabled + plus-one cap ────────────────────────────────
create or replace function public.submit_rsvp(
  p_token text,
  p_sub_event_id uuid,
  p_response_status text,
  p_plus_one_count integer default null,
  p_dietary_notes text default null
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_guest_id uuid;
  v_event_id uuid;
  v_guest_name text;
  v_sub_label text;
  v_title text;
  v_body text;
  v_rsvp_enabled boolean;
  v_allow_plus boolean;
  v_max_plus integer;
  v_collect_dietary boolean;
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

  select
    coalesce(gs.rsvp_enabled, true),
    coalesce(gs.allow_plus_ones, false),
    coalesce(gs.max_plus_ones_per_invite, 0),
    coalesce(gs.collect_dietary_notes, false)
  into v_rsvp_enabled, v_allow_plus, v_max_plus, v_collect_dietary
  from public.event_guest_settings gs
  where gs.event_id = v_event_id;

  -- Fail closed if settings row missing: treat RSVP as disabled
  if not found then
    v_rsvp_enabled := false;
    v_allow_plus := false;
    v_max_plus := 0;
    v_collect_dietary := false;
  end if;

  if v_rsvp_enabled is not true then
    raise exception 'rsvp_disabled';
  end if;

  if p_plus_one_count is not null then
    if v_allow_plus is not true then
      raise exception 'plus_ones_not_allowed';
    end if;
    if p_plus_one_count < 0 or p_plus_one_count > v_max_plus then
      raise exception 'plus_ones_over_limit';
    end if;
  end if;

  if p_dietary_notes is not null then
    if v_collect_dietary is not true then
      raise exception 'dietary_not_collected';
    end if;
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
      null,
      'rsvp_received',
      left(v_title, 200),
      left(v_body, 500),
      '/events/' || v_event_id::text || '/guests'
    );
  exception when others then
    raise warning 'submit_rsvp notify failed: %', sqlerrm;
  end;
end;
$function$;

revoke all on function public.submit_rsvp(text, uuid, text, integer, text) from public;
grant execute on function public.submit_rsvp(text, uuid, text, integer, text) to anon, authenticated;
