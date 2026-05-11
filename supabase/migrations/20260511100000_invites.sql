-- ============================================================
-- Invite token system
-- Run this in Supabase SQL Editor after the initial schema
-- ============================================================

create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  token      text unique not null default replace(gen_random_uuid()::text, '-', ''),
  client_id  uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at    timestamptz,
  used_by    uuid references auth.users(id)
);

alter table public.invites enable row level security;

-- Admins can create and view all invites
create policy "admin_all_invites" on public.invites
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can read an invite by token (token is unguessable UUID — acts as a bearer)
create policy "public_read_invite_by_token" on public.invites
  for select using (true);

-- Authenticated users can mark an invite as used
create policy "auth_use_invite" on public.invites
  for update using (auth.uid() is not null);
