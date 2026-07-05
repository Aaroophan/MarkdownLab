'use client'

import MarkdownEditor from '@/components/editor/MarkdownEditor'

export default function EditorPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
        Editor
      </div>
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor />
      </div>
    </div>
  )
}
