// Use Web Crypto API AES-GCM encryption
// Since there's no password, we use a deterministic app-level key
// This is NOT cryptographically secure against someone with the link
// It's obfuscation only - the real security model is: don't share the link with untrusted parties

const APP_KEY = 'MarkdownHereShareV1'

async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(APP_KEY),
    'HKDF',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      info: encoder.encode('MarkdownHere-Share'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptPayload(data: string): Promise<string> {
  try {
    const key = await deriveKey()
    const encoder = new TextEncoder()
    const plaintext = encoder.encode(data)

    // Generate random IV (96 bits for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)

    // Base64 encode
    return btoa(String.fromCharCode.apply(null, Array.from(combined) as number[]))
  } catch (error) {
    console.error('[v0] Encryption error:', error)
    // Fallback to unencrypted (still compressed)
    return data
  }
}

export async function decryptPayload(encoded: string): Promise<string | null> {
  try {
    const key = await deriveKey()

    // Base64 decode
    const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)

    const decoder = new TextDecoder()
    return decoder.decode(plaintext)
  } catch (error) {
    console.error('[v0] Decryption error:', error)
    return null
  }
}
