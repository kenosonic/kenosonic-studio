import { useState } from 'react'
import { MicroLabel } from '../../components/ui'
import { useVault, syncStatus, type VaultRecord } from '../../hooks/useVault'
import type { VaultDocType, VaultEntity } from '../../lib/documents/nameFormatter'
import { currentTaxYear } from '../../lib/documents/taxYear'

const DOC_TYPE_LABELS: Record<VaultDocType, string> = {
  invoice:          'Invoice',
  contract:         'Contract',
  statement:        'Statement',
  tax_return:       'Tax Return',
  proposal:         'Proposal',
  vat201:           'VAT201',
  itr14:            'ITR14',
  emp201:           'EMP201',
  bank_statement:   'Bank Statement',
  tax_clearance:    'Tax Clearance',
  bbbee_certificate:'B-BBEE Certificate',
  cipc_certificate: 'CIPC Certificate',
  other:            'Other',
}

type SyncFilter = 'all' | 'pending' | 'synced' | 'error'

function SyncBadge({ status }: { status: 'synced' | 'pending' | 'error' }) {
  if (status === 'synced')  return <span className="text-green-600 text-[13px]" title="Synced to Drive">✅</span>
  if (status === 'error')   return <span className="text-red-500 text-[13px]" title="Sync failed">❌</span>
  return <span className="text-yellow-500 text-[13px]" title="Pending sync">⚠️</span>
}

