-- compliance_items: per-entity checklist items (Companies Act, SARS, B-BBEE)
create table if not exists public.compliance_items (
  id              uuid        primary key default gen_random_uuid(),
  entity          text        not null check (entity in ('keno_sonic', 'giggle_factory')),
  section         text,
  title           text        not null,
  description     text        not null default '',
  category        text        not null check (category in ('companies_act', 'sars', 'bbbee', 'other')),
  status          text        not null default 'pending' check (status in ('done', 'pending', 'na')),
  linked_doc_type text,
  updated_at      timestamptz not null default now()
);

-- compliance_reminders: dated obligations with optional recurrence
create table if not exists public.compliance_reminders (
  id          uuid        primary key default gen_random_uuid(),
  entity      text        not null check (entity in ('keno_sonic', 'giggle_factory')),
  title       text        not null,
  due_date    date        not null,
  recurrence  text        not null default 'once' check (recurrence in ('annual', 'biannual', 'monthly', 'once')),
  category    text        not null check (category in ('sars', 'cipc', 'bbbee', 'other')),
  notified_at timestamptz,
  resolved    boolean     not null default false,
  notes       text
);

alter table public.compliance_items    enable row level security;
alter table public.compliance_reminders enable row level security;

drop policy if exists "compliance_items_admin"    on public.compliance_items;
drop policy if exists "compliance_reminders_admin" on public.compliance_reminders;

create policy "compliance_items_admin" on public.compliance_items
  for all using (public.is_studio_admin()) with check (public.is_studio_admin());

create policy "compliance_reminders_admin" on public.compliance_reminders
  for all using (public.is_studio_admin()) with check (public.is_studio_admin());

