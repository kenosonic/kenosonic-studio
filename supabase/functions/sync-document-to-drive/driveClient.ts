// Google Drive REST API client for Supabase Edge Functions (Deno).
// Authenticates via a service account JSON key — no user OAuth required.
// Credentials must be stored as Edge Function secret: GOOGLE_SERVICE_ACCOUNT_JSON

export interface ServiceAccount {
  client_email: string
  private_key: string
  token_uri: string
}

/** Convert PEM-encoded private key to raw DER bytes for Web Crypto. */
function pemToDer(pem: string): Uint8Array {
  const base64 = pem
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/\s+/g, '')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64urlStr(s: string): string {
  return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/** Exchange a service account JWT for a Drive access token (1 hour TTL). */
export async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = base64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64urlStr(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now,
  }))

  const signingInput = `${header}.${claim}`

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const jwt = `${signingInput}.${base64url(sig)}`

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Google token exchange failed: ${data.error_description ?? data.error}`)
  return data.access_token as string
}

// ─── Drive REST helpers ───────────────────────────────────────────────────────

const DRIVE = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

/** List files in a Drive folder, optionally filtered by exact name. */
export async function listFiles(
  token: string,
  folderId: string,
  name?: string,
): Promise<Array<{ id: string; name: string; webViewLink: string }>> {
  let q = `'${folderId}' in parents and trashed = false`
  if (name) q += ` and name = '${name.replace(/'/g, "\\'")}'`

  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,webViewLink)',
    pageSize: '10',
  })

  const res = await fetch(`${DRIVE}/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Drive listFiles failed: ${JSON.stringify(data.error)}`)
  return data.files ?? []
}

/** Create a folder inside a parent folder. Returns the new folder id. */
export async function createFolder(
  token: string,
  name: string,
  parentId: string,
): Promise<string> {
  const res = await fetch(`${DRIVE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Drive createFolder failed: ${JSON.stringify(data.error)}`)
  return data.id as string
}

/**
 * Find a folder by name inside a parent, creating it if it doesn't exist.
 * Uses an in-memory cache map to avoid redundant API calls within one invocation.
 */
const folderCache = new Map<string, string>()

export async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string,
): Promise<string> {
  const cacheKey = `${parentId}::${name}`
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!

  const existing = await listFiles(token, parentId, name)
  const folder = existing.find(f => f.name === name)
  const id = folder ? folder.id : await createFolder(token, name, parentId)

  folderCache.set(cacheKey, id)
  return id
}

export interface UploadResult {
  driveFileId: string
  webViewLink: string
}

/**
 * Upload a file to Drive, skipping if a file with the same name already exists.
 * Returns the file id and view link (existing or newly created).
 */
export async function uploadFile(
  token: string,
  folderId: string,
  fileName: string,
  fileBytes: Uint8Array,
  mimeType = 'application/pdf',
): Promise<UploadResult> {
  // Skip if already present
  const existing = await listFiles(token, folderId, fileName)
  if (existing.length > 0) {
    return { driveFileId: existing[0].id, webViewLink: existing[0].webViewLink }
  }

  // Multipart upload
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] })
  const boundary = '-------boundary_ks_drive_upload'

  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ]
  const bodyParts = body.map(s => new TextEncoder().encode(s))
  const closing = new TextEncoder().encode(`\r\n--${boundary}--`)

  const totalLength = bodyParts.reduce((n, p) => n + p.length, 0) + fileBytes.length + closing.length
  const combined = new Uint8Array(totalLength)
  let offset = 0
  for (const part of [...bodyParts.slice(0, 1)]) {
    combined.set(part, offset); offset += part.length
  }
  combined.set(bodyParts[1], offset); offset += bodyParts[1].length
  combined.set(fileBytes, offset); offset += fileBytes.length
  combined.set(closing, offset)

  const res = await fetch(`${UPLOAD}/files?uploadType=multipart&fields=id,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
      'Content-Length': String(totalLength),
    },
    body: combined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Drive upload failed: ${JSON.stringify(data.error)}`)
  return { driveFileId: data.id, webViewLink: data.webViewLink }
}
