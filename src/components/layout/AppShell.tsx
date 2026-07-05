'use client'

import { useEffect, useState, useRef } from 'react'
import { useDocumentStore } from '@/features/documents/documentStore'
import { editorActions } from '@/features/editor/editorUtils'
import TopToolbar from './TopToolbar'
import DocumentSidebar from './DocumentSidebar'
import EditorPanel from './EditorPanel'
import PreviewPanel from './PreviewPanel'
import StatusBar from './StatusBar'
import CommandPalette from '@/components/commands/CommandPalette'
import TableGeneratorModal from '@/components/modals/TableGeneratorModal'
import PanelResizer from './PanelResizer'
import Toast, { useToast } from '@/components/ui/Toast'
import { exportDocument, getPreviewHtml, ensureMermaidRendered } from '@/features/export'
import { copyShareLinkToClipboard, parseShareHash, createShareLink } from '@/features/share/urlShare'
import { detectAndParseShare, validateSharePayload, createDocumentFromShare } from '@/features/share/shareImporter'
import ShareModal from '@/components/modals/ShareModal'
import LargeDocumentModal from '@/components/modals/LargeDocumentModal'

export default function AppShell() {
  const [mounted, setMounted] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [largeDocModalOpen, setLargeDocModalOpen] = useState(false)
  const [shareLink, setShareLink] = useState<string>()
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState<string>()
  const { message, isVisible, showToast } = useToast()
  const loadFromStorage = useDocumentStore((state) => state.loadFromStorage)
  const createDocument = useDocumentStore((state) => state.createDocument)
  const updateDocument = useDocumentStore((state) => state.updateDocument)
  const settings = useDocumentStore((state) => state.settings)
  const activeDoc = useDocumentStore((state) => state.getActiveDocument())
  const saveToStorage = useDocumentStore((state) => state.saveToStorage)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Use the store's getState to avoid capturing changing function identities
        useDocumentStore.getState().loadFromStorage()

        // Check for share link in URL hash
        const sharedPayload = await detectAndParseShare()
        if (sharedPayload && validateSharePayload(sharedPayload)) {
          // Show prompt to import shared document
          const shouldImport = confirm(`Open shared document: "${sharedPayload.title}"?`)
          if (shouldImport) {
            const newDoc = createDocumentFromShare(sharedPayload, () =>
              useDocumentStore.getState().createDocument().toString()
            )
            useDocumentStore.getState().updateDocument(newDoc.id, newDoc)
            useDocumentStore.getState().saveToStorage()
            showToast('Shared document imported')
            // Clear hash
            window.history.replaceState(null, '', window.location.pathname)
          }
        }
      } catch (err) {
        console.error('[v0] Error initializing app:', err)
      }
      setMounted(true)
    }

    initializeApp()
    // Run only once on mount; avoid including functions that change identity
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd based shortcuts
      const isMeta = e.ctrlKey || e.metaKey

      if (isMeta && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      } else if (isMeta && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        const updateSettings = useDocumentStore.getState().updateSettings
        const settings = useDocumentStore.getState().settings
        updateSettings({ previewOnly: !settings.previewOnly })
      } else if (isMeta && e.key === 's') {
        e.preventDefault()
        useDocumentStore.getState().saveToStorage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleInsertContent = (type: string) => {
    // This will be connected to the editor in Phase 3.5
    // For now, log it
    console.log('[v0] Insert content:', type)
  }

  const handleGenerateTable = (table: string) => {
    // Will be connected to editor in Phase 3.5
    console.log('[v0] Generated table:', table)
  }

  const handleExport = async (format: 'markdown' | 'html' | 'pdf' | 'docx') => {
    if (!activeDoc) {
      showToast('No document to export')
      return
    }

    setExporting(true)

    try {
      // Ensure Mermaid diagrams are rendered
      await ensureMermaidRendered()

      const htmlContent = format !== 'markdown' ? getPreviewHtml() : undefined

      if (!htmlContent && format !== 'markdown') {
        throw new Error('Could not render preview content')
      }

      const result = await exportDocument(format, {
        title: activeDoc.title,
        content: activeDoc.content,
        htmlContent: htmlContent || undefined,
        filename: '',
        theme: 'light',
      })

      if (result.success) {
        showToast(`Exported ${format.toUpperCase()}`)
      } else {
        showToast(`Export failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Export error:', error)
      showToast(`Export failed: ${errorMsg}`)
    } finally {
      setExporting(false)
    }
  }

  const handleShare = async () => {
    if (!activeDoc) {
      showToast('No document to share')
      return
    }

    setShareLoading(true)
    setShareError(undefined)

    try {
      const payload = {
        version: 1 as const,
        title: activeDoc.title,
        content: activeDoc.content,
        createdAt: activeDoc.createdAt,
        updatedAt: activeDoc.updatedAt,
      }

      const result = await createShareLink(payload)

      if (!result.success) {
        if (result.error?.includes('too large')) {
          setLargeDocModalOpen(true)
          return
        }
        setShareError(result.error || 'Failed to create share link')
        return
      }

      setShareLink(result.url)
      setShareModalOpen(true)
      showToast('Share link created')

      // Copy to clipboard automatically
      if (result.url) {
        await navigator.clipboard.writeText(result.url).catch(() => {
          // If clipboard fails, user can still copy from modal
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Share error:', error)
      setShareError(errorMsg)
    } finally {
      setShareLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div>Loading...</div>
      </div>
    )
  }

  // Hide sidebar and document list in preview-only mode
  const showSidebar = !settings.previewOnly

  return (
    <div className={`flex h-screen flex-col bg-background text-foreground ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <TopToolbar
        onInsertContent={handleInsertContent}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenTableModal={() => setTableModalOpen(true)}
        onShowToast={showToast}
        onExport={handleExport}
        onShare={handleShare}
      />

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <DocumentSidebar />}

        <div className="flex flex-1">
          {settings.layoutMode === 'split' && (
            <div className="flex flex-1">
              <div style={{ width: `${settings.panelRatio * 100}%` }} className="overflow-hidden">
                <EditorPanel ref={editorRef} />
              </div>
              <PanelResizer />
              <div style={{ width: `${(1 - settings.panelRatio) * 100}%` }} className="overflow-hidden">
                <PreviewPanel />
              </div>
            </div>
          )}

          {settings.layoutMode === 'editor' && <EditorPanel ref={editorRef} />}

          {settings.layoutMode === 'preview' && <PreviewPanel />}
        </div>
      </div>

      {!settings.previewOnly && <StatusBar />}

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onExport={handleExport} onShare={handleShare} />
      <TableGeneratorModal isOpen={tableModalOpen} onClose={() => setTableModalOpen(false)} onGenerate={handleGenerateTable} />
      <ShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} shareLink={shareLink} isLoading={shareLoading} error={shareError} />
      <LargeDocumentModal
        isOpen={largeDocModalOpen}
        onClose={() => setLargeDocModalOpen(false)}
        onDownloadMarkdown={() => handleExport('markdown')}
        onExportHtml={() => handleExport('html')}
        docSize={activeDoc?.content.length || 0}
      />
      <Toast message={message} isVisible={isVisible} />
    </div>
  )
}
