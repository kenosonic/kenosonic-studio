import { supabase } from '../supabase'
import { taxYearMonths } from '../documents/taxYear'
import type { VaultDocType, VaultEntity } from '../documents/nameFormatter'

export type CheckStatus = 'ok' | 'missing' | 'partial'

export interface VaultFile {
  id: string
  doc_type: VaultDocType
  file_name: string
  file_path: string
  drive_file_id: string | null
  tax_year: string | null
  tags: string[]
  created_at: string
}

export interface ChecklistItem {
  id: string
  label: string
  description: string
  docType: VaultDocType
  status: CheckStatus
  files: VaultFile[]
  /** For bank statements — which months are missing */
  missingMonths?: string[]
}

export interface SarsChecklist {
  taxYear: string
  entity: VaultEntity
  items: ChecklistItem[]
  score: { done: number; total: number }
}

// SARS-required document categories for a SA Pty Ltd
const CHECKLIST_TEMPLATE: Array<{
  id: string
  label: string
  description: string
  docType: VaultDocType
  monthlyCheck?: boolean
}> = [
  {
    id: 'itr14',
    label: 'ITR14 Annual Return',
    description: 'Company income tax return filed with SARS',
    docType: 'itr14',
  },
  {
    id: 'vat201',
    label: 'VAT201 Returns',
    description: 'Monthly or bi-monthly VAT returns filed with SARS',
    docType: 'vat201',
  },
  {
    id: 'emp201',
    label: 'EMP201 / EMP501',
    description: 'Payroll tax returns (if employees are on payroll)',
    docType: 'emp201',
  },
  {
    id: 'bank_statement',
    label: 'Bank Statements (12 months)',
    description: 'All 12 months for the tax year — March through February',
    docType: 'bank_statement',
    monthlyCheck: true,
  },
  {
    id: 'tax_clearance',
    label: 'Tax Clearance Certificate',
    description: 'Valid SARS tax clearance certificate',
    docType: 'tax_clearance',
  },
  {
    id: 'invoices',
    label: 'Invoices Issued',
    description: 'All sales invoices issued during the tax year',
    docType: 'invoice',
  },
  {
    id: 'statements',
    label: 'Supplier Statements',
    description: 'Supplier/expense statements received during the tax year',
    docType: 'statement',
  },
]

/**
 * Builds the SARS compliance checklist for a given entity and tax year.
 * Queries ks_file_vault to determine which documents are on file.
 */
export async function getSarsChecklist(
  entity: VaultEntity,
  taxYear: string,
): Promise<SarsChecklist> {
  const { data: files, error } = await supabase
    .from('ks_file_vault')
    .select('id, doc_type, file_name, file_path, drive_file_id, tax_year, tags, created_at')
    .eq('entity', entity)
    .eq('tax_year', taxYear)

  if (error) throw new Error(`Failed to load vault for checklist: ${error.message}`)

  const vaultFiles = (files ?? []) as VaultFile[]
  const byType = new Map<VaultDocType, VaultFile[]>()
  for (const f of vaultFiles) {
    const arr = byType.get(f.doc_type) ?? []
    arr.push(f)
    byType.set(f.doc_type, arr)
  }

  const requiredMonths = taxYearMonths(taxYear) // 12 months, March→February

  const items: ChecklistItem[] = CHECKLIST_TEMPLATE.map(tmpl => {
    const found = byType.get(tmpl.docType) ?? []

    if (tmpl.monthlyCheck) {
      // Bank statements: check each month individually using tags or file_name
      const coveredMonths = new Set<string>()
      for (const f of found) {
        // Expect a tag like '2025-03' or the file name to contain the month
        for (const m of requiredMonths) {
          if (f.tags.includes(m) || f.file_name.includes(m)) {
            coveredMonths.add(m)
          }
        }
      }
      const missingMonths = requiredMonths.filter(m => !coveredMonths.has(m))
      const status: CheckStatus =
        missingMonths.length === 0 ? 'ok'
        : missingMonths.length < requiredMonths.length ? 'partial'
        : 'missing'

      return { ...tmpl, status, files: found, missingMonths }
    }

    const status: CheckStatus = found.length > 0 ? 'ok' : 'missing'
    return { ...tmpl, status, files: found }
  })

  const done  = items.filter(i => i.status === 'ok').length
  const total = items.length

  return { taxYear, entity, items, score: { done, total } }
}

/** Month string '2025-03' → human-readable 'March 2025' */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
}
