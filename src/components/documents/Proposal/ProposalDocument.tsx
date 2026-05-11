import { useEffect, useState } from 'react'
import type { Client, ProposalContent, KSDocument } from '../../../types'
import { DocumentShell } from '../DocumentShell'
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
const sectionHeading: React.CSSProperties = {
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
  fontSize: '16px', color: '#0D0D0D', marginBottom: '10px',
}
const bodyText: React.CSSProperties = { fontSize: '13px', color: '#3A3A3A', lineHeight: 1.7 }
const divider: React.CSSProperties = { borderTop: '0.5px solid #E8E5E0', margin: '36px 0' }

export function ProposalDocument({ document, client, readonly = false }: Props) {
  const raw = document.content as ProposalContent
  const [content, setContent] = useState<ProposalContent>({
    intro: raw.intro ?? '',
    sections: raw.sections ?? [{ id: crypto.randomUUID(), heading: 'Our Approach', body: 'Describe your strategy here.' }],
    deliverables: raw.deliverables ?? ['Deliverable one'],
    timeline: raw.timeline ?? [{ id: crypto.randomUUID(), milestone: 'Kickoff', date: '' }],
    pricing_summary: raw.pricing_summary ?? 0,
    terms: raw.terms ?? 'Payment is due within 14 days of invoice. Work begins upon receipt of 50% deposit.',
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
    setContent(c => ({ ...c, sections: [...c.sections, { id: crypto.randomUUID(), heading: 'New Section', body: 'Write here…' }] }))
  }
  function removeSection(id: string) {
    setContent(c => ({ ...c, sections: c.sections.filter(s => s.id !== id) }))
  }
  function addDeliverable() {
    setContent(c => ({ ...c, deliverables: [...c.deliverables, 'New deliverable'] }))
  }
  function removeDeliverable(i: number) {
    setContent(c => ({ ...c, deliverables: c.deliverables.filter((_, idx) => idx !== i) }))
  }
  function addMilestone() {
    setContent(c => ({ ...c, timeline: [...c.timeline, { id: crypto.randomUUID(), milestone: 'New Milestone', date: '' }] }))
  }
  function removeMilestone(id: string) {
    setContent(c => ({ ...c, timeline: c.timeline.filter(t => t.id !== id) }))
  }

  return (
    <div>
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver">Click any value to edit inline.</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => exportToPDF('document-content', document.reference_number)}>Export PDF</Button>
            <Button variant="dark" size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      )}

      <DocumentShell document={document} client={client}>

        {/* Intro */}
        <div style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Introduction</span>
          {readonly ? (
            <p style={bodyText}>{content.intro}</p>
          ) : (
            <p contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, intro: e.target.innerText }))} style={bodyText}>{content.intro || 'Write your proposal introduction here…'}</p>
          )}
        </div>

        <div style={divider} />

        {/* Sections */}
        <div style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Scope & Strategy</span>
          {content.sections.map(section => (
            <div key={section.id} style={{ marginBottom: '28px', position: 'relative' }}>
              {readonly ? (
                <>
                  <p style={sectionHeading}>{section.heading}</p>
                  <p style={bodyText}>{section.body}</p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <p contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, sections: c.sections.map(s => s.id === section.id ? { ...s, heading: e.target.innerText } : s) }))} style={sectionHeading}>{section.heading}</p>
                    <button className="no-print ml-3 flex-shrink-0 bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => removeSection(section.id)}>×</button>
                  </div>
                  <p contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, sections: c.sections.map(s => s.id === section.id ? { ...s, body: e.target.innerText } : s) }))} style={bodyText}>{section.body}</p>
                </>
              )}
            </div>
          ))}
          {!readonly && (
            <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={addSection}>+ Add Section</button>
          )}
        </div>

        <div style={divider} />

        {/* Deliverables */}
        <div style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Deliverables</span>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {content.deliverables.map((d, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F56E0F', flexShrink: 0, marginTop: '6px' }} />
                {readonly ? (
                  <span style={bodyText}>{d}</span>
                ) : (
                  <>
                    <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, deliverables: c.deliverables.map((x, idx) => idx === i ? e.target.innerText : x) }))} style={{ ...bodyText, flex: 1 }}>{d}</span>
                    <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors flex-shrink-0" onClick={() => removeDeliverable(i)}>×</button>
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
        <div style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Timeline</span>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', width: '70%' }}>Milestone</th>
                <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Target Date</th>
                {!readonly && <th style={{ width: '32px' }} />}
              </tr>
            </thead>
            <tbody>
              {content.timeline.map(row => (
                <tr key={row.id}>
                  <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0' }}>
                    {readonly ? (
                      <span style={{ fontSize: '13px', color: '#0D0D0D', fontWeight: 500 }}>{row.milestone}</span>
                    ) : (
                      <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, timeline: c.timeline.map(t => t.id === row.id ? { ...t, milestone: e.target.innerText } : t) }))} style={{ fontSize: '13px', color: '#0D0D0D', fontWeight: 500 }}>{row.milestone}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0' }}>
                    {readonly ? (
                      <span style={{ fontSize: '12px', color: '#9A9A9A' }}>{row.date || '—'}</span>
                    ) : (
                      <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, timeline: c.timeline.map(t => t.id === row.id ? { ...t, date: e.target.innerText } : t) }))} style={{ fontSize: '12px', color: '#9A9A9A' }}>{row.date || 'e.g. Week 2'}</span>
                    )}
                  </td>
                  {!readonly && (
                    <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', textAlign: 'right' }}>
                      <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => removeMilestone(row.id)}>×</button>
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

        {/* Investment */}
        <div style={{ marginBottom: '36px' }}>
          <span style={microLabel}>Investment</span>
          <div style={{ backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D0D0D' }}>Total Project Value (incl. VAT)</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: '#F56E0F' }}>
              R{' '}
              {readonly ? (
                <span>{fmt(content.pricing_summary)}</span>
              ) : (
                <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, pricing_summary: parseFloat(e.target.innerText.replace(/[^\d.-]/g, '')) || 0 }))}>{fmt(content.pricing_summary)}</span>
              )}
            </span>
          </div>
        </div>

        <div style={divider} />

        {/* Terms */}
        <div>
          <span style={microLabel}>Terms & Conditions</span>
          {readonly ? (
            <p style={bodyText}>{content.terms}</p>
          ) : (
            <p contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, terms: e.target.innerText }))} style={bodyText}>{content.terms}</p>
          )}
        </div>

      </DocumentShell>
    </div>
  )
}
