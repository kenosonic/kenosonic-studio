// Supabase Edge Function — send-compliance-reminders
// Triggered by pg_cron daily at 06:00 UTC (08:00 SAST).
// Secrets required:
//   RESEND_API_KEY  — Resend API key
//   ADMIN_EMAIL     — recipient, default: hello@kenosonic.co.za
//   FROM_EMAIL      — sender, default: "Kenosonic Interactive <hello@kenosonic.co.za>"
//   CRON_SECRET     — shared secret; cron caller must send Authorization: Bearer <CRON_SECRET>
//   SITE_URL        — app URL, e.g. https://kenosonic-studio.vercel.app

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY   = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL  = Deno.env.get('ADMIN_EMAIL')  ?? 'stevenrerani@gmail.com'
const FROM         = Deno.env.get('FROM_EMAIL')   ?? 'Kenosonic Interactive <hello@kenosonic.co.za>'
const CRON_SECRET  = Deno.env.get('CRON_SECRET')  ?? ''
const SITE_URL     = (Deno.env.get('SITE_URL')    ?? 'https://kenosonic-studio.vercel.app').replace(/\/$/, '')

interface Reminder {
  id: string
  entity: string
  title: string
  due_date: string
  category: string
  recurrence: string
  notes: string | null
  notified_at: string | null
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / 86_400_000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function urgencyColor(days: number): string {
  if (days < 0)  return '#EF4444'   // overdue — red
  if (days <= 7)  return '#EF4444'  // critical — red
  if (days <= 30) return '#F59E0B'  // warning — amber
  return '#22C55E'                   // ok — green
}

function urgencyLabel(days: number): string {
  if (days < 0)  return `OVERDUE by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
  if (days === 0) return 'DUE TODAY'
  if (days === 1) return 'DUE TOMORROW'
  return `DUE IN ${days} DAYS`
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    sars: 'SARS & Tax', cipc: 'CIPC / Companies Act',
    bbbee: 'B-BBEE', other: 'General',
  }
  return map[cat] ?? cat.toUpperCase()
}

function entityLabel(entity: string): string {
  return entity === 'keno_sonic' ? 'Kenosonic Interactive' : 'Giggle Factory'
}

function ksHeader(): string {
  return `
    <div style="background:#0D0D0D;border-bottom:3px solid #F56E0F;padding:28px 36px;">
      <span style="font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:15px;letter-spacing:-0.02em;color:#fff;">
        KENO <span style="color:#F56E0F;">SONIC</span>
      </span>
    </div>`
}

function ksFooter(): string {
  return `
    <div style="background:#0D0D0D;padding:20px 36px;border-top:0.5px solid #1E1E1E;">
      <p style="font-family:Inter,sans-serif;font-size:10px;color:#5A5A5A;line-height:1.7;margin:0;">
        Kenosonic Interactive (Pty) Ltd &middot; Johannesburg, South Africa<br>
        <a href="mailto:hello@kenosonic.co.za" style="color:#F56E0F;text-decoration:none;">hello@kenosonic.co.za</a>
        &middot; kenosonic.co.za
      </p>
    </div>`
}

function buildEmailHtml(reminders: Reminder[]): string {
  // Group by entity
  const byEntity = reminders.reduce<Record<string, Reminder[]>>((acc, r) => {
    ;(acc[r.entity] ??= []).push(r)
    return acc
  }, {})

  const entityBlocks = Object.entries(byEntity).map(([entity, items]) => {
    const itemRows = items.map(r => {
      const days  = daysUntil(r.due_date)
      const color = urgencyColor(days)
      const label = urgencyLabel(days)
      return `
        <div style="border:0.5px solid #E8E5E0;border-left:3px solid ${color};padding:16px 20px;margin-bottom:12px;background:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
            <div>
              <p style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.12em;color:#9A9A9A;margin:0 0 4px;">
                ${categoryLabel(r.category)}
              </p>
              <p style="font-size:14px;font-weight:700;color:#0D0D0D;margin:0 0 4px;">
                ${r.title}
              </p>
              <p style="font-size:11px;color:#6A6A6A;margin:0;">
                Due: ${formatDate(r.due_date)} &middot; ${r.recurrence}
              </p>
              ${r.notes ? `<p style="font-size:11px;color:#9A9A9A;margin:6px 0 0;font-style:italic;">${r.notes}</p>` : ''}
            </div>
            <div style="background:${color}18;border:0.5px solid ${color};padding:4px 10px;border-radius:4px;white-space:nowrap;">
              <span style="font-size:9px;font-weight:700;color:${color};letter-spacing:0.1em;">${label}</span>
            </div>
          </div>
        </div>`
    }).join('')

    return `
      <div style="margin-bottom:28px;">
        <p style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;color:#F56E0F;margin:0 0 12px;">
          ${entityLabel(entity)}
        </p>
        ${itemRows}
      </div>`
  }).join('')

  const overdueCount  = reminders.filter(r => daysUntil(r.due_date) < 0).length
  const criticalCount = reminders.filter(r => { const d = daysUntil(r.due_date); return d >= 0 && d <= 7 }).length
  const totalCount    = reminders.length

  const summaryBadge = overdueCount > 0
    ? `<span style="background:#EF444418;border:0.5px solid #EF4444;color:#EF4444;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:0.1em;">${overdueCount} OVERDUE</span>`
    : criticalCount > 0
      ? `<span style="background:#F59E0B18;border:0.5px solid #F59E0B;color:#F59E0B;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:0.1em;">${criticalCount} CRITICAL</span>`
      : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Compliance Reminders</title></head>
<body style="margin:0;padding:32px 16px;background:#F0EDE8;font-family:Inter,-apple-system,sans-serif;">
<div style="max-width:600px;margin:0 auto;">
  ${ksHeader()}
  <div style="background:#fff;padding:36px 36px 40px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
      <div>
        <p style="font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.15em;color:#F56E0F;margin:0 0 6px;">Daily Compliance Digest</p>
        <h1 style="font-size:20px;font-weight:700;color:#0D0D0D;letter-spacing:-0.02em;margin:0;line-height:1.2;">
          ${totalCount} upcoming deadline${totalCount === 1 ? '' : 's'}
        </h1>
      </div>
      ${summaryBadge}
    </div>
    <p style="font-size:13px;color:#5A5A5A;margin:0 0 28px;line-height:1.6;">
      The following compliance items are due within the next 30 days. Log in to Keno Sonic OS to review and mark them complete.
    </p>
    ${entityBlocks}
    <a href="${SITE_URL}/admin/compliance"
       style="display:block;background:#F56E0F;color:#fff;text-decoration:none;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;text-align:center;padding:16px 32px;border-radius:4px;letter-spacing:0.02em;">
      Open Compliance Centre →
    </a>
  </div>
  ${ksFooter()}
</div>
</body></html>`
}

async function sendEmail(subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [ADMIN_EMAIL], subject, html }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Resend error')
}

