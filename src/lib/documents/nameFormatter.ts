export type VaultDocType =
  | 'invoice' | 'contract' | 'statement' | 'tax_return' | 'proposal'
  | 'vat201' | 'itr14' | 'emp201' | 'bank_statement'
  | 'tax_clearance' | 'bbbee_certificate' | 'cipc_certificate' | 'other'

export type VaultEntity = 'keno_sonic' | 'giggle_factory'
export type VaultStatus = 'draft' | 'final' | 'signed'

export interface NameFormatterInput {
  date: Date | string
  docType: VaultDocType
  entity: VaultEntity
  description: string
  version?: number
  status?: VaultStatus
}

const DOC_TYPE_PREFIX: Record<VaultDocType, string> = {
  invoice:          'INV',
  contract:         'CON',
  statement:        'STMT',
  tax_return:       'TAX',
  proposal:         'PROP',
  vat201:           'VAT201',
  itr14:            'ITR14',
  emp201:           'EMP201',
  bank_statement:   'BANK',
  tax_clearance:    'TAXCLR',
  bbbee_certificate:'BBBEE',
  cipc_certificate: 'CIPC',
  other:            'DOC',
}

const ENTITY_LABEL: Record<VaultEntity, string> = {
  keno_sonic:     'KenoSonic',
  giggle_factory: 'GiggleFactory',
}

function sanitize(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Produces a canonical vault file name.
 * Format: YYYY-MM-DD_[PREFIX]_[Entity]_[Description]_v[N][_Suffix].pdf
 * Max 80 chars (excluding .pdf). Description is truncated if needed.
 */
export function formatFileName(input: NameFormatterInput): string {
  const { date, docType, entity, description, version = 1, status } = input

  const prefix      = DOC_TYPE_PREFIX[docType]
  const entityLabel = ENTITY_LABEL[entity]
  const versionStr  = `v${version}`
  const suffix      = status === 'signed' ? '_Signed' : status === 'draft' ? '_Draft' : ''

  const cleanDesc = sanitize(description)

  // Build without description first to know available space
  const fixed = `${formatDate(date)}_${prefix}_${entityLabel}_`
  const tail  = `_${versionStr}${suffix}.pdf`
  const maxDesc = Math.max(0, 80 - fixed.length - tail.length)
  const desc    = cleanDesc.slice(0, maxDesc)

  return `${fixed}${desc}${tail}`
}
