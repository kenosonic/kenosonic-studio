import { supabase } from '../supabase'
import { formatFileName, type NameFormatterInput, type VaultDocType, type VaultEntity, type VaultStatus } from './nameFormatter'
import { getTaxYear } from './taxYear'
import { autoCheckCompliance } from '../compliance/autoCheck'

export interface DocumentMetadata {
  entity: VaultEntity
  docType: VaultDocType
  description: string
  date?: Date | string
  version?: number
  status?: VaultStatus
  clientId?: string
  projectId?: string
  invoiceId?: string
  tags?: string[]
}

export interface VaultRecord {
  id: string
  entity: VaultEntity
  client_id: string | null
  project_id: string | null
  invoice_id: string | null
  doc_type: VaultDocType
  tax_year: string
  file_name: string
  file_path: string
  drive_file_id: string | null
  drive_synced_at: string | null
  status: VaultStatus
  tags: string[]
  created_at: string
  updated_at: string
}

/**
 * Uploads a file to Supabase Storage and inserts a row into ks_file_vault.
 * File name is always produced by formatFileName — never pass raw names.
 */
export async function uploadDocument(
  file: File | Blob,
  metadata: DocumentMetadata,
): Promise<VaultRecord> {
  const date     = metadata.date ?? new Date()
  const status   = metadata.status ?? 'final'
  const taxYear  = getTaxYear(date)

  const nameInput: NameFormatterInput = {
    date,
    docType:     metadata.docType,
    entity:      metadata.entity,
    description: metadata.description,
    version:     metadata.version ?? 1,
    status,
  }
  const fileName = formatFileName(nameInput)
  const filePath = `${metadata.entity}/${metadata.docType}/${taxYear}/${fileName}`

  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { upsert: false })

  if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`)

  const { data, error: dbError } = await supabase
    .from('ks_file_vault')
    .insert({
      entity:     metadata.entity,
      client_id:  metadata.clientId  ?? null,
      project_id: metadata.projectId ?? null,
      invoice_id: metadata.invoiceId ?? null,
      doc_type:   metadata.docType,
      tax_year:   taxYear,
      file_name:  fileName,
      file_path:  filePath,
      status,
      tags:       metadata.tags ?? [],
    })
    .select()
    .single()

  if (dbError) {
    // Best-effort: remove the uploaded file so Storage doesn't orphan
    await supabase.storage.from('documents').remove([filePath])
    throw new Error(`Database insert failed: ${dbError.message}`)
  }

  // Auto-tick compliance items linked to this doc type (non-fatal)
  autoCheckCompliance(metadata.entity, metadata.docType).catch(err =>
    console.warn('[autoCheck] compliance tick failed:', err),
  )

  return data as VaultRecord
}

/** Returns a short-lived signed URL (60 s) for downloading a vault file. */
export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60)

  if (error || !data) throw new Error(`Failed to create signed URL: ${error?.message}`)
  return data.signedUrl
}
