// Supabase Edge Function — sync-document-to-drive
//
// Handles two triggers:
//   1. Database webhook — fires on ks_file_vault INSERT (Supabase Dashboard → Database → Webhooks)
//      Body: { type: 'INSERT', record: { ...vault row... }, ... }
//      Only syncs records where status = 'final'.
//
//   2. Manual HTTP POST — from "Push to Drive" UI button
//      Body: { document_id: '<uuid>' }
//      Syncs regardless of status (admin intent is explicit).
//
// Required Edge Function secrets (Supabase Dashboard → Edge Functions → Secrets):
//   GOOGLE_SERVICE_ACCOUNT_JSON  — full service account key JSON (stringify the downloaded .json file)
//   KENO_SONIC_DRIVE_ROOT_ID     — Google Drive folder ID of the Keno Sonic root folder
//   SUPABASE_URL                 — auto-injected by Supabase
//   SUPABASE_SERVICE_ROLE_KEY    — auto-injected by Supabase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAccessToken, uploadFile, type ServiceAccount } from './driveClient.ts'
import { getFolderId } from './folderMap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

interface VaultRecord {
  id: string
  entity: 'keno_sonic' | 'giggle_factory'
  doc_type: string
  tax_year: string
  file_name: string
  file_path: string
  status: string
  drive_file_id: string | null
}

async function syncToDrive(record: VaultRecord): Promise<{ driveFileId: string; webViewLink: string }> {
  // 1. Parse service account credentials
  const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')
  if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON secret is not set')
  const sa = JSON.parse(saJson) as ServiceAccount

  // 2. Get Drive access token
  const token = await getAccessToken(sa)

  // 3. Resolve (or create) the target Drive folder
  const folderId = await getFolderId(token, record.entity, record.doc_type, record.tax_year)

  // 4. Download file from Supabase Storage using the admin client
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: fileData, error: dlErr } = await db.storage
    .from('documents')
    .download(record.file_path)

  if (dlErr || !fileData) throw new Error(`Storage download failed: ${dlErr?.message}`)

  const fileBytes = new Uint8Array(await fileData.arrayBuffer())

  // 5. Upload to Drive (skips if duplicate by name)
  return await uploadFile(token, folderId, record.file_name, fileBytes)
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json()

    // Resolve the vault record from either trigger type
    let record: VaultRecord | null = null

    if (body.type === 'INSERT' && body.record) {
      // Database webhook payload
      record = body.record as VaultRecord
      // Only auto-sync final documents
      if (record.status !== 'final') return json({ skipped: true, reason: 'status !== final' })
    } else if (body.document_id) {
      // Manual trigger from UI
      const { data, error } = await db
        .from('ks_file_vault')
        .select('*')
        .eq('id', body.document_id)
        .single()
      if (error || !data) return json({ error: 'Document not found' }, 404)
      record = data as VaultRecord
    } else {
      return json({ error: 'Invalid payload — provide document_id or a webhook body' }, 400)
    }

    // Skip if already synced
    if (record.drive_file_id) return json({ skipped: true, reason: 'already synced', driveFileId: record.drive_file_id })

    // Perform the sync
    const { driveFileId, webViewLink } = await syncToDrive(record)

    // Update the vault row
    await db
      .from('ks_file_vault')
      .update({ drive_file_id: driveFileId, drive_synced_at: new Date().toISOString() })
      .eq('id', record.id)

    return json({ success: true, driveFileId, webViewLink })

  } catch (err) {
    console.error('[sync-document-to-drive]', err)

    // Log to document_sync_errors if we have a document id
    try {
      const body = await req.clone().json().catch(() => ({}))
      const docId = body.document_id ?? body.record?.id
      if (docId) {
        await db.from('document_sync_errors').insert({
          document_id: docId,
          error_message: String(err),
        })
      }
    } catch {
      // Logging failure is non-fatal
    }

    // Fail silently per spec — return 200 so webhook doesn't retry endlessly
    return json({ success: false, error: String(err) })
  }
})
