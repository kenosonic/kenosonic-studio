import { useEffect, useRef, useState } from 'react'
import { MicroLabel } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { computeComplianceScore } from '../../lib/compliance/complianceScore'
import {
  getSarsChecklist,
  formatMonth,
  type SarsChecklist,
} from '../../lib/compliance/sarsChecklist'
import { currentTaxYear, taxYearMonths } from '../../lib/documents/taxYear'
import { uploadDocument } from '../../lib/documents/uploadDocument'
import type { VaultEntity } from '../../lib/documents/nameFormatter'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'companies_act' | 'sars_tax' | 'vault' | 'reminders'

type ComplianceItem = {
  id: string
  entity: string
  section: string | null
  title: string
  description: string
  category: 'companies_act' | 'sars' | 'bbbee' | 'other'
  status: 'done' | 'pending' | 'na'
  linked_doc_type: string | null
  updated_at: string
}

type ComplianceReminder = {
  id: string
  entity: string
  title: string
  due_date: string
  recurrence: 'annual' | 'biannual' | 'monthly' | 'once'
  category: 'sars' | 'cipc' | 'bbbee' | 'other'
  notified_at: string | null
  resolved: boolean
  notes: string | null
}

type BusinessInfo = {
  entity: string
  company_name: string
  trading_name: string
  registration_number: string
  vat_number: string
  tax_reference_number: string
  registered_address: string
  postal_address: string
  contact_email: string
  contact_phone: string
  financial_year_end: string
  bbbee_level: string
  bank_name: string
  bank_account_number: string
  bank_branch_code: string
  notes: string
}

const BIZ_FIELDS: Array<{ key: keyof Omit<BusinessInfo, 'entity'>; label: string; wide?: boolean }> = [
  { key: 'company_name',         label: 'Legal company name',        wide: true },
  { key: 'trading_name',         label: 'Trading / brand name' },
  { key: 'registration_number',  label: 'CIPC registration number' },
  { key: 'vat_number',           label: 'VAT number' },
  { key: 'tax_reference_number', label: 'Income tax reference number' },
  { key: 'registered_address',   label: 'Registered address',        wide: true },
  { key: 'postal_address',       label: 'Postal address',            wide: true },
  { key: 'contact_email',        label: 'Contact email' },
  { key: 'contact_phone',        label: 'Contact phone' },
  { key: 'financial_year_end',   label: 'Financial year end (month)' },
  { key: 'bbbee_level',          label: 'B-BBEE status / level' },
  { key: 'bank_name',            label: 'Bank name' },
  { key: 'bank_account_number',  label: 'Bank account number' },
  { key: 'bank_branch_code',     label: 'Branch code' },
  { key: 'notes',                label: 'Notes',                     wide: true },
]

