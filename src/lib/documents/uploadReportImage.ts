import { supabase } from '../supabase'

export async function uploadReportImage(file: File, documentId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `reports/${documentId}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`
  const { error } = await supabase.storage.from('brief-assets').upload(path, file, { upsert: false })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('brief-assets').getPublicUrl(path)
  return data.publicUrl
}
