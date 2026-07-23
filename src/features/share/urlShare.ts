import { SharePayload, ShareResult } from './shareTypes'
import { compressJson, decompressJson } from './compress'
import { encryptPayload, decryptPayload } from './crypto'

const MAX_URL_LENGTH = 3000
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''

export async function createShareLink(payload: SharePayload): Promise<ShareResult> {
  try {
    // Compress payload
    const compressed = compressJson(payload)

    // Encrypt compressed payload
    const encrypted = await encryptPayload(compressed)

    // Build full URL
    const hash = `#mdlab=${encrypted}`
    const fullUrl = `${BASE_URL}/MarkdownHere/${hash}`

    // Check URL length
    if (fullUrl.length > MAX_URL_LENGTH) {
      return {
        success: false,
        error: `Document too large for URL sharing (${fullUrl.length}/${MAX_URL_LENGTH} chars)`,
      }
    }

    return {
      success: true,
      url: fullUrl,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: errorMsg,
    }
  }
}

export async function parseShareHash(): Promise<SharePayload | null> {
  try {
    if (typeof window === 'undefined') return null

    const hash = window.location.hash
    if (!hash.startsWith('#mdlab=')) return null

    const encrypted = hash.slice(7) // Remove '#mdlab='
    const compressed = await decryptPayload(encrypted)

    if (!compressed) return null

    const payload = decompressJson<SharePayload>(compressed)
    return payload
  } catch (error) {
    console.error('[v0] Parse share hash error:', error)
    return null
  }
}

export async function copyShareLinkToClipboard(payload: SharePayload): Promise<boolean> {
  try {
    const result = await createShareLink(payload)
    if (!result.success || !result.url) {
      throw new Error(result.error || 'Failed to create share link')
    }

    await navigator.clipboard.writeText(result.url)
    return true
  } catch (error) {
    console.error('[v0] Copy to clipboard error:', error)
    return false
  }
}
