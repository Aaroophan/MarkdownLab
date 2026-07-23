'use client'

import { useDocumentStore } from '@/features/documents/documentStore'
import {
  FileText,
  Plus,
  FolderOpen,
  Save,
  Download,
  Moon,
  Sun,
  Eye,
  Share2,
  Copy,
  MoreVertical,
  ChevronDown,
  Link2,
  Image,
  Code2,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Quote,
  Bold,
  Italic,
  Zap,
} from 'lucide-react'
import { useRef, useState, useCallback, useEffect } from 'react'

interface TopToolbarProps {
  onInsertContent?: (type: string) => void
  onOpenCommandPalette?: () => void
  onOpenTableModal?: () => void
  onShowToast?: (message: string) => void
  onExport?: (format: 'markdown' | 'html' | 'pdf' | 'docx') => void
  onShare?: () => void
}

export default function TopToolbar({
  onInsertContent,
  onOpenCommandPalette,
  onOpenTableModal,
  onShowToast,
  onExport,
  onShare,
}: TopToolbarProps) {
  const createDocument = useDocumentStore((state) => state.createDocument)
  const setTheme = useDocumentStore((state) => state.setTheme)
  const settings = useDocumentStore((state) => state.settings)
  const importDocument = useDocumentStore((state) => state.importDocument)
  const saveToStorage = useDocumentStore((state) => state.saveToStorage)
  const updateSettings = useDocumentStore((state) => state.updateSettings)
  const activeDoc = useDocumentStore((state) => state.getActiveDocument())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const fileName = file.name.replace(/\.(md|markdown|txt)$/, '')
      importDocument(fileName, content)
      saveToStorage()
    } catch (error) {
      console.error('Failed to import file:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownload = () => {
    if (!activeDoc) return

    const element = document.createElement('a')
    const file = new Blob([activeDoc.content], { type: 'text/markdown' })
    element.href = URL.createObjectURL(file)
    element.download = `${activeDoc.title}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(element.href)
  }

  const handleCreateNewDoc = useCallback(() => {
    createDocument()
    saveToStorage()
    setShowMenu(false)
  }, [createDocument, saveToStorage])

  const handleInsert = (type: string) => {
    onInsertContent?.(type)
    setShowInsertMenu(false)
  }

  const handleToggleTheme = () => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark')
    setShowMenu(false)
  }

  const handleTogglePreviewOnly = () => {
    updateSettings({ previewOnly: !settings.previewOnly })
    setShowMenu(false)
  }

  const handleToggleSyncScroll = () => {
    updateSettings({ syncScroll: !settings.syncScroll })
    setShowMenu(false)
  }

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowInsertMenu(false)
      setShowMenu(false)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-2 py-2 gap-2 flex-wrap">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".md,.markdown,.txt"
        className="hidden"
        aria-label="Import markdown file"
      />

      {/* Left section - Logo & Document controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2">
          <FileText className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold hidden sm:inline">MarkdownHere</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateNewDoc}
            title="New Document (Ctrl+N)"
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Open File"
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              saveToStorage()
            }}
            title="Save (Ctrl+S)"
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <Save className="h-4 w-4" />
          </button>

          {activeDoc && (
            <button
              onClick={handleDownload}
              title="Download as .md"
              className="p-1.5 hover:bg-muted rounded transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Middle section - Insert & Format toolbar */}
      <div className="flex items-center gap-1 border-l border-r border-border px-2">
        <div className="relative">
          <button
            onClick={() => setShowInsertMenu(!showInsertMenu)}
            title="Insert element"
            className="p-1.5 hover:bg-muted rounded transition-colors flex items-center gap-1"
          >
            <Zap className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {showInsertMenu && (
            <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded shadow-lg z-50 min-w-56">
              <div className="grid grid-cols-2 gap-1 p-2">
                <button
                  onClick={() => handleInsert('bold')}
                  title="Bold (Ctrl+B)"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Bold className="h-3.5 w-3.5" />
                  Bold
                </button>
                <button
                  onClick={() => handleInsert('italic')}
                  title="Italic (Ctrl+I)"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Italic className="h-3.5 w-3.5" />
                  Italic
                </button>
                <button
                  onClick={() => handleInsert('link')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Link
                </button>
                <button
                  onClick={() => handleInsert('image')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Image className="h-3.5 w-3.5" />
                  Image
                </button>
                <button
                  onClick={() => handleInsert('code')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Code Block
                </button>
                <button
                  onClick={() => handleInsert('quote')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Quote className="h-3.5 w-3.5" />
                  Quote
                </button>
                <button
                  onClick={() => handleInsert('ul')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  onClick={() => handleInsert('ol')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                  Numbered
                </button>
                <button
                  onClick={() => handleInsert('task')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Task List
                </button>
                <button
                  onClick={() => onOpenTableModal?.()}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs"
                >
                  <Table className="h-3.5 w-3.5" />
                  Table
                </button>
                <button
                  onClick={() => handleInsert('mermaid')}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-xs col-span-2"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Mermaid Diagram
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section - Settings & toggles */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onOpenCommandPalette?.()}
          title="Command Palette (Ctrl+K)"
          className="p-1.5 hover:bg-muted rounded transition-colors"
        >
          <span className="text-xs px-1">Cmd</span>
        </button>

        <button
          onClick={handleToggleSyncScroll}
          title={`${settings.syncScroll ? 'Disable' : 'Enable'} Sync Scroll`}
          className={`p-1.5 rounded transition-colors ${
            settings.syncScroll ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
          }`}
        >
          <Link2 className="h-4 w-4" />
        </button>

        <button
          onClick={handleTogglePreviewOnly}
          title={`${settings.previewOnly ? 'Exit' : 'Enter'} Preview-Only Mode (Ctrl+Shift+P)`}
          className={`p-1.5 rounded transition-colors ${
            settings.previewOnly ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
          }`}
        >
          <Eye className="h-4 w-4" />
        </button>

        <button
          onClick={handleToggleTheme}
          title="Toggle Theme"
          className="p-1.5 hover:bg-muted rounded transition-colors"
        >
          {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            title="More Options"
            className="p-1.5 hover:bg-muted rounded transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded shadow-lg z-50 min-w-48">
              <button
                onClick={() => {
                  if (activeDoc) {
                    navigator.clipboard.writeText(activeDoc.content).then(() => {
                      onShowToast?.('Markdown copied!')
                      setShowMenu(false)
                    })
                  }
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy Markdown
              </button>
              <div className="h-px bg-border" />
              <button
                onClick={() => {
                  onExport?.('markdown')
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export as Markdown
              </button>
              <button
                onClick={() => {
                  onExport?.('html')
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export as HTML
              </button>
              <button
                onClick={() => {
                  onExport?.('pdf')
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export as PDF
              </button>
              <button
                onClick={() => {
                  onExport?.('docx')
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Export as DOCX
              </button>
              <div className="h-px bg-border" />
              <button
                onClick={() => {
                  onShare?.()
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
              >
                <Share2 className="h-4 w-4" />
                Share Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
