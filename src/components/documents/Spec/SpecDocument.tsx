import { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import type { Client, KSDocument, SpecContent } from '../../../types'
import { updateDocumentContent } from '../../../hooks/useDocument'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

marked.setOptions({ breaks: true })

function toHtml(raw: SpecContent): string {
  const content = raw.markdown ?? ''
  if (!content) return ''
  // Already HTML (saved via editor) or plain markdown to convert
  return content.trimStart().startsWith('<') ? content : marked.parse(content) as string
}

function CoverPage({ document: doc, client, version, date }: {
  document: KSDocument
  client: Client
  version: string
  date: string
}) {
  return (
    <div
      data-spec-page="cover"
      style={{
        backgroundColor: '#0D0D0D',
        minHeight: '1056px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div className="spec-cover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '48px 56px 0' }}>
        <img src="/logo.svg" alt="Kenosonic" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Spec Document</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#3A3A3A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{doc.reference_number}</p>
        </div>
      </div>

      <div className="spec-cover-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px' }}>
        <div style={{ borderLeft: '3px solid #F56E0F', paddingLeft: '24px', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>Technical Specification</p>
          <h1 className="spec-cover-title" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '40px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0 }}>
            {doc.title}
          </h1>
        </div>
        <div className="spec-cover-meta" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Prepared For</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{client.company_name}</p>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#2A2A2A', flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Contact</p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 600, color: '#9A9A9A', margin: 0 }}>{client.contact_name}</p>
          </div>
        </div>
      </div>

      <div className="spec-cover-footer" style={{ borderTop: '0.5px solid #1E1E1E', padding: '20px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', lineHeight: 1.6, margin: 0 }}>hello@kenosonic.co.za · kenosonic.co.za</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', margin: 0 }}>v{version} · {date}</p>
      </div>
    </div>
  )
}

function BackPage({ client }: { client: Client }) {
  return (
    <div
      data-spec-page="back"
      style={{
        backgroundColor: '#0D0D0D',
        minHeight: '1056px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
        padding: '56px',
        textAlign: 'center',
      }}
    >
      <img src="/logo.svg" alt="Kenosonic" style={{ height: '32px', filter: 'brightness(0) invert(1)', marginBottom: '48px' }} />
      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Confidential</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#5A5A5A', lineHeight: 1.8, maxWidth: '480px', marginBottom: '48px' }}>
        This document contains proprietary information belonging to Kenosonic Interactive (Pty) Ltd and {client.company_name}. It is intended solely for the named recipient and may not be reproduced, distributed, or disclosed without prior written consent.
      </p>
      <div style={{ width: '48px', height: '1px', backgroundColor: '#2A2A2A', marginBottom: '48px' }} />
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#5A5A5A', lineHeight: 2, margin: 0 }}>
        hello@kenosonic.co.za<br />kenosonic.co.za<br />Johannesburg, South Africa
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#2A2A2A', marginTop: '48px', marginBottom: 0 }}>
        Kenosonic Interactive (Pty) Ltd · Reg. No. 2026/021166/07 · B-BBEE Level 1 · © {new Date().getFullYear()}
      </p>
    </div>
  )
}

export function SpecDocument({ document, client, readonly = false }: Props) {
  const raw = (document.content ?? {}) as SpecContent
  const [version, setVersion] = useState(raw.version ?? '1.0')
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const versionRef = useRef(version)

  const date = new Date(document.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  // Keep versionRef in sync so the save closure always reads the latest value
  useEffect(() => { versionRef.current = version }, [version])

  // Populate editor once on mount
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = toHtml(raw)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleSave() {
    if (readonly) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(doSave, 2000)
  }

  function handlePrint() {
    // Temporarily override the global @page margin so cover/back pages are full-bleed
    const style = window.document.createElement('style')
    style.id = '__spec-print-override'
    style.textContent = `
      @page { margin: 0; }
      [data-spec-page="cover"], [data-spec-page="back"] { min-height: 297mm !important; }
      [data-spec-page="content"] { padding: 15mm 20mm !important; }
    `
    window.document.head.appendChild(style)
    requestAnimationFrame(() => {
      window.print()
      window.addEventListener('afterprint', () => {
        window.document.getElementById('__spec-print-override')?.remove()
      }, { once: true })
    })
  }

  async function doSave() {
    const html = contentRef.current?.innerHTML ?? ''
    setSaving(true)
    await updateDocumentContent(document.id, {
      markdown: html,
      version: versionRef.current,
      source_filename: raw.source_filename ?? '',
    } as unknown as Record<string, unknown>)
    setSaving(false)
  }

  // Trigger save when version changes
  useEffect(() => {
    scheduleSave()
  }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const md = evt.target?.result as string
      const html = marked.parse(md) as string
      if (contentRef.current) contentRef.current.innerHTML = html
      scheduleSave()
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      {!readonly && (
        <div className="no-print flex items-center gap-2 mb-6 flex-wrap">
          <div className="flex items-center gap-1 border border-ks-hairline rounded-ks px-2.5 py-1.5">
            <span className="font-body text-[9px] uppercase tracking-[0.1em] text-ks-silver">v</span>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              className="font-body text-[11px] text-ks-ink bg-transparent focus:outline-none w-10"
              placeholder="1.0"
            />
          </div>
          <input ref={fileInputRef} type="file" accept=".md,text/markdown,text/plain" className="hidden" onChange={handleFileImport} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver border border-ks-hairline px-3 py-1.5 rounded-ks hover:border-ks-ink hover:text-ks-ink transition-colors"
          >Import .md</button>
          <button
            onClick={handlePrint}
            className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver border border-ks-hairline px-3 py-1.5 rounded-ks hover:border-ks-ink hover:text-ks-ink transition-colors"
          >Print</button>
          <button
            onClick={doSave}
            disabled={saving}
            className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-white bg-ks-ink border border-ks-ink px-3 py-1.5 rounded-ks hover:opacity-80 transition-opacity disabled:opacity-50 ml-auto"
          >{saving ? 'Saving…' : 'Save'}</button>
        </div>
      )}

      <div id="document-content" className="mx-auto shadow-sm" style={{ maxWidth: '850px' }}>
        <CoverPage document={document} client={client} version={version} date={date} />

        {/* Editable content body — click anywhere to edit, drag to rearrange */}
        <div
          ref={contentRef}
          contentEditable={readonly ? 'false' : 'true'}
          onInput={scheduleSave}
          suppressContentEditableWarning
          data-spec-page="content"
          className="spec-markdown"
          style={{
            minHeight: '400px',
            padding: '48px 56px 56px',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            lineHeight: 1.8,
            color: '#3A3A3A',
          }}
        />

        <BackPage client={client} />
      </div>
    </div>
  )
}
