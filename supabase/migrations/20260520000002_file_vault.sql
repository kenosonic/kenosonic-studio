-- ============================================================
-- Keno Sonic OS — Document Vault (Phase 1)
-- Table: ks_file_vault
--
-- Named ks_file_vault (not "documents") because public.documents
-- already exists and stores JSONB client-portal document templates.
-- This table stores physical files uploaded to Supabase Storage
-- and synced to Google Drive.
--
-- FKs:
--   client_id  → ks_clients  (studio clients, not CRM clients)
--   project_id → ks_projects (studio projects, not CRM projects)
--   invoice_id → documents   (studio invoice documents, type = 'invoice')
-- ============================================================


-- ============================================================
-- 1. File Vault
-- ============================================================
create table if not exists public.ks_file_vault (
  id              uuid        primary key default gen_random_uuid(),
  entity          text        not null check (entity in ('keno_sonic', 'giggle_factory')),
  client_id       uuid        references public.ks_clients(id) on delete set null,
  project_id      uuid        references public.ks_projects(id) on delete set null,
  invoice_id      uuid        references public.documents(id) on delete set null,
  doc_type        text        not null check (doc_type in (
    'invoice', 'contract', 'statement', 'tax_return', 'proposal',
    'vat201', 'itr14', 'emp201', 'bank_statement',
    'tax_clearance', 'bbbee_certificate', 'cipc_certificate', 'other'
  )),
  tax_year        text,
  file_name       text        not null,
  file_path       text        not null,
  drive_file_id   text,
  drive_synced_at timestamptz,
  status          text        not null check (status in ('draft', 'final', 'signed')) default 'draft',
  tags            text[]      not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.ks_file_vault.file_name is
  'Canonical file name produced by nameFormatter — never allow free-text names.';
comment on column public.ks_file_vault.file_path is
  'Supabase Storage path: {entity}/{doc_type}/{tax_year}/{file_name}';
comment on column public.ks_file_vault.invoice_id is
  'FK to public.documents where type = ''invoice''. Set when a vault file was generated from a studio invoice.';


-- ============================================================
-- 2. Drive Sync Error Log
-- ============================================================
create table if not exists public.document_sync_errors (
  id            uuid        primary key default gen_random_uuid(),
  document_id   uuid        not null references public.ks_file_vault(id) on delete cascade,
  error_message text        not null,
  attempted_at  timestamptz not null default now(),
  resolved      boolean     not null default false
);


-- ============================================================
-- 3. Auto-update updated_at on ks_file_vault
-- ============================================================
create or replace function public.update_ks_file_vault_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ks_file_vault_updated_at on public.ks_file_vault;
create trigger ks_file_vault_updated_at
  before update on public.ks_file_vault
  for each row execute function public.update_ks_file_vault_updated_at();


-- ============================================================
-- 4. Row Level Security
-- ============================================================
alter table public.ks_file_vault        enable row level security;
alter table public.document_sync_errors enable row level security;

drop policy if exists "ks_file_vault_admin"         on public.ks_file_vault;
drop policy if exists "ks_file_vault_client_read"   on public.ks_file_vault;
drop policy if exists "ks_file_vault_client_insert" on public.ks_file_vault;
drop policy if exists "document_sync_errors_admin"  on public.document_sync_errors;

-- ks_file_vault: admins full access (reuses existing is_studio_admin helper)
create policy "ks_file_vault_admin" on public.ks_file_vault
  for all using (public.is_studio_admin());

-- ks_file_vault: clients can read docs linked to their own client record
create policy "ks_file_vault_client_read" on public.ks_file_vault
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and studio_role = 'client'
        and ks_client_id = public.ks_file_vault.client_id
    )
  );

-- ks_file_vault: clients can upload docs linked to their own client record
create policy "ks_file_vault_client_insert" on public.ks_file_vault
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and studio_role = 'client'
        and ks_client_id = public.ks_file_vault.client_id
    )
  );

-- document_sync_errors: admins only (service role bypasses RLS for writes)
create policy "document_sync_errors_admin" on public.document_sync_errors
  for all using (public.is_studio_admin());
