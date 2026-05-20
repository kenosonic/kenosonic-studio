/**
 * Data migration: old Studio Supabase → new CRM Supabase
 *
 * Run once:
 *   node scripts/migrate-data.mjs
 *
 * Requires:
 *   npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js'

// ── Old Studio DB (source) ──────────────────────────────────────
// Get service role key from: old project → Settings → API → service_role
const OLD_URL = 'https://vwvfuejihuqxgizkvuhv.supabase.co'
const OLD_SERVICE_KEY = 'PASTE_OLD_SERVICE_ROLE_KEY_HERE'

// ── New CRM DB (destination) ────────────────────────────────────
const NEW_URL = 'https://wertdeqojkznnzohcflv.supabase.co'
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcnRkZXFvamt6bm56b2hjZmx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk0NDQzNCwiZXhwIjoyMDg0NTIwNDM0fQ.-V-f7pZOk-bXWKP0BpbV9jd3UlriavoQGBr9FXT2U58'

const src = createClient(OLD_URL, OLD_SERVICE_KEY)
const dst = createClient(NEW_URL, NEW_SERVICE_KEY)

async function run() {
  console.log('Starting migration…\n')

  // ── 1. Clients ──────────────────────────────────────────────
  console.log('Migrating clients → ks_clients…')
  const { data: clients, error: cErr } = await src.from('clients').select('*')
  if (cErr) { console.error('  ✗ fetch clients:', cErr.message); process.exit(1) }

  if (clients.length) {
    const rows = clients.map(c => ({ ...c, crm_lead_id: null }))
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
    const { error } = await dst.from('ks_projects').upsert(projects, { onConflict: 'id' })
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
    const rows = docs.map(d => ({
      ...d,
      archived: d.archived ?? false,
      completed_at: d.completed_at ?? null,
    }))
    const { error } = await dst.from('documents').upsert(rows, { onConflict: 'id' })
    if (error) console.error('  ✗ insert documents:', error.message)
    else console.log(`  ✓ ${docs.length} documents migrated`)
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
  console.log('Migrating invites → ks_invites…')
  const { data: invites, error: iErr } = await src.from('invites').select('*')
  if (iErr) { console.error('  ✗ fetch invites:', iErr.message); process.exit(1) }

  if (invites.length) {
    const { error } = await dst.from('ks_invites').upsert(invites, { onConflict: 'id' })
    if (error) console.error('  ✗ insert ks_invites:', error.message)
    else console.log(`  ✓ ${invites.length} invites migrated`)
  } else {
    console.log('  – no invites to migrate')
  }

  // ── 6. Profiles (studio fields only) ────────────────────────
  console.log('Migrating profiles (studio_role + ks_client_id)…')
  const { data: profiles, error: prErr } = await src.from('profiles').select('*')
  if (prErr) { console.error('  ✗ fetch profiles:', prErr.message); process.exit(1) }

  if (profiles.length) {
    for (const p of profiles) {
      const { error } = await dst.from('profiles').upsert({
        id: p.id,
        full_name: p.full_name,
        studio_role: p.role,          // old: role  →  new: studio_role
        ks_client_id: p.client_id,    // old: client_id  →  new: ks_client_id
      }, { onConflict: 'id' })
      if (error) console.error(`  ✗ profile ${p.id}:`, error.message)
    }
    console.log(`  ✓ ${profiles.length} profiles migrated`)
  } else {
    console.log('  – no profiles to migrate')
  }

  console.log('\nMigration complete.')
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })
