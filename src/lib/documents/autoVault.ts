import { generatePDFBlob } from '../pdf'
import { uploadDocument } from './uploadDocument'
import { getTaxYear } from './taxYear'
import type { KSDocument } from '../../types'
import type { Client } from '../../types'
import type { VaultDocType } from './nameFormatter'

// Studio always operates as Keno Sonic entity for auto-vaulted documents
const STUDIO_ENTITY = 'keno_sonic' as const

const DOC_TYPE_MAP: Partial<Record<string, VaultDocType>> = {
  invoice:  'invoice',
  proposal: 'proposal',
  contract: 'contract',
}

/**
 * Captures the currently-rendered document (element #document-content) as a
 * PDF Blob and uploads it to ks_file_vault. Fire-and-forget safe — errors are
 * logged but not re-thrown so callers don't need to handle them.
 *
 * Called automatically after:
 *   - Invoice → status becomes 'sent'
 *   - Proposal → status becomes 'approved'
 */
export async function autoVaultDocument(
  doc: KSDocument,
  client: Client,
): Promise<void> {
  const vaultDocType = DOC_TYPE_MAP[doc.type]
  if (!vaultDocType) return // only vault mapped types

  const issueDate = (doc.content as Record<string, string>).issue_date ?? doc.created_at
  const taxYear   = getTaxYear(issueDate)
  const clientSlug = client.company_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
  const description = `${clientSlug}_${doc.reference_number}`

  try {
    const blob = await generatePDFBlob('document-content')

    await uploadDocument(blob, {
      entity:      STUDIO_ENTITY,
      docType:     vaultDocType,
      description,
      date:        issueDate,
      status:      'final',
      clientId:    doc.client_id,
      projectId:   doc.project_id ?? undefined,
      invoiceId:   doc.id,           // FK to documents table (works for any doc type)
      tags:        [doc.reference_number, doc.type],
    })
  } catch (err) {
    // Non-fatal: vault upload failure must never block the main document flow
    console.warn('[autoVault] Failed to vault document:', doc.reference_number, err)
  }
}
