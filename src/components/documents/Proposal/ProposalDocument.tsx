import { useEffect, useState } from 'react'
import type { Client, ProposalContent, ProposalLineItem, ProposalTimeline, KSDocument } from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

// Style helpers
const micro: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F',
  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em',
  marginBottom: '14px', display: 'block',
}
const body: React.CSSProperties = { fontSize: '13px', color: '#3A3A3A', lineHeight: 1.7 }
const sectionH: React.CSSProperties = {
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
  fontSize: '13px', color: '#0D0D0D', marginBottom: '10px',
}
const hr: React.CSSProperties = { borderTop: '0.5px solid #E8E5E0', margin: '32px 0' }
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0',
  color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em',
  textTransform: 'uppercase',
}
const tdStyle: React.CSSProperties = {
  padding: '12px 0', borderBottom: '0.5px solid #E8E5E0',
  fontSize: '12px', color: '#3A3A3A', verticalAlign: 'top',
}

function BulletList({
  items, bullet = '—', onChange, readonly,
}: {
  items: string[]
  bullet?: string
  onChange?: (items: string[]) => void
  readonly: boolean
}) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '7px' }}>
          <span style={{ color: '#F56E0F', flexShrink: 0, fontSize: '12px', marginTop: '2px' }}>{bullet}</span>
          {readonly || !onChange ? (
            <span style={body}>{item}</span>
          ) : (
            <>
              <span
                contentEditable suppressContentEditableWarning
                onBlur={e => { const u = [...items]; u[i] = e.currentTarget.innerText; onChange(u) }}
                style={{ ...body, flex: 1 }}
              >{item}</span>
              <button
                className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors flex-shrink-0"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              >×</button>
            </>
          )}
        </li>
      ))}
      {!readonly && onChange && (
        <li style={{ marginTop: '8px' }}>
          <button
            className="no-print font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
            onClick={() => onChange([...items, 'New item'])}
          >+ Add</button>
        </li>
      )}
    </ul>
  )
}

function CE({
  value, onSave, style, block = false,
}: {
  value: string
  onSave: (v: string) => void
  style?: React.CSSProperties
  block?: boolean
}) {
  const Tag = block ? 'p' : 'span'
  return (
    <Tag
      contentEditable suppressContentEditableWarning
      onBlur={e => onSave(e.currentTarget.innerText)}
      style={style}
    >{value}</Tag>
  )
}

