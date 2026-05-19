import { useEffect, useState } from 'react'
import type {
  Client, KSDocument, ReportContent, ReportSection,
  ReportSectionType, ReportStat, ReportBar,
} from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

const SECTION_TYPES: { type: ReportSectionType; label: string }[] = [
  { type: 'text',       label: 'Text' },
  { type: 'callout',    label: 'Callout' },
  { type: 'grid',       label: 'Grid' },
  { type: 'table',      label: 'Table' },
  { type: 'stat_tiles', label: 'Stat Tiles' },
  { type: 'bar_chart',  label: 'Bar Chart' },
  { type: 'image',      label: 'Image' },
]

function newSectionData(type: ReportSectionType): Partial<ReportSection> {
  switch (type) {
    case 'text':    return { body: 'Write your content here.' }
    case 'callout': return { body: 'Key insight or callout text.' }
    case 'grid':    return { items: [{ id: crypto.randomUUID(), t: 'Item Title', b: 'Item body.' }] }
    case 'table':   return {
      columns: ['Column A', 'Column B', 'Column C'],
      rows: [{ id: crypto.randomUUID(), cells: ['', '', ''] }],
    }
    case 'stat_tiles': return {
      stats: [
        { id: crypto.randomUUID(), label: 'Metric', value: '0', change: '+0%', up: true },
        { id: crypto.randomUUID(), label: 'Metric', value: '0', change: '+0%', up: true },
        { id: crypto.randomUUID(), label: 'Metric', value: '0' },
      ],
    }
    case 'bar_chart': return {
      bars: [
        { id: crypto.randomUUID(), label: 'Category A', value: 70, display: '70%' },
        { id: crypto.randomUUID(), label: 'Category B', value: 45, display: '45%' },
        { id: crypto.randomUUID(), label: 'Category C', value: 25, display: '25%' },
      ],
    }
    case 'image': return { image_url: '', image_caption: '' }
    default:      return {}
  }
}

