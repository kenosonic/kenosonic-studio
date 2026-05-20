-- ============================================================
-- Kenosonic Studio OS — Migration onto existing CRM Supabase
-- Target: https://wertdeqojkznnzohcflv.supabase.co
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- Strategy: Studio tables are prefixed ks_ to avoid conflicts
-- with the CRM's existing clients/projects tables.
-- ks_clients.crm_lead_id links to CRM leads for onboarding.
-- ============================================================


-- ============================================================
-- 1. Extend existing CRM profiles with Studio columns
--    CRM already has: id, full_name, email, role, avatar_url,
--    department, status
-- ============================================================
alter table public.profiles
  add column if not exists studio_role  text check (studio_role in ('admin', 'client')),
  add column if not exists ks_client_id uuid;
-- FK to ks_clients added after that table is created (below)


-- ============================================================
-- 2. Studio Clients
--    crm_lead_id → links to a CRM lead so you can onboard
--    an existing website inquiry directly.
-- ============================================================
create table if not exists public.ks_clients (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  created_by          uuid references public.profiles(id),
  crm_lead_id         uuid references public.leads(id) on delete set null,
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

-- Now safe to add the FK back on profiles
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_ks_client_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_ks_client_id_fkey
      foreign key (ks_client_id) references public.ks_clients(id) on delete set null;
  end if;
end;
$$;


-- ============================================================
-- 3. Studio Projects
-- ============================================================
create table if not exists public.ks_projects (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  client_id    uuid not null references public.ks_clients(id) on delete cascade,
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


-- ============================================================
-- 4. Documents
--    Includes completed_at from migration 20260513
-- ============================================================
create table if not exists public.documents (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  client_id        uuid not null references public.ks_clients(id) on delete cascade,
  project_id       uuid references public.ks_projects(id) on delete set null,
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
  completed_at     timestamptz,
  created_by       uuid references public.profiles(id)
);


-- ============================================================
-- 5. Document Signatures
-- ============================================================
create table if not exists public.document_signatures (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references public.documents(id) on delete cascade,
  signer_name     text not null,
  signer_email    text not null,
  signed_at       timestamptz not null default now(),
  signature_value text not null
);


-- ============================================================
-- 6. Invite Tokens
-- ============================================================
create table if not exists public.ks_invites (
  id         uuid primary key default gen_random_uuid(),
  token      text unique not null default replace(gen_random_uuid()::text, '-', ''),
  client_id  uuid not null references public.ks_clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at    timestamptz,
  used_by    uuid references auth.users(id)
);


-- ============================================================
-- 7. Functions & Triggers
-- ============================================================

-- Auto-update updated_at on documents
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at();

-- Auto-create profile on user signup.
-- CRM may already have this trigger — using ON CONFLICT DO NOTHING is safe.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;


-- ============================================================
-- 8. Row Level Security
-- ============================================================
alter table public.ks_clients          enable row level security;
alter table public.ks_projects         enable row level security;
alter table public.documents           enable row level security;
alter table public.document_signatures enable row level security;
alter table public.ks_invites          enable row level security;

-- Helper: is the current user a Studio admin?
create or replace function public.is_studio_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and studio_role = 'admin'
  )
$$;

-- ks_clients: admins full access; clients read their own record
create policy "ks_clients_admin" on public.ks_clients
  for all using (public.is_studio_admin());

create policy "ks_clients_self" on public.ks_clients
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ks_client_id = public.ks_clients.id
    )
  );

-- ks_projects: admins only (clients don't browse projects directly)
create policy "ks_projects_admin" on public.ks_projects
  for all using (public.is_studio_admin());

create policy "ks_projects_client" on public.ks_projects
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ks_client_id = public.ks_projects.client_id
    )
  );

-- documents
create policy "documents_admin" on public.documents
  for all using (public.is_studio_admin());

create policy "client_own_documents" on public.documents
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ks_client_id = public.documents.client_id
    )
  );

create policy "client_update_own_doc_status" on public.documents
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and ks_client_id = public.documents.client_id
    )
  );

-- document_signatures
create policy "signatures_admin" on public.document_signatures
  for all using (public.is_studio_admin());

create policy "client_insert_signature" on public.document_signatures
  for insert with check (
    exists (
      select 1 from public.documents d
      join public.profiles p on p.ks_client_id = d.client_id
      where d.id = document_id and p.id = auth.uid()
    )
  );

-- ks_invites
create policy "ks_invites_admin" on public.ks_invites
  for all using (public.is_studio_admin());

-- Anyone can read an invite by token (unguessable UUID acts as bearer)
create policy "ks_invites_public_read" on public.ks_invites
  for select using (true);

create policy "ks_invites_auth_use" on public.ks_invites
  for update using (auth.uid() is not null);


-- ============================================================
-- 9. Convenience view: CRM leads ready to onboard
--    Surfaces unlinked leads so the onboard UI can pick them.
-- ============================================================
create or replace view public.ks_available_leads as
select
  l.id,
  l.business_name                          as company_name,
  coalesce(l.contact_person, l.name)       as contact_name,
  l.email                                  as contact_email,
  l.phone                                  as contact_phone,
  l.industry,
  l.website,
  l.address,
  l.notes,
  l.sales_stage,
  l.service_interest,
  l.created_at
from public.leads l
where not exists (
  select 1 from public.ks_clients c where c.crm_lead_id = l.id
)
order by l.created_at desc;


-- ============================================================
-- AFTER RUNNING THIS SQL:
--
-- 1. Update your .env:
--      VITE_SUPABASE_URL=https://wertdeqojkznnzohcflv.supabase.co
--      VITE_SUPABASE_ANON_KEY=<anon key from new project settings>
--
-- 2. Set your admin user:
--      update public.profiles
--      set studio_role = 'admin', full_name = 'Your Name'
--      where id = '<your-auth-user-uuid>';
--
-- 3. Update Studio app table references:
--      clients       → ks_clients
--      projects      → ks_projects
--      invites       → ks_invites
--      profiles.role → profiles.studio_role
--      profiles.client_id → profiles.ks_client_id
-- ============================================================
