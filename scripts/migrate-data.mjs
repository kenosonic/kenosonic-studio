/**
 * Data migration: old Studio Supabase → new CRM Supabase
 *
 * Run once:
 *   node scripts/migrate-data.mjs
 *
 * Requires:
 *   npm install @supabase/supabase-js ws
 */

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

// ── Old Studio DB (source) ──────────────────────────────────────
const OLD_URL = 'https://vwvfuejihuqxgizkvuhv.supabase.co'
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dmZ1ZWppaHVxeGdpemt2dWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ5NzMyNiwiZXhwIjoyMDk0MDczMzI2fQ.EnLmTGC16noSAzdK-3_g6h4Mtd62mvGY4Y3dvDQhAAk'

// ── New CRM DB (destination) ────────────────────────────────────
const NEW_URL = 'https://wertdeqojkznnzohcflv.supabase.co'
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnRkZXFvamt6bm56b2hjZmx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk0NDQzNCwiZXhwIjoyMDg0NTIwNDM0fQ.-V-f7pZOk-bXWKP0BpbV9jd3UlriavoQGBr9FXT2U58'

const clientOpts = { realtime: { transport: ws } }
const src = createClient(OLD_URL, OLD_SERVICE_KEY, clientOpts)
const dst = createClient(NEW_URL, NEW_SERVICE_KEY, clientOpts)

// Valid values per check constraints in the new DB
const VALID_DOC_TYPES = new Set(['invoice', 'quote', 'proposal', 'contract', 'report', 'audit', 'email', 'offboarding', 'questionnaire'])
const VALID_DOC_STATUSES = new Set(['draft', 'sent', 'viewed', 'approved', 'signed', 'rejected', 'completed'])
const VALID_CLIENT_STATUSES = new Set(['active', 'inactive'])

async function run() {
  console.log('Starting migration…\n')

  // ── 1. Clients ──────────────────────────────────────────────
  console.log('Migrating clients → ks_clients…')
  const { data: clients, error: cErr } = await src.from('clients').select('*')
  if (cErr) { console.error('  ✗ fetch clients:', cErr.message); process.exit(1) }

  if (clients.length) {
    const rows = clients.map(c => ({
      ...c,
      crm_lead_id: null,
      created_by: null,                                           // old user IDs don't exist in new auth
      status: VALID_CLIENT_STATUSES.has(c.status) ? c.status : 'active',
    }))
    const { error } = await dst.from('ks_clients').upsert(rows, { onConflict: 'id' })
    if (error) console.error('  ✗ insert ks_clients:', error.message)
    else console.log(`  ✓ ${clients.length} clients migrated`)
  } else {
    console.log('  – no clients to migrate')
  }

  // ── 2. Projects ─────────────────────────────────────────────
  console.log('Migrating projects → ks_projects…')
  const { data: projects, error: pErr } = await src.from('projects').select('*')
  if (pErr) { console.error('  ✗ fetch projects:', pErr.message); process.exit(1) }

  if (projects.length) {
    const rows = projects.map(p => ({ ...p, created_by: null }))
    const { error } = await dst.from('ks_projects').upsert(rows, { onConflict: 'id' })
    if (error) console.error('  ✗ insert ks_projects:', error.message)
    else console.log(`  ✓ ${projects.length} projects migrated`)
  } else {
    console.log('  – no projects to migrate')
  }

  // ── 3. Documents ────────────────────────────────────────────
  console.log('Migrating documents…')
  const { data: docs, error: dErr } = await src.from('documents').select('*')
  if (dErr) { console.error('  ✗ fetch documents:', dErr.message); process.exit(1) }

  if (docs.length) {
    const skipped = []
    const rows = []
    for (const d of docs) {
      if (!VALID_DOC_TYPES.has(d.type)) {
        skipped.push({ id: d.id, type: d.type, reason: 'invalid type' })
        continue
      }
      if (!VALID_DOC_STATUSES.has(d.status)) {
        skipped.push({ id: d.id, status: d.status, reason: 'invalid status' })
        continue
      }
      rows.push({
        ...d,
        created_by: null,                                         // old user IDs don't exist in new auth
        archived: d.archived ?? false,
        completed_at: d.completed_at ?? null,
      })
    }
    if (skipped.length) {
      console.log(`  ⚠ skipped ${skipped.length} doc(s):`, skipped)
    }
    if (rows.length) {
      const { error } = await dst.from('documents').upsert(rows, { onConflict: 'id' })
      if (error) console.error('  ✗ insert documents:', error.message)
      else console.log(`  ✓ ${rows.length} documents migrated`)
    }
  } else {
    console.log('  – no documents to migrate')
  }

  // ── 4. Document signatures ───────────────────────────────────
  console.log('Migrating document_signatures…')
  const { data: sigs, error: sErr } = await src.from('document_signatures').select('*')
  if (sErr) { console.error('  ✗ fetch signatures:', sErr.message); process.exit(1) }

  if (sigs.length) {
    const { error } = await dst.from('document_signatures').upsert(sigs, { onConflict: 'id' })
    if (error) console.error('  ✗ insert signatures:', error.message)
    else console.log(`  ✓ ${sigs.length} signatures migrated`)
  } else {
    console.log('  – no signatures to migrate')
  }

  // ── 5. Invites ───────────────────────────────────────────────
  // ks_invites columns: id, token, client_id, created_at, expires_at, used_at, used_by
  // (no return_to — strip it; used_by refs auth.users so null it out for migrated records)
  console.log('Migrating invites → ks_invites…')
  const { data: invites, error: iErr } = await src.from('invites').select('*')
  if (iErr) { console.error('  ✗ fetch invites:', iErr.message); process.exit(1) }

  if (invites.length) {
    const rows = invites.map(({ id, token, client_id, created_at, expires_at, used_at }) => ({
      id,
      token,
      client_id,
      created_at,
      expires_at,
      used_at: used_at ?? null,
      used_by: null,                                              // old auth users don't exist in new DB
    }))
    const { error } = await dst.from('ks_invites').upsert(rows, { onConflict: 'id' })
    if (error) console.error('  ✗ insert ks_invites:', error.message)
    else console.log(`  ✓ ${invites.length} invites migrated`)
  } else {
    console.log('  – no invites to migrate')
  }

  // ── 6. Profiles (studio fields only) ────────────────────────
  // profiles.id must match auth.users.id — skips profiles whose users
  // haven't signed into the new DB yet (they'll be created on first login)
  console.log('Migrating profiles (studio_role + ks_client_id)…')
  const { data: profiles, error: prErr } = await src.from('profiles').select('*')
  if (prErr) { console.error('  ✗ fetch profiles:', prErr.message); process.exit(1) }

  let profilesOk = 0
  if (profiles.length) {
    for (const p of profiles) {
      const { error } = await dst.from('profiles').upsert({
        id: p.id,
        full_name: p.full_name,
        studio_role: p.role,          // old: role  →  new: studio_role
        ks_client_id: p.client_id,    // old: client_id  →  new: ks_client_id
      }, { onConflict: 'id' })
      if (error) console.error(`  ✗ profile ${p.id} (user must log in first):`, error.message)
      else profilesOk++
    }
    console.log(`  ✓ ${profilesOk}/${profiles.length} profiles migrated (rest need to log in first)`)
  } else {
    console.log('  – no profiles to migrate')
  }

  console.log('\nMigration complete.')
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
