import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDocument, signDocument, updateDocumentStatus } from '../../hooks/useDocument'
import { useAuth } from '../../hooks/useAuth'
import { Button, MicroLabel } from '../../components/ui'
import { InvoiceDocument } from '../../components/documents/Invoice/InvoiceDocument'
import { QuoteDocument } from '../../components/documents/Quote/QuoteDocument'
import { ProposalDocument } from '../../components/documents/Proposal/ProposalDocument'
import { ContractDocument } from '../../components/documents/Contract/ContractDocument'
import { ReportDocument } from '../../components/documents/Report/ReportDocument'
import { AuditDocument } from '../../components/documents/Audit/AuditDocument'
import { EmailDocument } from '../../components/documents/Email/EmailDocument'
import { OffboardingDocument } from '../../components/documents/Offboarding/OffboardingDocument'
import { DOC_TYPE_LABELS, STATUS_COLORS, type Client } from '../../types'
import { exportToPDF } from '../../lib/pdf'

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const { document, loading, setDocument } = useDocument(id)
  const { profile } = useAuth()
  const [showSignModal, setShowSignModal] = useState(false)
  const [signerName, setSignerName] = useState(profile?.full_name ?? '')
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)

  // Mark as viewed
  if (document && document.status === 'sent' && !document.viewed_at) {
    updateDocumentStatus(document.id, 'viewed')
    setDocument(d => d ? { ...d, status: 'viewed' } : d)
  }

  async function handleSign() {
    if (!document || !signerName.trim()) return
    setSigning(true)
    await signDocument(document.id, signerName, profile?.full_name ?? '')
    setDocument(d => d ? { ...d, status: 'signed', signed_at: new Date().toISOString() } : d)
    setSigned(true)
    setSigning(false)
    setShowSignModal(false)
  }

  async function handleApprove() {
    if (!document) return
    await updateDocumentStatus(document.id, 'approved')
    setDocument(d => d ? { ...d, status: 'approved' } : d)
  }

  if (loading) return <div className="font-body text-[12px] text-ks-silver">Loading...</div>
  if (!document) return <div className="font-body text-[12px] text-ks-silver">Document not found.</div>

  const client = document.client as Client
  const canApprove = ['sent', 'viewed'].includes(document.status)
  const canSign = ['approved', 'sent', 'viewed'].includes(document.status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/portal" className="font-body text-[11px] text-ks-silver hover:text-ks-lava block mb-3">← Back to Documents</Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <MicroLabel>{DOC_TYPE_LABELS[document.type]}</MicroLabel>
            <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[document.status]}`}>
              {document.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => exportToPDF('document-content', document.reference_number)}>
              PDF
            </Button>
            {canApprove && (
              <Button variant="dark" size="sm" onClick={handleApprove}>Approve</Button>
            )}
            {canSign && document.status !== 'signed' && (
              <Button variant="orange" size="sm" onClick={() => setShowSignModal(true)}>Sign</Button>
            )}
            {(signed || document.status === 'signed') && (
              <span className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-green-600 flex items-center gap-1">✓ Signed</span>
            )}
          </div>
        </div>
      </div>

      {/* Document — scroll horizontally on small screens */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      {document.type === 'invoice' && client && <InvoiceDocument document={document} client={client} readonly />}
      {document.type === 'quote' && client && <QuoteDocument document={document} client={client} readonly />}
      {document.type === 'proposal' && client && <ProposalDocument document={document} client={client} readonly />}
      {document.type === 'contract' && client && <ContractDocument document={document} client={client} readonly />}
      {document.type === 'report' && client && <ReportDocument document={document} client={client} readonly />}
      {document.type === 'audit' && client && <AuditDocument document={document} client={client} readonly />}
      {document.type === 'email' && client && <EmailDocument document={document} client={client} readonly />}
      {document.type === 'offboarding' && client && <OffboardingDocument document={document} client={client} readonly />}
      {!['invoice', 'quote', 'proposal', 'contract', 'report', 'audit', 'email', 'offboarding'].includes(document.type) && (
        <div className="bg-white border border-ks-hairline p-16 text-center max-w-[850px]">
          <p className="font-body text-[13px] text-ks-slate">This document type doesn't have a visual template yet.</p>
        </div>
      )}
      </div>

      {/* Sign modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-ks-rule w-full max-w-md p-8">
            <MicroLabel className="block mb-2">Electronic Signature</MicroLabel>
            <h3 className="font-display font-bold text-[18px] text-ks-ink mb-6">Sign Document</h3>
            <p className="font-body text-[12px] text-ks-silver mb-6">
              By typing your name below and clicking "Sign", you agree that this constitutes your electronic signature.
            </p>
            <div className="flex flex-col gap-1.5 mb-6">
              <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver">Your Full Name</label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="bg-ks-smoke border border-ks-rule text-ks-ink text-[16px] font-display font-bold italic px-4 py-3 rounded-ks focus:outline-none focus:border-ks-lava"
                placeholder="Type your full name"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowSignModal(false)}>Cancel</Button>
              <Button variant="orange" onClick={handleSign} disabled={signing || !signerName.trim()}>
                {signing ? 'Signing…' : 'Sign Document'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
