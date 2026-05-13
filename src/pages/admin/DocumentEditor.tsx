import { Link, useParams } from 'react-router-dom'
import { useDocument, updateDocumentStatus, sendDocument } from '../../hooks/useDocument'
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
import { STATUS_COLORS, type DocumentStatus, type Client } from '../../types'
import { useState } from 'react'

const NEXT_STATUS: Partial<Record<DocumentStatus, DocumentStatus>> = {
  sent: 'approved',
  viewed: 'approved',
  approved: 'signed',
}

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>()
  const { document, loading, setDocument } = useDocument(id)
  const [updating, setUpdating] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!document) return
    setSending(true)
    try {
      await sendDocument(document.id)
      setDocument(d => d ? { ...d, status: 'sent', sent_at: new Date().toISOString() } : d)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Send failed:\n\n${msg}`)
    } finally {
      setSending(false)
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
  if (!document) return <div className="px-10 py-10 text-ks-silver font-body text-[12px]">Document not found.</div>

  const client = document.client as Client

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-10">
      {/* Breadcrumb + meta */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {client && (
              <>
                <Link to={`/admin/clients/${client.id}`} className="font-body text-[11px] text-ks-silver hover:text-ks-lava">{client.company_name}</Link>
                <span className="text-ks-silver text-[11px]">/</span>
              </>
            )}
            <span className="font-body text-[11px] text-ks-ink">{document.reference_number}</span>
          </div>
          <div className="flex items-center gap-3">
            <MicroLabel>{document.type}</MicroLabel>
            <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[document.status]}`}>
              {document.status}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          {document.status === 'draft' && (
            <Button variant="orange" size="sm" onClick={handleSend} disabled={sending}>
              {sending ? 'Sending…' : 'Send to Client'}
            </Button>
          )}
          {NEXT_STATUS[document.status] && (
            <Button variant="dark" size="sm" onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating…' : `Mark as ${NEXT_STATUS[document.status]}`}
            </Button>
          )}
        </div>
      </div>

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