export function ProposalDocument({ document, client, readonly = false }: Props) {
  const raw = document.content as ProposalContent

  const defaultTimeline: ProposalTimeline[] = [
    { id: crypto.randomUUID(), phase: 'Discovery & Planning', duration: '3 days', deliverable: 'Wireframes / sitemap approved' },
    { id: crypto.randomUUID(), phase: 'Design', duration: '7 days', deliverable: 'Homepage design approved' },
    { id: crypto.randomUUID(), phase: 'Development', duration: '10 days', deliverable: 'Full site ready for review' },
    { id: crypto.randomUUID(), phase: 'Review & Revisions', duration: '5 days', deliverable: 'Final changes implemented' },
    { id: crypto.randomUUID(), phase: 'Launch', duration: '2 days', deliverable: 'Site goes live' },
  ]
  const defaultLineItems: ProposalLineItem[] = [
    { id: crypto.randomUUID(), title: 'Website Design & Development', amount: 5000 },
    { id: crypto.randomUUID(), title: 'Technical Setup & Optimisation', amount: 1500 },
    { id: crypto.randomUUID(), title: 'Training & Documentation', amount: 500 },
  ]

  const [content, setContent] = useState<ProposalContent>({
    valid_until: raw.valid_until ?? '',
    primary_goal: raw.primary_goal ?? 'establish an online presence',
    page_count: raw.page_count ?? 5,
    included_design: raw.included_design ?? [
      'Custom website design tailored to your brand',
      'Up to 5 pages (Home, About, Services, Portfolio, Contact)',
      'Mobile-responsive design (looks great on all devices)',
      'Contact form with email notification setup',
      'Basic SEO optimisation (meta titles, descriptions, alt tags)',
      'Integration with your social media profiles',
      'Google Analytics setup for tracking visitors',
    ],
    included_technical: raw.included_technical ?? [
      'SSL certificate installation (secure https://)',
      'Website speed optimisation',
      'Cross-browser compatibility testing',
    ],
    included_training: raw.included_training ?? [
      'Video tutorial showing how to update content yourself',
      '30 days of technical support after launch (bug fixes only)',
    ],
    excluded_items: raw.excluded_items ?? [
      'Logo design or branding materials',
      'Copywriting (writing website text)',
      'Photography or custom graphics',
      'E-commerce functionality',
      'Ongoing SEO or marketing services',
      'Email marketing setup',
      'Social media management',
    ],
    revision_rounds: raw.revision_rounds ?? 2,
    revision_rate: raw.revision_rate ?? 500,
    client_responsibilities: raw.client_responsibilities ?? [
      'All website content (text, images, logos) within 5 business days of project start',
      'Timely feedback on designs (within 3 business days of each review request)',
      'Access to domain registrar and hosting accounts (if applicable)',
      'One primary point of contact for approvals',
    ],
    timeline: raw.timeline ?? defaultTimeline,
    total_timeline: raw.total_timeline ?? 'Approximately 4 weeks from content delivery to launch',
    line_items: raw.line_items ?? defaultLineItems,
    founders_mode: raw.founders_mode ?? false,
    founders_exchange: raw.founders_exchange ?? [
      'A detailed testimonial upon project completion',
      'Permission to showcase this website in our portfolio',
      'Referrals to anyone you know who needs web services',
    ],
    client_costs: raw.client_costs ?? [
      { id: crypto.randomUUID(), title: 'Domain name registration', cost: '~R150–300/year' },
      { id: crypto.randomUUID(), title: 'Web hosting', cost: '~R50–150/month' },
    ],
    deposit_percent: raw.deposit_percent ?? 50,
    terms: raw.terms ?? [
      { id: crypto.randomUUID(), heading: 'Ownership', body: 'Upon completion, you own all rights to the website design and code. Kenosonic Interactive retains the right to display the work in our portfolio.' },
      { id: crypto.randomUUID(), heading: 'Revisions', body: 'Minor text/image updates during development are included. Major design changes requested after approval stages may incur additional fees.' },
      { id: crypto.randomUUID(), heading: 'Timeline Delays', body: 'If content delivery or feedback is delayed by more than 7 days, the project timeline will be extended accordingly.' },
      { id: crypto.randomUUID(), heading: 'Cancellation', body: 'Either party may cancel with 7 days written notice. Work completed to that point remains your property.' },
      { id: crypto.randomUUID(), heading: 'Hosting & Maintenance', body: 'After launch, you are responsible for hosting fees, domain renewal, and ongoing maintenance. Monthly maintenance packages are available from R500/month.' },
      { id: crypto.randomUUID(), heading: 'Scope Changes', body: 'Any requests outside the defined scope will require a separate proposal and pricing.' },
    ],
    next_steps: raw.next_steps ?? [
      'Review this proposal and reach out with any questions',
      'Reply with "I accept the proposal as outlined" or sign below',
      'Complete the onboarding questionnaire we\'ll send through',
      'Provide all content assets within 5 business days',
    ],
    validity_days: raw.validity_days ?? 14,
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

  const subtotal = content.line_items.reduce((s, i) => s + i.amount, 0)
  const foundersDiscount = content.founders_mode ? subtotal : 0
  const total = subtotal - foundersDiscount
  const depositAmount = content.founders_mode ? 0 : total * (content.deposit_percent / 100)
  const finalAmount = content.founders_mode ? 0 : total - depositAmount

  function updateTimeline(id: string, field: keyof ProposalTimeline, value: string) {
    setContent(c => ({ ...c, timeline: c.timeline.map(r => r.id === id ? { ...r, [field]: value } : r) }))
  }
  function updateLineItem(id: string, field: keyof ProposalLineItem, value: string | number) {
    setContent(c => ({ ...c, line_items: c.line_items.map(i => i.id === id ? { ...i, [field]: value } : i) }))
  }
  function updateTerm(id: string, field: 'heading' | 'body', value: string) {
    setContent(c => ({ ...c, terms: c.terms.map(t => t.id === id ? { ...t, [field]: value } : t) }))
  }
  function updateClientCost(id: string, field: 'title' | 'cost', value: string) {
    setContent(c => ({ ...c, client_costs: c.client_costs.map(x => x.id === id ? { ...x, [field]: value } : x) }))
  }

  const setField = <K extends keyof ProposalContent>(key: K, val: ProposalContent[K]) =>
    setContent(c => ({ ...c, [key]: val }))

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

        {/* Proposal meta */}
        <div style={{ display: 'flex', gap: '40px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '0.5px solid #E8E5E0' }}>
          <div style={{ flex: 1 }}>
            <p style={{ ...micro, marginBottom: '6px' }}>Prepared for</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '16px', color: '#0D0D0D' }}>{client.company_name}</p>
            <p style={{ fontSize: '12px', color: '#9A9A9A' }}>{client.contact_name} · {client.contact_email}</p>
          </div>
          <div>
            <p style={{ ...micro, marginBottom: '6px' }}>Valid Until</p>
            {readonly ? (
              <p style={{ fontSize: '13px', color: '#3A3A3A' }}>{content.valid_until || '—'}</p>
            ) : (
              <CE value={content.valid_until || 'e.g. 2026-06-30'} onSave={v => setField('valid_until', v)} style={{ fontSize: '13px', color: '#3A3A3A' }} />
            )}
          </div>
          {content.founders_mode && (
            <div style={{ backgroundColor: '#FFF7F0', border: '1px solid #F56E0F', padding: '10px 16px', alignSelf: 'flex-start' }}>
              <p style={{ fontSize: '9px', color: '#F56E0F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Founder's Promotion</p>
              <p style={{ fontSize: '11px', color: '#3A3A3A', marginTop: '2px' }}>Complimentary Portfolio Project</p>
            </div>
          )}
        </div>

        {/* Project Overview */}
        <div style={{ marginBottom: '0' }}>
          <span style={micro}>Project Overview</span>
          <p style={body}>
            Thank you for the opportunity to work on your project. Based on our discovery conversation, I understand that you need a professional website to{' '}
            {readonly ? (
              <strong style={{ color: '#0D0D0D' }}>{content.primary_goal}</strong>
            ) : (
              <strong style={{ color: '#0D0D0D' }}>
                <CE value={content.primary_goal} onSave={v => setField('primary_goal', v)} style={{ color: '#0D0D0D', fontWeight: 700 }} />
              </strong>
            )}.
          </p>
          <p style={{ ...body, marginTop: '10px' }}>
            This proposal outlines the scope of work, timeline, investment, and terms for your website development project.
          </p>
        </div>

        <div style={hr} />

        {/* Scope of Work */}
        <div style={{ marginBottom: '0' }}>
          <span style={micro}>Scope of Work</span>

          <p style={{ ...sectionH, color: '#0D0D0D', marginBottom: '12px' }}>What's Included</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '28px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Design & Development</p>
              <BulletList items={content.included_design} onChange={v => setField('included_design', v)} readonly={readonly} />
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Technical Setup</p>
              <BulletList items={content.included_technical} onChange={v => setField('included_technical', v)} readonly={readonly} />
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#9A9A9A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Training & Support</p>
              <BulletList items={content.included_training} onChange={v => setField('included_training', v)} readonly={readonly} />
            </div>
          </div>

          <p style={{ ...sectionH, marginBottom: '12px' }}>What's NOT Included</p>
          <p style={{ ...body, marginBottom: '10px' }}>The following services are outside this proposal and would require separate arrangements:</p>
          <BulletList items={content.excluded_items} onChange={v => setField('excluded_items', v)} readonly={readonly} />

          <div style={{ marginTop: '24px', backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '16px 20px' }}>
            <p style={{ ...sectionH, marginBottom: '6px' }}>Revisions Policy</p>
            <p style={body}>
              This project includes{' '}
              {readonly ? (
                <strong>{content.revision_rounds} rounds</strong>
              ) : (
                <strong><CE value={String(content.revision_rounds)} onSave={v => setField('revision_rounds', parseInt(v) || 2)} style={{ fontWeight: 700 }} /> rounds</strong>
              )}{' '}
              of design revisions. Additional revision rounds beyond this are billed at R
              {readonly ? (
                <strong>{fmt(content.revision_rate)}</strong>
              ) : (
                <strong><CE value={String(content.revision_rate)} onSave={v => setField('revision_rate', parseFloat(v.replace(/[^\d.]/g, '')) || 500)} style={{ fontWeight: 700 }} /></strong>
              )}{' '}
              per hour (minimum 1 hour).
            </p>
          </div>
        </div>

        <div style={hr} />

        {/* Client Responsibilities */}
        <div>
          <span style={micro}>Client Responsibilities</span>
          <p style={{ ...body, marginBottom: '12px' }}>To ensure the project stays on schedule, you will need to provide:</p>
          <BulletList items={content.client_responsibilities} onChange={v => setField('client_responsibilities', v)} readonly={readonly} />
          <div style={{ marginTop: '16px', backgroundColor: '#FFF7F0', border: '0.5px solid #F56E0F', padding: '12px 16px' }}>
            <p style={{ fontSize: '12px', color: '#0D0D0D', fontWeight: 500 }}>
              <span style={{ color: '#F56E0F' }}>Important:</span> Development cannot begin until all required content is received.
            </p>
          </div>
        </div>

        <div style={hr} />

        {/* Timeline */}
        <div>
          <span style={micro}>Timeline</span>
          <p style={{ ...body, marginBottom: '16px' }}>Assuming content is delivered on time, the project will follow this schedule:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '28%' }}>Phase</th>
                <th style={{ ...thStyle, width: '18%' }}>Duration</th>
                <th style={thStyle}>Deliverable</th>
                {!readonly && <th style={{ ...thStyle, width: '32px' }} />}
              </tr>
            </thead>
            <tbody>
              {content.timeline.map(row => (
                <tr key={row.id}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: '#0D0D0D' }}>
                    {readonly ? row.phase : <CE value={row.phase} onSave={v => updateTimeline(row.id, 'phase', v)} style={{ fontWeight: 500, color: '#0D0D0D', fontSize: '12px' }} />}
                  </td>
                  <td style={{ ...tdStyle, color: '#9A9A9A' }}>
                    {readonly ? row.duration : <CE value={row.duration} onSave={v => updateTimeline(row.id, 'duration', v)} style={{ color: '#9A9A9A', fontSize: '12px' }} />}
                  </td>
                  <td style={tdStyle}>
                    {readonly ? row.deliverable : <CE value={row.deliverable} onSave={v => updateTimeline(row.id, 'deliverable', v)} style={{ fontSize: '12px', color: '#3A3A3A' }} />}
                  </td>
                  {!readonly && (
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, timeline: c.timeline.filter(r => r.id !== row.id) }))}>×</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!readonly && (
            <button className="no-print mt-3 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => setContent(c => ({ ...c, timeline: [...c.timeline, { id: crypto.randomUUID(), phase: 'New Phase', duration: '—', deliverable: '—' }] }))}>
              + Add Phase
            </button>
          )}
          <p style={{ ...body, color: '#9A9A9A', marginTop: '16px', fontStyle: 'italic' }}>
            <strong style={{ color: '#0D0D0D' }}>Total Timeline:</strong>{' '}
            {readonly ? content.total_timeline : <CE value={content.total_timeline} onSave={v => setField('total_timeline', v)} style={{ fontStyle: 'italic', fontSize: '13px', color: '#9A9A9A' }} />}
          </p>
        </div>

        <div style={hr} />

        {/* Investment */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ ...micro, marginBottom: 0 }}>Investment</span>
            {!readonly && (
              <button
                className="no-print font-body font-medium text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-ks transition-colors border"
                style={content.founders_mode ? { borderColor: '#F56E0F', color: '#F56E0F', backgroundColor: '#FFF7F0' } : { borderColor: '#D4D0CA', color: '#9A9A9A' }}
                onClick={() => setContent(c => ({ ...c, founders_mode: !c.founders_mode }))}
              >
                Founder's Promotion: {content.founders_mode ? 'ON' : 'OFF'}
              </button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '70%' }}>Item</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Standard Rate</th>
                {!readonly && <th style={{ width: '32px' }} />}
              </tr>
            </thead>
            <tbody>
              {content.line_items.map(item => (
                <tr key={item.id}>
                  <td style={tdStyle}>
                    {readonly ? item.title : <CE value={item.title} onSave={v => updateLineItem(item.id, 'title', v)} style={{ fontSize: '12px', color: '#3A3A3A' }} />}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D' }}>
                      R{' '}
                      {readonly ? fmt(item.amount) : <CE value={fmt(item.amount)} onSave={v => updateLineItem(item.id, 'amount', parseFloat(v.replace(/[^\d.]/g, '')) || 0)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D' }} />}
                    </span>
                  </td>
                  {!readonly && (
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, line_items: c.line_items.filter(i => i.id !== item.id) }))}>×</button>
                    </td>
                  )}
                </tr>
              ))}
              {/* Subtotal */}
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#0D0D0D' }}>Subtotal</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#0D0D0D' }}>R {fmt(subtotal)}</td>
                {!readonly && <td style={tdStyle} />}
              </tr>
              {/* Founders discount row */}
              {content.founders_mode && (
                <tr>
                  <td style={{ ...tdStyle, color: '#F56E0F', fontStyle: 'italic' }}>Founder's Portfolio Discount</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#F56E0F' }}>− R {fmt(foundersDiscount)}</td>
                  {!readonly && <td style={tdStyle} />}
                </tr>
              )}
              {/* Total */}
              <tr style={{ backgroundColor: '#F8F6F3' }}>
                <td style={{ ...tdStyle, borderBottom: 'none', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D0D0D', padding: '16px 0' }}>Total Project Cost</td>
                <td style={{ ...tdStyle, borderBottom: 'none', textAlign: 'right', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: '#F56E0F', padding: '16px 0', whiteSpace: 'nowrap' }}>R {fmt(total)}</td>
                {!readonly && <td style={{ ...tdStyle, borderBottom: 'none' }} />}
              </tr>
            </tbody>
          </table>

          {!readonly && (
            <button className="no-print mt-3 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => setContent(c => ({ ...c, line_items: [...c.line_items, { id: crypto.randomUUID(), title: 'New Item', amount: 0 }] }))}>
              + Add Item
            </button>
          )}

          {/* Founders explanation */}
          {content.founders_mode && (
            <div style={{ marginTop: '24px', backgroundColor: '#FFF7F0', border: '1px solid #F56E0F', padding: '20px 24px' }}>
              <p style={{ ...sectionH, color: '#F56E0F', marginBottom: '10px' }}>Why Are We Offering This for Free?</p>
              <p style={{ ...body, marginBottom: '12px' }}>We're building our portfolio and refining our processes. In exchange for this complimentary website, we ask for:</p>
              <BulletList items={content.founders_exchange} onChange={v => setField('founders_exchange', v)} readonly={readonly} />
            </div>
          )}

          {/* Client costs */}
          <div style={{ marginTop: '24px' }}>
            <p style={{ ...sectionH, marginBottom: '10px' }}>Costs You're Responsible For</p>
            <p style={{ ...body, marginBottom: '12px' }}>While our services are {content.founders_mode ? 'complimentary' : 'covered above'}, you will need to cover:</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {content.client_costs.map(row => (
                  <tr key={row.id}>
                    <td style={{ ...tdStyle, fontWeight: 500, color: '#0D0D0D' }}>
                      {readonly ? row.title : <CE value={row.title} onSave={v => updateClientCost(row.id, 'title', v)} style={{ fontWeight: 500, color: '#0D0D0D', fontSize: '12px' }} />}
                    </td>
                    <td style={{ ...tdStyle, color: '#9A9A9A' }}>
                      {readonly ? row.cost : <CE value={row.cost} onSave={v => updateClientCost(row.id, 'cost', v)} style={{ fontSize: '12px', color: '#9A9A9A' }} />}
                    </td>
                    {!readonly && (
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, client_costs: c.client_costs.filter(x => x.id !== row.id) }))}>×</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!readonly && (
              <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => setContent(c => ({ ...c, client_costs: [...c.client_costs, { id: crypto.randomUUID(), title: 'New Cost', cost: '—' }] }))}>
                + Add Cost
              </button>
            )}
          </div>
        </div>

        <div style={hr} />

        {/* Payment Terms */}
        <div>
          <span style={micro}>Payment Terms</span>
          {content.founders_mode ? (
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={tdStyle}><p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '4px' }}>Deposit</p><p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0D0D0D' }}>R 0.00</p></div>
              <div style={tdStyle}><p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '4px' }}>Final Payment</p><p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0D0D0D' }}>R 0.00</p></div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1, backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '20px' }}>
                <p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '6px' }}>
                  Deposit (
                  {readonly ? `${content.deposit_percent}%` : <CE value={String(content.deposit_percent)} onSave={v => setField('deposit_percent', parseInt(v) || 50)} style={{ fontSize: '11px' }} />}
                  % to commence)
                </p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0D0D0D' }}>R {fmt(depositAmount)}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '20px' }}>
                <p style={{ fontSize: '11px', color: '#9A9A9A', marginBottom: '6px' }}>Final Payment (on completion)</p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '20px', color: '#0D0D0D' }}>R {fmt(finalAmount)}</p>
              </div>
            </div>
          )}
          {content.founders_mode && (
            <p style={{ ...body, color: '#9A9A9A', marginTop: '12px', fontStyle: 'italic' }}>A formal invoice marked "100% Discounted" will be provided for your records.</p>
          )}
        </div>

        <div style={hr} />

        {/* Terms & Conditions */}
        <div>
          <span style={micro}>Terms & Conditions</span>
          {content.terms.map((term, idx) => (
            <div key={term.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <p style={{ ...sectionH, marginBottom: '4px' }}>
                  <span style={{ color: '#F56E0F', marginRight: '8px' }}>{idx + 1}.</span>
                  {readonly ? term.heading : <CE value={term.heading} onSave={v => updateTerm(term.id, 'heading', v)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D' }} />}
                </p>
                {!readonly && <button className="no-print ml-3 flex-shrink-0 bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, terms: c.terms.filter(t => t.id !== term.id) }))}>×</button>}
              </div>
              {readonly ? (
                <p style={{ ...body, paddingLeft: '22px' }}>{term.body}</p>
              ) : (
                <CE value={term.body} onSave={v => updateTerm(term.id, 'body', v)} style={{ ...body, paddingLeft: '22px', display: 'block' }} block />
              )}
            </div>
          ))}
          {!readonly && (
            <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => setContent(c => ({ ...c, terms: [...c.terms, { id: crypto.randomUUID(), heading: 'New Clause', body: 'Write clause here.' }] }))}>
              + Add Clause
            </button>
          )}
        </div>

        <div style={hr} />

        {/* Next Steps */}
        <div style={{ marginBottom: '32px' }}>
          <span style={micro}>Next Steps</span>
          <p style={{ ...body, marginBottom: '12px' }}>To move forward:</p>
          <ol style={{ listStyle: 'none', padding: 0 }}>
            {content.next_steps.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#F56E0F', flexShrink: 0, width: '20px' }}>{i + 1}.</span>
                {readonly || !true ? (
                  <span style={body}>{step}</span>
                ) : (
                  <>
                    <span contentEditable suppressContentEditableWarning onBlur={e => { const u = [...content.next_steps]; u[i] = e.currentTarget.innerText; setField('next_steps', u) }} style={{ ...body, flex: 1 }}>{step}</span>
                    {!readonly && <button className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors flex-shrink-0" onClick={() => setField('next_steps', content.next_steps.filter((_, idx) => idx !== i))}>×</button>}
                  </>
                )}
              </li>
            ))}
          </ol>
          {!readonly && (
            <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => setField('next_steps', [...content.next_steps, 'New step'])}>
              + Add Step
            </button>
          )}
        </div>

        {/* Validity note */}
        <div style={{ borderTop: '0.5px solid #E8E5E0', paddingTop: '24px' }}>
          <p style={{ fontSize: '11px', color: '#9A9A9A', fontStyle: 'italic' }}>
            This proposal is valid for{' '}
            {readonly ? content.validity_days : <CE value={String(content.validity_days)} onSave={v => setField('validity_days', parseInt(v) || 14)} style={{ fontSize: '11px', fontStyle: 'italic' }} />}
            {' '}days from the date listed above. After this period, pricing and availability may change.
          </p>
        </div>

      </DocumentShell>
    </div>
  )
}
