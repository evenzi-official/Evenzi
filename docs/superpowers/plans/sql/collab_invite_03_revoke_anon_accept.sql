-- collab_invite_03: accept_event_invite is authenticated-only (requires auth.uid + email_confirmed)
revoke all on function public.accept_event_invite(uuid) from public, anon;
grant execute on function public.accept_event_invite(uuid) to authenticated;
