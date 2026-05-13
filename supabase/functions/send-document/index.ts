// Supabase Edge Function — send-document
// Secrets required (set via Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY  — your Resend API key
//   SITE_URL        — your Vercel deployment URL, e.g. https://kenosonic-studio.vercel.app
//   FROM_EMAIL      — optional override, default: "Kenosonic Interactive <hello@kenosonic.co.za>"
//   ADMIN_EMAIL     — optional override, default: hello@kenosonic.co.za

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://kenosonic-studio.vercel.app').replace(/\/$/, '')
const FROM = Deno.env.get('FROM_EMAIL') ?? 'Kenosonic Interactive <hello@kenosonic.co.za>'
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'hello@kenosonic.co.za'

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice', quote: 'Quote', proposal: 'Proposal', contract: 'Contract',
  report: 'Brand Report', audit: 'Audit Report', email: 'Email', offboarding: 'Offboarding',
  questionnaire: 'Project Brief',
}

const IS_FORM_DOC: Record<string, boolean> = {
  questionnaire: true,
}

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

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Resend error')
  return data
}

// ─── Email templates ─────────────────────────────────────────────────────────

function ksHeader() {
  return `
    <div style="background:#0D0D0D;border-bottom:3px solid #F56E0F;padding:28px 36px;display:flex;align-items:center;">
      <span style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:15px;letter-spacing:-0.02em;color:#fff;">
        KENO <span style="color:#F56E0F;">SONIC</span>
      </span>
    </div>`
}

function ksFooter() {
  return `
    <div style="background:#0D0D0D;padding:20px 36px;border-top:0.5px solid #1E1E1E;">
      <p style="font-family:Inter,sans-serif;font-size:10px;color:#5A5A5A;line-height:1.7;margin:0;">
        Kenosonic Interactive (Pty) Ltd &middot; Johannesburg, South Africa<br>
        <a href="mailto:hello@kenosonic.co.za" style="color:#F56E0F;text-decoration:none;">hello@kenosonic.co.za</a>
        &middot; kenosonic.co.za
      </p>
    </div>`
}

