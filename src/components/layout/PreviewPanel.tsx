'use client'

import MarkdownPreview from '@/components/preview/MarkdownPreview'

export default function PreviewPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
        Preview
      </div>
      <div className="flex-1 overflow-hidden">
        <MarkdownPreview />
      </div>
    </div>
  )
}
