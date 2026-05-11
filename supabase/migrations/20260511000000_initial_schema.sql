-- ============================================================
-- Keno Sonic Studio OS — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Profiles (extends auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'client')) default 'client',
  client_id  uuid,
  full_name  text not null default ''
);

-- 2. Clients
create table if not exists public.clients (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  created_by          uuid references public.profiles(id),
  company_name        text not null,
  contact_name        text not null,
  contact_email       text not null,
  contact_phone       text,
  address_line1       text not null default '',
  address_line2       text,
  city                text not null default '',
  province            text not null default '',
  country             text not null default 'ZA',
  registration_number text,
  vat_number          text,
  industry            text not null default '',
  logo_url            text,
  notes               text,
  status              text not null check (status in ('active', 'inactive')) default 'active'
);

-- 3. Projects
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  name         text not null,
  service_type text not null check (service_type in (
    'web','digital_marketing','brand','google_ads','social_media',
    'seo','copywriting','custom_dev','plugins','bpa','other'
  )),
  status       text not null check (status in ('prospect','active','completed','paused')) default 'prospect',
  start_date   date,
  end_date     date,
  value        numeric(12,2),
  notes        text
);

-- 4. Documents
create table if not exists public.documents (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete set null,
  type             text not null check (type in (
    'invoice','quote','proposal','contract','report','audit','email','offboarding'
  )),
  title            text not null,
  status           text not null check (status in (
    'draft','sent','viewed','approved','signed','rejected'
  )) default 'draft',
  content          jsonb not null default '{}',
  reference_number text not null,
  sent_at          timestamptz,
  viewed_at        timestamptz,
  approved_at      timestamptz,
  signed_at        timestamptz,
  created_by       uuid references public.profiles(id)
);

-- 5. Signatures
create table if not exists public.document_signatures (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.documents(id) on delete cascade,
  signer_name     text not null,
  signer_email    text not null,
  signed_at       timestamptz not null default now(),
  signature_value text not null
);

-- ============================================================
-- Auto-update updated_at on documents
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at();

-- ============================================================
-- Auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles           enable row level security;
alter table public.clients            enable row level security;
alter table public.projects           enable row level security;
alter table public.documents          enable row level security;
alter table public.document_signatures enable row level security;

-- Profiles: users see their own row
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id);

-- Admins: full access (role = admin)
create policy "admin_all_clients" on public.clients
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_all_projects" on public.projects
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_all_documents" on public.documents
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_all_signatures" on public.document_signatures
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Clients: see only their own data
create policy "client_own_data" on public.clients
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and client_id = public.clients.id)
  );

create policy "client_own_documents" on public.documents
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and client_id = public.documents.client_id)
  );

create policy "client_insert_signature" on public.document_signatures
  for insert with check (
    exists (
      select 1 from public.documents d
      join public.profiles p on p.client_id = d.client_id
      where d.id = document_id and p.id = auth.uid()
    )
  );

create policy "client_update_own_doc_status" on public.documents
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and client_id = public.documents.client_id)
  );

-- ============================================================
-- AFTER RUNNING THIS:
-- 1. Go to Authentication → Users → Create your admin user
-- 2. In SQL Editor run:
--    update public.profiles set role = 'admin', full_name = 'Your Name'
--    where id = '<your-user-uuid>';
-- ============================================================
