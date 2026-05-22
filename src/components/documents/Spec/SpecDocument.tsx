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

function extractTitle(md: string): string {
  const m = md.match(/^#(?!#)\s+(.+)$/m)
  return m ? m[1].trim() : ''
}

function splitMarkdown(md: string): Array<{ heading: string; body: string }> {
  const withoutH1 = md.replace(/^#(?!#)\s+[^\n]*\n?/, '').trim()
  const sections: Array<{ heading: string; body: string }> = []
  const matches = [...withoutH1.matchAll(/^##\s+(.+)$/gm)]

  if (matches.length === 0) {
    return withoutH1 ? [{ heading: '', body: withoutH1 }] : []
  }

  const preamble = withoutH1.slice(0, matches[0].index).trim()
  if (preamble) sections.push({ heading: '', body: preamble })

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : withoutH1.length
    const body = withoutH1.slice(start, end).trim()
    sections.push({ heading: matches[i][1], body })
  }

  return sections.filter(s => s.heading || s.body)
}

function CoverPage({ document: doc, client, version, date }: {
  document: KSDocument
  client: Client
  version: string
  date: string
}) {
  const title = extractTitle((doc.content as SpecContent).markdown ?? '') || doc.title

  return (
    <div
      data-spec-page="cover"
      style={{
        backgroundColor: '#0D0D0D',
        minHeight: '1100px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '850px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '48px 56px 0' }}>
        <img src="/logo.svg" alt="Kenosonic" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
            Spec Document
          </p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#3A3A3A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {doc.reference_number}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px' }}>
        <div style={{ borderLeft: '3px solid #F56E0F', paddingLeft: '24px', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
            Technical Specification
          </p>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '40px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            margin: 0,
          }}>
            {title}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
              Prepared For
            </p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {client.company_name}
            </p>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#2A2A2A', flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
              Contact
            </p>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '14px', fontWeight: 600, color: '#9A9A9A', margin: 0 }}>
              {client.contact_name}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '0.5px solid #1E1E1E', padding: '20px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', lineHeight: 1.6, margin: 0 }}>
          hello@kenosonic.co.za · kenosonic.co.za
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', textAlign: 'right', margin: 0 }}>
          v{version} · {date}
        </p>
      </div>
    </div>
  )
}

