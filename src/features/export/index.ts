import { exportMarkdown } from './exportMarkdown'
import { exportHtml } from './exportHtml'
import { exportPdf } from './exportPdf'
import { exportDocx } from './exportDocx'
import { getPreviewHtml, ensureMermaidRendered } from './exportHelpers'
import type { ExportFormat, ExportOptions, ExportResult } from './exportTypes'

export { type ExportFormat, type ExportOptions, type ExportResult }
export { getPreviewHtml, ensureMermaidRendered }

export async function exportDocument(
  format: ExportFormat,
  options: ExportOptions
): Promise<ExportResult> {
  switch (format) {
    case 'markdown':
      return exportMarkdown(options)
    case 'html':
      return exportHtml(options)
    case 'pdf':
      return exportPdf(options)
    case 'docx':
      return exportDocx(options)
    default:
      return {
        success: false,
        format,
        filename: '',
        error: `Unknown export format: ${format}`,
      }
  }
}
