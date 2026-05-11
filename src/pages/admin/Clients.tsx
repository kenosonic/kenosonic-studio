import { Link } from 'react-router-dom'
import { useClients } from '../../hooks/useClient'
import { Button, MicroLabel } from '../../components/ui'

export default function Clients() {
  const { clients, loading } = useClients()

  return (
    <div className="px-10 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <MicroLabel>CRM</MicroLabel>
          <h2 className="font-display font-bold text-[24px] tracking-[-0.02em] text-ks-ink mt-1">Clients</h2>
        </div>
        <Link to="/admin/clients/new">
          <Button variant="dark">+ Onboard Client</Button>
        </Link>
      </div>

      {loading ? (
        <p className="font-body text-[12px] text-ks-silver">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="bg-white border border-ks-hairline p-16 text-center">
          <p className="font-body text-[12px] text-ks-silver mb-4">No clients yet.</p>
          <Link to="/admin/clients/new">
            <Button variant="outline">Onboard Your First Client</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-ks-hairline">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-ks-hairline">
            {['Company', 'Contact', 'Industry', 'Status', ''].map(h => (
              <span key={h} className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">{h}</span>
            ))}
          </div>

          {clients.map((client, i) => (
            <Link
              key={client.id}
              to={`/admin/clients/${client.id}`}
              className={`grid grid-cols-[2fr_2fr_1fr_1fr_80px] gap-4 items-center px-6 py-4 hover:bg-ks-smoke transition-colors ${i < clients.length - 1 ? 'border-b border-ks-hairline' : ''}`}
            >
              <div>
                <p className="font-display font-bold text-[13px] text-ks-ink">{client.company_name}</p>
              </div>
              <div>
                <p className="font-body text-[12px] text-ks-slate">{client.contact_name}</p>
                <p className="font-body text-[11px] text-ks-silver">{client.contact_email}</p>
              </div>
              <p className="font-body text-[12px] text-ks-slate">{client.industry}</p>
              <span className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks w-fit ${
                client.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-ks-pebble text-ks-silver'
              }`}>
                {client.status}
              </span>
              <span className="font-body text-[11px] text-ks-lava">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
