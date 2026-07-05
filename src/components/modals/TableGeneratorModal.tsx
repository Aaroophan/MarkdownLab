'use client'

import { useState } from 'react'
import { generateTable } from '@/features/editor/editorUtils'

interface TableGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (table: string) => void
}

export default function TableGeneratorModal({ isOpen, onClose, onGenerate }: TableGeneratorModalProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [hasHeader, setHasHeader] = useState(true)

  if (!isOpen) return null

  const handleGenerate = () => {
    const table = generateTable(rows, cols, hasHeader)
    onGenerate(table)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg bg-card border border-border shadow-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Generate Markdown Table</h2>

        {/* Rows input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rows</label>
          <input
            type="number"
            min="1"
            max="20"
            value={rows}
            onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Columns input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Columns</label>
          <input
            type="number"
            min="1"
            max="10"
            value={cols}
            onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Header row checkbox */}
        <div className="mb-6 flex items-center gap-2">
          <input
            type="checkbox"
            id="hasHeader"
            checked={hasHeader}
            onChange={(e) => setHasHeader(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="hasHeader" className="text-sm font-medium">
            Include header row
          </label>
        </div>

        {/* Preview */}
        <div className="mb-6 p-3 bg-muted/50 rounded text-xs font-mono overflow-x-auto">
          <pre>{generateTable(rows, cols, hasHeader)}</pre>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  )
}
