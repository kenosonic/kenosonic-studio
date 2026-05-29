import { useEffect, useState } from 'react'
import type { Client, ContractContent, KSDocument } from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Editable } from '../Editable'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

const fmt = (n: number) => new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const microLabel: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F',
  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em',
  marginBottom: '16px', display: 'block',
}
const bodyText: React.CSSProperties = { fontSize: '13px', color: '#3A3A3A', lineHeight: 1.7 }
const divider: React.CSSProperties = { borderTop: '0.5px solid #E8E5E0', margin: '36px 0' }

export function ContractDocument({ document, client, readonly = false }: Props) {
  const raw = document.content as ContractContent
  const today = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  const [content, setContent] = useState<ContractContent>({
    intro: raw.intro ?? `This Service Agreement ("Agreement") is entered into as of ${today}, between Kenosonic Interactive (Pty) Ltd ("Service Provider") and ${client.company_name} ("Client").`,
    sections: raw.sections ?? [
      { id: crypto.randomUUID(), heading: 'Scope of Services', body: 'The Service Provider agrees to deliver the services as outlined in the attached proposal or quote.' },
      { id: crypto.randomUUID(), heading: 'Intellectual Property', body: 'Upon receipt of full payment, all deliverables become the exclusive property of the Client.' },
      { id: crypto.randomUUID(), heading: 'Confidentiality', body: 'Both parties agree to keep all project details, pricing, and communications strictly confidential.' },
    ],
    deliverables: raw.deliverables ?? ['Final deliverable as agreed'],
    timeline: raw.timeline ?? [{ id: crypto.randomUUID(), milestone: 'Project Start', date: '' }],
    payment_terms: raw.payment_terms ?? '50% deposit required to commence work. Remaining 50% due on completion.',
    total_value: raw.total_value ?? 0,
    terms: raw.terms ?? 'Either party may terminate this agreement with 14 days written notice. In the event of termination, the Client is liable for all work completed to date.',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await updateDocumentContent(document.id, content as unknown as Record<string, unknown>)
    setSaving(false)
  }

  useEffect(() => {
    if (readonly) return
    const t = setTimeout(save, 2000)
    return () => clearTimeout(t)
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  function addSection() {
    setContent(c => ({ ...c, sections: [...c.sections, { id: crypto.randomUUID(), heading: 'New Clause', body: 'Write clause content here…' }] }))
  }
  function addDeliverable() {
    setContent(c => ({ ...c, deliverables: [...c.deliverables, 'New deliverable'] }))
  }
  function addMilestone() {
    setContent(c => ({ ...c, timeline: [...c.timeline, { id: crypto.randomUUID(), milestone: 'New Milestone', date: '' }] }))
  }

  return (
    <div>
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver hidden sm:block">Click any value to edit inline.</p>
          <div className="flex gap-2 ml-auto sm:ml-0 sm:gap-3">
            <Button variant="outline" size="sm" onClick={() => exportToPDF('document-content', document.reference_number)} title="Export PDF">
              <svg className="sm:hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Button variant="dark" size="sm" onClick={save} disabled={saving} title="Save">
              <span className="sm:hidden">{saving ? '…' : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}</span>
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
            </Button>
          </div>
        </div>
      )}

      <DocumentShell document={document} client={client}>

        {/* Parties */}
        <div style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Parties to this Agreement</span>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ flex: 1, backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '20px' }}>
              <p style={{ fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Service Provider</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', marginBottom: '4px' }}>Kenosonic Interactive (Pty) Ltd</p>
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>Reg. No. 2026/021166/07</p>
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>Johannesburg, South Africa</p>
            </div>
            <div style={{ flex: 1, backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '20px' }}>
              <p style={{ fontSize: '9px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Client</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', marginBottom: '4px' }}>{client.company_name}</p>
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>{client.contact_name}</p>
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>{client.contact_email}</p>
            </div>
          </div>
        </div>

        {/* Preamble */}
        <div className="print-break" style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Preamble</span>
          {readonly ? (
            <p style={bodyText}>{content.intro}</p>
          ) : (
            <Editable tag="p" value={content.intro} onSave={v => setContent(c => ({ ...c, intro: v }))} style={bodyText} />
          )}
        </div>

        <div style={divider} />

        {/* Clauses */}
        <div className="print-break" style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Terms of Service</span>
          {content.sections.map((section, idx) => (
            <div key={section.id} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D' }}>
                  <span style={{ color: '#F56E0F', marginRight: '8px' }}>{idx + 1}.</span>
                  {readonly ? section.heading : (
                    <Editable value={section.heading} onSave={v => setContent(c => ({ ...c, sections: c.sections.map(s => s.id === section.id ? { ...s, heading: v } : s) }))} />
                  )}
                </p>
                {!readonly && (
                  <button className="no-print ml-3 flex-shrink-0 bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, sections: c.sections.filter(s => s.id !== section.id) }))}>×</button>
                )}
              </div>
              {readonly ? (
                <p style={{ ...bodyText, paddingLeft: '22px' }}>{section.body}</p>
              ) : (
                <Editable tag="p" value={section.body} onSave={v => setContent(c => ({ ...c, sections: c.sections.map(s => s.id === section.id ? { ...s, body: v } : s) }))} style={{ ...bodyText, paddingLeft: '22px' }} />
              )}
            </div>
          ))}
          {!readonly && (
            <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={addSection}>+ Add Clause</button>
          )}
        </div>

        <div style={divider} />

        {/* Deliverables */}
        <div className="print-break" style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Deliverables</span>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {content.deliverables.map((d, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F56E0F', flexShrink: 0, marginTop: '6px' }} />
                {readonly ? (
                  <span style={bodyText}>{d}</span>
                ) : (
                  <>
                    <Editable value={d} onSave={v => setContent(c => ({ ...c, deliverables: c.deliverables.map((x, idx) => idx === i ? v : x) }))} style={{ ...bodyText, flex: 1 }} />
                    <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors flex-shrink-0" onClick={() => setContent(c => ({ ...c, deliverables: c.deliverables.filter((_, idx) => idx !== i) }))}>×</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {!readonly && (
            <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={addDeliverable}>+ Add Deliverable</button>
          )}
        </div>

        <div style={divider} />

        {/* Timeline */}
        <div className="print-break" style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Project Timeline</span>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', width: '70%' }}>Milestone</th>
                <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Date</th>
                {!readonly && <th style={{ width: '32px' }} />}
              </tr>
            </thead>
            <tbody>
              {content.timeline.map(row => (
                <tr key={row.id}>
                  <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0' }}>
                    {readonly ? <span style={{ fontSize: '13px', color: '#0D0D0D', fontWeight: 500 }}>{row.milestone}</span> : (
                      <Editable value={row.milestone} onSave={v => setContent(c => ({ ...c, timeline: c.timeline.map(t => t.id === row.id ? { ...t, milestone: v } : t) }))} style={{ fontSize: '13px', color: '#0D0D0D', fontWeight: 500 }} />
                    )}
                  </td>
                  <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0' }}>
                    {readonly ? <span style={{ fontSize: '12px', color: '#9A9A9A' }}>{row.date || '—'}</span> : (
                      <Editable value={row.date || 'e.g. 2026-06-15'} onSave={v => setContent(c => ({ ...c, timeline: c.timeline.map(t => t.id === row.id ? { ...t, date: v === 'e.g. 2026-06-15' ? '' : v } : t) }))} style={{ fontSize: '12px', color: '#9A9A9A' }} />
                    )}
                  </td>
                  {!readonly && (
                    <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', textAlign: 'right' }}>
                      <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, timeline: c.timeline.filter(t => t.id !== row.id) }))}>×</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!readonly && (
            <button className="no-print mt-4 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={addMilestone}>+ Add Milestone</button>
          )}
        </div>

        <div style={divider} />

        {/* Payment */}
        <div className="print-break" style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Payment</span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '6px' }}>Payment Terms</p>
              {readonly ? (
                <p style={bodyText}>{content.payment_terms}</p>
              ) : (
                <Editable tag="p" value={content.payment_terms} onSave={v => setContent(c => ({ ...c, payment_terms: v }))} style={bodyText} />
              )}
            </div>
            <div style={{ backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '20px', textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '9px', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Total Value (incl. VAT)</p>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: '#F56E0F' }}>
                R{' '}
                {readonly ? (
                  <span>{fmt(content.total_value)}</span>
                ) : (
                  <Editable value={fmt(content.total_value)} onSave={v => setContent(c => ({ ...c, total_value: parseFloat(v.replace(/[^\d.-]/g, '')) || 0 }))} />
                )}
              </span>
            </div>
          </div>
        </div>

        <div style={divider} />

        {/* Termination */}
        <div className="print-break" style={{ marginBottom: '40px' }}>
          <span style={microLabel}>Termination</span>
          {readonly ? (
            <p style={bodyText}>{content.terms}</p>
          ) : (
            <Editable tag="p" value={content.terms} onSave={v => setContent(c => ({ ...c, terms: v }))} style={bodyText} />
          )}
        </div>

        <div style={divider} />

        {/* Signature block */}
        <div className="print-break print-avoid">
          <span style={microLabel}>Signatures</span>
          <div style={{ display: 'flex', gap: '40px', marginTop: '8px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '40px' }}>For Kenosonic Interactive (Pty) Ltd</p>
              <div style={{ borderTop: '0.5px solid #0D0D0D', paddingTop: '8px' }}>
                <p style={{ fontSize: '12px', color: '#0D0D0D', fontWeight: 500 }}>Authorised Signatory</p>
                <p style={{ fontSize: '11px', color: '#9A9A9A' }}>Date: _______________</p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '40px' }}>For {client.company_name}</p>
              <div style={{ borderTop: '0.5px solid #0D0D0D', paddingTop: '8px' }}>
                <p style={{ fontSize: '12px', color: '#0D0D0D', fontWeight: 500 }}>{client.contact_name}</p>
                <p style={{ fontSize: '11px', color: '#9A9A9A' }}>Date: _______________</p>
              </div>
            </div>
          </div>
        </div>

      </DocumentShell>
    </div>
  )
}