-- ─── Seed: compliance_items ───────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from public.compliance_items limit 1) then

    insert into public.compliance_items
      (entity, section, title, description, category, status, linked_doc_type)
    values

    -- ═══ KENO SONIC — Companies Act 71 of 2008 (24 items, Pty Ltd EME) ════════
    ('keno_sonic','MOI',    'Memorandum of Incorporation filed',
     'MOI lodged with CIPC at registration. Must be available on request to any shareholder or director.',
     'companies_act','done', null),
    ('keno_sonic','s66',    'Director appointments recorded',
     'All directors formally appointed and recorded. Register updated after each change.',
     'companies_act','done', null),
    ('keno_sonic','s69',    'Director eligibility confirmed',
     'All directors confirmed as not disqualified — no sequestration, fraud convictions, or prohibited persons.',
     'companies_act','done', null),
    ('keno_sonic','s70',    'Board vacancies filled',
     'Minimum 1 director maintained at all times. Any vacancy filled within 6 months.',
     'companies_act','done', null),
    ('keno_sonic','s22',    'Solvency & liquidity monitored',
     'The company must not trade when assets are less than liabilities or unable to pay debts as they fall due.',
     'companies_act','pending', null),
    ('keno_sonic','s24',    'Company records maintained',
     'Accurate records kept: MOI, shareholder register, minutes, resolutions, AFS — retained for at least 7 years.',
     'companies_act','pending', null),
    ('keno_sonic','s26',    'Records available for inspection',
     'Company records accessible to shareholders and directors on reasonable notice, at no charge.',
     'companies_act','pending', null),
    ('keno_sonic','s28',    'Accounting records up to date',
     'Accurate accounting records maintained for at least 7 years. Must reflect financial position fairly at all times.',
     'companies_act','pending', null),
    ('keno_sonic','s30',    'Annual financial statements prepared',
     'AFS prepared within 6 months of financial year-end. Must meet IFRS for SMEs or an equivalent framework.',
     'companies_act','pending', 'financial_statements'),
    ('keno_sonic','s33',    'CIPC annual return filed',
     'Annual return filed with CIPC within 30 days of registration anniversary. Failure triggers deregistration.',
     'companies_act','pending', 'cipc_certificate'),
    ('keno_sonic','s46',    'Distributions pass solvency test',
     'Every dividend or distribution requires the board to pass the solvency and liquidity test at the time.',
     'companies_act','pending', null),
    ('keno_sonic','s58',    'Shareholder meetings held',
     'At least one general meeting per year. Minutes recorded and stored for at least 7 years.',
     'companies_act','pending', null),
    ('keno_sonic','s61',    'Meeting notices correct',
     'Minimum 10 business days notice for general meetings (15 for AGM unless MOI provides otherwise).',
     'companies_act','pending', null),
    ('keno_sonic','s65',    'Written resolutions used appropriately',
     'Shareholders may resolve in writing without a meeting — all entitled shareholders must sign.',
     'companies_act','pending', null),
    ('keno_sonic','s75',    'Director interest disclosures made',
     'Directors disclose personal financial interests in any board matter and recuse themselves from the vote.',
     'companies_act','pending', null),
    ('keno_sonic','s76',    'Directors acting in good faith',
     'Directors act in the best interests of the company, with reasonable care and diligence (business judgment rule).',
     'companies_act','pending', null),
    ('keno_sonic','s77',    'Director liability awareness',
     'Directors aware of personal liability for gross negligence, wilful misconduct, or reckless trading.',
     'companies_act','pending', null),
    ('keno_sonic','s163',   'Shareholder rights protected',
     'Shareholder interests are not being oppressed or prejudiced in an unjust or inequitable manner.',
     'companies_act','pending', null),
    ('keno_sonic','Reg 27', 'Share register maintained',
     'Accurate register of all shareholders: name, address, shares held, and date of acquisition.',
     'companies_act','pending', null),
    ('keno_sonic','Reg 43', 'Company disclosure requirements met',
     'Company name, reg. number, and registered address appear on all official documents and correspondence.',
     'companies_act','pending', null),
    ('keno_sonic','s86',    'Company secretary appointment',
     'Not required — applicable to public companies only. Private companies are exempt.',
     'companies_act','na', null),
    ('keno_sonic','s90',    'Auditor appointment',
     'Not required — Pty Ltd EME (turnover < R10M) is exempt from mandatory audit.',
     'companies_act','na', null),
    ('keno_sonic','s92',    'Audit committee',
     'Not required for private companies without an appointed auditor.',
     'companies_act','na', null),
    ('keno_sonic','s94',    'Social & ethics committee',
     'Not required — public interest score below 500 points. Only state-owned companies and those above the threshold must comply.',
     'companies_act','na', null),

    -- ═══ KENO SONIC — SARS & Tax ════════════════════════════════════════════════
    ('keno_sonic', null, 'VAT201 returns filed',
     'Submit VAT201 bi-monthly via SARS eFiling. Due by the 25th of the month following the period end (30th if eFiling).',
     'sars','pending','vat201'),
    ('keno_sonic', null, 'EMP201 PAYE returns submitted',
     'Monthly PAYE, UIF, and SDL declarations. Due by the 7th of the month following the payroll period.',
     'sars','pending','emp201'),
    ('keno_sonic', null, 'EMP501 reconciliation filed',
     'Bi-annual payroll reconciliation (May mid-year and after Feb year-end). Submitted via eFiling.',
     'sars','pending', null),
    ('keno_sonic', null, 'IRP6 Provisional Tax — Period 1',
     'First provisional tax payment due 31 August. Based on estimated taxable income for the year.',
     'sars','pending','irp6'),
    ('keno_sonic', null, 'IRP6 Provisional Tax — Period 2',
     'Second (final) provisional tax payment due last day of February. Must be at least 90% of actual tax liability.',
     'sars','pending','irp6'),
    ('keno_sonic', null, 'ITR14 Income Tax Return',
     'Annual company income tax return. Due 12 months after financial year-end.',
     'sars','pending','itr14'),
    ('keno_sonic', null, 'Tax Clearance Certificate current',
     'Tax Clearance (Good Standing) is current and valid. Required for tenders, contracts, and SARS compliance.',
     'sars','pending','tax_clearance'),
    ('keno_sonic', null, 'UIF registration and contributions',
     'All employees registered for UIF. Monthly contributions declared with EMP201 and paid to SARS.',
     'sars','done', null),

    -- ═══ KENO SONIC — B-BBEE ════════════════════════════════════════════════════
    ('keno_sonic', null, 'B-BBEE affidavit / certificate current',
     'EME affidavit or B-BBEE certificate is current (renewed annually). Required for supplier qualification.',
     'bbbee','pending','bbbee_certificate'),

    -- ═══ GIGGLE FACTORY — Companies Act ════════════════════════════════════════
    ('giggle_factory','MOI',    'Memorandum of Incorporation filed',
     'MOI lodged with CIPC at registration. Must be available on request to any shareholder or director.',
     'companies_act','done', null),
    ('giggle_factory','s66',    'Director appointments recorded',
     'All directors formally appointed and recorded. Register updated after each change.',
     'companies_act','done', null),
    ('giggle_factory','s69',    'Director eligibility confirmed',
     'All directors confirmed as not disqualified — no sequestration, fraud convictions, or prohibited persons.',
     'companies_act','done', null),
    ('giggle_factory','s70',    'Board vacancies filled',
     'Minimum 1 director maintained at all times. Any vacancy filled within 6 months.',
     'companies_act','done', null),
    ('giggle_factory','s22',    'Solvency & liquidity monitored',
     'The company must not trade when assets are less than liabilities or unable to pay debts as they fall due.',
     'companies_act','pending', null),
    ('giggle_factory','s24',    'Company records maintained',
     'Accurate records kept: MOI, shareholder register, minutes, resolutions, AFS — retained for at least 7 years.',
     'companies_act','pending', null),
    ('giggle_factory','s26',    'Records available for inspection',
     'Company records accessible to shareholders and directors on reasonable notice, at no charge.',
     'companies_act','pending', null),
    ('giggle_factory','s28',    'Accounting records up to date',
     'Accurate accounting records maintained for at least 7 years. Must reflect financial position fairly at all times.',
     'companies_act','pending', null),
    ('giggle_factory','s30',    'Annual financial statements prepared',
     'AFS prepared within 6 months of financial year-end. Must meet IFRS for SMEs or an equivalent framework.',
     'companies_act','pending','financial_statements'),
    ('giggle_factory','s33',    'CIPC annual return filed',
     'Annual return filed with CIPC within 30 days of registration anniversary. Failure triggers deregistration.',
     'companies_act','pending','cipc_certificate'),
    ('giggle_factory','s46',    'Distributions pass solvency test',
     'Every dividend or distribution requires the board to pass the solvency and liquidity test at the time.',
     'companies_act','pending', null),
    ('giggle_factory','s58',    'Shareholder meetings held',
     'At least one general meeting per year. Minutes recorded and stored for at least 7 years.',
     'companies_act','pending', null),
    ('giggle_factory','s61',    'Meeting notices correct',
     'Minimum 10 business days notice for general meetings (15 for AGM unless MOI provides otherwise).',
     'companies_act','pending', null),
    ('giggle_factory','s65',    'Written resolutions used appropriately',
     'Shareholders may resolve in writing without a meeting — all entitled shareholders must sign.',
     'companies_act','pending', null),
    ('giggle_factory','s75',    'Director interest disclosures made',
     'Directors disclose personal financial interests in any board matter and recuse themselves from the vote.',
     'companies_act','pending', null),
    ('giggle_factory','s76',    'Directors acting in good faith',
     'Directors act in the best interests of the company, with reasonable care and diligence (business judgment rule).',
     'companies_act','pending', null),
    ('giggle_factory','s77',    'Director liability awareness',
     'Directors aware of personal liability for gross negligence, wilful misconduct, or reckless trading.',
     'companies_act','pending', null),
    ('giggle_factory','s163',   'Shareholder rights protected',
     'Shareholder interests are not being oppressed or prejudiced in an unjust or inequitable manner.',
     'companies_act','pending', null),
    ('giggle_factory','Reg 27', 'Share register maintained',
     'Accurate register of all shareholders: name, address, shares held, and date of acquisition.',
     'companies_act','pending', null),
    ('giggle_factory','Reg 43', 'Company disclosure requirements met',
     'Company name, reg. number, and registered address appear on all official documents and correspondence.',
     'companies_act','pending', null),
    ('giggle_factory','s86',    'Company secretary appointment',
     'Not required — applicable to public companies only. Private companies are exempt.',
     'companies_act','na', null),
    ('giggle_factory','s90',    'Auditor appointment',
     'Not required — Pty Ltd EME (turnover < R10M) is exempt from mandatory audit.',
     'companies_act','na', null),
    ('giggle_factory','s92',    'Audit committee',
     'Not required for private companies without an appointed auditor.',
     'companies_act','na', null),
    ('giggle_factory','s94',    'Social & ethics committee',
     'Not required — public interest score below 500 points. Only state-owned companies and those above the threshold must comply.',
     'companies_act','na', null),

    -- ═══ GIGGLE FACTORY — SARS & Tax ════════════════════════════════════════════
    ('giggle_factory', null, 'VAT201 returns filed',
     'Submit VAT201 bi-monthly via SARS eFiling. Due by the 25th of the month following the period end.',
     'sars','pending','vat201'),
    ('giggle_factory', null, 'EMP201 PAYE returns submitted',
     'Monthly PAYE, UIF, and SDL declarations. Due by the 7th of the following month.',
     'sars','pending','emp201'),
    ('giggle_factory', null, 'EMP501 reconciliation filed',
     'Bi-annual payroll reconciliation (May mid-year and after Feb year-end).',
     'sars','pending', null),
    ('giggle_factory', null, 'IRP6 Provisional Tax — Period 1',
     'First provisional tax payment due 31 August.',
     'sars','pending','irp6'),
    ('giggle_factory', null, 'IRP6 Provisional Tax — Period 2',
     'Second (final) provisional tax payment due last day of February.',
     'sars','pending','irp6'),
    ('giggle_factory', null, 'ITR14 Income Tax Return',
     'Annual company income tax return. Due 12 months after financial year-end.',
     'sars','pending','itr14'),
    ('giggle_factory', null, 'Tax Clearance Certificate current',
     'Tax Clearance (Good Standing) is current and valid.',
     'sars','pending','tax_clearance'),
    ('giggle_factory', null, 'UIF registration and contributions',
     'All employees registered for UIF. Monthly contributions declared and paid.',
     'sars','done', null),

    -- ═══ GIGGLE FACTORY — B-BBEE ════════════════════════════════════════════════
    ('giggle_factory', null, 'B-BBEE affidavit / certificate current',
     'EME affidavit or B-BBEE certificate is current (renewed annually).',
     'bbbee','pending','bbbee_certificate');

  end if;
