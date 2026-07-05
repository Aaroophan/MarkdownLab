export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'docx'

export interface ExportOptions {
  title: string
  content: string
  htmlContent?: string
  filename: string
  theme?: 'light' | 'dark'
}

export interface ExportResult {
  success: boolean
  format: ExportFormat
  filename: string
  error?: string
}
