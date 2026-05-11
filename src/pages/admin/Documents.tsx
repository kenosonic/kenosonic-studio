import { Link } from 'react-router-dom'
import { useDocuments } from '../../hooks/useDocument'
import { MicroLabel } from '../../components/ui'
import { DOC_TYPE_LABELS, STATUS_COLORS, type DocumentType } from '../../types'
import { useState } from 'react'

const ALL_TYPES: Array<DocumentType | 'all'> = ['all', 'invoice', 'quote', 'proposal', 'contract', 'report', 'audit', 'email', 'offboarding']

export default function Documents() {
  const { documents, loading } = useDocuments()
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')

  const filtered = typeFilter === 'all' ? documents : documents.filter(d => d.type === typeFilter)

  return (
    <div className="px-10 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <MicroLabel>All Documents</MicroLabel>
          <h2 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ks-ink mt-1">Documents</h2>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {ALL_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-ks transition-colors ${
              typeFilter === t ? 'bg-ks-void text-white' : 'bg-white border border-ks-rule text-ks-silver hover:border-ks-ink hover:text-ks-ink'
            }`}
          >
            {t === 'all' ? 'All' : DOC_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-[12px] text-ks-silver">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-ks-hairline p-12 text-center">
          <p className="font-body text-[12px] text-ks-silver">No documents found.</p>
        </div>
      ) : (
        <div className="bg-white border border-ks-hairline">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-ks-hairline">
            {['Document', 'Client', 'Type', 'Status', ''].map(h => (
              <span key={h} className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">{h}</span>
            ))}
          </div>
          {filtered.map((doc, i) => (
            <Link
              key={doc.id}
              to={`/admin/documents/${doc.id}`}
              className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 items-center px-6 py-4 hover:bg-ks-smoke transition-colors ${i < filtered.length - 1 ? 'border-b border-ks-hairline' : ''}`}
            >
              <div>
                <p className="font-display font-bold text-[13px] text-ks-ink truncate">{doc.title}</p>
                <p className="font-body text-[11px] text-ks-silver">{doc.reference_number}</p>
              </div>
              <p className="font-body text-[12px] text-ks-slate truncate">
                {(doc.client as { company_name?: string })?.company_name ?? '—'}
              </p>
              <p className="font-body text-[11px] text-ks-silver">{DOC_TYPE_LABELS[doc.type]}</p>
              <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks w-fit ${STATUS_COLORS[doc.status]}`}>
                {doc.status}
              </span>
              <span className="font-body text-[11px] text-ks-lava">Edit →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