function SlideOutPanel({
  record,
  onClose,
  onPush,
  onDownload,
}: {
  record: VaultRecord
  onClose: () => void
  onPush: (r: VaultRecord) => Promise<void>
  onDownload: (r: VaultRecord) => Promise<void>
}) {
  const [pushing, setPushing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const status = syncStatus(record)

  async function handlePush() {
    setPushing(true)
    setPushError(null)
    try { await onPush(record) } catch (e) { setPushError(String(e)) }
    setPushing(false)
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await onDownload(record)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col overflow-y-auto"
        style={{ backgroundColor: '#F8F6F3', borderLeft: '0.5px solid #E8E5E0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '0.5px solid #E8E5E0' }}>
          <div>
            <MicroLabel>File Vault</MicroLabel>
            <h3 className="font-display font-bold text-[16px] tracking-[-0.02em] text-ks-ink mt-0.5 leading-snug break-all">
              {record.file_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="font-body text-[18px] text-ks-silver hover:text-ks-ink transition-colors ml-4 flex-shrink-0"
          >×</button>
        </div>

        {/* Metadata */}
        <div className="flex-1 px-6 py-5 space-y-4">
          {[
            ['Type',     DOC_TYPE_LABELS[record.doc_type]],
            ['Entity',   record.entity === 'keno_sonic' ? 'Keno Sonic' : 'Giggle Factory'],
            ['Tax Year', record.tax_year ?? '—'],
            ['Status',   record.status],
            ['Client',   (record.client as { company_name?: string } | null)?.company_name ?? '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-0.5">{label}</p>
              <p className="font-body text-[13px] text-ks-ink">{value}</p>
            </div>
          ))}

          <div>
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-0.5">Drive Sync</p>
            <div className="flex items-center gap-2">
              <SyncBadge status={status} />
              <p className="font-body text-[12px] text-ks-slate">
                {status === 'synced'
                  ? `Synced ${record.drive_synced_at ? new Date(record.drive_synced_at).toLocaleDateString('en-ZA') : ''}`
                  : status === 'error' ? 'Sync failed — see error below'
                  : 'Not yet synced to Drive'}
              </p>
            </div>
          </div>

          {/* Sync errors */}
          {status === 'error' && record.sync_errors?.filter(e => !e.resolved).map(e => (
            <div key={e.id} className="bg-red-50 border border-red-200 px-4 py-3 rounded-ks">
              <p className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-red-500 mb-1">Sync Error</p>
              <p className="font-body text-[11px] text-red-700 break-all">{e.error_message}</p>
              <p className="font-body text-[10px] text-red-400 mt-1">
                {new Date(e.attempted_at).toLocaleString('en-ZA')}
              </p>
            </div>
          ))}

          {pushError && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-ks">
              <p className="font-body text-[11px] text-red-700">{pushError}</p>
            </div>
          )}

          {record.tags.length > 0 && (
            <div>
              <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {record.tags.map(tag => (
                  <span key={tag} className="font-body text-[10px] px-2 py-0.5 bg-white border border-ks-rule text-ks-slate rounded-ks">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex flex-col gap-3" style={{ borderTop: '0.5px solid #E8E5E0' }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full font-body font-medium text-[10px] uppercase tracking-[0.1em] px-4 py-3 bg-ks-void text-white hover:bg-ks-ink transition-colors disabled:opacity-50"
          >
            {downloading ? 'Generating link…' : 'Download (60s link)'}
          </button>

          {status !== 'synced' && (
            <button
              onClick={handlePush}
              disabled={pushing}
              className="w-full font-body font-medium text-[10px] uppercase tracking-[0.1em] px-4 py-3 border border-ks-lava text-ks-lava hover:bg-ks-lava hover:text-white transition-colors disabled:opacity-50"
            >
              {pushing ? 'Pushing to Drive…' : 'Push to Drive'}
            </button>
          )}

          {record.drive_file_id && (
            <a
              href={`https://drive.google.com/file/d/${record.drive_file_id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full font-body font-medium text-[10px] uppercase tracking-[0.1em] px-4 py-3 border border-ks-rule text-ks-slate hover:border-ks-ink hover:text-ks-ink transition-colors text-center"
            >
              Open in Drive →
            </a>
          )}
        </div>
      </div>
    </>
  )
}

export default function Vault() {
  const [entityFilter, setEntityFilter] = useState<VaultEntity | 'all'>('all')
  const [docTypeFilter, setDocTypeFilter] = useState<VaultDocType | 'all'>('all')
  const [taxYearFilter, setTaxYearFilter] = useState<string>(currentTaxYear())
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all')
  const [selected, setSelected] = useState<VaultRecord | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)

  const { records, loading, error, reload, pushToDrive, syncAllPending, getDownloadUrl } = useVault({
    entity:   entityFilter === 'all' ? undefined : entityFilter,
    doc_type: docTypeFilter === 'all' ? undefined : docTypeFilter,
    tax_year: taxYearFilter || undefined,
  })

  const filtered = records.filter(r => {
    if (syncFilter === 'all') return true
    return syncStatus(r) === syncFilter
  })

  const pendingCount = records.filter(r => !r.drive_file_id).length

  async function handleSyncAll() {
    setSyncingAll(true)
    await syncAllPending()
    setSyncingAll(false)
  }

  async function handleDownload(record: VaultRecord) {
    try {
      const url = await getDownloadUrl(record)
      window.open(url, '_blank')
    } catch (e) {
      alert(`Failed to generate download link: ${e}`)
    }
  }

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <MicroLabel>Document Vault</MicroLabel>
          <h2 className="font-display font-bold text-[22px] sm:text-[24px] tracking-[-0.02em] text-ks-ink mt-1">
            File Vault
          </h2>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2.5 border border-ks-lava text-ks-lava hover:bg-ks-lava hover:text-white transition-colors disabled:opacity-50"
          >
            {syncingAll ? 'Syncing…' : `Sync All Pending (${pendingCount})`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">

        {/* Entity */}
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value as VaultEntity | 'all')}
          className="font-body text-[11px] px-3 py-2 bg-white border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink"
        >
          <option value="all">All Entities</option>
          <option value="keno_sonic">Keno Sonic</option>
          <option value="giggle_factory">Giggle Factory</option>
        </select>

        {/* Doc type */}
        <select
          value={docTypeFilter}
          onChange={e => setDocTypeFilter(e.target.value as VaultDocType | 'all')}
          className="font-body text-[11px] px-3 py-2 bg-white border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink"
        >
          <option value="all">All Types</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* Tax year */}
        <input
          type="text"
          value={taxYearFilter}
          onChange={e => setTaxYearFilter(e.target.value)}
          placeholder="Tax year e.g. 2025-2026"
          className="font-body text-[11px] px-3 py-2 bg-white border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink w-44"
        />

        {/* Sync status */}
        <div className="flex gap-1.5">
          {(['all', 'pending', 'synced', 'error'] as SyncFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setSyncFilter(f)}
              className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-2 transition-colors ${
                syncFilter === f
                  ? 'bg-ks-void text-white'
                  : 'bg-white border border-ks-rule text-ks-silver hover:border-ks-ink hover:text-ks-ink'
              }`}
            >
              {f === 'all' ? 'All' : f === 'pending' ? '⚠ Pending' : f === 'synced' ? '✓ Synced' : '✕ Error'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-red-500 text-[13px] mt-px">✕</span>
          <p className="font-body text-[12px] text-red-700">Failed to load vault: {error}</p>
        </div>
      )}

      {loading ? (
        <p className="font-body text-[12px] text-ks-silver">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-ks-hairline p-12 text-center">
          <p className="font-body text-[12px] text-ks-silver">No files found for these filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-ks-hairline">
          {/* Header row */}
          <div className="hidden sm:grid sm:grid-cols-[3fr_1.5fr_1fr_1fr_80px_48px] gap-4 px-6 py-3 border-b border-ks-hairline">
            {['File Name', 'Client', 'Type', 'Tax Year', 'Drive', ''].map(h => (
              <span key={h} className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">{h}</span>
            ))}
          </div>

          {filtered.map((rec, i) => {
            const s = syncStatus(rec)
            return (
              <button
                key={rec.id}
                onClick={() => setSelected(rec)}
                className={`w-full text-left block sm:grid sm:grid-cols-[3fr_1.5fr_1fr_1fr_80px_48px] sm:items-center px-4 sm:px-6 py-4 hover:bg-ks-smoke transition-colors ${
                  i < filtered.length - 1 ? 'border-b border-ks-hairline' : ''
                }`}
              >
                {/* Mobile layout */}
                <div className="flex items-start justify-between sm:contents">
                  <div className="min-w-0">
                    <p className="font-body font-medium text-[12px] text-ks-ink truncate">{rec.file_name}</p>
                    <p className="font-body text-[10px] text-ks-silver mt-0.5">
                      {(rec.client as { company_name?: string } | null)?.company_name ?? '—'} · {rec.tax_year ?? '—'}
                    </p>
                  </div>
                  <div className="sm:hidden flex items-center gap-2 ml-3 flex-shrink-0">
                    <SyncBadge status={s} />
                  </div>
                </div>

                {/* Desktop columns */}
                <p className="hidden sm:block font-body text-[12px] text-ks-slate truncate">
                  {(rec.client as { company_name?: string } | null)?.company_name ?? '—'}
                </p>
                <p className="hidden sm:block font-body text-[11px] text-ks-silver">{DOC_TYPE_LABELS[rec.doc_type]}</p>
                <p className="hidden sm:block font-body text-[11px] text-ks-silver">{rec.tax_year ?? '—'}</p>
                <div className="hidden sm:flex items-center gap-1.5">
                  <SyncBadge status={s} />
                  {s === 'pending' && (
                    <button
                      onClick={e => { e.stopPropagation(); pushToDrive(rec).then(reload) }}
                      className="font-body font-medium text-[8px] uppercase tracking-[0.1em] px-2 py-1 border border-ks-lava text-ks-lava hover:bg-ks-lava hover:text-white transition-colors"
                    >
                      Push
                    </button>
                  )}
                </div>
                <span className="hidden sm:block font-body text-[11px] text-ks-lava">View →</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Slide-out panel */}
      {selected && (
        <SlideOutPanel
          record={selected}
          onClose={() => setSelected(null)}
          onPush={async (r) => { await pushToDrive(r); setSelected(r) }}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
