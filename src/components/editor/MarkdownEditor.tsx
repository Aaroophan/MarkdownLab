'use client'

import { useCallback, useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import { useDocumentStore } from '@/features/documents/documentStore'

export default function MarkdownEditor() {
  const activeDoc = useDocumentStore((state) => state.getActiveDocument())
  const updateDocumentContent = useDocumentStore((state) => state.updateDocumentContent)
  const saveToStorage = useDocumentStore((state) => state.saveToStorage)
  const setDocumentSaved = useDocumentStore((state) => state.setDocumentSaved)
  const settings = useDocumentStore((state) => state.settings)

  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  if (!activeDoc) {
    return (
      <div className="flex h-full items-center justify-center text-foreground/50">
        <div className="text-sm">No document selected</div>
      </div>
    )
  }

  const handleChange = (value: string) => {
    updateDocumentContent(activeDoc.id, value)
    setDocumentSaved(false)

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Auto-save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage()
      setDocumentSaved(true)
    }, 1000)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const theme = settings.theme === 'dark' ? githubDark : githubLight

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        ref={editorRef}
        value={activeDoc.content}
        onChange={handleChange}
        extensions={[markdown()]}
        theme={theme}
        height="100%"
        width="100%"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
        }}
        className="h-full"
      />
    </div>
  )
}
