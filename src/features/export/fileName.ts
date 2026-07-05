/**
 * Sanitize filename to be safe for download
 * "My Notes" → "my-notes"
 * "System Design!" → "system-design"
 */
export function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .slice(0, 200) // Limit length
}

export function getFilename(title: string, extension: string): string {
  const sanitized = sanitizeFilename(title)
  return `${sanitized}.${extension}`
}
