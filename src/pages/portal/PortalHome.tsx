import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useDocuments } from '../../hooks/useDocument'
import { MicroLabel } from '../../components/ui'
import { DOC_TYPE_LABELS, STATUS_COLORS } from '../../types'

export default function PortalHome() {
  const { profile } = useAuth()
  const { documents, loading } = useDocuments(profile?.client_id)

  return (
    <div>
      <div className="mb-10">
        <MicroLabel>Client Portal</MicroLabel>
        <h2 className="font-display font-bold text-[26px] tracking-[-0.02em] text-ks-ink mt-1">
          Your Documents
        </h2>
        <p className="font-body text-[13px] text-ks-silver mt-2">
          View, approve, and sign documents from Keno Sonic.
        </p>
      </div>

      {loading ? (
        <p className="font-body text-[12px] text-ks-silver">Loading...</p>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-ks-hairline p-16 text-center">
          <p className="font-body text-[12px] text-ks-silver">No documents have been shared with you yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-ks-hairline">
          {documents.map((doc, i) => (
            <Link
              key={doc.id}
              to={`/portal/documents/${doc.id}`}
              className={`flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 hover:bg-ks-smoke transition-colors gap-3 ${i < documents.length - 1 ? 'border-b border-ks-hairline' : ''}`}
            >
              <div className="min-w-0">
                <p className="font-display font-bold text-[14px] text-ks-ink truncate">{doc.title}</p>
                <p className="font-body text-[11px] text-ks-silver mt-1">
                  {DOC_TYPE_LABELS[doc.type]} · {doc.reference_number}
                  {doc.sent_at && ` · Sent ${new Date(doc.sent_at).toLocaleDateString('en-ZA')}`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${STATUS_COLORS[doc.status]}`}>
                  {doc.status}
                </span>
                <span className="font-body text-[11px] text-ks-lava">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
