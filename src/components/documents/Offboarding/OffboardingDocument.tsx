import { useEffect, useState } from 'react'
import type { Client, KSDocument, OffboardingContent, OffboardingItem } from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

const microLabel: React.CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', display: 'block' }
const divider: React.CSSProperties = { borderTop: '0.5px solid #E8E5E0', margin: '32px 0' }
const bodyText: React.CSSProperties = { fontSize: '13px', color: '#3A3A3A', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }

export function OffboardingDocument({ document, client, readonly = false }: Props) {
  const raw = (document.content ?? {}) as OffboardingContent
  const [content, setContent] = useState<OffboardingContent>({
    project_summary: raw.project_summary ?? `Thank you for working with Kenosonic Interactive. This document summarises the work delivered for ${client.company_name} and provides everything you need to take full ownership of your project.`,
    delivered_items: Array.isArray(raw.delivered_items) ? raw.delivered_items : [{ id: crypto.randomUUID(), title: 'Website', detail: 'Fully developed, tested, and deployed.' }],
    credentials: Array.isArray(raw.credentials) ? raw.credentials : [],
    handover_notes: raw.handover_notes ?? '',
    next_steps: Array.isArray(raw.next_steps) ? raw.next_steps : [
      'Review all delivered assets and confirm everything is to your satisfaction',
      'Confirm access to all platforms and accounts listed below',
      'Save your credentials in a secure location',
      'Reach out within 14 days if you notice any issues',
    ],
    support_terms: raw.support_terms ?? 'Post-project support is available on request at our standard hourly rate. We recommend a monthly maintenance retainer for ongoing updates and security monitoring.',
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

  function addDeliverable() {
    setContent(c => ({ ...c, delivered_items: [...c.delivered_items, { id: crypto.randomUUID(), title: 'New Item', detail: '' }] }))
  }

  function removeDeliverable(id: string) {
    setContent(c => ({ ...c, delivered_items: c.delivered_items.filter(i => i.id !== id) }))
  }

  function updateDeliverable(id: string, field: keyof OffboardingItem, value: string) {
    setContent(c => ({ ...c, delivered_items: c.delivered_items.map(i => i.id === id ? { ...i, [field]: value } : i) }))
  }

  function addCredential() {
    setContent(c => ({ ...c, credentials: [...c.credentials, { id: crypto.randomUUID(), service: 'New Platform', note: '' }] }))
  }

  function removeCredential(id: string) {
    setContent(c => ({ ...c, credentials: c.credentials.filter(i => i.id !== id) }))
  }

  function addNextStep() {
    setContent(c => ({ ...c, next_steps: [...c.next_steps, 'New step'] }))
  }

  return (
    <div>
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver">Click any text to edit inline.</p>
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
            Project Handover
          </p>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '32px', fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '12px' }}>
            {client.company_name} —<br />Offboarding Summary
          </h2>
          <div style={{ height: '3px', width: '64px', backgroundColor: '#F56E0F' }} />
        </div>

        {/* Project summary */}
        <div style={{ marginBottom: '32px' }}>
          <span style={microLabel}>Project Summary</span>
          {readonly ? (
            <p style={bodyText}>{content.project_summary}</p>
          ) : (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={e => setContent(c => ({ ...c, project_summary: e.currentTarget.innerText }))}
              style={bodyText}
            >{content.project_summary}</p>
          )}
        </div>

        <div style={divider} />

        {/* Delivered items */}
        <div style={{ marginBottom: '32px' }}>
          <span style={microLabel}>Deliverables</span>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', width: '35%' }}>Item</th>
                <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Details</th>
                {!readonly && <th style={{ width: '32px' }} />}
              </tr>
            </thead>
            <tbody>
              {content.delivered_items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', verticalAlign: 'top', paddingRight: '16px' }}>
                    {readonly ? (
                      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D' }}>{item.title}</span>
                    ) : (
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => updateDeliverable(item.id, 'title', e.currentTarget.innerText)}
                        style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D', display: 'block' }}
                      >{item.title}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', verticalAlign: 'top' }}>
                    {readonly ? (
                      <span style={bodyText}>{item.detail}</span>
                    ) : (
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => updateDeliverable(item.id, 'detail', e.currentTarget.innerText)}
                        style={{ ...bodyText, display: 'block' }}
                      >{item.detail || 'Add details…'}</span>
                    )}
                  </td>
                  {!readonly && (
                    <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', textAlign: 'right', verticalAlign: 'top' }}>
                      <button
                        className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                        onClick={() => removeDeliverable(item.id)}
                      >×</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!readonly && (
            <button
              className="no-print mt-4 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
              onClick={addDeliverable}
            >+ Add Item</button>
          )}
        </div>

        <div style={divider} />

        {/* Credentials / Access */}
        <div style={{ marginBottom: '32px' }}>
          <span style={microLabel}>Access & Credentials</span>
          {content.credentials.length === 0 && readonly ? (
            <p style={{ ...bodyText, color: '#9A9A9A' }}>No credentials recorded.</p>
          ) : (
            <>
              {content.credentials.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', width: '35%' }}>Platform / Service</th>
                      <th style={{ textAlign: 'left', padding: '10px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Access Notes</th>
                      {!readonly && <th style={{ width: '32px' }} />}
                    </tr>
                  </thead>
                  <tbody>
                    {content.credentials.map(cred => (
                      <tr key={cred.id}>
                        <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', verticalAlign: 'top', paddingRight: '16px' }}>
                          {readonly ? (
                            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D' }}>{cred.service}</span>
                          ) : (
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setContent(c => ({ ...c, credentials: c.credentials.map(x => x.id === cred.id ? { ...x, service: e.currentTarget.innerText } : x) }))}
                              style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D', display: 'block' }}
                            >{cred.service}</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', verticalAlign: 'top' }}>
                          {readonly ? (
                            <span style={bodyText}>{cred.note}</span>
                          ) : (
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={e => setContent(c => ({ ...c, credentials: c.credentials.map(x => x.id === cred.id ? { ...x, note: e.currentTarget.innerText } : x) }))}
                              style={{ ...bodyText, display: 'block' }}
                            >{cred.note || 'Login details / notes…'}</span>
                          )}
                        </td>
                        {!readonly && (
                          <td style={{ padding: '14px 0', borderBottom: '0.5px solid #E8E5E0', textAlign: 'right', verticalAlign: 'top' }}>
                            <button
                              className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                              onClick={() => removeCredential(cred.id)}
                            >×</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!readonly && (
                <button
                  className="no-print mt-2 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
                  onClick={addCredential}
                >+ Add Credential</button>
              )}
            </>
          )}
        </div>

        <div style={divider} />

        {/* Handover notes */}
        {(content.handover_notes || !readonly) && (
          <div style={{ marginBottom: '32px' }}>
            <span style={microLabel}>Handover Notes</span>
            {readonly ? (
              <p style={bodyText}>{content.handover_notes}</p>
            ) : (
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={e => setContent(c => ({ ...c, handover_notes: e.currentTarget.innerText }))}
                style={{ ...bodyText, minHeight: '60px', padding: '10px', backgroundColor: '#FAFAF9', border: '0.5px solid #E8E5E0' }}
              >{content.handover_notes || 'Add any specific handover instructions, CMS notes, or important context here…'}</p>
            )}
          </div>
        )}

        {(content.handover_notes || !readonly) && <div style={divider} />}

        {/* Next steps */}
        <div style={{ marginBottom: '32px' }}>
          <span style={microLabel}>Your Next Steps</span>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {content.next_steps.map((step, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                <span style={{ width: '20px', height: '20px', backgroundColor: '#F56E0F', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '9px', color: '#FFFFFF' }}>{i + 1}</span>
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {readonly ? (
                    <span style={bodyText}>{step}</span>
                  ) : (
                    <>
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => setContent(c => ({ ...c, next_steps: c.next_steps.map((s, idx) => idx === i ? e.currentTarget.innerText : s) }))}
                        style={{ ...bodyText, flex: 1 }}
                      >{step}</span>
                      <button
                        className="no-print bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors flex-shrink-0 mt-0.5"
                        onClick={() => setContent(c => ({ ...c, next_steps: c.next_steps.filter((_, idx) => idx !== i) }))}
                      >×</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!readonly && (
            <button
              className="no-print mt-3 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
              onClick={addNextStep}
            >+ Add Step</button>
          )}
        </div>

        <div style={divider} />

        {/* Support terms */}
        <div style={{ backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '24px' }}>
          <span style={microLabel}>Ongoing Support</span>
          {readonly ? (
            <p style={bodyText}>{content.support_terms}</p>
          ) : (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={e => setContent(c => ({ ...c, support_terms: e.currentTarget.innerText }))}
              style={bodyText}
            >{content.support_terms}</p>
          )}
        </div>

      </DocumentShell>
    </div>
  )
}
