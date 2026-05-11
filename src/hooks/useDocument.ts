import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { KSDocument, DocumentType, DocumentStatus } from '../types'
import { DOC_TYPE_PREFIX } from '../types'

export function useDocuments(clientId?: string) {
  const [documents, setDocuments] = useState<KSDocument[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('documents')
      .select('*, client:clients(company_name, contact_name)')
      .order('created_at', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)
    const { data } = await query
    setDocuments(data ?? [])
    setLoading(false)
  }, [clientId])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  return { documents, loading, refetch: fetchDocuments }
}

export function useDocument(id: string | undefined) {
  const [document, setDocument] = useState<KSDocument | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    supabase
      .from('documents')
      .select('*, client:clients(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setDocument(data)
        setLoading(false)
      })
  }, [id])

  return { document, loading, setDocument }
}

export async function createDocument(
  clientId: string,
  type: DocumentType,
  title: string,
  content: Record<string, unknown>,
  userId: string,
  projectId?: string,
) {
  const year = new Date().getFullYear()
  const prefix = DOC_TYPE_PREFIX[type]
  const { count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)
  const ref = `${prefix}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

  const { data, error } = await supabase.from('documents').insert({
    client_id: clientId,
    project_id: projectId ?? null,
    type,
    title,
    status: 'draft',
    content,
    reference_number: ref,
    created_by: userId,
  }).select().single()

  if (error) throw error
  return data as KSDocument
}

export async function updateDocumentContent(id: string, content: Record<string, unknown>) {
  const { error } = await supabase
    .from('documents')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateDocumentStatus(id: string, status: DocumentStatus) {
  const timestamps: Record<string, string> = {}
  if (status === 'sent') timestamps.sent_at = new Date().toISOString()
  if (status === 'approved') timestamps.approved_at = new Date().toISOString()
  if (status === 'signed') timestamps.signed_at = new Date().toISOString()

  const { error } = await supabase
    .from('documents')
    .update({ status, ...timestamps })
    .eq('id', id)
  if (error) throw error
}

export async function signDocument(documentId: string, signerName: string, signerEmail: string) {
  const { error } = await supabase.from('document_signatures').insert({
    document_id: documentId,
    signer_name: signerName,
    signer_email: signerEmail,
    signature_value: signerName,
    signed_at: new Date().toISOString(),
  })
  if (error) throw error
  await updateDocumentStatus(documentId, 'signed')
}
