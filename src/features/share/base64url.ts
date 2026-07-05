// Standard base64url encoding (RFC 4648 section 5)
export function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function fromBase64Url(str: string): string {
  // Restore padding
  let padded = str.replace(/-/g, '+').replace(/_/g, '/')
  while (padded.length % 4) {
    padded += '='
  }
  return atob(padded)
}
