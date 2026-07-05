'use client'

import { Download, FileText, Code } from 'lucide-react'

interface LargeDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  onDownloadMarkdown: () => void
  onExportHtml: () => void
  docSize: number
}

export default function LargeDocumentModal({
  isOpen,
  onClose,
  onDownloadMarkdown,
  onExportHtml,
  docSize,
}: LargeDocumentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-2">Document Too Large to Share</h2>
        <p className="text-sm text-foreground/70 mb-4">
          This document ({Math.round(docSize / 1024)}KB) is too large for URL sharing. Instead, download it as a file:
        </p>

        <div className="space-y-2 mb-6">
          <button
            onClick={() => {
              onDownloadMarkdown()
              onClose()
            }}
            className="w-full flex items-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-3 rounded transition-colors text-left"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm">Download as Markdown</div>
              <div className="text-xs text-foreground/60">Save as .md file</div>
            </div>
          </button>

          <button
            onClick={() => {
              onExportHtml()
              onClose()
            }}
            className="w-full flex items-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-3 rounded transition-colors text-left"
          >
            <Code className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="font-medium text-sm">Export as HTML</div>
              <div className="text-xs text-foreground/60">Standalone webpage</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-border rounded hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