function docSendHtml(client: Record<string, string>, doc: Record<string, unknown>): string {
  const typeLabel = DOC_TYPE_LABELS[doc.type as string] ?? String(doc.type)
  const isForm = IS_FORM_DOC[doc.type as string] ?? false
  const portalUrl = `${SITE_URL}/portal/documents/${doc.id}`
  const heading = isForm ? `Please fill in your ${typeLabel}` : 'You have a new document'
  const body = isForm
    ? `Kenosonic Interactive has sent you a <strong>${typeLabel}</strong> to complete. It only takes a few minutes — click the button below to get started.`
    : `Kenosonic Interactive has shared a <strong>${typeLabel}</strong> with you that may require your review or signature.`
  const ctaLabel = isForm ? `Fill in your ${typeLabel} →` : 'View Document →'

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${heading}</title></head>
<body style="margin:0;padding:32px 16px;background:#F0EDE8;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;">
  ${ksHeader()}
  <div style="background:#fff;padding:36px 36px 40px;">
    <p style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.15em;color:#F56E0F;margin:0 0 8px;">${typeLabel}</p>
    <h1 style="font-size:22px;font-weight:700;color:#0D0D0D;letter-spacing:-0.02em;margin:0 0 20px;line-height:1.2;">${heading}</h1>
    <p style="font-size:14px;color:#3A3A3A;line-height:1.7;margin:0 0 8px;">Hi ${client.contact_name},</p>
    <p style="font-size:14px;color:#3A3A3A;line-height:1.7;margin:0 0 28px;">${body}</p>
    <div style="background:#F8F6F3;border:0.5px solid #E8E5E0;padding:20px 24px;margin:0 0 28px;">
      <p style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.12em;color:#9A9A9A;margin:0 0 6px;">Reference</p>
      <p style="font-size:15px;font-weight:700;color:#0D0D0D;margin:0 0 4px;">${doc.title}</p>
      <p style="font-size:11px;color:#9A9A9A;margin:0;">Ref: ${doc.reference_number}</p>
    </div>
    <a href="${portalUrl}"
       style="display:block;background:#F56E0F;color:#fff;text-decoration:none;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;text-align:center;padding:16px 32px;border-radius:4px;letter-spacing:0.02em;">
      ${ctaLabel}
    </a>
    <p style="font-size:11px;color:#9A9A9A;margin:20px 0 0;line-height:1.6;">
      If prompted to sign in, use <strong>${client.contact_email}</strong>.
    </p>
  </div>
  ${ksFooter()}
</div>
</body></html>`
}

function emailDocHtml(client: Record<string, string>, doc: Record<string, unknown>): string {
  const content = (doc.content ?? {}) as Record<string, unknown>
  const subject = String(content.subject ?? doc.title)
  const greeting = String(content.greeting ?? `Hi ${client.contact_name},`)
  const bodySections = Array.isArray(content.body_sections) ? content.body_sections as Array<{ heading?: string; body: string }> : []
  const cta = content.cta as { label: string; url: string } | undefined

  const sectionsHtml = bodySections.map(s => `
    ${s.heading ? `<h2 style="font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#0D0D0D;margin:24px 0 8px;">${s.heading}</h2>` : ''}
    <p style="font-size:14px;color:#3A3A3A;line-height:1.7;margin:0 0 16px;">${s.body.replace(/\n/g, '<br>')}</p>
  `).join('')

  const ctaHtml = cta ? `
    <div style="text-align:center;margin:32px 0;">
      <a href="${cta.url}" style="display:inline-block;background:#F56E0F;color:#fff;text-decoration:none;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;padding:16px 32px;border-radius:4px;letter-spacing:0.02em;">${cta.label}</a>
    </div>` : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title></head>
<body style="margin:0;padding:32px 16px;background:#F0EDE8;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;">
  ${ksHeader()}
  <div style="background:#fff;padding:36px 36px 40px;">
    <p style="font-size:14px;font-weight:500;color:#0D0D0D;margin:0 0 24px;">${greeting}</p>
    ${sectionsHtml}
    ${ctaHtml}
  </div>
  ${ksFooter()}
</div>
</body></html>`
}

