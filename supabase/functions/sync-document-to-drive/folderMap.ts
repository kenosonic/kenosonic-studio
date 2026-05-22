// Drive folder resolution for Keno Sonic file vault.
//
// Folder structure mirrored in Drive:
//   {Entity Root}/
//     {doc_type}/
//       {tax_year}/
//
// Root folder IDs come from Edge Function secrets:
//   KENO_SONIC_DRIVE_ROOT_ID — the shared Drive folder for Keno Sonic
//
// Folders are created on demand if they don't yet exist.
// findOrCreateFolder uses an in-process cache, so duplicate API calls
// within a single function invocation are avoided.

import { findOrCreateFolder } from './driveClient.ts'

type VaultEntity = 'keno_sonic' | 'giggle_factory'

function getRootFolderId(entity: VaultEntity): string {
  if (entity === 'keno_sonic') {
    const id = Deno.env.get('KENO_SONIC_DRIVE_ROOT_ID')
    if (!id) throw new Error('KENO_SONIC_DRIVE_ROOT_ID secret is not set')
    return id
  }
  // Giggle Factory — add GIGGLE_FACTORY_DRIVE_ROOT_ID secret when ready
  throw new Error(`Drive root folder not configured for entity: ${entity}`)
}

/**
 * Resolves (creating if needed) the correct Drive folder for a vault document.
 * Path: {root}/{doc_type}/{tax_year}
 * Returns the leaf folder ID to upload into.
 */
export async function getFolderId(
  token: string,
  entity: VaultEntity,
  docType: string,
  taxYear: string,
): Promise<string> {
  const rootId    = getRootFolderId(entity)
  const typeId    = await findOrCreateFolder(token, docType, rootId)
  const yearId    = await findOrCreateFolder(token, taxYear, typeId)
  return yearId
}
