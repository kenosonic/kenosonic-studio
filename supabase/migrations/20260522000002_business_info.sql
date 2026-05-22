create table if not exists public.business_info (
  entity               text        primary key check (entity in ('keno_sonic', 'giggle_factory')),
  company_name         text        not null default '',
  trading_name         text        not null default '',
  registration_number  text        not null default '',
  vat_number           text        not null default '',
  tax_reference_number text        not null default '',
  registered_address   text        not null default '',
  postal_address       text        not null default '',
  contact_email        text        not null default '',
  contact_phone        text        not null default '',
  financial_year_end   text        not null default 'February',
  bbbee_level          text        not null default '',
  bank_name            text        not null default '',
  bank_account_number  text        not null default '',
  bank_branch_code     text        not null default '',
  notes                text        not null default '',
  updated_at           timestamptz not null default now()
);

alter table public.business_info enable row level security;

drop policy if exists "business_info_admin" on public.business_info;

create policy "business_info_admin" on public.business_info
  for all using (public.is_studio_admin()) with check (public.is_studio_admin());

-- Seed empty rows so upsert always finds an existing record
insert into public.business_info (entity) values ('keno_sonic'), ('giggle_factory')
  on conflict (entity) do nothing;
