import { useEffect, useState } from 'react'
import type { AuditContent, AuditSection, Client, KSDocument, ServiceType } from '../../../types'
import { SERVICE_LABELS } from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

const SERVICE_TYPES: ServiceType[] = ['web', 'seo', 'digital_marketing', 'google_ads', 'social_media', 'brand', 'copywriting', 'custom_dev', 'plugins', 'bpa', 'other']

const DEFAULT_TOOLS: Partial<Record<ServiceType, string[]>> = {
  seo:               ['Google Search Console', 'SEMrush', 'Ahrefs', 'Screaming Frog'],
  web:               ['Google Lighthouse', 'GTmetrix', 'PageSpeed Insights', 'WAVE'],
  digital_marketing: ['Google Analytics', 'Meta Business Suite', 'HubSpot'],
  google_ads:        ['Google Ads Dashboard', 'Google Analytics', 'Keyword Planner'],
  social_media:      ['Meta Business Suite', 'Hootsuite', 'Sprout Social'],
  brand:             ['Manual Review', 'Figma', 'Canva'],
  copywriting:       ['Grammarly', 'Hemingway Editor', 'Surfer SEO'],
  custom_dev:        ['SonarQube', 'Lighthouse', 'OWASP ZAP'],
  bpa:               ['Process Street', 'Zapier', 'Manual Review'],
  plugins:           ['WPScan', 'Query Monitor', 'Manual Review'],
  other:             ['Manual Review'],
}

const DEFAULT_SECTION_NAMES: Partial<Record<ServiceType, string[]>> = {
  seo:               ['Technical SEO', 'On-Page Optimisation', 'Off-Page & Link Building', 'Content Quality', 'Local SEO'],
  web:               ['Performance & Speed', 'UX & Navigation', 'SEO Fundamentals', 'Security & SSL', 'Mobile Responsiveness', 'Conversion Optimisation'],
  digital_marketing: ['Brand Consistency', 'Channel Strategy', 'Audience Targeting', 'Budget Efficiency', 'Analytics & Tracking'],
  google_ads:        ['Campaign Structure', 'Keyword Strategy', 'Ad Copy & Creative', 'Landing Page Quality', 'Bidding & Budget', 'Conversion Tracking'],
  social_media:      ['Profile Optimisation', 'Content Strategy', 'Engagement & Community', 'Paid Campaigns', 'Analytics & Reporting'],
  brand:             ['Brand Identity & Logo', 'Visual Consistency', 'Brand Voice & Tone', 'Audience Alignment', 'Competitor Differentiation'],
  copywriting:       ['Tone & Voice', 'Website Copy', 'SEO Writing', 'CTA Effectiveness', 'Email & Newsletter Copy'],
  custom_dev:        ['Code Quality', 'Architecture & Scalability', 'Security', 'Performance', 'Documentation'],
  bpa:               ['Process Mapping', 'Automation Scope', 'Integration Quality', 'ROI Assessment', 'Documentation'],
  plugins:           ['Functionality', 'Performance Impact', 'Security', 'Compatibility', 'Documentation'],
  other:             ['Overview', 'Key Findings', 'Recommendations', 'Next Steps'],
}

function makeDefaultSections(serviceType: ServiceType): AuditSection[] {
  const names = DEFAULT_SECTION_NAMES[serviceType] ?? DEFAULT_SECTION_NAMES.other!
  return names.map(name => ({ id: crypto.randomUUID(), name, score: 0, findings: '', recommendations: '' }))
}

function ScoreBar({ score, onChange, readonly }: { score: number; onChange?: (n: number) => void; readonly?: boolean }) {
  const color = score >= 4 ? '#22C55E' : score === 3 ? '#F59E0B' : score > 0 ? '#EF4444' : '#E8E5E0'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={readonly}
          onClick={() => onChange?.(score === n ? 0 : n)}
          style={{
            width: '22px', height: '7px', borderRadius: '2px', border: 'none',
            backgroundColor: n <= score ? color : '#E8E5E0',
            cursor: readonly ? 'default' : 'pointer',
            transition: 'background-color 0.15s',
          }}
        />
      ))}
      <span style={{ fontSize: '10px', color: '#9A9A9A', marginLeft: '6px', fontFamily: 'Inter, sans-serif' }}>
        {score > 0 ? `${score}/5` : 'Not rated'}
      </span>
    </div>
  )
}

