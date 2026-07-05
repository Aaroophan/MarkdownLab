import { saveAs } from 'file-saver'
import { getFilename } from './fileName'
import type { ExportOptions, ExportResult } from './exportTypes'

export async function exportMarkdown(options: ExportOptions): Promise<ExportResult> {
  try {
    const { title, content, filename } = options

    // Create blob from markdown content
    const blob = new Blob([content], { type: 'text/markdown' })

    // Generate filename
    const fullFilename = filename || getFilename(title, 'md')

    // Trigger download
    saveAs(blob, fullFilename)

    return {
      success: true,
      format: 'markdown',
      filename: fullFilename,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Markdown export failed:', error)
    return {
      success: false,
      format: 'markdown',
      filename: '',
      error: errorMessage,
    }
  }
}
