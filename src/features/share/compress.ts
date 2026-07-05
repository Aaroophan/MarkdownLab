import LZ from 'lz-string'

export function compressJson(data: any): string {
  const json = JSON.stringify(data)
  return LZ.compressToBase64(json)
}

export function decompressJson<T>(compressed: string): T | null {
  try {
    const json = LZ.decompressFromBase64(compressed)
    if (!json) return null
    return JSON.parse(json)
  } catch (error) {
    console.error('[v0] Decompression error:', error)
    return null
  }
}

export function getCompressionRatio(original: string, compressed: string): number {
  return Math.round(((original.length - compressed.length) / original.length) * 100)
}
