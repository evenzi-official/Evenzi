-- notifications_04_push_subscriptions
-- Phase B: push_subscriptions + push_dispatch_log + get_push_delivery_targets

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_push_subscriptions_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_own on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger trg_push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

create table public.push_dispatch_log (
  notification_id uuid primary key references public.notifications(id) on delete cascade,
  dispatched_at timestamptz not null default now()
);
alter table public.push_dispatch_log enable row level security;
-- no client policies — service / DEFINER only

create or replace function public.get_push_delivery_targets(p_user_id uuid)
returns table (
  endpoint text,
  p256dh text,
  auth_key text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_preferences up
    where up.user_id = p_user_id and up.push_notifications = true
  ) then
    return;
  end if;

  return query
  select s.endpoint, s.p256dh, s.auth_key
  from public.push_subscriptions s
  where s.user_id = p_user_id;
end;
$$;

revoke all on function public.get_push_delivery_targets(uuid) from public, anon, authenticated;
grant execute on function public.get_push_delivery_targets(uuid) to service_role;