export function ReportDocument({ document, client, readonly = false }: Props) {
  const raw = document.content as ReportContent
  const [content, setContent] = useState<ReportContent>({
    subtitle: raw.subtitle ?? 'Brand & Storytelling Analysis',
    sections: raw.sections ?? [],
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

  // ── Generic section helpers ──────────────────────────────────────────────

  function setSection(id: string, updater: (s: ReportSection) => ReportSection) {
    setContent(c => ({ ...c, sections: c.sections.map(s => s.id === id ? updater(s) : s) }))
  }

  function addSection(type: ReportSectionType) {
    setContent(c => ({
      ...c,
      sections: [...c.sections, {
        id: crypto.randomUUID(),
        micro: 'New Section',
        heading: 'Section Heading',
        type,
        ...newSectionData(type),
      }],
    }))
  }

  function removeSection(id: string) {
    setContent(c => ({ ...c, sections: c.sections.filter(s => s.id !== id) }))
  }

  function changeType(id: string, type: ReportSectionType) {
    setContent(c => ({
      ...c,
      sections: c.sections.map(s => {
        if (s.id !== id) return s
        // Merge: defaults fill in missing fields, existing data is preserved
        return { ...newSectionData(type), ...s, type }
      }),
    }))
  }

  // ── Grid ────────────────────────────────────────────────────────────────

  function addGridItem(sectionId: string) {
    setSection(sectionId, s => ({ ...s, items: [...(s.items ?? []), { id: crypto.randomUUID(), t: 'Item Title', b: 'Item body.' }] }))
  }
  function removeGridItem(sectionId: string, itemId: string) {
    setSection(sectionId, s => ({ ...s, items: s.items?.filter(i => i.id !== itemId) }))
  }
  function updateGridItem(sectionId: string, itemId: string, field: 't' | 'b', value: string) {
    setSection(sectionId, s => ({ ...s, items: s.items?.map(i => i.id === itemId ? { ...i, [field]: value } : i) }))
  }

  // ── Table ────────────────────────────────────────────────────────────────

  function updateColumn(sectionId: string, idx: number, value: string) {
    setSection(sectionId, s => {
      const columns = [...(s.columns ?? [])]
      columns[idx] = value
      return { ...s, columns }
    })
  }
  function addTableColumn(sectionId: string) {
    setSection(sectionId, s => ({
      ...s,
      columns: [...(s.columns ?? []), 'New Column'],
      rows: s.rows?.map(r => ({ ...r, cells: [...r.cells, ''] })) ?? [],
    }))
  }
  function removeTableColumn(sectionId: string, idx: number) {
    setSection(sectionId, s => ({
      ...s,
      columns: (s.columns ?? []).filter((_, i) => i !== idx),
      rows: s.rows?.map(r => ({ ...r, cells: r.cells.filter((_, i) => i !== idx) })) ?? [],
    }))
  }
  function addTableRow(sectionId: string) {
    setSection(sectionId, s => ({
      ...s,
      rows: [...(s.rows ?? []), { id: crypto.randomUUID(), cells: Array((s.columns ?? []).length).fill('') }],
    }))
  }
  function removeTableRow(sectionId: string, rowId: string) {
    setSection(sectionId, s => ({ ...s, rows: s.rows?.filter(r => r.id !== rowId) }))
  }
  function updateCell(sectionId: string, rowId: string, cellIdx: number, value: string) {
    setSection(sectionId, s => ({
      ...s,
      rows: s.rows?.map(r => {
        if (r.id !== rowId) return r
        const cells = [...r.cells]
        cells[cellIdx] = value
        return { ...r, cells }
      }),
    }))
  }

  // ── Stat Tiles ───────────────────────────────────────────────────────────

  function addStat(sectionId: string) {
    setSection(sectionId, s => ({
      ...s,
      stats: [...(s.stats ?? []), { id: crypto.randomUUID(), label: 'Metric', value: '0' }],
    }))
  }
  function removeStat(sectionId: string, statId: string) {
    setSection(sectionId, s => ({ ...s, stats: s.stats?.filter(st => st.id !== statId) }))
  }
  function updateStat(sectionId: string, statId: string, field: keyof ReportStat, value: string | boolean) {
    setSection(sectionId, s => ({ ...s, stats: s.stats?.map(st => st.id === statId ? { ...st, [field]: value } : st) }))
  }

  // ── Bar Chart ────────────────────────────────────────────────────────────

  function addBar(sectionId: string) {
    setSection(sectionId, s => ({
      ...s,
      bars: [...(s.bars ?? []), { id: crypto.randomUUID(), label: 'New Category', value: 50, display: '50%' }],
    }))
  }
  function removeBar(sectionId: string, barId: string) {
    setSection(sectionId, s => ({ ...s, bars: s.bars?.filter(b => b.id !== barId) }))
  }
  function updateBar(sectionId: string, barId: string, field: keyof ReportBar, value: string | number) {
    setSection(sectionId, s => ({ ...s, bars: s.bars?.map(b => b.id === barId ? { ...b, [field]: value } : b) }))
  }

  return (
    <div>
      {/* Toolbar */}
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver hidden sm:block">Click any text to edit inline.</p>
          <div className="flex gap-2 ml-auto sm:ml-0 sm:gap-3">
            <Button variant="outline" size="sm" onClick={() => exportToPDF('document-content', `${document.reference_number}`)} title="Export PDF">
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

        {/* Report title block */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.0, color: '#0D0D0D', marginBottom: '12px', letterSpacing: '-0.03em' }}>
            {client.company_name} —<br />
            {readonly ? content.subtitle : (
              <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, subtitle: e.currentTarget.innerText }))} style={{ display: 'inline-block' }}>{content.subtitle}</span>
            )}
          </h2>
          <div style={{ height: '3px', width: '64px', backgroundColor: '#F56E0F' }} />
        </div>

        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.7, color: '#3A3A3A' }}>
          {content.sections.map(section => (
            <section key={section.id} style={{ marginBottom: '48px', position: 'relative' }}>

              {/* Remove + type switcher row (edit only) */}
              {!readonly && (
                <div className="no-print flex items-center gap-1 mb-3 flex-wrap">
                  {SECTION_TYPES.map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => changeType(section.id, type)}
                      className={`font-body text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-ks transition-colors ${
                        section.type === type
                          ? 'bg-ks-void text-white'
                          : 'bg-white border border-ks-rule text-ks-silver hover:border-ks-ink hover:text-ks-ink'
                      }`}
                    >{label}</button>
                  ))}
                  <button
                    className="no-print ml-auto bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                    onClick={() => removeSection(section.id)}
                  >×</button>
                </div>
              )}

              {/* Section header */}
              <div style={{ marginBottom: '24px' }}>
                {readonly ? (
                  <>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F56E0F', display: 'block', marginBottom: '4px' }}>{section.micro}</span>
                    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0D0D0D', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '0.5px solid #D4D0CA', paddingBottom: '8px' }}>{section.heading}</h3>
                  </>
                ) : (
                  <>
                    <span contentEditable suppressContentEditableWarning onBlur={e => setSection(section.id, s => ({ ...s, micro: e.currentTarget.innerText }))} style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F56E0F', display: 'block', marginBottom: '4px' }}>{section.micro}</span>
                    <h3 contentEditable suppressContentEditableWarning onBlur={e => setSection(section.id, s => ({ ...s, heading: e.currentTarget.innerText }))} style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0D0D0D', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '0.5px solid #D4D0CA', paddingBottom: '8px' }}>{section.heading}</h3>
                  </>
                )}
              </div>

              {/* ── Text ─────────────────────────────────────────────── */}
              {section.type === 'text' && (
                readonly
                  ? <p style={{ fontSize: '14px', color: '#0D0D0D' }}>{section.body}</p>
                  : <p contentEditable suppressContentEditableWarning onBlur={e => setSection(section.id, s => ({ ...s, body: e.currentTarget.innerText }))} style={{ fontSize: '14px', color: '#0D0D0D' }}>{section.body}</p>
              )}

              {/* ── Callout ──────────────────────────────────────────── */}
              {section.type === 'callout' && (
                <div style={{ padding: '32px', border: '0.5px solid #D4D0CA', backgroundColor: '#F0EDE8' }}>
                  {readonly
                    ? <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{section.body}</p>
                    : <p contentEditable suppressContentEditableWarning onBlur={e => setSection(section.id, s => ({ ...s, body: e.currentTarget.innerText }))} style={{ fontSize: '14px', lineHeight: 1.6 }}>{section.body}</p>
                  }
                </div>
              )}

              {/* ── Grid ─────────────────────────────────────────────── */}
              {section.type === 'grid' && section.items && (
                <div>
                  {section.items.map((item, idx) => (
                    <div key={item.id} style={{ paddingBottom: '24px', borderBottom: idx < (section.items?.length ?? 0) - 1 ? '0.5px solid #E8E5E0' : 'none', marginBottom: '24px', position: 'relative' }}>
                      {!readonly && (
                        <button className="no-print absolute right-0 top-0 bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => removeGridItem(section.id, item.id)}>×</button>
                      )}
                      {readonly ? (
                        <>
                          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0D0D0D', marginBottom: '6px' }}>{item.t}</h4>
                          <p>{item.b}</p>
                        </>
                      ) : (
                        <>
                          <h4 contentEditable suppressContentEditableWarning onBlur={e => updateGridItem(section.id, item.id, 't', e.currentTarget.innerText)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0D0D0D', marginBottom: '6px' }}>{item.t}</h4>
                          <p contentEditable suppressContentEditableWarning onBlur={e => updateGridItem(section.id, item.id, 'b', e.currentTarget.innerText)}>{item.b}</p>
                        </>
                      )}
                    </div>
                  ))}
                  {!readonly && (
                    <button className="no-print font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => addGridItem(section.id)}>+ Add Item</button>
                  )}
                </div>
              )}

              {/* ── Table ────────────────────────────────────────────── */}
              {section.type === 'table' && section.columns && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        {section.columns.map((col, ci) => (
                          <th key={ci} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #0D0D0D', color: '#9A9A9A', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap', position: 'relative' }}>
                            {readonly ? col : (
                              <span contentEditable suppressContentEditableWarning onBlur={e => updateColumn(section.id, ci, e.currentTarget.innerText)} style={{ display: 'block', minWidth: '60px' }}>{col}</span>
                            )}
                            {!readonly && (
                              <button className="no-print absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full leading-none" onClick={() => removeTableColumn(section.id, ci)}>×</button>
                            )}
                          </th>
                        ))}
                        {!readonly && <th className="no-print" style={{ width: '32px' }} />}
                      </tr>
                    </thead>
                    <tbody>
                      {(section.rows ?? []).map((row, ri) => (
                        <tr key={row.id} style={{ backgroundColor: ri % 2 === 1 ? '#F8F6F3' : 'transparent' }}>
                          {row.cells.map((cell, ci) => (
                            <td key={ci} style={{ padding: '10px 12px', borderBottom: '0.5px solid #E8E5E0', color: '#3A3A3A', verticalAlign: 'top' }}>
                              {readonly ? cell : (
                                <span contentEditable suppressContentEditableWarning onBlur={e => updateCell(section.id, row.id, ci, e.currentTarget.innerText)} style={{ display: 'block', minWidth: '40px' }}>{cell}</span>
                              )}
                            </td>
                          ))}
                          {!readonly && (
                            <td className="no-print" style={{ padding: '10px 4px', borderBottom: '0.5px solid #E8E5E0' }}>
                              <button className="bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => removeTableRow(section.id, row.id)}>×</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!readonly && (
                    <div className="no-print flex gap-2 mt-3">
                      <button className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => addTableRow(section.id)}>+ Row</button>
                      <button className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver border border-ks-rule px-3 py-1.5 rounded-ks hover:border-ks-ink hover:text-ks-ink transition-colors" onClick={() => addTableColumn(section.id)}>+ Column</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Stat Tiles ───────────────────────────────────────── */}
              {section.type === 'stat_tiles' && section.stats && (
                <div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {section.stats.map(stat => (
                      <div key={stat.id} style={{ flex: '1', minWidth: '140px', backgroundColor: '#FFFFFF', border: '0.5px solid #E8E5E0', borderLeft: '3px solid #F56E0F', padding: '20px 20px 16px', position: 'relative' }}>
                        {!readonly && (
                          <button className="no-print absolute right-2 top-2 bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => removeStat(section.id, stat.id)}>×</button>
                        )}
                        {/* Value */}
                        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '30px', color: '#0D0D0D', lineHeight: 1, marginBottom: '8px' }}>
                          {readonly ? stat.value : (
                            <span contentEditable suppressContentEditableWarning onBlur={e => updateStat(section.id, stat.id, 'value', e.currentTarget.innerText)}>{stat.value}</span>
                          )}
                        </p>
                        {/* Label */}
                        <p style={{ fontSize: '9px', color: '#9A9A9A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: stat.change ? '10px' : 0 }}>
                          {readonly ? stat.label : (
                            <span contentEditable suppressContentEditableWarning onBlur={e => updateStat(section.id, stat.id, 'label', e.currentTarget.innerText)}>{stat.label}</span>
                          )}
                        </p>
                        {/* Trend badge */}
                        {stat.change && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: stat.up ? '#dcfce7' : '#fee2e2', padding: '2px 8px' }}>
                            <span style={{ fontSize: '10px', color: stat.up ? '#16a34a' : '#dc2626', fontWeight: 700, lineHeight: 1 }}>{stat.up ? '↑' : '↓'}</span>
                            <span style={{ fontSize: '10px', color: stat.up ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {readonly ? stat.change : (
                                <span contentEditable suppressContentEditableWarning onBlur={e => updateStat(section.id, stat.id, 'change', e.currentTarget.innerText)}>{stat.change}</span>
                              )}
                            </span>
                          </div>
                        )}
                        {/* Edit controls */}
                        {!readonly && (
                          <div className="no-print flex gap-2 mt-2 flex-wrap">
                            {stat.change ? (
                              <>
                                <button className="font-body text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-ks border transition-colors" style={{ borderColor: stat.up ? '#16a34a' : '#dc2626', color: stat.up ? '#16a34a' : '#dc2626' }} onClick={() => updateStat(section.id, stat.id, 'up', !stat.up)}>{stat.up ? '↑ Up' : '↓ Down'}</button>
                                <button className="font-body text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-ks border border-ks-rule text-ks-silver hover:border-red-400 hover:text-red-500 transition-colors" onClick={() => updateStat(section.id, stat.id, 'change', '')}>Remove Trend</button>
                              </>
                            ) : (
                              <button className="font-body text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-ks border border-ks-lava text-ks-lava hover:bg-ks-lava hover:text-white transition-colors" onClick={() => updateStat(section.id, stat.id, 'change', '+0%')}>+ Add Trend</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {!readonly && (
                    <button className="no-print mt-4 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => addStat(section.id)}>+ Add Tile</button>
                  )}
                </div>
              )}

              {/* ── Bar Chart ────────────────────────────────────────── */}
              {section.type === 'bar_chart' && section.bars && (
                <div>
                  {section.bars.map(bar => (
                    <div key={bar.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px', position: 'relative' }}>
                      {/* Label */}
                      <div style={{ width: '160px', flexShrink: 0 }}>
                        {readonly ? (
                          <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{bar.label}</span>
                        ) : (
                          <span contentEditable suppressContentEditableWarning onBlur={e => updateBar(section.id, bar.id, 'label', e.currentTarget.innerText)} style={{ fontSize: '12px', color: '#3A3A3A', display: 'block' }}>{bar.label}</span>
                        )}
                      </div>
                      {/* Bar track */}
                      <div style={{ flex: 1, height: '10px', backgroundColor: '#E8E5E0', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.max(0, Math.min(100, bar.value))}%`, backgroundColor: '#F56E0F', transition: 'width 0.3s' }} />
                      </div>
                      {/* Display value */}
                      <div style={{ width: '56px', flexShrink: 0, textAlign: 'right' }}>
                        {readonly ? (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0D0D0D', fontFamily: 'Space Grotesk, sans-serif' }}>{bar.display ?? `${bar.value}%`}</span>
                        ) : (
                          <span contentEditable suppressContentEditableWarning onBlur={e => updateBar(section.id, bar.id, 'display', e.currentTarget.innerText)} style={{ fontSize: '12px', fontWeight: 700, color: '#0D0D0D', fontFamily: 'Space Grotesk, sans-serif', display: 'block', textAlign: 'right' }}>{bar.display ?? `${bar.value}%`}</span>
                        )}
                      </div>
                      {/* Slider + remove (edit only) */}
                      {!readonly && (
                        <div className="no-print flex items-center gap-2">
                          <input
                            type="range" min="0" max="100" value={bar.value}
                            onChange={e => updateBar(section.id, bar.id, 'value', parseInt(e.target.value))}
                            className="w-20 accent-ks-lava"
                          />
                          <button className="bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors flex-shrink-0" onClick={() => removeBar(section.id, bar.id)}>×</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {!readonly && (
                    <button className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => addBar(section.id)}>+ Add Bar</button>
                  )}
                </div>
              )}

              {/* ── Image ────────────────────────────────────────────── */}
              {section.type === 'image' && (
                <div>
                  {!readonly && (
                    <div className="no-print mb-3">
                      <input
                        type="url"
                        placeholder="Paste image URL…"
                        value={section.image_url ?? ''}
                        onChange={e => setSection(section.id, s => ({ ...s, image_url: e.target.value }))}
                        className="w-full border border-ks-rule bg-white font-body text-[12px] text-ks-ink placeholder:text-ks-silver px-3 py-2 rounded-ks focus:outline-none focus:border-ks-lava transition-colors"
                      />
                    </div>
                  )}
                  {section.image_url ? (
                    <div>
                      <img
                        src={section.image_url}
                        alt={section.image_caption ?? ''}
                        style={{ maxWidth: '100%', display: 'block', border: '0.5px solid #E8E5E0' }}
                      />
                      <div style={{ marginTop: '8px' }}>
                        {readonly ? (
                          section.image_caption && <p style={{ fontSize: '11px', color: '#9A9A9A', fontStyle: 'italic' }}>{section.image_caption}</p>
                        ) : (
                          <span contentEditable suppressContentEditableWarning onBlur={e => setSection(section.id, s => ({ ...s, image_caption: e.currentTarget.innerText }))} style={{ fontSize: '11px', color: '#9A9A9A', fontStyle: 'italic', display: 'block' }}>{section.image_caption || 'Add a caption…'}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    !readonly && (
                      <div style={{ border: '2px dashed #D4D0CA', padding: '48px 24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '11px', color: '#9A9A9A' }}>Paste an image URL above to embed a screenshot or chart.</p>
                      </div>
                    )
                  )}
                </div>
              )}

            </section>
          ))}
        </div>

        {/* Add section — type picker */}
        {!readonly && (
          <div className="no-print flex flex-wrap items-center gap-2 mt-4 pt-4" style={{ borderTop: '0.5px dashed #D4D0CA' }}>
            <span className="font-body text-[9px] text-ks-silver uppercase tracking-[0.12em]">Add section:</span>
            {SECTION_TYPES.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => addSection(type)}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
              >+ {label}</button>
            ))}
          </div>
        )}

      </DocumentShell>
    </div>
  )
}
