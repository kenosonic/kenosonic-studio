import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface FileUploadProps {
  label: string
  value?: string
  onChange: (url: string | undefined) => void
  accept?: string
  documentId: string
  fieldName: string
  hint?: string
}

export function FileUpload({ label, value, onChange, accept = 'image/*,.pdf', documentId, fieldName, hint }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const isImage = value && !value.endsWith('.pdf') && !/\.pdf(\?|$)/i.test(value)
  const isPdf = value && /\.pdf(\?|$)/i.test(value)
  const filename = value ? decodeURIComponent(value.split('/').pop()?.split('?')[0] ?? '') : ''

  async function handleFile(file: File) {
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const path = `${documentId}/${fieldName}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('brief-assets')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('brief-assets').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  async function handleRemove() {
    if (!value) return
    // Extract path from public URL
    const path = value.split('/brief-assets/')[1]?.split('?')[0]
    if (path) await supabase.storage.from('brief-assets').remove([path])
    onChange(undefined)
  }

  return (
    <div>
      <label className="font-body font-medium text-[10px] uppercase tracking-[0.1em] text-ks-silver block mb-1.5">{label}</label>
      {hint && <p className="font-body text-[11px] text-ks-silver mb-2">{hint}</p>}

      {value ? (
        <div className="border border-ks-rule rounded-ks overflow-hidden">
          {isImage && (
            <div className="bg-ks-smoke p-3">
              <img src={value} alt={label} className="max-h-32 max-w-full object-contain rounded" />
            </div>
          )}
          {isPdf && (
            <div className="bg-ks-smoke px-4 py-3 flex items-center gap-2">
              <span className="text-ks-lava text-[14px]">📄</span>
              <span className="font-body text-[12px] text-ks-slate truncate">{filename}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 bg-white border-t border-ks-hairline">
            <a href={value} target="_blank" rel="noreferrer" className="font-body text-[10px] text-ks-lava hover:opacity-70 transition-opacity">View file ↗</a>
            <button type="button" onClick={handleRemove} className="font-body text-[10px] text-ks-silver hover:text-red-500 transition-colors">Remove</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-ks-rule rounded-ks px-4 py-6 flex flex-col items-center gap-2 hover:border-ks-lava transition-colors disabled:opacity-50 bg-ks-smoke"
        >
          <span className="text-[20px]">{uploading ? '⏳' : '↑'}</span>
          <span className="font-body text-[11px] text-ks-silver">{uploading ? 'Uploading…' : 'Click to upload'}</span>
          <span className="font-body text-[9px] text-ks-silver uppercase tracking-[0.1em]">{accept.replace(/,/g, ' · ').replace(/\*/g, '')}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="font-body text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}
