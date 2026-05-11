import { useEffect, useState } from 'react'
import type { Client, KSDocument, ReportContent, ReportSection } from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
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

  function updateSection(id: string, field: keyof ReportSection, value: string) {
    setContent(c => ({ ...c, sections: c.sections.map(s => s.id === id ? { ...s, [field]: value } : s) }))
  }

  function updateSectionItem(sectionId: string, itemId: string, field: 't' | 'b', value: string) {
    setContent(c => ({
      ...c,
      sections: c.sections.map(s => s.id === sectionId
        ? { ...s, items: s.items?.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : s
      ),
    }))
  }

  function addSection() {
    setContent(c => ({
      ...c,
      sections: [...c.sections, {
        id: crypto.randomUUID(),
        micro: 'New Section',
        heading: 'Section Heading',
        type: 'text',
        body: 'Write your content here.',
      }],
    }))
  }

  function removeSection(id: string) {
    setContent(c => ({ ...c, sections: c.sections.filter(s => s.id !== id) }))
  }

  function addItem(sectionId: string) {
    setContent(c => ({
      ...c,
      sections: c.sections.map(s => s.id === sectionId
        ? { ...s, items: [...(s.items ?? []), { id: crypto.randomUUID(), t: 'Item Title', b: 'Item body text.' }] }
        : s
      ),
    }))
  }

  function removeItem(sectionId: string, itemId: string) {
    setContent(c => ({
      ...c,
      sections: c.sections.map(s => s.id === sectionId
        ? { ...s, items: s.items?.filter(i => i.id !== itemId) }
        : s
      ),
    }))
  }

  return (
    <div>
      {/* Toolbar */}
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver">Click any text to edit inline.</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => exportToPDF('document-content', `${document.reference_number}`)}>Export PDF</Button>
            <Button variant="dark" size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      )}

      <DocumentShell document={document} client={client}>

        {/* Title block */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '36px', fontWeight: 700, lineHeight: 1.0, color: '#0D0D0D', marginBottom: '12px', letterSpacing: '-0.03em' }}>
            {client.company_name} —<br />
            {readonly ? (
              content.subtitle
            ) : (
              <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, subtitle: e.target.innerText }))} style={{ display: 'inline-block' }}>{content.subtitle}</span>
            )}
          </h2>
          <div style={{ height: '3px', width: '64px', backgroundColor: '#F56E0F' }} />
        </div>

        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.7, color: '#3A3A3A' }}>
          {content.sections.map(section => (
            <section key={section.id} style={{ marginBottom: '48px', position: 'relative' }}>

              {/* Remove section button */}
              {!readonly && (
                <button
                  className="no-print absolute -right-4 top-0 bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                  onClick={() => removeSection(section.id)}
                >×</button>
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
                    <span contentEditable suppressContentEditableWarning onBlur={e => updateSection(section.id, 'micro', e.target.innerText)} style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F56E0F', display: 'block', marginBottom: '4px' }}>{section.micro}</span>
                    <h3 contentEditable suppressContentEditableWarning onBlur={e => updateSection(section.id, 'heading', e.target.innerText)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0D0D0D', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '0.5px solid #D4D0CA', paddingBottom: '8px' }}>{section.heading}</h3>
                  </>
                )}
              </div>

              {/* Text section */}
              {section.type === 'text' && (
                readonly ? (
                  <p style={{ fontSize: '14px', color: '#0D0D0D' }}>{section.body}</p>
                ) : (
                  <p contentEditable suppressContentEditableWarning onBlur={e => updateSection(section.id, 'body', e.target.innerText)} style={{ fontSize: '14px', color: '#0D0D0D' }}>{section.body}</p>
                )
              )}

              {/* Callout section */}
              {section.type === 'callout' && (
                <div style={{ padding: '32px', border: '0.5px solid #D4D0CA', backgroundColor: '#F0EDE8' }}>
                  {readonly ? (
                    <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{section.body}</p>
                  ) : (
                    <p contentEditable suppressContentEditableWarning onBlur={e => updateSection(section.id, 'body', e.target.innerText)} style={{ fontSize: '14px', lineHeight: 1.6 }}>{section.body}</p>
                  )}
                </div>
              )}

              {/* Grid section */}
              {section.type === 'grid' && section.items && (
                <div>
                  {section.items.map((item, idx) => (
                    <div key={item.id} style={{ paddingBottom: '24px', borderBottom: idx < (section.items?.length ?? 0) - 1 ? '0.5px solid #E8E5E0' : 'none', marginBottom: '24px', position: 'relative' }}>
                      {!readonly && (
                        <button className="no-print absolute right-0 top-0 bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => removeItem(section.id, item.id)}>×</button>
                      )}
                      {readonly ? (
                        <>
                          <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0D0D0D', marginBottom: '6px' }}>{item.t}</h4>
                          <p>{item.b}</p>
                        </>
                      ) : (
                        <>
                          <h4 contentEditable suppressContentEditableWarning onBlur={e => updateSectionItem(section.id, item.id, 't', e.target.innerText)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#0D0D0D', marginBottom: '6px' }}>{item.t}</h4>
                          <p contentEditable suppressContentEditableWarning onBlur={e => updateSectionItem(section.id, item.id, 'b', e.target.innerText)}>{item.b}</p>
                        </>
                      )}
                    </div>
                  ))}
                  {!readonly && (
                    <button className="no-print font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => addItem(section.id)}>+ Add Item</button>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {!readonly && (
          <button className="no-print font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors mt-4" onClick={addSection}>+ Add Section</button>
        )}

      </DocumentShell>
    </div>
  )
}
