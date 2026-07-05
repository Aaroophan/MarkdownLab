'use client'

import { useEffect, useState, useRef } from 'react'
import { useDocumentStore } from '@/features/documents/documentStore'
import { Search } from 'lucide-react'

interface Command {
  id: string
  title: string
  description: string
  shortcut?: string
  icon?: string
  action: () => void
  category: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onExecuteCommand?: (id: string) => void
  onExport?: (format: 'markdown' | 'html' | 'pdf' | 'docx') => void
  onShare?: () => void
}

export default function CommandPalette({ isOpen, onClose, onExecuteCommand, onExport, onShare }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const createDocument = useDocumentStore((state) => state.createDocument)
  const deleteDocument = useDocumentStore((state) => state.deleteDocument)
  const renameDocument = useDocumentStore((state) => state.renameDocument)
  const setTheme = useDocumentStore((state) => state.setTheme)
  const updateSettings = useDocumentStore((state) => state.updateSettings)
  const saveToStorage = useDocumentStore((state) => state.saveToStorage)
  const clearAllData = useDocumentStore((state) => state.clearAllData)
  const settings = useDocumentStore((state) => state.settings)
  const activeDoc = useDocumentStore((state) => state.getActiveDocument())

  const commands: Command[] = [
    {
      id: 'new-document',
      title: 'New Document',
      description: 'Create a new markdown document',
      shortcut: 'Ctrl+N',
      category: 'Document',
      action: () => {
        createDocument()
        saveToStorage()
      },
    },
    {
      id: 'save-document',
      title: 'Save Document',
      description: 'Save current document to storage',
      shortcut: 'Ctrl+S',
      category: 'Document',
      action: () => saveToStorage(),
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle between light and dark themes',
      shortcut: 'Ctrl+Shift+L',
      category: 'Settings',
      action: () => setTheme(settings.theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'toggle-preview-only',
      title: `${settings.previewOnly ? 'Exit' : 'Enter'} Preview-Only Mode`,
      description: 'Hide editor UI and show only preview',
      shortcut: 'Ctrl+Shift+P',
      category: 'View',
      action: () => updateSettings({ previewOnly: !settings.previewOnly }),
    },
    {
      id: 'toggle-sync-scroll',
      title: `${settings.syncScroll ? 'Disable' : 'Enable'} Sync Scroll`,
      description: 'Synchronize editor and preview scrolling',
      category: 'View',
      action: () => updateSettings({ syncScroll: !settings.syncScroll }),
    },
    {
      id: 'copy-markdown',
      title: 'Copy Markdown',
      description: 'Copy document content as markdown',
      category: 'Copy',
      action: () => {
        if (activeDoc) {
          navigator.clipboard.writeText(activeDoc.content)
        }
      },
    },
    {
      id: 'copy-html',
      title: 'Copy as HTML',
      description: 'Copy rendered preview as HTML',
      category: 'Copy',
      action: () => {
        // Placeholder - will be implemented in Phase 4
      },
    },
    {
      id: 'export-markdown',
      title: 'Export as Markdown',
      description: 'Download document as .md file',
      category: 'Export',
      action: () => onExport?.('markdown'),
    },
    {
      id: 'export-html',
      title: 'Export as HTML',
      description: 'Download standalone HTML file',
      category: 'Export',
      action: () => onExport?.('html'),
    },
    {
      id: 'export-pdf',
      title: 'Export as PDF',
      description: 'Download document as PDF',
      category: 'Export',
      action: () => onExport?.('pdf'),
    },
    {
      id: 'export-docx',
      title: 'Export as DOCX',
      description: 'Download document as Word file',
      category: 'Export',
      action: () => onExport?.('docx'),
    },
    {
      id: 'share-document',
      title: 'Share Document',
      description: 'Create shareable link with compressed data',
      category: 'Share',
      action: () => onShare?.(),
    },
    {
      id: 'clear-storage',
      title: 'Clear All Data',
      description: 'Delete all documents and reset settings (cannot be undone)',
      category: 'Danger',
      action: () => {
        if (typeof window !== 'undefined' && confirm('Are you sure? This cannot be undone.')) {
          clearAllData()
        }
      },
    },
  ]

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            onExecuteCommand?.(filteredCommands[selectedIndex].id)
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose, onExecuteCommand])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-card border border-border shadow-xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <span className="text-xs text-muted-foreground">ESC</span>
        </div>

        {/* Commands list */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    idx === selectedIndex ? 'bg-muted text-foreground' : 'hover:bg-muted/50 text-foreground'
                  }`}
                  onClick={() => {
                    cmd.action()
                    onExecuteCommand?.(cmd.id)
                    onClose()
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{cmd.title}</div>
                      <div className="text-xs text-muted-foreground">{cmd.description}</div>
                    </div>
                    {cmd.shortcut && <span className="text-xs text-muted-foreground ml-2">{cmd.shortcut}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with hints */}
        <div className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            {filteredCommands.length > 0 && (
              <>↑ ↓ to navigate • Enter to execute</>
            )}
          </span>
          <span>{filteredCommands.length} command(s)</span>
        </div>
      </div>
    </div>
  )
}
