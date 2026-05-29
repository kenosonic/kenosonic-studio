import { useEffect, useState } from 'react'
import type { Client, InvoiceContent, KSDocument, LineItem } from '../../../types'
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

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), title: 'New Item', description: 'Item description', amount: 0 }
}

export function InvoiceDocument({ document, client, readonly = false }: Props) {
  const raw = document.content as InvoiceContent
  const [content, setContent] = useState<InvoiceContent>({
    issue_date: raw.issue_date ?? new Date().toISOString().split('T')[0],
    due_date: raw.due_date ?? '',
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

  const fmt = (n: number) => new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setContent(c => ({ ...c, line_items: c.line_items.map(i => i.id === id ? { ...i, [field]: value } : i) }))
  }

  function addItem() {
    setContent(c => ({ ...c, line_items: [...c.line_items, newLineItem()] }))
  }

  function removeItem(id: string) {
    setContent(c => ({ ...c, line_items: c.line_items.filter(i => i.id !== id) }))
  }

  async function save() {
    setSaving(true)
    await updateDocumentContent(document.id, content as unknown as Record<string, unknown>)
    setSaving(false)
  }

  // Auto-save 2s after last change
  useEffect(() => {
    if (readonly) return
    const t = setTimeout(save, 2000)
    return () => clearTimeout(t)
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Toolbar */}
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6">
          <p className="font-body text-[11px] text-ks-silver hidden sm:block">Click any value to edit inline.</p>
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

        {/* Client + payment details */}
        <div className="print-avoid" style={{ display: 'flex', borderBottom: '0.5px solid #E8E5E0', marginBottom: '40px' }}>
          <div style={{ flex: 1, paddingRight: '48px', borderRight: '0.5px solid #E8E5E0' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Client Info</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', marginBottom: '4px' }}>{client.contact_name}</p>
            <p style={{ fontSize: '12px', color: '#3A3A3A', marginBottom: '2px' }}>{client.contact_email}</p>
            <p style={{ fontSize: '12px', color: '#3A3A3A', marginBottom: '2px' }}>{client.address_line1}</p>
            <p style={{ fontSize: '12px', color: '#3A3A3A' }}>{client.city}, {client.province}</p>
          </div>
          <div style={{ flex: 1, paddingLeft: '48px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Payment Details</p>
            {readonly ? (
              <>
                <p style={{ fontSize: '12px', color: '#3A3A3A', marginBottom: '2px' }}>{content.payment_terms}</p>
                <p style={{ fontSize: '12px', color: '#9A9A9A', marginBottom: '2px' }}>{content.bank_details.bank} Account: {content.bank_details.account}</p>
                <p style={{ fontSize: '12px', color: '#9A9A9A' }}>Branch: {content.bank_details.branch}</p>
              </>
            ) : (
              <>
                <Editable tag="p" value={content.payment_terms} onSave={v => setContent(c => ({ ...c, payment_terms: v }))} style={{ fontSize: '12px', color: '#3A3A3A', marginBottom: '2px' }} />
                <Editable tag="p" value={`${content.bank_details.bank} Account: ${content.bank_details.account}`} onSave={v => setContent(c => ({ ...c, bank_details: { ...c.bank_details, bank: v.split(' ')[0], account: v.split(': ')[1] ?? c.bank_details.account } }))} style={{ fontSize: '12px', color: '#9A9A9A', marginBottom: '2px' }} />
                <Editable tag="p" value={`Branch: ${content.bank_details.branch}`} onSave={v => setContent(c => ({ ...c, bank_details: { ...c.bank_details, branch: v.replace('Branch: ', '') } }))} style={{ fontSize: '12px', color: '#9A9A9A' }} />
              </>
            )}
          </div>
        </div>

        {/* Line items */}
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px' }}>Project Items</p>

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
                      <Editable value={item.title} onSave={v => updateItem(item.id, 'title', v)} style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '14px', color: '#0D0D0D', display: 'block', marginBottom: '4px' }} />
                      <Editable value={item.description} onSave={v => updateItem(item.id, 'description', v)} style={{ fontSize: '12px', color: '#9A9A9A' }} />
                    </>
                  )}
                </td>
                <td style={{ padding: '20px 0', borderBottom: '0.5px solid #E8E5E0', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: '#0D0D0D', fontSize: '14px' }}>
                    R{' '}
                    {readonly ? (
                      <span>{fmt(item.amount)}</span>
                    ) : (
                      <Editable value={fmt(item.amount)} onSave={v => updateItem(item.id, 'amount', parseFloat(v.replace(/[^\d.-]/g, '')) || 0)} />
                    )}
                  </span>
                  {!readonly && (
                    <button
                      className="no-print ml-3 bg-ks-void text-white text-[11px] w-5 h-5 rounded-ks hover:bg-red-500 transition-colors"
                      onClick={() => removeItem(item.id)}
                    >×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!readonly && (
          <button
            className="no-print mt-4 font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-lava border border-ks-lava px-4 py-2 rounded-ks hover:bg-ks-lava hover:text-white transition-colors"
            onClick={addItem}
          >
            + Add Item
          </button>
        )}

        {/* Totals */}
        <div className="print-avoid" style={{ width: '50%', marginLeft: 'auto', marginTop: '32px', backgroundColor: '#F8F6F3', border: '0.5px solid #E8E5E0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#3A3A3A' }}>Subtotal</span>
            <span style={{ fontSize: '12px', color: '#3A3A3A' }}>R {fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9A9A9A' }}>VAT ({content.tax_rate}%)</span>
            <span style={{ fontSize: '12px', color: '#9A9A9A' }}>R {fmt(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginTop: '8px', borderTop: '0.5px solid #D4D0CA' }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '15px', color: '#0D0D0D' }}>Total</span>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '22px', color: '#F56E0F' }}>R {fmt(total)}</span>
          </div>
        </div>

        {/* Notes */}
        {(content.notes || !readonly) && (
          <div className="print-avoid" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '0.5px solid #E8E5E0' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Notes</p>
            {readonly ? (
              <p style={{ fontSize: '12px', color: '#3A3A3A' }}>{content.notes}</p>
            ) : (
              <Editable tag="p" value={content.notes || 'Add any notes here…'} onSave={v => setContent(c => ({ ...c, notes: v === 'Add any notes here…' ? '' : v }))} style={{ fontSize: '12px', color: '#3A3A3A' }} />
            )}
          </div>
        )}

      </DocumentShell>
    </div>
  )
}
