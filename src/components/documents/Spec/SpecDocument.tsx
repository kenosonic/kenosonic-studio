import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import type { Client, KSDocument, SpecContent } from '../../../types'
import { updateDocumentContent } from '../../../hooks/useDocument'

// Usable content height per viewer page (A4 content area minus top padding and footer)
const PAGE_CONTENT_PX = 960

interface Section {
  heading: string
  body: string
}

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

function splitMarkdown(md: string): Section[] {
  const withoutH1 = md.replace(/^#(?!#)\s+[^\n]*\n?/, '').trim()
  const sections: Section[] = []
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
        minHeight: '1056px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '850px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '48px 56px 0' }}>
        <img src="/logo.svg" alt="Kenosonic" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Spec Document</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#3A3A3A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{doc.reference_number}</p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px' }}>
        <div style={{ borderLeft: '3px solid #F56E0F', paddingLeft: '24px', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>Technical Specification</p>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '40px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0 }}>{title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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

      <div style={{ borderTop: '0.5px solid #1E1E1E', padding: '20px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', lineHeight: 1.6, margin: 0 }}>hello@kenosonic.co.za · kenosonic.co.za</p>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#5A5A5A', textAlign: 'right', margin: 0 }}>v{version} · {date}</p>
      </div>
    </div>
  )
}

// A single A4 page containing one or more sections that fit together
function ContentPage({ sections, docRef, title, version, date }: {
  sections: Section[]
  docRef: string
  title: string
  version: string
  date: string
}) {
  const truncTitle = title.length > 40 ? title.slice(0, 37) + '…' : title

  return (
    <div
      data-spec-page="content"
      style={{
        backgroundColor: '#FFFFFF',
        minHeight: '1056px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '850px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ flex: 1, paddingTop: '48px' }}>
        {sections.map((section, i) => (
          <div key={i} style={{ padding: `${i > 0 ? '32px' : '0'} 56px 24px` }}>
            {section.heading && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#F56E0F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
                {section.heading}
              </p>
            )}
            <div
              className="spec-markdown"
              dangerouslySetInnerHTML={{ __html: marked.parse(section.body) as string }}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.8, color: '#3A3A3A' }}
            />
          </div>
        ))}
      </div>

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
        minHeight: '1056px',
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
  const [markdown, setMarkdown] = useState(raw.markdown ?? '')
  const [sourceFilename, setSourceFilename] = useState(raw.source_filename ?? '')
  const [version, setVersion] = useState(raw.version ?? '1.0')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'preview' | 'source'>('preview')
  const [viewPage, setViewPage] = useState(0)
  const [pageGroups, setPageGroups] = useState<Section[][]>([])
  const measureRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sections = useMemo(() => splitMarkdown(markdown), [markdown])
  const title = extractTitle(markdown) || document.title
  const date = new Date(document.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  // Measure section heights off-screen, then group sections into pages that fit A4
  useLayoutEffect(() => {
    if (sections.length === 0) { setPageGroups([]); return }

    const container = measureRef.current
    if (!container) { setPageGroups([sections]); return }

    const els = Array.from(container.querySelectorAll<HTMLElement>('[data-measure]'))
    if (els.length !== sections.length) { setPageGroups([sections]); return }

    const SECTION_GAP = 32  // px gap before each non-first section on a page
    const FOOTER_H = 42     // running footer height

    const groups: Section[][] = []
    let current: Section[] = []
    let usedHeight = 0

    els.forEach((el, i) => {
      // Height this section would add, including the gap if it's not first on the page
      const sectionH = el.offsetHeight + (current.length > 0 ? SECTION_GAP : 0)

      if (current.length > 0 && usedHeight + sectionH + FOOTER_H > PAGE_CONTENT_PX) {
        // This section doesn't fit — close current page and start a new one
        groups.push(current)
        current = [sections[i]]
        usedHeight = el.offsetHeight
      } else {
        current.push(sections[i])
        usedHeight += sectionH
      }
    })
    if (current.length > 0) groups.push(current)

    setPageGroups(groups)
  }, [sections])

  const totalPages = pageGroups.length + 2 // cover + content pages + back

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
    if (viewPage >= totalPages && totalPages > 0) setViewPage(0)
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
      {/*
        Hidden measurement container — rendered off-screen at the same width as the display.
        useLayoutEffect reads offsetHeight of each [data-measure] block to group sections into pages.
      */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '850px', visibility: 'hidden', pointerEvents: 'none' }}
      >
        {sections.map((section, i) => (
          <div
            key={i}
            data-measure
            style={{ padding: '0 56px 24px', fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: 1.8 }}
          >
            {section.heading && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', lineHeight: '20px', marginBottom: '20px' }}>
                {section.heading}
              </p>
            )}
            <div className="spec-markdown" dangerouslySetInnerHTML={{ __html: marked.parse(section.body) as string }} />
          </div>
        ))}
      </div>

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
            <input ref={fileInputRef} type="file" accept=".md,text/markdown,text/plain" className="hidden" onChange={handleFileImport} />
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

          {/* Content pages — each group is one A4 page */}
          {pageGroups.map((group, gi) => (
            <div key={gi} className={viewPage === gi + 1 ? undefined : 'hidden print:block'}>
              <ContentPage
                sections={group}
                docRef={document.reference_number}
                title={title}
                version={version}
                date={date}
              />
            </div>
          ))}

          {/* Back */}
          <div className={viewPage === totalPages - 1 ? undefined : 'hidden print:block'}>
            <BackPage client={client} />
          </div>
        </div>
      )}

      {/* Pagination */}
      {tab === 'preview' && totalPages > 1 && (
        <div className="no-print mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setViewPage(p => Math.max(0, p - 1))}
            disabled={viewPage === 0}
            className="font-body text-[11px] text-ks-slate hover:text-ks-ink disabled:opacity-30 transition-colors px-3 py-1.5 border border-ks-hairline rounded-ks hover:border-ks-ink disabled:cursor-default"
          >← Previous</button>

          {totalPages <= 12 ? (
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setViewPage(i)}
                  title={i === 0 ? 'Cover' : i === totalPages - 1 ? 'Back' : `Page ${i}`}
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
