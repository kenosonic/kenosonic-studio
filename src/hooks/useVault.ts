import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getSignedUrl } from '../lib/documents/uploadDocument'
import type { VaultDocType, VaultEntity, VaultStatus } from '../lib/documents/nameFormatter'

export interface VaultRecord {
  id: string
  entity: VaultEntity
  client_id: string | null
  project_id: string | null
  invoice_id: string | null
  doc_type: VaultDocType
  tax_year: string | null
  file_name: string
  file_path: string
  drive_file_id: string | null
  drive_synced_at: string | null
  status: VaultStatus
  tags: string[]
  created_at: string
  updated_at: string
  client?: { company_name: string } | null
  sync_errors?: Array<{ id: string; error_message: string; attempted_at: string; resolved: boolean }>
}

export interface VaultFilters {
  entity?: VaultEntity
  doc_type?: VaultDocType
  tax_year?: string
  client_id?: string
  status?: VaultStatus
}

export function useVault(filters: VaultFilters = {}) {
  const [records, setRecords] = useState<VaultRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    let q = supabase
      .from('ks_file_vault')
      .select(`
        *,
        client:ks_clients(company_name),
        sync_errors:document_sync_errors(id, error_message, attempted_at, resolved)
      `)
      .order('created_at', { ascending: false })

    if (filters.entity)    q = q.eq('entity', filters.entity)
    if (filters.doc_type)  q = q.eq('doc_type', filters.doc_type)
    if (filters.tax_year)  q = q.eq('tax_year', filters.tax_year)
    if (filters.client_id) q = q.eq('client_id', filters.client_id)
    if (filters.status)    q = q.eq('status', filters.status)

    const { data, error: err } = await q
    if (err) setError(err.message)
    else setRecords((data ?? []) as VaultRecord[])
    setLoading(false)
  }, [filters.entity, filters.doc_type, filters.tax_year, filters.client_id, filters.status])

  useEffect(() => { load() }, [load])

  async function pushToDrive(record: VaultRecord): Promise<void> {
    const { error: fnErr } = await supabase.functions.invoke('sync-document-to-drive', {
      body: { document_id: record.id },
    })
    if (fnErr) throw new Error(fnErr.message)
    await load()
  }

  async function syncAllPending(): Promise<void> {
    const pending = records.filter(r => !r.drive_file_id)
    await Promise.allSettled(pending.map(r => pushToDrive(r)))
    await load()
  }

  async function getDownloadUrl(record: VaultRecord): Promise<string> {
    return getSignedUrl(record.file_path)
  }

  return { records, loading, error, reload: load, pushToDrive, syncAllPending, getDownloadUrl }
}

export function syncStatus(record: VaultRecord): 'synced' | 'error' | 'pending' {
  if (record.drive_file_id) return 'synced'
  const hasUnresolved = record.sync_errors?.some(e => !e.resolved)
  if (hasUnresolved) return 'error'
  return 'pending'
}
