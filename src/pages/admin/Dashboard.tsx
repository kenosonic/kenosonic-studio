import { Link } from 'react-router-dom'
import { useClients } from '../../hooks/useClient'
import { useDocuments } from '../../hooks/useDocument'
import { MicroLabel, StatCell } from '../../components/ui'
import { STATUS_COLORS, DOC_TYPE_LABELS } from '../../types'

export default function Dashboard() {
  const { clients } = useClients()
  const { documents } = useDocuments()

  const activeClients = clients.filter(c => c.status === 'active').length
  const draftDocs = documents.filter(d => d.status === 'draft').length
  const pendingDocs = documents.filter(d => ['sent', 'viewed'].includes(d.status)).length
  const signedDocs = documents.filter(d => d.status === 'signed').length

  const recent = documents.slice(0, 6)

  return (
    <div>
      {/* Page header */}
      <div className="px-4 sm:px-10 pt-6 sm:pt-10 pb-6">
        <MicroLabel>Overview</MicroLabel>
        <h2 className="font-display font-bold text-[22px] sm:text-[24px] tracking-[-0.02em] text-ks-ink mt-1">Dashboard</h2>
      </div>

      {/* Stat bar — 2×2 on mobile, row on desktop */}
      <div className="mx-4 sm:mx-10 mb-8 grid grid-cols-2 sm:flex border border-ks-rule" style={{ backgroundColor: '#E8E5E0' }}>
        <div className="border-r border-b sm:border-b-0 border-ks-rule sm:flex-1">
          <StatCell label="Active Clients" value={activeClients} />
        </div>
        <div className="border-b sm:border-b-0 sm:border-r border-ks-rule sm:flex-1">
          <StatCell label="Draft Documents" value={draftDocs} />
        </div>
        <div className="border-r border-ks-rule sm:flex-1">
          <StatCell label="Awaiting Response" value={pendingDocs} highlight />
        </div>
        <div className="sm:flex-1">
          <StatCell label="Signed" value={signedDocs} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 sm:px-10 mb-8">
        <MicroLabel className="block mb-4">Quick Actions</MicroLabel>
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/admin/clients/new"
            className="bg-ks-void text-white font-body font-medium text-[10px] uppercase tracking-[0.12em] px-5 py-3 rounded-ks hover:bg-ks-lava transition-colors"
          >
            + Onboard Client
          </Link>
          <Link
            to="/admin/documents"
            className="bg-transparent text-ks-lava border border-ks-lava font-body font-medium text-[10px] uppercase tracking-[0.12em] px-5 py-3 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
          >
            View All Documents
          </Link>
        </div>
      </div>

      {/* Recent documents */}
      <div className="px-4 sm:px-10">
        <div className="flex items-center justify-between mb-4">
          <MicroLabel>Recent Documents</MicroLabel>
          <Link to="/admin/documents" className="font-body text-[10px] text-ks-lava uppercase tracking-[0.1em] hover:underline">
            View All →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="bg-white border border-ks-hairline p-12 text-center rounded-ks">
            <p className="font-body text-[12px] text-ks-silver">No documents yet. Onboard a client to get started.</p>
          </div>
        ) : (
          <div className="bg-white border border-ks-hairline">
            {recent.map((doc, i) => (
              <Link
                key={doc.id}
                to={`/admin/documents/${doc.id}`}
                className={`flex items-start sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-ks-smoke transition-colors gap-3 ${i < recent.length - 1 ? 'border-b border-ks-hairline' : ''}`}
              >
                <div className="min-w-0">
                  <p className="font-display font-bold text-[13px] text-ks-ink truncate">{doc.title}</p>
                  <p className="font-body text-[11px] text-ks-silver mt-0.5 truncate">
                    {(doc.client as { company_name?: string })?.company_name ?? ''} · {doc.reference_number}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span className="hidden sm:block font-body text-[10px] text-ks-silver">{DOC_TYPE_LABELS[doc.type]}</span>
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
