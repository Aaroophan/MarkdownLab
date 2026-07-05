export type SharePayload = {
  version: 1
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ShareResult {
  success: boolean
  url?: string
  error?: string
}

export interface ImportResult {
  success: boolean
  payload?: SharePayload
  error?: string
}