end $$;

-- ─── Seed: compliance_reminders ──────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from public.compliance_reminders limit 1) then

    insert into public.compliance_reminders
      (entity, title, due_date, recurrence, category, notes)
    values
    -- ═══ KENO SONIC ══════════════════════════════════════════════════════════════
    ('keno_sonic','CIPC Annual Return',                    '2026-06-30','annual',   'cipc', 'File within 30 days of company registration anniversary. Confirm exact date from CIPC account.'),
    ('keno_sonic','VAT201 — Apr/May 2026',                 '2026-06-25','monthly',  'sars', 'VAT return for the April–May 2026 bi-monthly period. Due 25th or 30th if eFiling.'),
    ('keno_sonic','VAT201 — Jun/Jul 2026',                 '2026-08-25','monthly',  'sars', 'VAT return for the June–July 2026 period.'),
    ('keno_sonic','IRP6 Provisional Tax — Period 1',       '2026-08-31','biannual', 'sars', 'First provisional tax payment. Based on estimated taxable income.'),
    ('keno_sonic','EMP501 Mid-Year Reconciliation',        '2026-09-01','biannual', 'sars', 'Mid-year payroll reconciliation. Check SARS eFiling for the current filing window.'),
    ('keno_sonic','VAT201 — Aug/Sep 2026',                 '2026-10-25','monthly',  'sars', 'VAT return for the August–September 2026 period.'),
    ('keno_sonic','VAT201 — Oct/Nov 2026',                 '2026-12-25','monthly',  'sars', 'VAT return for the October–November 2026 period.'),
    ('keno_sonic','B-BBEE Affidavit Renewal',              '2026-12-31','annual',   'bbbee','Annual EME affidavit renewal. Renew with a SANAS-accredited agent or sworn affidavit.'),
    ('keno_sonic','Tax Clearance Certificate Renewal',     '2027-01-31','annual',   'sars', 'Renew before expiry. Good Standing certificate is valid for 1 year from issue date.'),
    ('keno_sonic','VAT201 — Dec 2026/Jan 2027',            '2027-02-25','monthly',  'sars', 'VAT return for the December 2026–January 2027 period.'),
    ('keno_sonic','IRP6 Provisional Tax — Period 2',       '2027-02-28','biannual', 'sars', 'Second (final) provisional tax payment. Must be at least 90% of actual tax liability.'),
    ('keno_sonic','ITR14 Income Tax Return',                '2027-02-28','annual',   'sars', 'Annual company income tax return, due 12 months after financial year-end.'),
    ('keno_sonic','EMP501 Annual Reconciliation',          '2027-05-31','annual',   'sars', 'Annual payroll reconciliation after February year-end.'),
    -- ═══ GIGGLE FACTORY ══════════════════════════════════════════════════════════
    ('giggle_factory','IRP6 Provisional Tax — Period 1',   '2026-08-31','biannual', 'sars', 'First provisional tax payment.'),
    ('giggle_factory','CIPC Annual Return',                 '2026-07-31','annual',   'cipc', 'File within 30 days of registration anniversary.'),
    ('giggle_factory','B-BBEE Affidavit Renewal',          '2026-12-31','annual',   'bbbee','Annual EME affidavit renewal.'),
    ('giggle_factory','IRP6 Provisional Tax — Period 2',   '2027-02-28','biannual', 'sars', 'Second provisional tax payment.'),
    ('giggle_factory','ITR14 Income Tax Return',            '2027-02-28','annual',   'sars', 'Annual income tax return.');

  end if;
end $$;
