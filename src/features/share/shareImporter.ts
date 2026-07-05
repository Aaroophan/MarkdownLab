import { parseShareHash } from './urlShare'
import { SharePayload } from './shareTypes'

export async function detectAndParseShare(): Promise<SharePayload | null> {
  return parseShareHash()
}

export function validateSharePayload(payload: any): payload is SharePayload {
  return (
    payload &&
    typeof payload === 'object' &&
    payload.version === 1 &&
    typeof payload.title === 'string' &&
    typeof payload.content === 'string' &&
    typeof payload.createdAt === 'string' &&
    typeof payload.updatedAt === 'string'
  )
}

export function createDocumentFromShare(payload: SharePayload, generateId: () => string) {
  return {
    id: generateId(),
    title: payload.title || 'Imported Document',
    content: payload.content || '',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: payload.updatedAt || new Date().toISOString(),
  }
}