function adminNotifyHtml(client: Record<string, string>, doc: Record<string, unknown>, action: 'approved' | 'signed'): string {
  const typeLabel = DOC_TYPE_LABELS[doc.type as string] ?? String(doc.type)
  const verb = action === 'approved' ? 'approved' : 'signed'
  const accentColor = action === 'approved' ? '#22C55E' : '#F56E0F'
  const timestamp = new Date().toLocaleString('en-ZA', { dateStyle: 'long', timeStyle: 'short' })
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Document ${verb}</title></head>
<body style="margin:0;padding:32px 16px;background:#F0EDE8;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:480px;margin:0 auto;">
  ${ksHeader()}
  <div style="background:#fff;padding:32px;">
    <div style="display:inline-block;background:${accentColor}20;border:0.5px solid ${accentColor};padding:6px 14px;border-radius:4px;margin-bottom:20px;">
      <span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:${accentColor};">${verb}</span>
    </div>
    <h2 style="font-size:18px;font-weight:700;color:#0D0D0D;margin:0 0 8px;">${client.contact_name} has ${verb} a document</h2>
    <p style="font-size:13px;color:#9A9A9A;margin:0 0 24px;">${client.company_name}</p>
    <div style="background:#F8F6F3;border:0.5px solid #E8E5E0;padding:16px 20px;border-left:3px solid ${accentColor};">
      <p style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.12em;color:#9A9A9A;margin:0 0 4px;">${typeLabel}</p>
      <p style="font-size:14px;font-weight:700;color:#0D0D0D;margin:0 0 4px;">${doc.title}</p>
      <p style="font-size:11px;color:#9A9A9A;margin:0;">Ref: ${doc.reference_number} &middot; ${timestamp}</p>
    </div>
  </div>
  ${ksFooter()}
</div>
</body></html>`
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    // Service role client for DB operations
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { action, document_id, notification_type, invite_token } = await req.json()

    // ── action: send-invite ──────────────────────────────────────────────────
    if (action === 'send-invite') {
      if (!invite_token) return json({ error: 'invite_token required' }, 400)

      // Load client via the invite token
      const { data: invite } = await db
        .from('invites')
        .select('client_id')
        .eq('token', invite_token)
        .single()
      if (!invite) return json({ error: 'Invite not found' }, 404)

      const { data: clientData } = await db
        .from('clients')
        .select('contact_name, contact_email')
        .eq('id', invite.client_id)
        .single()
      if (!clientData) return json({ error: 'Client not found' }, 404)

      const inviteUrl = `${SITE_URL}/invite/${invite_token}`
      const subject = `You've been invited to the Kenosonic Interactive Client Portal`
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>You're invited</title></head>
<body style="margin:0;padding:32px 16px;background:#F0EDE8;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;">
  ${ksHeader()}
  <div style="background:#fff;padding:36px 36px 40px;">
    <p style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.15em;color:#F56E0F;margin:0 0 8px;">Client Portal Invite</p>
    <h1 style="font-size:22px;font-weight:700;color:#0D0D0D;letter-spacing:-0.02em;margin:0 0 20px;line-height:1.2;">You're invited to your client portal</h1>
    <p style="font-size:14px;color:#3A3A3A;line-height:1.7;margin:0 0 8px;">Hi ${clientData.contact_name},</p>
    <p style="font-size:14px;color:#3A3A3A;line-height:1.7;margin:0 0 28px;">
      Kenosonic Interactive has set up a secure portal for you to view, approve, and sign your documents. Click the button below to create your account and get access.
    </p>
    <a href="${inviteUrl}"
       style="display:block;background:#F56E0F;color:#fff;text-decoration:none;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;text-align:center;padding:16px 32px;border-radius:4px;letter-spacing:0.02em;">
      Access My Portal →
    </a>
    <p style="font-size:11px;color:#9A9A9A;margin:20px 0 0;line-height:1.6;">
      This invite link is for your use only and expires in 30 days.
    </p>
  </div>
  ${ksFooter()}
</div>
</body></html>`

      await sendEmail(clientData.contact_email, subject, html)
      return json({ success: true })
    }

    if (!document_id) return json({ error: 'document_id required' }, 400)

    // Load document + client
    const { data: doc, error: docError } = await db
      .from('documents')
      .select('*, client:clients(*)')
      .eq('id', document_id)
      .single()

    if (docError || !doc) return json({ error: 'Document not found' }, 404)
    const client = doc.client as Record<string, string>

    // ── action: send ──────────────────────────────────────────────────────────
    if (action === 'send') {
      const isEmailDoc = doc.type === 'email'
      const subject = isEmailDoc
        ? (doc.content as Record<string, string>).subject ?? doc.title
        : `${DOC_TYPE_LABELS[doc.type] ?? doc.type} from Kenosonic Interactive — ${doc.reference_number}`
      const html = isEmailDoc
        ? emailDocHtml(client, doc)
        : docSendHtml(client, doc)

      await sendEmail(client.contact_email, subject, html)

      // Update document status + sent_at
      await db.from('documents').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      }).eq('id', document_id)

      return json({ success: true })
    }

    // ── action: notify ────────────────────────────────────────────────────────
    if (action === 'notify') {
      const notifType = notification_type as 'approved' | 'signed'
      if (!['approved', 'signed'].includes(notifType)) {
        return json({ error: 'Invalid notification_type' }, 400)
      }

      const verb = notifType === 'approved' ? 'Approved' : 'Signed'
      const subject = `Document ${verb} — ${doc.title} (${doc.reference_number})`
      const html = adminNotifyHtml(client, doc, notifType)

      await sendEmail(ADMIN_EMAIL, subject, html)
      return json({ success: true })
    }

    return json({ error: 'Invalid action' }, 400)

  } catch (err) {
    console.error(err)
    return json({ error: String(err) }, 500)
  }
})
