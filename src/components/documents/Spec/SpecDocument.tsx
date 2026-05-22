import { useEffect, useState, useRef } from 'react'
import { marked } from 'marked'
import type { Client, KSDocument, SpecContent } from '../../../types'
import { Button } from '../../ui'
import { updateDocumentContent } from '../../../hooks/useDocument'

interface Props {
  document: KSDocument
  client: Client
  readonly?: boolean
}

marked.setOptions({ breaks: true })

export function SpecDocument({ document, client: _client, readonly = false }: Props) {
  const raw = (document.content ?? {}) as SpecContent
  const [markdown, setMarkdown] = useState(raw.markdown ?? '')
  const [sourceFilename] = useState(raw.source_filename ?? '')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'preview' | 'source'>(readonly ? 'preview' : 'preview')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function save(md: string) {
    setSaving(true)
    await updateDocumentContent(document.id, {
      markdown: md,
      source_filename: sourceFilename,
    } as unknown as Record<string, unknown>)
    setSaving(false)
  }

  useEffect(() => {
    if (readonly) return
    const t = setTimeout(() => save(markdown), 2000)
    return () => clearTimeout(t)
  }, [markdown]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      setMarkdown(text)
      setSaving(true)
      await updateDocumentContent(document.id, {
        markdown: text,
        source_filename: file.name,
      } as unknown as Record<string, unknown>)
      setSaving(false)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const htmlContent = marked.parse(markdown) as string

  return (
    <div>
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
          <div className="flex items-center gap-2 ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={handleFileReplace}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-body font-medium text-[9px] uppercase tracking-[0.1em] text-ks-silver border border-ks-hairline px-3 py-1.5 rounded-ks hover:border-ks-ink hover:text-ks-ink transition-colors"
            >{markdown ? 'Replace .md' : 'Import .md'}</button>
            <Button variant="dark" size="sm" onClick={() => save(markdown)} disabled={saving}>
              <span className="sm:hidden">{saving ? '…' : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}</span>
              <span className="hidden sm:inline">{saving ? 'Saving…' : 'Save'}</span>
            </Button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '850px', backgroundColor: '#FFFFFF', border: '0.5px solid #E8E5E0' }}>
        {/* Header */}
        <div style={{ padding: '32px 48px 24px', borderBottom: '0.5px solid #E8E5E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', backgroundColor: '#F56E0F', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>K</span>
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '13px', color: '#0D0D0D', letterSpacing: '-0.01em' }}>Kenosonic</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#9A9A9A', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Spec Document</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', color: '#0D0D0D', fontWeight: 600, marginTop: '2px' }}>{document.reference_number}</div>
          </div>
        </div>

        {/* Document title */}
        <div style={{ padding: '24px 48px 0' }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {document.title}
          </h1>
          {sourceFilename && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#9A9A9A', marginBottom: '0' }}>
              Source: {sourceFilename}
            </p>
          )}
        </div>

        {/* Content area */}
        <div style={{ padding: '24px 48px 48px' }}>
          {tab === 'source' && !readonly ? (
            <textarea
              value={markdown}
              onChange={e => setMarkdown(e.target.value)}
              className="w-full font-mono text-[12px] text-ks-ink bg-ks-smoke border border-ks-hairline rounded-ks p-4 focus:outline-none focus:border-ks-lava resize-none"
              style={{ minHeight: '480px', lineHeight: 1.7 }}
              placeholder="Paste or type your markdown here…"
            />
          ) : markdown ? (
            <div
              className="spec-markdown"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                lineHeight: 1.8,
                color: '#3A3A3A',
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9A9A9A' }}>
              No content yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
