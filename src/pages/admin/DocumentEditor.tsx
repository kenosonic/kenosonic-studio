import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDocument, updateDocumentStatus, sendDocument, archiveDocument, deleteDocument } from '../../hooks/useDocument'
import { supabase } from '../../lib/supabase'
import { MicroLabel, Button } from '../../components/ui'
import { InvoiceDocument } from '../../components/documents/Invoice/InvoiceDocument'
import { QuoteDocument } from '../../components/documents/Quote/QuoteDocument'
import { ProposalDocument } from '../../components/documents/Proposal/ProposalDocument'
import { ContractDocument } from '../../components/documents/Contract/ContractDocument'
import { ReportDocument } from '../../components/documents/Report/ReportDocument'
import { AuditDocument } from '../../components/documents/Audit/AuditDocument'
import { EmailDocument } from '../../components/documents/Email/EmailDocument'
import { OffboardingDocument } from '../../components/documents/Offboarding/OffboardingDocument'
import { QuestionnaireDocument } from '../../components/documents/Questionnaire/QuestionnaireDocument'
import { STATUS_COLORS, type DocumentStatus, type Client, type QuestionnaireContent } from '../../types'
import { useState } from 'react'

const NEXT_STATUS: Partial<Record<DocumentStatus, DocumentStatus>> = {
  sent: 'approved',
  viewed: 'approved',
  approved: 'signed',
}

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { document, loading, error: loadError, setDocument } = useDocument(id)
  const [updating, setUpdating] = useState(false)
  const [sending, setSending] = useState(false)
  const [locking, setLocking] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isLocked = document?.type === 'questionnaire' && (document.content as QuestionnaireContent).locked === true

  async function handleToggleLock() {
    if (!document) return
    setLocking(true)
    const newContent = { ...(document.content as Record<string, unknown>), locked: !isLocked }
    await supabase.from('documents').update({ content: newContent }).eq('id', document.id)
    setDocument(d => d ? { ...d, content: newContent } : d)
    setLocking(false)
  }

  async function handleSend() {
    if (!document) return
    setSending(true)
    setSendError(null)
    setSendSuccess(false)
    try {
      await sendDocument(document.id)
      if (document.status === 'draft') {
        setDocument(d => d ? { ...d, status: 'sent', sent_at: new Date().toISOString() } : d)
      }
      setSendSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setSendError(msg)
    } finally {
      setSending(false)
    }
  }

  async function handleArchive() {
    if (!document) return
    setArchiving(true)
    setActionError(null)
    try {
      await archiveDocument(document.id, !document.archived)
      setDocument(d => d ? { ...d, archived: !d.archived } : d)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setArchiving(false)
    }
  }

  async function handleDelete() {
    if (!document) return
    setDeleting(true)
    setActionError(null)
    try {
      await deleteDocument(document.id)
      navigate(client ? `/admin/clients/${client.id}` : '/admin/documents', { replace: true })
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err))
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleStatusUpdate() {
    if (!document) return
    const next = NEXT_STATUS[document.status]
    if (!next) return
    setUpdating(true)
    await updateDocumentStatus(document.id, next)
    setDocument(d => d ? { ...d, status: next } : d)
    setUpdating(false)
  }

  if (loading) return <div className="px-10 py-10 text-ks-silver font-body text-[12px]">Loading...</div>
  if (loadError) return <div className="px-10 py-10 text-red-500 font-body text-[12px]">Failed to load document: {loadError}</div>
  if (!document) return <div className="px-10 py-10 text-ks-silver font-body text-[12px]">Document not found.</div>

  const client = document.client as Client

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-10">
      {/* Breadcrumb + meta — full width on mobile, flex row on desktop */}
      <div className="mb-6 sm:flex sm:items-start sm:justify-between sm:gap-4">

        {/* Meta block */}
        <div className="mb-4 sm:mb-0 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {client && (
              <>
                <Link to={`/admin/clients/${client.id}`} className="font-body text-[11px] text-ks-silver hover:text-ks-lava truncate max-w-[160px] sm:max-w-none">{client.company_name}</Link>
                <span className="text-ks-silver text-[11px]">/</span>
              </>
            )}
            <span className="font-body text-[11px] text-ks-ink">{document.reference_number}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <MicroLabel>{document.type}</MicroLabel>
            <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[document.status]}`}>
              {document.status}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {document.type === 'questionnaire' && document.status === 'completed' && (
            <Button variant={isLocked ? 'outline' : 'dark'} size="sm" onClick={handleToggleLock} disabled={locking}>
              {locking ? 'Updating…' : isLocked ? 'Unlock Brief' : 'Lock Brief'}
            </Button>
          )}
          {document.status === 'draft' && !document.archived && (
            <Button variant="orange" size="sm" onClick={handleSend} disabled={sending}>
              {sending ? 'Sending…' : 'Send to Client'}
            </Button>
          )}
          {document.status !== 'draft' && !document.archived && (
            <Button variant="outline" size="sm" onClick={handleSend} disabled={sending}>
              {sending ? 'Resending…' : 'Resend'}
            </Button>
          )}
          {NEXT_STATUS[document.status] && !document.archived && (
            <Button variant="dark" size="sm" onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating…' : `Mark as ${NEXT_STATUS[document.status]}`}
            </Button>
          )}

          {/* Archive — icon on mobile, text on desktop */}
          <Button variant="outline" size="sm" onClick={handleArchive} disabled={archiving} title={document.archived ? 'Unarchive' : 'Archive'}>
            <span className="sm:hidden">
              {archiving ? (
                <span className="text-[11px]">…</span>
              ) : document.archived ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
              )}
            </span>
            <span className="hidden sm:inline">{archiving ? '…' : document.archived ? 'Unarchive' : 'Archive'}</span>
          </Button>

          {/* Delete — icon on mobile, text on desktop (draft only) */}
          {document.status === 'draft' && !document.archived && !confirmDelete && (
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} title="Delete">
              <span className="sm:hidden">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </span>
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="font-body text-[11px] text-ks-silver hidden sm:inline">Sure?</span>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>No</Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-ks bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? '…' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Send feedback banners */}
      {sendSuccess && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-3">
          <span className="text-green-600 text-[13px]">✓</span>
          <p className="font-body text-[12px] text-green-700">Document sent successfully. The client will receive an email with a link.</p>
        </div>
      )}
      {sendError && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-500 text-[13px] mt-px">✕</span>
          <div>
            <p className="font-body font-medium text-[12px] text-red-700">Failed to send document</p>
            <p className="font-body text-[11px] text-red-600 mt-0.5">{sendError}</p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-500 text-[13px] mt-px">✕</span>
          <p className="font-body text-[12px] text-red-700">{actionError}</p>
        </div>
      )}
      {document.archived && (
        <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-3">
          <span className="font-body text-[11px] text-yellow-700">This document is archived and hidden from the default view.</span>
        </div>
      )}

      {/* Client activity info */}
      {document.viewed_at && (
        <div className="mb-4 flex items-center gap-2 bg-ks-smoke border border-ks-hairline px-4 py-3">
          <span className="font-body text-[11px] text-ks-silver">
            Viewed by client on {new Date(document.viewed_at).toLocaleString('en-ZA')}
          </span>
        </div>
      )}
      {document.status === 'sent' && !document.viewed_at && (
        <div className="mb-4 flex items-center gap-2 bg-ks-smoke border border-ks-hairline px-4 py-3">
          <span className="font-body text-[11px] text-ks-silver">Sent — awaiting client view</span>
        </div>
      )}

      {/* Document renderer — scroll horizontally on small screens */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      {document.type === 'invoice' && client && <InvoiceDocument document={document} client={client} />}
      {document.type === 'quote' && client && <QuoteDocument document={document} client={client} />}
      {document.type === 'proposal' && client && <ProposalDocument document={document} client={client} />}
      {document.type === 'contract' && client && <ContractDocument document={document} client={client} />}
      {document.type === 'report' && client && <ReportDocument document={document} client={client} />}
      {document.type === 'audit' && client && <AuditDocument document={document} client={client} />}
      {document.type === 'email' && client && <EmailDocument document={document} client={client} />}
      {document.type === 'offboarding' && client && <OffboardingDocument document={document} client={client} />}
      {document.type === 'questionnaire' && client && <QuestionnaireDocument document={document} client={client} />}
      {!['invoice', 'quote', 'proposal', 'contract', 'report', 'audit', 'email', 'offboarding', 'questionnaire'].includes(document.type) && (
        <div className="bg-white border border-ks-hairline p-16 text-center max-w-[850px]">
          <MicroLabel className="block mb-3">Template Coming Soon</MicroLabel>
          <p className="font-body text-[13px] text-ks-slate capitalize">{document.type} template is not yet available.</p>
        </div>
      )}
      </div>
    </div>
  )
}
