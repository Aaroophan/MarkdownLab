'use client'

import { useDocumentStore } from '@/features/documents/documentStore'
import { Moon, Sun } from 'lucide-react'

export default function StatusBar() {
  const activeDoc = useDocumentStore((state) => state.getActiveDocument())
  const isSaved = useDocumentStore((state) => state.isSaved)
  const settings = useDocumentStore((state) => state.settings)

  const wordCount = activeDoc?.content.trim().split(/\s+/).filter((w) => w.length > 0).length || 0
  const charCount = activeDoc?.content.length || 0

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        {activeDoc && (
          <>
            <div>{activeDoc.title}</div>
            <div>{isSaved ? '✓ Saved' : '● Unsaved'}</div>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {activeDoc && (
          <>
            <div>{wordCount} words</div>
            <div>{charCount} characters</div>
          </>
        )}
        <div className="flex items-center gap-1">
          {settings.theme === 'dark' ? (
            <Moon className="h-3 w-3" />
          ) : (
            <Sun className="h-3 w-3" />
          )}
          <span>{settings.theme === 'dark' ? 'Dark' : 'Light'}</span>
        </div>
      </div>
    </div>
  )
}