function ContentPage({ section, docRef, title, version, date }: {
  section: { heading: string; body: string }
  docRef: string
  title: string
  version: string
  date: string
}) {
  const html = marked.parse(section.body) as string
  const truncTitle = title.length > 40 ? title.slice(0, 37) + '…' : title

  return (
    <div
      data-spec-page="content"
      style={{
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: '850px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: '40px 56px 24px' }}>
        {section.heading && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
            {section.heading}
          </p>
        )}
        <div
          className="spec-markdown"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.8, color: '#3A3A3A' }}
        />
      </div>

      {/* Section separator with doc metadata */}
      <div style={{ borderTop: '0.5px solid #E8E5E0', padding: '10px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', color: '#C0BDB8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Spec Document · {truncTitle} · v{version} · {date}
        </p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', color: '#C0BDB8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {docRef}
        </p>
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
        minHeight: '1100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '850px',
        padding: '56px',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      <img src="/logo.svg" alt="Kenosonic" style={{ height: '32px', filter: 'brightness(0) invert(1)', marginBottom: '48px' }} />

      <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>
        Confidential
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#5A5A5A', lineHeight: 1.8, maxWidth: '480px', marginBottom: '48px' }}>
        This document contains proprietary information belonging to Kenosonic Interactive (Pty) Ltd and {client.company_name}. It is intended solely for the named recipient and may not be reproduced, distributed, or disclosed without prior written consent.
      </p>

      <div style={{ width: '48px', height: '1px', backgroundColor: '#2A2A2A', marginBottom: '48px' }} />

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#5A5A5A', lineHeight: 2, margin: 0 }}>
        hello@kenosonic.co.za<br />
        kenosonic.co.za<br />
        Johannesburg, South Africa
      </p>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#2A2A2A', marginTop: '48px', marginBottom: 0 }}>
        Kenosonic Interactive (Pty) Ltd · Reg. No. 2026/021166/07 · B-BBEE Level 1 · © {new Date().getFullYear()}
      </p>
    </div>
  )
}

export function SpecDocument({ document, client, readonly = false }: Props) {
  const raw = (document.content ?? {}) as SpecContent
  const [markdown, setMarkdown] = useState(raw.markdown ?? '')
  const [sourceFilename, setSourceFilename] = useState(raw.source_filename ?? '')
  const [version, setVersion] = useState(raw.version ?? '1.0')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'preview' | 'source'>('preview')
  const [viewPage, setViewPage] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sections = splitMarkdown(markdown)
  const totalPages = 2 + sections.length
  const title = extractTitle(markdown) || document.title
  const date = new Date(document.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  async function save(md: string, filename: string, ver: string) {
    setSaving(true)
    await updateDocumentContent(document.id, {
      markdown: md,
      source_filename: filename,
      version: ver,
    } as unknown as Record<string, unknown>)
    setSaving(false)
  }

  useEffect(() => {
    if (readonly) return
    const t = setTimeout(() => save(markdown, sourceFilename, version), 2000)
    return () => clearTimeout(t)
  }, [markdown, sourceFilename, version]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewPage >= totalPages) setViewPage(0)
  }, [totalPages]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      setMarkdown(text)
      setSourceFilename(file.name)
      setViewPage(0)
      setSaving(true)
      await updateDocumentContent(document.id, {
        markdown: text,
        source_filename: file.name,
        version,
      } as unknown as Record<string, unknown>)
      setSaving(false)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      {/* Toolbar */}
      {!readonly && (
        <div className="no-print flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('preview')}
              className={`font-body text-[11px] px-3 py-1.5 rounded-ks border transition-colors ${tab === 'preview' ? 'border-ks-ink bg-ks-ink text-white' : 'border-ks-hairline text-ks-slate hover:border-ks-ink'}`}
            >Preview</button>
            <button
              onClick={() => setTab('source')}
              className={`font-body text-[11px] px-3 py-1.5 rounded-ks border transition-colors ${tab === 'source' ? 'border-ks-ink bg-ks-ink text-white' : 'border-ks-hairline text-ks-slate hover:border-ks-ink'}`}
            >Source</button>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={handleFileImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver border border-ks-hairline px-3 py-1.5 rounded-ks hover:border-ks-ink hover:text-ks-ink transition-colors"
            >{markdown ? 'Replace .md' : 'Import .md'}</button>
            <button
              onClick={() => window.print()}
              className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver border border-ks-hairline px-3 py-1.5 rounded-ks hover:border-ks-ink hover:text-ks-ink transition-colors"
            >Print</button>
            <button
              onClick={() => save(markdown, sourceFilename, version)}
              disabled={saving}
              className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-white bg-ks-ink border border-ks-ink px-3 py-1.5 rounded-ks hover:opacity-80 transition-opacity disabled:opacity-50"
            >{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}

      {/* Source editor */}
      {tab === 'source' && !readonly && (
        <div className="no-print mb-6">
          <textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            className="w-full font-mono text-[12px] text-ks-ink bg-ks-smoke border border-ks-hairline rounded-ks p-4 focus:outline-none focus:border-ks-lava resize-none"
            style={{ minHeight: '520px', lineHeight: 1.7, maxWidth: '850px' }}
            placeholder="Paste or type your markdown here…"
          />
        </div>
      )}

      {/* Page viewer */}
      {tab === 'preview' && (
        <div id="document-content" className="mx-auto shadow-sm" style={{ maxWidth: '850px' }}>
          {/* Cover */}
          <div className={viewPage === 0 ? undefined : 'hidden print:block'}>
            <CoverPage document={document} client={client} version={version} date={date} />
          </div>

          {/* Content pages */}
          {sections.map((section, i) => (
            <div key={i} className={viewPage === i + 1 ? undefined : 'hidden print:block'}>
              <ContentPage
                section={section}
                docRef={document.reference_number}
                title={title}
                version={version}
                date={date}
              />
            </div>
          ))}

          {/* Back page */}
          <div className={viewPage === totalPages - 1 ? undefined : 'hidden print:block'}>
            <BackPage client={client} />
          </div>
        </div>
      )}

      {/* Pagination */}
      {tab === 'preview' && (
        <div className="no-print mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setViewPage(p => Math.max(0, p - 1))}
            disabled={viewPage === 0}
            className="font-body text-[11px] text-ks-slate hover:text-ks-ink disabled:opacity-30 transition-colors px-3 py-1.5 border border-ks-hairline rounded-ks hover:border-ks-ink disabled:cursor-default"
          >← Previous</button>

          {totalPages <= 10 ? (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setViewPage(i)}
                  title={i === 0 ? 'Cover' : i === totalPages - 1 ? 'Back' : sections[i - 1]?.heading || `Page ${i}`}
                  className={`w-2 h-2 rounded-full transition-colors ${viewPage === i ? 'bg-ks-lava' : 'bg-ks-rule hover:bg-ks-silver'}`}
                />
              ))}
            </div>
          ) : (
            <span className="font-body text-[11px] text-ks-silver">Page {viewPage + 1} / {totalPages}</span>
          )}

          <button
            onClick={() => setViewPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={viewPage >= totalPages - 1}
            className="font-body text-[11px] text-ks-slate hover:text-ks-ink disabled:opacity-30 transition-colors px-3 py-1.5 border border-ks-hairline rounded-ks hover:border-ks-ink disabled:cursor-default"
          >Next →</button>
        </div>
      )}
    </div>
  )
}