serve(async (req) => {
  // Verify cron caller via shared secret
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (CRON_SECRET && token !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const now = new Date()
    const in30 = new Date(now)
    in30.setDate(in30.getDate() + 30)

    // Fetch all unresolved reminders due within the next 30 days
    const { data: candidates, error } = await db
      .from('compliance_reminders')
      .select('id, entity, title, due_date, category, recurrence, notes, notified_at')
      .eq('resolved', false)
      .lte('due_date', in30.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (error) throw new Error(`DB query failed: ${error.message}`)
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No upcoming reminders' }), { status: 200 })
    }

    // Apply notification throttle:
    //   - Never notified → always include
    //   - Due within 7 days AND last notification was > 7 days ago → include (re-notify)
    //   - Otherwise → skip (already notified recently)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000)

    const toNotify = (candidates as Reminder[]).filter(r => {
      if (!r.notified_at) return true
      const lastNotified = new Date(r.notified_at)
      const days = daysUntil(r.due_date)
      return days <= 7 && lastNotified < sevenDaysAgo
    })

    if (toNotify.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'All recently notified' }), { status: 200 })
    }

    // Send digest email
    const overdueCount = toNotify.filter(r => daysUntil(r.due_date) < 0).length
    const subject = overdueCount > 0
      ? `⚠️ ${overdueCount} overdue compliance item${overdueCount === 1 ? '' : 's'} — action required`
      : `⚠️ Compliance reminder: ${toNotify.length} deadline${toNotify.length === 1 ? '' : 's'} approaching`

    await sendEmail(subject, buildEmailHtml(toNotify))

    // Mark all notified
    const notifiedAt = now.toISOString()
    await db
      .from('compliance_reminders')
      .update({ notified_at: notifiedAt })
      .in('id', toNotify.map(r => r.id))

    return new Response(JSON.stringify({ sent: toNotify.length }), { status: 200 })

  } catch (err) {
    console.error('[send-compliance-reminders]', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