const microLabel: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', display: 'block' }
const divider: React.CSSProperties = { borderTop: '0.5px solid #E8E5E0', margin: '32px 0' }
const bodyText: React.CSSProperties = { fontSize: '13px', color: '#3A3A3A', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }

export function AuditDocument({ document, client, readonly = false }: Props) {
  const raw = (document.content ?? {}) as AuditContent
  const [content, setContent] = useState<AuditContent>({
    service_type: raw.service_type ?? 'seo',
    tools_used: Array.isArray(raw.tools_used) ? raw.tools_used : [],
    sections: Array.isArray(raw.sections) ? raw.sections : [],
    summary: raw.summary ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [newTool, setNewTool] = useState('')

  // Auto-populate sections on first load if empty
  useEffect(() => {
    if (content.sections.length === 0) {
      setContent(c => ({
        ...c,
        sections: makeDefaultSections(c.service_type),
        tools_used: c.tools_used.length === 0 ? (DEFAULT_TOOLS[c.service_type] ?? []) : c.tools_used,
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleServiceTypeChange(st: ServiceType) {
    if (st === content.service_type) return
    setContent(c => ({
      ...c,
      service_type: st,
      sections: makeDefaultSections(st),
      tools_used: DEFAULT_TOOLS[st] ?? [],
    }))
  }

  function updateSection(id: string, field: keyof AuditSection, value: string | number) {
    setContent(c => ({ ...c, sections: c.sections.map(s => s.id === id ? { ...s, [field]: value } : s) }))
  }

  function addSection() {
    setContent(c => ({ ...c, sections: [...c.sections, { id: crypto.randomUUID(), name: 'New Area', score: 0, findings: '', recommendations: '' }] }))
  }

  function removeSection(id: string) {
    setContent(c => ({ ...c, sections: c.sections.filter(s => s.id !== id) }))
  }

  function addTool() {
    const t = newTool.trim()
    if (!t) return
    setContent(c => ({ ...c, tools_used: [...c.tools_used, t] }))
    setNewTool('')
  }

  function removeTool(tool: string) {
    setContent(c => ({ ...c, tools_used: c.tools_used.filter(t => t !== tool) }))
  }

  const overallScore = content.sections.filter(s => s.score > 0).length > 0
    ? Math.round(content.sections.filter(s => s.score > 0).reduce((a, s) => a + s.score, 0) / content.sections.filter(s => s.score > 0).length * 10) / 10
    : null

  return (
    <div>
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <p className="font-body text-[11px] text-ks-silver">Click any text to edit inline.</p>
            <div className="flex items-center gap-2">
              <span className="font-body text-[9px] text-ks-silver uppercase tracking-[0.1em]">Service:</span>
              <select
                value={content.service_type}
                onChange={e => handleServiceTypeChange(e.target.value as ServiceType)}
                className="bg-ks-smoke border border-ks-rule text-ks-ink font-body text-[11px] px-2 py-1 rounded-ks focus:outline-none focus:border-ks-lava"
              >
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{SERVICE_LABELS[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => exportToPDF('document-content', document.reference_number)}>Export PDF</Button>
            <Button variant="dark" size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      )}

      <DocumentShell document={document} client={client}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
            {SERVICE_LABELS[content.service_type]} Audit
          </p>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '12px' }}>
            {client.company_name} —<br />Performance Review
          </h2>
          <div style={{ height: '3px', width: '64px', backgroundColor: '#F56E0F' }} />
        </div>

        {/* Overall score */}
        {overallScore !== null && (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '20px 28px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Overall Score</p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '28px', fontWeight: 700, color: overallScore >= 4 ? '#22C55E' : overallScore >= 3 ? '#F59E0B' : '#EF4444' }}>{overallScore}<span style={{ fontSize: '14px', color: '#9A9A9A' }}>/5</span></p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {content.sections.filter(s => s.score > 0).map(s => (
                <div key={s.id} style={{ backgroundColor: '#F0EDE8', padding: '6px 12px', fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#3A3A3A' }}>
                  <span style={{ color: '#9A9A9A', marginRight: '6px' }}>{s.name}</span>
                  <span style={{ fontWeight: 600, color: s.score >= 4 ? '#22C55E' : s.score === 3 ? '#F59E0B' : '#EF4444' }}>{s.score}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools used */}
        <div style={{ marginBottom: '32px' }}>
          <span style={microLabel}>Tools Used</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            {content.tools_used.map(tool => (
              <span key={tool} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#F0EDE8', padding: '5px 12px', fontSize: '11px', fontFamily: 'Inter, sans-serif', color: '#3A3A3A', border: '0.5px solid #E8E5E0' }}>
                {tool}
                {!readonly && (
                  <button onClick={() => removeTool(tool)} style={{ color: '#9A9A9A', fontSize: '12px', lineHeight: 1, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>×</button>
                )}
              </span>
            ))}
            {!readonly && content.tools_used.length === 0 && (
              <span style={{ fontSize: '11px', color: '#9A9A9A', fontFamily: 'Inter, sans-serif' }}>No tools added yet</span>
            )}
          </div>
          {!readonly && (
            <div className="no-print flex gap-2 mt-2">
              <input
                type="text"
                value={newTool}
                onChange={e => setNewTool(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTool()}
                placeholder="Add a tool…"
                className="bg-ks-smoke border border-ks-rule text-ks-ink font-body text-[11px] px-3 py-1.5 rounded-ks focus:outline-none focus:border-ks-lava w-48"
              />
              <button onClick={addTool} className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors">
                Add
              </button>
            </div>
          )}
        </div>

        <div style={divider} />

        {/* Audit sections */}
        <div>
          <span style={microLabel}>Audit Findings</span>
          {content.sections.map((section, idx) => (
            <div key={section.id} style={{ marginBottom: '36px', position: 'relative' }}>
              {!readonly && (
                <button
                  className="no-print absolute -right-4 top-0 bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                  onClick={() => removeSection(section.id)}
                >×</button>
              )}

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '0.5px solid #E8E5E0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '11px', color: '#F56E0F', minWidth: '20px' }}>{idx + 1}.</span>
                  {readonly ? (
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D' }}>{section.name}</h3>
                  ) : (
                    <h3
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateSection(section.id, 'name', e.currentTarget.innerText)}
                      style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', minWidth: '100px' }}
                    >{section.name}</h3>
                  )}
                </div>
                <ScoreBar
                  score={section.score}
                  readonly={readonly}
                  onChange={n => updateSection(section.id, 'score', n)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <p style={{ ...microLabel, color: '#9A9A9A', marginBottom: '8px' }}>Findings</p>
                  {readonly ? (
                    <p style={bodyText}>{section.findings || '—'}</p>
                  ) : (
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateSection(section.id, 'findings', e.currentTarget.innerText)}
                      style={{ ...bodyText, minHeight: '48px', padding: '8px', backgroundColor: '#FAFAF9', border: '0.5px solid #E8E5E0' }}
                    >{section.findings || 'Describe findings here…'}</p>
                  )}
                </div>
                <div>
                  <p style={{ ...microLabel, color: '#9A9A9A', marginBottom: '8px' }}>Recommendations</p>
                  {readonly ? (
                    <p style={bodyText}>{section.recommendations || '—'}</p>
                  ) : (
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateSection(section.id, 'recommendations', e.currentTarget.innerText)}
                      style={{ ...bodyText, minHeight: '48px', padding: '8px', backgroundColor: '#FAFAF9', border: '0.5px solid #E8E5E0' }}
                    >{section.recommendations || 'Write recommendations here…'}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!readonly && (
            <button
              className="no-print font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
              onClick={addSection}
            >+ Add Area</button>
          )}
        </div>

        <div style={divider} />

        {/* Summary */}
        <div>
          <span style={microLabel}>Executive Summary</span>
          {readonly ? (
            <p style={bodyText}>{content.summary || '—'}</p>
          ) : (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={e => setContent(c => ({ ...c, summary: e.currentTarget.innerText }))}
              style={{ ...bodyText, minHeight: '80px', padding: '12px', backgroundColor: '#FAFAF9', border: '0.5px solid #E8E5E0' }}
            >{content.summary || 'Write an executive summary of the audit findings and overall recommendations…'}</p>
          )}
        </div>

      </DocumentShell>
    </div>
  )
}
