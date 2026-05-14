import { Link } from 'react-router-dom'
import { useDocuments } from '../../hooks/useDocument'
import { MicroLabel } from '../../components/ui'
import { DOC_TYPE_LABELS, STATUS_COLORS, type DocumentType } from '../../types'
import { useState } from 'react'

const ALL_TYPES: Array<DocumentType | 'all'> = ['all', 'invoice', 'quote', 'proposal', 'contract', 'report', 'audit', 'email', 'offboarding']

export default function Documents() {
  const { documents, loading, error } = useDocuments()
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')

  const filtered = typeFilter === 'all' ? documents : documents.filter(d => d.type === typeFilter)

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-10">
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div>
          <MicroLabel>All Documents</MicroLabel>
          <h2 className="font-display font-bold text-[22px] sm:text-[24px] tracking-[-0.02em] text-ks-ink mt-1">Documents</h2>
        </div>
      </div>

      {/* Filter tabs — scroll horizontally on mobile */}
      <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {ALL_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`flex-shrink-0 font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-ks transition-colors ${
              typeFilter === t ? 'bg-ks-void text-white' : 'bg-white border border-ks-rule text-ks-silver hover:border-ks-ink hover:text-ks-ink'
            }`}
          >
            {t === 'all' ? 'All' : DOC_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-500 text-[13px] mt-px">✕</span>
          <p className="font-body text-[12px] text-red-700">Failed to load documents: {error}</p>
        </div>
      )}

      {loading ? (
        <p className="font-body text-[12px] text-ks-silver">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-ks-hairline p-12 text-center">
          <p className="font-body text-[12px] text-ks-silver">No documents found.</p>
        </div>
      ) : (
        <div className="bg-white border border-ks-hairline">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-ks-hairline">
            {['Document', 'Client', 'Type', 'Status', ''].map(h => (
              <span key={h} className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">{h}</span>
            ))}
          </div>
          {filtered.map((doc, i) => (
            <Link
              key={doc.id}
              to={`/admin/documents/${doc.id}`}
              className={`block sm:grid sm:grid-cols-[2fr_1.5fr_1fr_1fr_80px] sm:items-center px-4 sm:px-6 py-4 hover:bg-ks-smoke transition-colors ${i < filtered.length - 1 ? 'border-b border-ks-hairline' : ''}`}
            >
              {/* Mobile layout */}
              <div className="flex items-start justify-between sm:contents">
                <div className="min-w-0">
                  <p className="font-display font-bold text-[13px] text-ks-ink truncate">{doc.title}</p>
                  <p className="font-body text-[11px] text-ks-silver">
                    {(doc.client as { company_name?: string })?.company_name ?? '—'} · {doc.reference_number}
                  </p>
                  <p className="sm:hidden font-body text-[10px] text-ks-silver mt-0.5">{DOC_TYPE_LABELS[doc.type]}</p>
                </div>
                {/* Mobile: status + arrow */}
                <div className="sm:hidden flex flex-col items-end gap-1.5 ml-3 flex-shrink-0">
                  <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[doc.status]}`}>
                    {doc.status}
                  </span>
                  <span className="font-body text-[11px] text-ks-lava">→</span>
                </div>
              </div>

              {/* Desktop-only columns */}
              <p className="hidden sm:block font-body text-[12px] text-ks-slate truncate">
                {(doc.client as { company_name?: string })?.company_name ?? '—'}
              </p>
              <p className="hidden sm:block font-body text-[11px] text-ks-silver">{DOC_TYPE_LABELS[doc.type]}</p>
              <span className={`hidden sm:inline-flex font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks w-fit ${STATUS_COLORS[doc.status]}`}>
                {doc.status}
              </span>
              <span className="hidden sm:block font-body text-[11px] text-ks-lava">Edit →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
