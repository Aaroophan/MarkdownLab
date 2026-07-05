'use client'

import { useState } from 'react'
import { useDocumentStore } from '@/features/documents/documentStore'
import { MoreVertical, Plus, Trash2 } from 'lucide-react'

export default function DocumentSidebar() {
  const documents = useDocumentStore((state) => state.documents)
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId)
  const switchActiveDocument = useDocumentStore((state) => state.switchActiveDocument)
  const createDocument = useDocumentStore((state) => state.createDocument)
  const deleteDocument = useDocumentStore((state) => state.deleteDocument)
  const renameDocument = useDocumentStore((state) => state.renameDocument)
  const saveToStorage = useDocumentStore((state) => state.saveToStorage)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renamingValue, setRenamingValue] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleRenameStart = (id: string, currentTitle: string) => {
    setRenamingId(id)
    setRenamingValue(currentTitle)
  }

  const handleRenameSave = (id: string) => {
    if (renamingValue.trim()) {
      renameDocument(id, renamingValue.trim())
      saveToStorage()
    }
    setRenamingId(null)
  }

  const handleCreateNew = () => {
    const newId = createDocument()
    switchActiveDocument(newId)
    saveToStorage()
  }

  return (
    <div className="flex w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <button
          onClick={handleCreateNew}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          New Document
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-1 p-2">
          {documents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No documents yet. Create one to get started.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 rounded px-2 py-2 transition-colors relative ${
                  activeDocumentId === doc.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <button
                  onClick={() => {
                    switchActiveDocument(doc.id)
                    saveToStorage()
                  }}
                  className="flex-1 text-left"
                >
                  {renamingId === doc.id ? (
                    <input
                      autoFocus
                      value={renamingValue}
                      onChange={(e) => setRenamingValue(e.target.value)}
                      onBlur={() => handleRenameSave(doc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSave(doc.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="h-6 w-full px-1 text-xs border border-border rounded bg-background text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-sm font-medium">{doc.title}</span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === doc.id ? null : doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>

                  {menuOpenId === doc.id && (
                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded shadow-lg z-50 min-w-32">
                      <button
                        onClick={() => {
                          handleRenameStart(doc.id, doc.title)
                          setMenuOpenId(null)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          deleteDocument(doc.id)
                          saveToStorage()
                          setMenuOpenId(null)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
