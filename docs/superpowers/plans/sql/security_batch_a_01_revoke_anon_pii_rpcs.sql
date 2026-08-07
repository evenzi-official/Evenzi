-- security_batch_a_01_revoke_anon_pii_rpcs
-- Platform truth audit Stage 2 Batch A:
--   P0-1: revoke anon EXECUTE on get_pending_invite (invite email PII via PostgREST)
--   P1-9: revoke anon EXECUTE on hash_website_password (CPU DoS)
-- Logged-out /auth/accept-invite preview uses service_role server-side and redacts email in UI.

revoke all on function public.get_pending_invite(uuid) from public;
revoke all on function public.get_pending_invite(uuid) from anon;
grant execute on function public.get_pending_invite(uuid) to authenticated, service_role;

revoke all on function public.hash_website_password(text) from public;
revoke all on function public.hash_website_password(text) from anon;
grant execute on function public.hash_website_password(text) to authenticated, service_role;