const EMPTY_BIZ: Omit<BusinessInfo, 'entity'> = {
  company_name: '', trading_name: '', registration_number: '', vat_number: '',
  tax_reference_number: '', registered_address: '', postal_address: '',
  contact_email: '', contact_phone: '', financial_year_end: 'February',
  bbbee_level: '', bank_name: '', bank_account_number: '', bank_branch_code: '', notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

function deadlineBadgeStyle(days: number): React.CSSProperties {
  if (days < 0)  return { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }
  if (days < 30) return { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }
  if (days < 90) return { backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }
  return              { backgroundColor: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }
}

function categoryLabel(cat: string) {
  return { sars: 'SARS', cipc: 'CIPC', bbbee: 'B-BBEE', other: 'Other' }[cat] ?? cat
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ done, total }: { done: number; total: number }) {
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)
  const color = pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444'
  const r = 28, circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#E8E5E0" strokeWidth="7" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round" transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-[17px] tracking-[-0.02em]" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div>
        <p className="font-display font-bold text-[22px] tracking-[-0.02em] text-ks-ink">
          {done} <span className="text-ks-silver font-body font-normal text-[14px]">/ {total}</span>
        </p>
        <p className="font-body text-[11px] text-ks-silver mt-0.5">obligations complete</p>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: 'done' | 'pending' | 'na' }) {
  const cls = status === 'done' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-400' : 'bg-ks-rule'
  return <span className={`flex-shrink-0 w-2 h-2 rounded-full ${cls}`} />
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Compliance() {
  const [entity, setEntity]   = useState<VaultEntity>('keno_sonic')
  const [tab, setTab]         = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [items, setItems]     = useState<ComplianceItem[]>([])
  const [reminders, setReminders] = useState<ComplianceReminder[]>([])
  const [vaultCount, setVaultCount] = useState(0)

  // Companies Act
  const [actFilter, setActFilter] = useState<'all' | 'done' | 'pending' | 'na'>('all')

  // SARS & Tax — VAT threshold tracker
  const [vatRevenue, setVatRevenue] = useState('')

  // Document Vault tab (existing SARS checklist)
  const [taxYear, setTaxYear]   = useState(currentTaxYear())
  const [checklist, setChecklist] = useState<SarsChecklist | null>(null)
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [checklistError, setChecklistError]     = useState<string | null>(null)

  // VAT return upload modal
  const [vatOpen, setVatOpen]       = useState(false)
  const [vatMonth, setVatMonth]     = useState('')
  const [vatFile, setVatFile]       = useState<File | null>(null)
  const [vatUploading, setVatUploading] = useState(false)
  const [vatError, setVatError]     = useState<string | null>(null)
  const vatFileRef = useRef<HTMLInputElement>(null)
  const vatMonths  = /^\d{4}-\d{4}$/.test(taxYear) ? taxYearMonths(taxYear) : []

  // Compliance doc upload modal
  const [docOpen, setDocOpen]       = useState(false)
  const [docType, setDocType]       = useState('tax_clearance')
  const [docFile, setDocFile]       = useState<File | null>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError]     = useState<string | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)

  // Reminders
  const [showResolved, setShowResolved] = useState(false)
  const [showAddForm, setShowAddForm]   = useState(false)
  const [newTitle, setNewTitle]         = useState('')
  const [newDueDate, setNewDueDate]     = useState('')
  const [newRecurrence, setNewRecurrence] = useState<ComplianceReminder['recurrence']>('once')
  const [newCategory, setNewCategory]   = useState<ComplianceReminder['category']>('sars')
  const [newNotes, setNewNotes]         = useState('')
  const [addingReminder, setAddingReminder] = useState(false)
  const [reminderError, setReminderError]   = useState<string | null>(null)

  // Business info settings
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bizInfo, setBizInfo]           = useState<BusinessInfo | null>(null)
  const [bizForm, setBizForm]           = useState<Omit<BusinessInfo, 'entity'>>(EMPTY_BIZ)
  const [bizSaving, setBizSaving]       = useState(false)
  const [bizError, setBizError]         = useState<string | null>(null)

  // ─── Data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('compliance_items').select('*').eq('entity', entity).order('category').order('section'),
      supabase.from('compliance_reminders').select('*').eq('entity', entity).order('due_date'),
      supabase.from('ks_file_vault').select('id', { count: 'exact', head: true }).eq('entity', entity),
      supabase.from('business_info').select('*').eq('entity', entity).maybeSingle(),
    ]).then(([itemsRes, remindersRes, vaultRes, bizRes]) => {
      setItems((itemsRes.data ?? []) as ComplianceItem[])
      setReminders((remindersRes.data ?? []) as ComplianceReminder[])
      setVaultCount(vaultRes.count ?? 0)
      const biz = bizRes.data as BusinessInfo | null
      setBizInfo(biz)
      setBizForm(biz ? { ...EMPTY_BIZ, ...biz } : EMPTY_BIZ)
    }).finally(() => setLoading(false))
  }, [entity])

  useEffect(() => {
    if (tab !== 'vault') return
    setChecklistLoading(true)
    setChecklistError(null)
    getSarsChecklist(entity, taxYear)
      .then(setChecklist)
      .catch(e => setChecklistError(String(e)))
      .finally(() => setChecklistLoading(false))
  }, [entity, taxYear, tab])

  // ─── Computed ───────────────────────────────────────────────────────────────

  const score        = computeComplianceScore(items)
  const actItems     = items.filter(i => i.category === 'companies_act')
  const today        = new Date()
  const in60Days     = new Date(today.getTime() + 60 * 86400000)
  const upcoming     = reminders.filter(r => !r.resolved && new Date(r.due_date) <= in60Days)
  const overdue      = reminders.filter(r => !r.resolved && new Date(r.due_date) < today)
  const vatPct       = Math.min(100, Math.round((parseFloat(vatRevenue.replace(/\s/g, '') || '0') / 1_000_000) * 100))
  const vatColor     = vatPct >= 90 ? '#EF4444' : vatPct >= 70 ? '#F59E0B' : '#22C55E'

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function toggleItem(item: ComplianceItem) {
    if (item.status === 'na') return
    const next = item.status === 'done' ? 'pending' : 'done'
    await supabase.from('compliance_items')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: next } : i))
  }

  async function resolveReminder(id: string) {
    await supabase.from('compliance_reminders').update({ resolved: true }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, resolved: true } : r))
  }

  async function addReminder() {
    if (!newTitle || !newDueDate) return
    setAddingReminder(true)
    setReminderError(null)
    const { data, error } = await supabase.from('compliance_reminders')
      .insert({ entity, title: newTitle, due_date: newDueDate, recurrence: newRecurrence, category: newCategory, notes: newNotes || null })
      .select().single()
    if (error) { setReminderError(error.message); setAddingReminder(false); return }
    setReminders(prev => [...prev, data as ComplianceReminder].sort((a, b) => a.due_date.localeCompare(b.due_date)))
    setNewTitle(''); setNewDueDate(''); setNewNotes(''); setShowAddForm(false)
    setAddingReminder(false)
  }

  async function handleVatUpload() {
    if (!vatMonth || !vatFile) return
    setVatUploading(true); setVatError(null)
    try {
      await uploadDocument(vatFile, {
        entity, docType: 'vat201',
        description: `VAT201_${formatMonth(vatMonth).replace(' ', '_')}`,
        date: `${vatMonth}-01`, status: 'final', tags: [vatMonth],
      })
      setVatOpen(false); setVatMonth(''); setVatFile(null)
      if (vatFileRef.current) vatFileRef.current.value = ''
      getSarsChecklist(entity, taxYear).then(setChecklist).catch(() => {})
    } catch (err) {
      setVatError(err instanceof Error ? err.message : String(err))
    } finally { setVatUploading(false) }
  }

  async function saveBusinessInfo() {
    setBizSaving(true)
    setBizError(null)
    const { error } = await supabase
      .from('business_info')
      .upsert({ entity, ...bizForm, updated_at: new Date().toISOString() })
    if (error) { setBizError(error.message); setBizSaving(false); return }
    setBizInfo({ entity, ...bizForm })
    setSettingsOpen(false)
    setBizSaving(false)
  }

  async function handleDocUpload() {
    if (!docFile) return
    setDocUploading(true); setDocError(null)
    try {
      await uploadDocument(docFile, {
        entity, docType: docType as Parameters<typeof uploadDocument>[1]['docType'],
        description: docType.replace(/_/g, ' '),
        date: new Date(), status: 'final',
      })
      setDocOpen(false); setDocFile(null)
      if (docFileRef.current) docFileRef.current.value = ''
      getSarsChecklist(entity, taxYear).then(setChecklist).catch(() => {})
    } catch (err) {
      setDocError(err instanceof Error ? err.message : String(err))
    } finally { setDocUploading(false) }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'companies_act',label: 'Companies Act' },
    { id: 'sars_tax',     label: 'SARS & Tax' },
    { id: 'vault',        label: 'Document Vault' },
    { id: 'reminders',    label: 'Reminders' },
  ]

  return (
    <div className="px-4 sm:px-10 py-6 sm:py-10 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <MicroLabel>Compliance Centre</MicroLabel>
          <h2 className="font-display font-bold text-[22px] sm:text-[24px] tracking-[-0.02em] text-ks-ink mt-1">Compliance</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={entity}
            onChange={e => setEntity(e.target.value as VaultEntity)}
            className="font-body text-[11px] px-3 py-2 bg-white border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink"
          >
            <option value="keno_sonic">Keno Sonic</option>
            <option value="giggle_factory">Giggle Factory</option>
          </select>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Business info settings"
            className="px-2.5 py-2 border border-ks-rule text-ks-silver hover:text-ks-ink hover:border-ks-ink transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 mb-6 border-b border-ks-hairline overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-body font-medium text-[10px] uppercase tracking-[0.1em] px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'border-ks-lava text-ks-lava'
                : 'border-transparent text-ks-silver hover:text-ks-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-body text-[12px] text-ks-silver">Loading…</p>
      ) : (
        <>
          {/* ═══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Score card */}
              <div className="bg-white border border-ks-hairline px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
                <ScoreGauge done={score.done} total={score.total} />
                <div className="flex gap-5">
                  {[
                    { label: 'Done',    count: score.done,    color: 'text-green-600' },
                    { label: 'Pending', count: score.pending, color: 'text-yellow-600' },
                    { label: 'N/A',     count: items.filter(i => i.status === 'na').length, color: 'text-ks-silver' },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="text-center">
                      <p className={`font-display font-bold text-[20px] tracking-[-0.02em] ${color}`}>{count}</p>
                      <p className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Vault files',          value: vaultCount,        color: 'text-ks-ink' },
                  { label: 'Upcoming (60 days)',    value: upcoming.length,   color: upcoming.length  > 0 ? 'text-yellow-600' : 'text-ks-ink' },
                  { label: 'Overdue',               value: overdue.length,    color: overdue.length   > 0 ? 'text-red-600'    : 'text-ks-ink' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white border border-ks-hairline p-4 text-center">
                    <p className={`font-display font-bold text-[24px] tracking-[-0.02em] ${color}`}>{value}</p>
                    <p className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Upcoming deadlines */}
              {upcoming.length > 0 && (
                <div className="bg-white border border-ks-hairline">
                  <div className="px-5 py-3 border-b border-ks-hairline">
                    <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">Upcoming — next 60 days</p>
                  </div>
                  {upcoming.map(r => {
                    const days = daysUntil(r.due_date)
                    const style = deadlineBadgeStyle(days)
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-ks-hairline last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-[13px] text-ks-ink truncate">{r.title}</p>
                          <p className="font-body text-[11px] text-ks-silver mt-0.5">
                            {new Date(r.due_date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                            &nbsp;·&nbsp;{categoryLabel(r.category)}
                          </p>
                        </div>
                        <span className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2 py-1 border rounded-ks flex-shrink-0" style={style}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {upcoming.length === 0 && (
                <div className="bg-white border border-ks-hairline p-10 text-center">
                  <p className="font-body text-[12px] text-ks-silver">No deadlines in the next 60 days.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ COMPANIES ACT ═════════════════════════════════════════════════ */}
          {tab === 'companies_act' && (
            <div>
              {/* Filter + score */}
              <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div className="flex gap-1">
                  {(['all', 'done', 'pending', 'na'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setActFilter(f)}
                      className={`font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 border transition-colors ${
                        actFilter === f
                          ? 'border-ks-ink text-ks-ink bg-ks-ink/5'
                          : 'border-ks-rule text-ks-silver hover:text-ks-ink'
                      }`}
                    >
                      {f === 'na' ? 'N/A' : f}
                    </button>
                  ))}
                </div>
                <p className="font-body text-[11px] text-ks-silver">
                  {actItems.filter(i => i.status === 'done').length} / {actItems.filter(i => i.status !== 'na').length} done
                </p>
              </div>

              <div className="bg-white border border-ks-hairline">
                {actItems
                  .filter(i => actFilter === 'all' || i.status === actFilter)
                  .map(item => (
                    <div key={item.id} className="flex items-start gap-4 px-5 py-4 border-b border-ks-hairline last:border-0">
                      <StatusDot status={item.status} />
                      <div className="flex-1 min-w-0">
                        {item.section && (
                          <span className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver mr-2">{item.section}</span>
                        )}
                        <p className="font-body font-medium text-[13px] text-ks-ink inline">{item.title}</p>
                        <p className="font-body text-[11px] text-ks-silver mt-1">{item.description}</p>
                      </div>
                      {item.status !== 'na' && (
                        <button
                          onClick={() => toggleItem(item)}
                          className={`flex-shrink-0 font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 border transition-colors ${
                            item.status === 'done'
                              ? 'border-green-300 text-green-700 hover:border-red-300 hover:text-red-600'
                              : 'border-ks-rule text-ks-silver hover:border-green-400 hover:text-green-700'
                          }`}
                        >
                          {item.status === 'done' ? 'Done ✓' : 'Mark done'}
                        </button>
                      )}
                      {item.status === 'na' && (
                        <span className="flex-shrink-0 font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver">N/A</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ═══ SARS & TAX ════════════════════════════════════════════════════ */}
          {tab === 'sars_tax' && (
            <div className="space-y-6">
              {/* VAT threshold tracker */}
              <div className="bg-white border border-ks-hairline px-6 py-5">
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-4">VAT Registration Threshold Tracker</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-body text-[12px] text-ks-silver flex-shrink-0">Rolling 12-month revenue (R)</span>
                  <input
                    type="number"
                    value={vatRevenue}
                    onChange={e => setVatRevenue(e.target.value)}
                    placeholder="0"
                    className="font-body text-[13px] px-3 py-2 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink w-40"
                  />
                  <span className="font-body text-[12px] text-ks-silver">of R1,000,000</span>
                </div>
                <div className="w-full bg-ks-smoke rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${vatPct}%`, backgroundColor: vatColor }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="font-body text-[10px] text-ks-silver">{vatPct}% of threshold</span>
                  {vatPct >= 90 && (
                    <span className="font-body font-medium text-[10px] text-red-600">VAT registration required</span>
                  )}
                  {vatPct >= 70 && vatPct < 90 && (
                    <span className="font-body font-medium text-[10px] text-yellow-600">Approaching threshold — plan ahead</span>
                  )}
                </div>
              </div>

              {/* Deadline timeline */}
              <div>
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-3">SARS Deadline Timeline</p>
                <div className="bg-white border border-ks-hairline">
                  {reminders
                    .filter(r => !r.resolved)
                    .map(r => {
                      const days  = daysUntil(r.due_date)
                      const style = deadlineBadgeStyle(days)
                      return (
                        <div key={r.id} className="flex items-center gap-4 px-5 py-4 border-b border-ks-hairline last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-body font-medium text-[13px] text-ks-ink">{r.title}</p>
                            <p className="font-body text-[11px] text-ks-silver mt-0.5">
                              {new Date(r.due_date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                              &nbsp;·&nbsp;{categoryLabel(r.category)}&nbsp;·&nbsp;{r.recurrence}
                            </p>
                            {r.notes && <p className="font-body text-[10px] text-ks-silver mt-0.5 italic">{r.notes}</p>}
                          </div>
                          <span className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2 py-1 border rounded-ks flex-shrink-0" style={style}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                          </span>
                        </div>
                      )
                    })}
                  {reminders.filter(r => !r.resolved).length === 0 && (
                    <p className="px-5 py-8 font-body text-[12px] text-ks-silver text-center">No active deadlines.</p>
                  )}
                </div>
              </div>

              {/* SARS compliance items */}
              <div>
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-3">SARS & B-BBEE Obligations</p>
                <div className="bg-white border border-ks-hairline">
                  {items.filter(i => i.category === 'sars' || i.category === 'bbbee').map(item => (
                    <div key={item.id} className="flex items-start gap-4 px-5 py-4 border-b border-ks-hairline last:border-0">
                      <StatusDot status={item.status} />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-medium text-[13px] text-ks-ink">{item.title}</p>
                        <p className="font-body text-[11px] text-ks-silver mt-0.5">{item.description}</p>
                      </div>
                      {item.status !== 'na' && (
                        <button
                          onClick={() => toggleItem(item)}
                          className={`flex-shrink-0 font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 border transition-colors ${
                            item.status === 'done'
                              ? 'border-green-300 text-green-700 hover:border-red-300 hover:text-red-600'
                              : 'border-ks-rule text-ks-silver hover:border-green-400 hover:text-green-700'
                          }`}
                        >
                          {item.status === 'done' ? 'Done ✓' : 'Mark done'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ DOCUMENT VAULT ════════════════════════════════════════════════ */}
          {tab === 'vault' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap gap-3 items-center">
                <input
                  type="text"
                  value={taxYear}
                  onChange={e => setTaxYear(e.target.value)}
                  placeholder="e.g. 2025-2026"
                  className="font-body text-[11px] px-3 py-2 bg-white border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink w-36"
                />
                <button onClick={() => setVatOpen(true)}
                  className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2 border border-ks-lava text-ks-lava hover:bg-ks-lava hover:text-white transition-colors">
                  + Log VAT Return
                </button>
                <button onClick={() => setDocOpen(true)}
                  className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2 border border-ks-rule text-ks-silver hover:text-ks-ink hover:border-ks-ink transition-colors">
                  + Upload Compliance Doc
                </button>
                <a href="https://drive.google.com/drive/folders/18EFdBXl0ps1TGQmKcnKvQaTP7RaZA9JM"
                  target="_blank" rel="noopener noreferrer"
                  className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2 border border-ks-rule text-ks-silver hover:text-ks-ink transition-colors ml-auto">
                  Open in Drive →
                </a>
              </div>

              {checklistError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
                  <span className="text-red-500 text-[13px] mt-px">✕</span>
                  <p className="font-body text-[12px] text-red-700">{checklistError}</p>
                </div>
              )}

              {checklistLoading ? (
                <p className="font-body text-[12px] text-ks-silver">Loading…</p>
              ) : checklist && (
                <>
                  {/* Score */}
                  <div className="bg-white border border-ks-hairline px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
                    <ScoreGauge done={checklist.score.done} total={checklist.score.total} />
                    <div className="flex gap-5">
                      {[
                        { label: 'On file',  count: checklist.items.filter(i => i.status === 'ok').length,      color: 'text-green-600' },
                        { label: 'Partial',  count: checklist.items.filter(i => i.status === 'partial').length,  color: 'text-yellow-600' },
                        { label: 'Missing',  count: checklist.items.filter(i => i.status === 'missing').length,  color: 'text-red-500' },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="text-center">
                          <p className={`font-display font-bold text-[20px] tracking-[-0.02em] ${color}`}>{count}</p>
                          <p className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-white border border-ks-hairline">
                    <div className="px-5 py-3 border-b border-ks-hairline">
                      <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">
                        SARS Document Checklist — {taxYear}
                      </p>
                    </div>
                    {checklist.items.map(item => {
                      const dotCls = item.status === 'ok' ? 'bg-green-500' : item.status === 'partial' ? 'bg-yellow-400' : 'bg-red-400'
                      const labelText = item.status === 'ok'
                        ? `${item.files.length} file${item.files.length !== 1 ? 's' : ''}`
                        : item.status === 'partial' ? `${item.files.length} / 12 months` : 'Missing'
                      const labelColor = item.status === 'ok' ? 'text-green-700' : item.status === 'partial' ? 'text-yellow-700' : 'text-red-600'
                      return (
                        <div key={item.id} className="border-b border-ks-hairline last:border-0 px-5 py-4">
                          <div className="flex items-center gap-4">
                            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${dotCls}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-body font-medium text-[13px] text-ks-ink">{item.label}</p>
                              <p className="font-body text-[11px] text-ks-silver mt-0.5">{item.description}</p>
                            </div>
                            <span className={`flex-shrink-0 font-body font-medium text-[9px] uppercase tracking-[0.1em] ${labelColor}`}>
                              {labelText}
                            </span>
                          </div>
                          {item.files.length > 0 && (
                            <div className="mt-3 ml-6 space-y-1.5">
                              {item.files.map(f => (
                                <div key={f.id} className="flex items-center gap-3">
                                  <span className="font-body text-[11px] text-ks-ink truncate flex-1">{f.file_name}</span>
                                  {f.drive_file_id && (
                                    <a href={`https://drive.google.com/file/d/${f.drive_file_id}/view`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-lava hover:underline flex-shrink-0">
                                      Drive →
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.missingMonths && item.missingMonths.length > 0 && (
                            <div className="mt-3 ml-6">
                              <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-red-500 mb-1.5">Missing months</p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.missingMonths.map(m => (
                                  <span key={m} className="font-body text-[10px] px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 rounded-ks">
                                    {formatMonth(m)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ REMINDERS ═════════════════════════════════════════════════════ */}
          {tab === 'reminders' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowResolved(v => !v)}
                  className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver hover:text-ks-ink transition-colors"
                >
                  {showResolved ? 'Hide resolved' : 'Show resolved'}
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowAddForm(v => !v)}
                  className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2 border border-ks-lava text-ks-lava hover:bg-ks-lava hover:text-white transition-colors"
                >
                  + Add reminder
                </button>
              </div>

              {/* Add form */}
              {showAddForm && (
                <div className="bg-white border border-ks-hairline px-5 py-5 space-y-3">
                  <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver">New Reminder</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      className="font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink" />
                    <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                      className="font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink" />
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value as ComplianceReminder['category'])}
                      className="font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink">
                      <option value="sars">SARS</option>
                      <option value="cipc">CIPC</option>
                      <option value="bbbee">B-BBEE</option>
                      <option value="other">Other</option>
                    </select>
                    <select value={newRecurrence} onChange={e => setNewRecurrence(e.target.value as ComplianceReminder['recurrence'])}
                      className="font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink">
                      <option value="once">Once</option>
                      <option value="monthly">Monthly</option>
                      <option value="biannual">Bi-annual</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Notes (optional)" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                    className="w-full font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink" />
                  {reminderError && <p className="font-body text-[11px] text-red-600">{reminderError}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setShowAddForm(false); setReminderError(null) }}
                      className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2 border border-ks-rule text-ks-silver hover:text-ks-ink transition-colors">
                      Cancel
                    </button>
                    <button onClick={addReminder} disabled={!newTitle || !newDueDate || addingReminder}
                      className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2 bg-ks-lava text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                      {addingReminder ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="bg-white border border-ks-hairline">
                {reminders
                  .filter(r => showResolved || !r.resolved)
                  .map(r => {
                    const days  = daysUntil(r.due_date)
                    const style = r.resolved ? { backgroundColor: '#F9FAFB', color: '#9CA3AF', borderColor: '#E5E7EB' } : deadlineBadgeStyle(days)
                    return (
                      <div key={r.id} className={`flex items-start gap-4 px-5 py-4 border-b border-ks-hairline last:border-0 ${r.resolved ? 'opacity-50' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-body font-medium text-[13px] text-ks-ink">{r.title}</p>
                            <span className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver">{categoryLabel(r.category)}</span>
                            <span className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver">{r.recurrence}</span>
                          </div>
                          <p className="font-body text-[11px] text-ks-silver mt-0.5">
                            {new Date(r.due_date + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {r.notes && <p className="font-body text-[10px] text-ks-silver mt-0.5 italic">{r.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2 py-1 border rounded-ks" style={style}>
                            {r.resolved ? 'Resolved' : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                          </span>
                          {!r.resolved && (
                            <button onClick={() => resolveReminder(r.id)}
                              className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1 border border-green-300 text-green-700 hover:bg-green-50 transition-colors">
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                {reminders.filter(r => showResolved || !r.resolved).length === 0 && (
                  <p className="px-5 py-8 font-body text-[12px] text-ks-silver text-center">No reminders to show.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── VAT Return Upload Modal ─────────────────────────────────────────── */}
      {vatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm p-6">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-5">Log VAT Return</p>
            <div className="space-y-4">
              <div>
                <label className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver block mb-1">Month</label>
                <select value={vatMonth} onChange={e => setVatMonth(e.target.value)}
                  className="w-full font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink">
                  <option value="">Select month…</option>
                  {vatMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver block mb-1">File (PDF)</label>
                <input ref={vatFileRef} type="file" accept=".pdf,.PDF"
                  onChange={e => setVatFile(e.target.files?.[0] ?? null)}
                  className="font-body text-[11px] text-ks-slate w-full" />
              </div>
              {vatError && <p className="font-body text-[11px] text-red-600">{vatError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setVatOpen(false); setVatError(null); setVatMonth(''); setVatFile(null) }}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2.5 border border-ks-rule text-ks-silver hover:text-ks-ink transition-colors">
                Cancel
              </button>
              <button onClick={handleVatUpload} disabled={!vatMonth || !vatFile || vatUploading}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2.5 bg-ks-lava text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                {vatUploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Business Info Settings Modal ────────────────────────────────────── */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
          <div className="relative bg-white h-full w-full max-w-lg flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ks-hairline flex-shrink-0">
              <div>
                <p className="font-body font-medium text-[9px] uppercase tracking-[0.15em] text-ks-lava">Business Info</p>
                <p className="font-display font-bold text-[17px] tracking-[-0.02em] text-ks-ink mt-0.5">
                  {entity === 'keno_sonic' ? 'Keno Sonic' : 'Giggle Factory'}
                </p>
              </div>
              <button
                onClick={() => { setSettingsOpen(false); setBizError(null) }}
                className="text-ks-silver hover:text-ks-ink transition-colors text-[20px] leading-none"
              >×</button>
            </div>

            {/* Quick-view strip (read-only summary when saved) */}
            {bizInfo?.vat_number && (
              <div className="px-6 py-3 bg-ks-smoke border-b border-ks-hairline flex flex-wrap gap-x-6 gap-y-1 flex-shrink-0">
                {bizInfo.vat_number && (
                  <span className="font-body text-[11px] text-ks-silver">VAT: <span className="text-ks-ink font-medium">{bizInfo.vat_number}</span></span>
                )}
                {bizInfo.registration_number && (
                  <span className="font-body text-[11px] text-ks-silver">Reg: <span className="text-ks-ink font-medium">{bizInfo.registration_number}</span></span>
                )}
                {bizInfo.tax_reference_number && (
                  <span className="font-body text-[11px] text-ks-silver">Tax ref: <span className="text-ks-ink font-medium">{bizInfo.tax_reference_number}</span></span>
                )}
              </div>
            )}

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BIZ_FIELDS.map(({ key, label, wide }) => (
                  <div key={key} className={wide ? 'sm:col-span-2' : ''}>
                    <label className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver block mb-1">
                      {label}
                    </label>
                    {key === 'registered_address' || key === 'postal_address' || key === 'notes' ? (
                      <textarea
                        rows={2}
                        value={bizForm[key]}
                        onChange={e => setBizForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={bizForm[key]}
                        onChange={e => setBizForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink"
                      />
                    )}
                  </div>
                ))}
              </div>
              {bizError && <p className="font-body text-[11px] text-red-600 mt-4">{bizError}</p>}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-ks-hairline flex-shrink-0">
              <button
                onClick={() => { setSettingsOpen(false); setBizError(null) }}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-5 py-2.5 border border-ks-rule text-ks-silver hover:text-ks-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveBusinessInfo}
                disabled={bizSaving}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-5 py-2.5 bg-ks-lava text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {bizSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Compliance Doc Upload Modal ─────────────────────────────────────── */}
      {docOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-sm p-6">
            <p className="font-body font-medium text-[9px] uppercase tracking-[0.12em] text-ks-silver mb-5">Upload Compliance Document</p>
            <div className="space-y-4">
              <div>
                <label className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver block mb-1">Document type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full font-body text-[12px] px-3 py-2.5 bg-ks-smoke border border-ks-rule text-ks-ink focus:outline-none focus:border-ks-ink">
                  <option value="tax_clearance">Tax Clearance Certificate</option>
                  <option value="bbbee_certificate">B-BBEE Certificate / Affidavit</option>
                  <option value="cipc_certificate">CIPC Certificate / Annual Return</option>
                  <option value="itr14">ITR14 Income Tax Return</option>
                  <option value="irp6">IRP6 Provisional Tax Return</option>
                  <option value="emp201">EMP201 PAYE Return</option>
                  <option value="bank_statement">Bank Statement</option>
                </select>
              </div>
              <div>
                <label className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver block mb-1">File (PDF)</label>
                <input ref={docFileRef} type="file" accept=".pdf,.PDF"
                  onChange={e => setDocFile(e.target.files?.[0] ?? null)}
                  className="font-body text-[11px] text-ks-slate w-full" />
              </div>
              {docError && <p className="font-body text-[11px] text-red-600">{docError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setDocOpen(false); setDocError(null); setDocFile(null) }}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2.5 border border-ks-rule text-ks-silver hover:text-ks-ink transition-colors">
                Cancel
              </button>
              <button onClick={handleDocUpload} disabled={!docFile || docUploading}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] px-4 py-2.5 bg-ks-lava text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                {docUploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
