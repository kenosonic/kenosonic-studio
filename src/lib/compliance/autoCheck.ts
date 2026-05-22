import { supabase } from '../supabase'
import type { VaultEntity, VaultDocType } from '../documents/nameFormatter'

/**
 * After a document is uploaded to the vault, auto-tick any compliance_items
 * whose linked_doc_type matches. Marks them 'done' if they were 'pending'.
 * Fire-and-forget safe — errors are logged but not re-thrown.
 */
export async function autoCheckCompliance(
  entity: VaultEntity,
  docType: VaultDocType,
): Promise<void> {
  const { data: items } = await supabase
    .from('compliance_items')
    .select('id')
    .eq('entity', entity)
    .eq('linked_doc_type', docType)
    .eq('status', 'pending')

  if (!items || items.length === 0) return

  await supabase
    .from('compliance_items')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .in('id', items.map(i => i.id))
}
