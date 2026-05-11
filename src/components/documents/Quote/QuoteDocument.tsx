import { useEffect, useState } from 'react'
import type { Client, QuoteContent, KSDocument, LineItem } from '../../../types'
import { DocumentShell } from '../DocumentShell'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'
import { exportToPDF } from '../../../lib/pdf'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), title: 'New Item', description: 'Item description', amount: 0 }
}

const fmt = (n: number) => new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export function QuoteDocument({ document, client, readonly = false }: Props) {
  const raw = document.content as QuoteContent
  const [content, setContent] = useState<QuoteContent>({
    issue_date: raw.issue_date ?? new Date().toISOString().split('T')[0],
    valid_until: raw.valid_until ?? '',
    payment_terms: raw.payment_terms ?? 'EFT / Bank Transfer',
    bank_details: raw.bank_details ?? { bank: 'FNB', account: '', branch: '' },
    line_items: raw.line_items ?? [newLineItem()],
    tax_rate: raw.tax_rate ?? 15,
    notes: raw.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const subtotal = content.line_items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const tax = subtotal * (content.tax_rate / 100)
  const total = subtotal + tax

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setContent(c => ({ ...c, line_items: c.line_items.map(i => i.id === id ? { ...i, [field]: value } : i) }))
  }

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

        {/* Dates + client info */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #E8E5E0', marginBottom: '40px', paddingBottom: '32px' }}>
          <div style={{ flex: 1, paddingRight: '48px', borderRight: '0.5px solid #E8E5E0' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Prepared For</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', marginBottom: '4px' }}>{client.contact_name}</p>
            <p style={{ fontSize: '12px', color: '#3A3A3A', marginBottom: '2px' }}>{client.contact_email}</p>
            <p style={{ fontSize: '12px', color: '#3A3A3A', marginBottom: '2px' }}>{client.address_line1}</p>
            <p style={{ fontSize: '12px', color: '#3A3A3A' }}>{client.city}, {client.province}</p>
          </div>
          <div style={{ flex: 1, paddingLeft: '48px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Quote Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: '#9A9A9A', width: '80px', flexShrink: 0 }}>Issue Date</span>
                {readonly ? (
                  <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.issue_date}</span>
                ) : (
                  <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, issue_date: e.target.innerText }))} style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.issue_date}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: '#9A9A9A', width: '80px', flexShrink: 0 }}>Valid Until</span>
                {readonly ? (
                  <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.valid_until || '—'}</span>
                ) : (
                  <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, valid_until: e.target.innerText }))} style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.valid_until || 'e.g. 2026-06-30'}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ fontSize: '11px', color: '#9A9A9A', width: '80px', flexShrink: 0 }}>Payment</span>
                {readonly ? (
                  <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.payment_terms}</span>
                ) : (
                  <span contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, payment_terms: e.target.innerText }))} style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.payment_terms}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px' }}>Scope of Work</p>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', width: '70%' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '12px 0', borderBottom: '0.5px solid #E8E5E0', color: '#9A9A9A', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Amount (ZAR)</th>
            </tr>
          </thead>
          <tbody>
            {content.line_items.map(item => (
              <tr key={item.id}>
                <td style={{ padding: '20px 0', borderBottom: '0.5px solid #E8E5E0', verticalAlign: 'top' }}>
                  {readonly ? (
                    <>
                      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', display: 'block', marginBottom: '4px' }}>{item.title}</span>
                      <span style={{ fontSize: '12px', color: '#9A9A9A' }}>{item.description}</span>
                    </>
                  ) : (
                    <>
                      <span contentEditable suppressContentEditableWarning onBlur={e => updateItem(item.id, 'title', e.target.innerText)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', display: 'block', marginBottom: '4px' }}>{item.title}</span>
                      <span contentEditable suppressContentEditableWarning onBlur={e => updateItem(item.id, 'description', e.target.innerText)} style={{ fontSize: '12px', color: '#9A9A9A' }}>{item.description}</span>
                    </>
                  )}
                </td>
                <td style={{ padding: '20px 0', borderBottom: '0.5px solid #E8E5E0', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#0D0D0D', fontSize: '14px' }}>
                    R{' '}
                    {readonly ? (
                      <span>{fmt(item.amount)}</span>
                    ) : (
                      <span contentEditable suppressContentEditableWarning onBlur={e => updateItem(item.id, 'amount', parseFloat(e.target.innerText.replace(/[^\d.-]/g, '')) || 0)}>{fmt(item.amount)}</span>
                    )}
                  </span>
                  {!readonly && (
                    <button className="no-print ml-3 bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors" onClick={() => setContent(c => ({ ...c, line_items: c.line_items.filter(i => i.id !== item.id) }))}>×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!readonly && (
          <button className="no-print mt-4 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors" onClick={() => setContent(c => ({ ...c, line_items: [...c.line_items, newLineItem()] }))}>
            + Add Item
          </button>
        )}

        {/* Totals */}
        <div style={{ width: '50%', marginLeft: 'auto', marginTop: '32px', backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#3A3A3A' }}>Subtotal</span>
            <span style={{ fontSize: '12px', color: '#3A3A3A' }}>R {fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9A9A9A' }}>VAT ({content.tax_rate}%)</span>
            <span style={{ fontSize: '12px', color: '#9A9A9A' }}>R {fmt(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginTop: '8px', borderTop: '0.5px solid #D4D0CA' }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D0D0D' }}>Quote Total</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: '#F56E0F' }}>R {fmt(total)}</span>
          </div>
        </div>

        {/* Notes */}
        {(content.notes || !readonly) && (
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '0.5px solid #E8E5E0' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Notes</p>
            {readonly ? (
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.notes}</p>
            ) : (
              <p contentEditable suppressContentEditableWarning onBlur={e => setContent(c => ({ ...c, notes: e.target.innerText }))} style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.notes || 'Add any notes here…'}</p>
            )}
          </div>
        )}

      </DocumentShell>
    </div>
  )
}
