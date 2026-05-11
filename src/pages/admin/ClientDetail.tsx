import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useClient } from '../../hooks/useClient'
import { useDocuments, createDocument } from '../../hooks/useDocument'
import { useAuth } from '../../hooks/useAuth'
import { Button, MicroLabel } from '../../components/ui'
import { DOC_TYPE_LABELS, STATUS_COLORS, type DocumentType } from '../../types'

const DOC_TYPES: DocumentType[] = ['invoice', 'quote', 'proposal', 'contract', 'report', 'audit', 'email', 'offboarding']

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const { client, loading } = useClient(id)
  const { documents } = useDocuments(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [showDocMenu, setShowDocMenu] = useState(false)

  async function handleCreateDoc(type: DocumentType) {
    if (!client || !user) return
    setCreating(true)
    setShowDocMenu(false)

    const defaultContent: Record<DocumentType, Record<string, unknown>> = {
      invoice: {
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        payment_terms: 'EFT / Bank Transfer',
        bank_details: { bank: 'FNB', account: '', branch: '' },
        line_items: [{ id: crypto.randomUUID(), title: 'Service', description: 'Description', amount: 0 }],
        tax_rate: 15,
        notes: '',
      },
      quote: {
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: '',
        payment_terms: 'EFT / Bank Transfer',
        bank_details: { bank: 'FNB', account: '', branch: '' },
        line_items: [{ id: crypto.randomUUID(), title: 'Service', description: 'Description', amount: 0 }],
        tax_rate: 15,
        notes: '',
      },
      report: {
        subtitle: 'Brand & Storytelling Analysis',
        sections: [
          { id: crypto.randomUUID(), micro: 'Strategic Foundation', heading: 'Core Positioning', type: 'text', body: 'Write your analysis here.' },
          { id: crypto.randomUUID(), micro: 'Core Insight', heading: 'Strategic Genius', type: 'callout', body: 'Write your key insight here.' },
        ],
      },
      proposal: { intro: '', sections: [], deliverables: [], timeline: [], pricing_summary: 0, terms: '' },
      contract: { intro: '', sections: [], signature_block: {} },
      audit: { service_type: 'web', tools_used: [], sections: [], summary: '' },
      email: { subject: '', greeting: `Hi ${client.contact_name},`, body_sections: [{ id: crypto.randomUUID(), body: '' }], cta: null },
      offboarding: { sections: [], assets_delivered: [], access_transferred: [], notes: '' },
    }

    const doc = await createDocument(
      client.id,
      type,
      `${DOC_TYPE_LABELS[type]} — ${client.company_name}`,
      defaultContent[type],
      user.id,
    )
    setCreating(false)
    navigate(`/admin/documents/${doc.id}`)
  }

  if (loading) return <div className="px-10 py-10 text-ks-silver font-body text-[12px]">Loading...</div>
  if (!client) return <div className="px-10 py-10 text-ks-silver font-body text-[12px]">Client not found.</div>

  return (
    <div className="px-10 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/admin/clients" className="font-body text-[11px] text-ks-silver hover:text-ks-lava">Clients</Link>
        <span className="text-ks-silver text-[11px]">/</span>
        <span className="font-body text-[11px] text-ks-ink">{client.company_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <MicroLabel>{client.industry}</MicroLabel>
          <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] text-ks-ink mt-1">{client.company_name}</h2>
        </div>
        <div className="relative">
          <Button variant="dark" onClick={() => setShowDocMenu(v => !v)} disabled={creating}>
            {creating ? 'Creating…' : '+ New Document'}
          </Button>
          {showDocMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-ks-hairline shadow-sm z-10 w-52 rounded-ks overflow-hidden">
              {DOC_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleCreateDoc(type)}
                  className="w-full text-left px-4 py-3 font-body text-[12px] text-ks-slate hover:bg-ks-smoke transition-colors border-b border-ks-hairline last:border-b-0"
                >
                  {DOC_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client info stat bar */}
      <div className="flex border border-ks-rule mb-8" style={{ backgroundColor: '#E8E5E0' }}>
        <div className="flex-1 p-5 border-r border-ks-rule">
          <MicroLabel color="silver" className="block mb-1">Contact</MicroLabel>
          <p className="font-display font-bold text-[13px] text-ks-ink">{client.contact_name}</p>
          <p className="font-body text-[11px] text-ks-silver">{client.contact_email}</p>
        </div>
        <div className="flex-1 p-5 border-r border-ks-rule">
          <MicroLabel color="silver" className="block mb-1">Location</MicroLabel>
          <p className="font-body text-[12px] text-ks-slate">{client.city}, {client.province}</p>
          <p className="font-body text-[11px] text-ks-silver">{client.address_line1}</p>
        </div>
        <div className="flex-1 p-5 border-r border-ks-rule">
          <MicroLabel color="silver" className="block mb-1">Reg. No.</MicroLabel>
          <p className="font-body text-[12px] text-ks-slate">{client.registration_number ?? '—'}</p>
        </div>
        <div className="flex-1 p-5">
          <MicroLabel color="silver" className="block mb-1">VAT No.</MicroLabel>
          <p className="font-body text-[12px] text-ks-slate">{client.vat_number ?? '—'}</p>
        </div>
      </div>

      {/* Documents */}
      <div>
        <MicroLabel className="block mb-4">Documents</MicroLabel>

        {documents.length === 0 ? (
          <div className="bg-white border border-ks-hairline p-12 text-center">
            <p className="font-body text-[12px] text-ks-silver">No documents yet. Use the button above to create one.</p>
          </div>
        ) : (
          <div className="bg-white border border-ks-hairline">
            {documents.map((doc, i) => (
              <Link
                key={doc.id}
                to={`/admin/documents/${doc.id}`}
                className={`flex items-center justify-between px-6 py-4 hover:bg-ks-smoke transition-colors ${i < documents.length - 1 ? 'border-b border-ks-hairline' : ''}`}
              >
                <div>
                  <p className="font-display font-bold text-[13px] text-ks-ink">{doc.title}</p>
                  <p className="font-body text-[11px] text-ks-silver mt-0.5">{doc.reference_number}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-body text-[10px] text-ks-silver">{DOC_TYPE_LABELS[doc.type]}</span>
                  <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[doc.status]}`}>
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
