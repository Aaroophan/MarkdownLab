import { saveAs } from 'file-saver'
import { getFilename } from './fileName'
import { EXPORT_LIGHT_CSS } from './exportStyles'
import type { ExportOptions, ExportResult } from './exportTypes'

export async function exportHtml(options: ExportOptions): Promise<ExportResult> {
  try {
    const { title, htmlContent } = options

    if (!htmlContent) {
      throw new Error('HTML content is required')
    }

    const filename = getFilename(title, 'html')

    // Create standalone HTML document with embedded CSS and Mermaid support
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
  <style>
    ${EXPORT_LIGHT_CSS}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ startOnLoad: true, theme: 'default' });
        mermaid.contentLoaded();
      }
    });
  </script>
</head>
<body>
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>`

    // Create blob and save
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    saveAs(blob, filename)

    return {
      success: true,
      format: 'html',
      filename,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] HTML export failed:', error)
    return {
      success: false,
      format: 'html',
      filename: '',
      error: errorMessage,
    }
  }
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
