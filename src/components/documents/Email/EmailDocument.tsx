import { useEffect, useState } from 'react'
import type { Client, EmailContent, KSDocument } from '../../../types'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

export function EmailDocument({ document, client, readonly = false }: Props) {
  const raw = (document.content ?? {}) as EmailContent
  const [content, setContent] = useState<EmailContent>({
    subject: raw.subject ?? '',
    greeting: raw.greeting ?? `Hi ${client.contact_name},`,
    body_sections: Array.isArray(raw.body_sections) ? raw.body_sections : [{ id: crypto.randomUUID(), body: '' }],
    cta: raw.cta ?? undefined,
  })
  const [saving, setSaving] = useState(false)
  const [showCTA, setShowCTA] = useState(!!(raw.cta?.label || raw.cta?.url))

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
    setContent(c => ({ ...c, body_sections: [...c.body_sections, { id: crypto.randomUUID(), heading: '', body: '' }] }))
  }

  function removeSection(id: string) {
    setContent(c => ({ ...c, body_sections: c.body_sections.filter(s => s.id !== id) }))
  }

  function updateSection(id: string, field: 'heading' | 'body', value: string) {
    setContent(c => ({ ...c, body_sections: c.body_sections.map(s => s.id === id ? { ...s, [field]: value } : s) }))
  }

  function toggleCTA() {
    if (showCTA) {
      setContent(c => ({ ...c, cta: undefined }))
      setShowCTA(false)
    } else {
      setContent(c => ({ ...c, cta: { label: 'View Document', url: '' } }))
      setShowCTA(true)
    }
  }

  return (
    <div>
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver">Click any text to edit inline.</p>
          <div className="flex gap-3">
            <Button variant="dark" size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      )}

      {/* Email preview container */}
      <div style={{ maxWidth: '640px', backgroundColor: '#F8F6F3', padding: '24px', border: '0.5px solid #E8E5E0' }}>

        {/* Email meta header */}
        <div style={{ backgroundColor: '#FFFFFF', border: '0.5px solid #E8E5E0', padding: '16px 20px', marginBottom: '2px', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '6px', color: '#9A9A9A' }}>
            <span style={{ minWidth: '40px' }}>From</span>
            <span style={{ color: '#0D0D0D', fontWeight: 500 }}>Kenosonic Interactive &lt;hello@kenosonic.io&gt;</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '6px', color: '#9A9A9A' }}>
            <span style={{ minWidth: '40px' }}>To</span>
            <span style={{ color: '#0D0D0D' }}>{client.contact_name} &lt;{client.contact_email}&gt;</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#9A9A9A' }}>
            <span style={{ minWidth: '40px' }}>Subject</span>
            {readonly ? (
              <span style={{ color: '#0D0D0D', fontWeight: 600 }}>{content.subject || '(no subject)'}</span>
            ) : (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={e => setContent(c => ({ ...c, subject: e.currentTarget.innerText }))}
                style={{ color: '#0D0D0D', fontWeight: 600, flex: 1, outline: 'none', borderBottom: '1px dashed #D4D0CA' }}
              >{content.subject || 'Enter subject line…'}</span>
            )}
          </div>
        </div>

        {/* Email body */}
        <div style={{ backgroundColor: '#FFFFFF', border: '0.5px solid #E8E5E0', padding: '40px 40px 32px' }}>

          {/* KS brand bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', paddingBottom: '20px', borderBottom: '0.5px solid #E8E5E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: '#F56E0F', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>K</span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D', letterSpacing: '-0.01em' }}>Kenosonic</span>
            </div>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9A9A9A' }}>{document.reference_number}</span>
          </div>

          {/* Greeting */}
          <div style={{ marginBottom: '24px' }}>
            {readonly ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D0D0D', fontWeight: 500 }}>{content.greeting}</p>
            ) : (
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={e => setContent(c => ({ ...c, greeting: e.currentTarget.innerText }))}
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#0D0D0D', fontWeight: 500, outline: 'none', borderBottom: '1px dashed #D4D0CA' }}
              >{content.greeting}</p>
            )}
          </div>

          {/* Body sections */}
          <div style={{ marginBottom: '24px' }}>
            {content.body_sections.map((section, idx) => (
              <div key={section.id} style={{ marginBottom: '20px', position: 'relative' }}>
                {!readonly && idx > 0 && (
                  <button
                    className="no-print absolute -right-4 top-0 bg-ks-void text-white text-[10px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                    onClick={() => removeSection(section.id)}
                  >×</button>
                )}
                {/* Optional heading */}
                {(section.heading || !readonly) && (
                  readonly ? (
                    section.heading ? <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', marginBottom: '8px' }}>{section.heading}</h4> : null
                  ) : (
                    <h4
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={e => updateSection(section.id, 'heading', e.currentTarget.innerText)}
                      style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', marginBottom: '8px', outline: 'none', borderBottom: '1px dashed #D4D0CA', display: 'block' }}
                    >{section.heading || 'Section heading (optional)…'}</h4>
                  )
                )}
                {readonly ? (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3A3A3A', lineHeight: 1.7 }}>{section.body}</p>
                ) : (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={e => updateSection(section.id, 'body', e.currentTarget.innerText)}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#3A3A3A', lineHeight: 1.7, outline: 'none', borderBottom: '1px dashed #D4D0CA', minHeight: '40px' }}
                  >{section.body || 'Write your message here…'}</p>
                )}
              </div>
            ))}
            {!readonly && (
              <button
                className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-3 py-1.5 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
                onClick={addSection}
              >+ Add Section</button>
            )}
          </div>

          {/* CTA */}
          {showCTA && content.cta && (
            <div style={{ textAlign: 'center', margin: '32px 0' }}>
              {readonly ? (
                <span style={{ display: 'inline-block', backgroundColor: '#F56E0F', color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', padding: '14px 32px', borderRadius: '4px', letterSpacing: '0.02em' }}>
                  {content.cta.label}
                </span>
              ) : (
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={e => setContent(c => ({ ...c, cta: { ...c.cta!, label: e.currentTarget.innerText } }))}
                    style={{ display: 'inline-block', backgroundColor: '#F56E0F', color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', padding: '14px 32px', borderRadius: '4px', outline: 'none', minWidth: '120px', textAlign: 'center' }}
                  >{content.cta.label}</span>
                  <input
                    type="text"
                    value={content.cta.url}
                    onChange={e => setContent(c => ({ ...c, cta: { ...c.cta!, url: e.target.value } }))}
                    placeholder="Button URL…"
                    className="no-print font-body text-[10px] text-ks-silver border border-ks-hairline px-2 py-1 rounded-ks focus:outline-none focus:border-ks-lava w-64 text-center"
                  />
                </div>
              )}
            </div>
          )}
          {!readonly && (
            <div className="no-print text-center mt-4">
              <button
                onClick={toggleCTA}
                className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver hover:text-ks-lava transition-colors"
              >{showCTA ? '− Remove CTA Button' : '+ Add CTA Button'}</button>
            </div>
          )}

          {/* Email footer */}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '0.5px solid #E8E5E0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9A9A9A', marginBottom: '4px' }}>Kenosonic Interactive (Pty) Ltd · Johannesburg, South Africa</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9A9A9A' }}>hello@kenosonic.io · kenosonic.io</p>
          </div>
        </div>
      </div>
    </div>
  )
}
