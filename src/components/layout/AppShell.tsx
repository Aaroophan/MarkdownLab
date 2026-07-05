'use client'

import Markdown from 'markdown-to-jsx'
import {
  Check,
  Copy,
  Download,
  FileText,
  Github,
  Moon,
  RotateCcw,
  Sun,
} from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'markdownlab:markdown-live-preview:content:v2'
const SETTINGS_KEY = 'markdownlab:markdown-live-preview:settings:v2'

const starterMarkdown = `# Markdown Live Preview

Start typing Markdown on the left. The preview updates instantly on the right.

## Features

- **Live preview** while you write
- _Dark mode_ and light mode
- Sync scroll between editor and preview
- Copy Markdown
- Export the preview as PDF

## Table example

| Syntax | Preview |
|---|---:|
| Headings | Yes |
| Lists | Yes |
| Code blocks | Yes |

## Code example

\`\`\`ts
const project = 'MarkdownLab'
console.log(project)
\`\`\`

## Mermaid example

\`\`\`mermaid
flowchart LR
  A[Write Markdown] --> B[Live Preview]
  B --> C[Copy or Export]
\`\`\`

> This version keeps the app simple and close to the Markdown Live Preview layout.
`

type ThemeMode = 'dark' | 'light'

type PersistedSettings = {
  theme: ThemeMode
  syncScroll: boolean
}

type ToastState = {
  tone: 'success' | 'error' | 'info'
  message: string
} | null

function readSettings(): PersistedSettings {
  if (typeof window === 'undefined') {
    return { theme: 'dark', syncScroll: true }
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return { theme: 'dark', syncScroll: true }

    const parsed = JSON.parse(saved) as Partial<PersistedSettings>

    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      syncScroll: typeof parsed.syncScroll === 'boolean' ? parsed.syncScroll : true,
    }
  } catch {
    return { theme: 'dark', syncScroll: true }
  }
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function getPlainTextFromMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-[\]|:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getWordCount(markdown: string) {
  const text = getPlainTextFromMarkdown(markdown)
  return text ? text.split(/\s+/).length : 0
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function LinkRenderer(props: ComponentProps<'a'>) {
  return <a {...props} target="_blank" rel="noreferrer" />
}

function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function renderMermaid() {
      try {
        setError('')
        setSvg('')
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'default',
        })

        const id = `markdownlab-mermaid-${Date.now()}-${Math.random().toString(16).slice(2)}`
        const result = await mermaid.render(id, chart)

        if (!cancelled) {
          setSvg(result.svg)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Mermaid diagram could not be rendered.')
        }
      }
    }

    renderMermaid()

    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return (
      <div className="mlp-mermaid-error">
        <strong>Mermaid diagram error</strong>
        <span>{error}</span>
      </div>
    )
  }

  if (!svg) {
    return <div className="mlp-mermaid-loading">Rendering Mermaid diagram...</div>
  }

  return <div className="mlp-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />
}

function CodeRenderer({ children, className }: ComponentProps<'code'>) {
  const rawCode = String(children ?? '').replace(/\n$/, '')
  const language = className?.replace('lang-', '').replace('language-', '') || ''
  const isBlock = Boolean(className)
  const [copied, setCopied] = useState(false)

  if (!isBlock) {
    return <code>{children}</code>
  }

  if (language.toLowerCase() === 'mermaid') {
    return <MermaidBlock chart={rawCode} />
  }

  return (
    <figure className="mlp-code-block">
      <figcaption>
        <span>{language || 'text'}</span>
        <button
          type="button"
          onClick={async () => {
            await copyToClipboard(rawCode)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1200)
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre>
        <code>{rawCode}</code>
      </pre>
    </figure>
  )
}

function ToolbarButton({ children, onClick, title }: { children: ReactNode; onClick: () => void; title?: string }) {
  return (
    <button type="button" className="mlp-toolbar-button" onClick={onClick} title={title}>
      {children}
    </button>
  )
}

export default function AppShell() {
  const initialSettings = useMemo(() => readSettings(), [])
  const [content, setContent] = useState(starterMarkdown)
  const [theme, setTheme] = useState<ThemeMode>(initialSettings.theme)
  const [syncScroll, setSyncScroll] = useState(initialSettings.syncScroll)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const previewScrollerRef = useRef<HTMLDivElement | null>(null)
  const previewArticleRef = useRef<HTMLElement | null>(null)
  const scrollSourceRef = useRef<'editor' | 'preview' | null>(null)
  const scrollReleaseTimerRef = useRef<number | null>(null)

  const words = useMemo(() => getWordCount(content), [content])
  const chars = content.length

  const showToast = useCallback((message: string, tone: NonNullable<ToastState>['tone'] = 'success') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2200)
  }, [])

  const releaseScrollSource = useCallback(() => {
    if (scrollReleaseTimerRef.current) {
      window.clearTimeout(scrollReleaseTimerRef.current)
    }

    scrollReleaseTimerRef.current = window.setTimeout(() => {
      scrollSourceRef.current = null
    }, 120)
  }, [])

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setContent(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, content)
  }, [content, mounted])

  useEffect(() => {
    if (!mounted) return
    const settings: PersistedSettings = { theme, syncScroll }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [theme, syncScroll, mounted])

  const handleEditorScroll = useCallback(() => {
    if (!syncScroll || scrollSourceRef.current === 'preview') return

    const editor = editorRef.current
    const preview = previewScrollerRef.current
    if (!editor || !preview) return

    scrollSourceRef.current = 'editor'
    const editorRange = Math.max(1, editor.scrollHeight - editor.clientHeight)
    const previewRange = Math.max(1, preview.scrollHeight - preview.clientHeight)
    preview.scrollTop = (editor.scrollTop / editorRange) * previewRange
    releaseScrollSource()
  }, [releaseScrollSource, syncScroll])

  const handlePreviewScroll = useCallback(() => {
    if (!syncScroll || scrollSourceRef.current === 'editor') return

    const editor = editorRef.current
    const preview = previewScrollerRef.current
    if (!editor || !preview) return

    scrollSourceRef.current = 'preview'
    const previewRange = Math.max(1, preview.scrollHeight - preview.clientHeight)
    const editorRange = Math.max(1, editor.scrollHeight - editor.clientHeight)
    editor.scrollTop = (preview.scrollTop / previewRange) * editorRange
    releaseScrollSource()
  }, [releaseScrollSource, syncScroll])

  const resetContent = useCallback(() => {
    setContent(starterMarkdown)
    editorRef.current?.focus()
    showToast('Reset to the sample Markdown.', 'info')
  }, [showToast])

  const copyMarkdown = useCallback(async () => {
    await copyToClipboard(content)
    showToast('Markdown copied.')
  }, [content, showToast])

  const downloadMarkdown = useCallback(() => {
    downloadBlob('markdownlab.md', new Blob([content], { type: 'text/markdown;charset=utf-8' }))
    showToast('Markdown downloaded.')
  }, [content, showToast])

  const exportPdf = useCallback(async () => {
    const target = previewArticleRef.current
    if (!target) return

    try {
      showToast('Preparing PDF...', 'info')
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const canvas = await html2canvas(target, {
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
      })

      const pdf = new jsPDF('p', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 28
      const imageWidth = pageWidth - margin * 2
      const imageHeight = (canvas.height * imageWidth) / canvas.width
      const image = canvas.toDataURL('image/png')

      let y = margin
      let remainingHeight = imageHeight
      let sourceY = 0
      const pageCanvas = document.createElement('canvas')
      const pageContext = pageCanvas.getContext('2d')
      const sliceHeight = ((pageHeight - margin * 2) * canvas.width) / imageWidth

      pageCanvas.width = canvas.width
      pageCanvas.height = Math.min(sliceHeight, canvas.height)

      if (!pageContext || imageHeight <= pageHeight - margin * 2) {
        pdf.addImage(image, 'PNG', margin, y, imageWidth, imageHeight)
      } else {
        while (remainingHeight > 0) {
          pageCanvas.height = Math.min(sliceHeight, canvas.height - sourceY)
          pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
          pageContext.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            canvas.width,
            pageCanvas.height,
          )

          const pageImage = pageCanvas.toDataURL('image/png')
          const pageImageHeight = (pageCanvas.height * imageWidth) / canvas.width
          pdf.addImage(pageImage, 'PNG', margin, y, imageWidth, pageImageHeight)

          remainingHeight -= pageHeight - margin * 2
          sourceY += sliceHeight

          if (remainingHeight > 0) {
            pdf.addPage()
            y = margin
          }
        }
      }

      pdf.save('markdownlab-preview.pdf')
      showToast('PDF exported.')
    } catch (error) {
      console.error(error)
      showToast('PDF export failed.', 'error')
    }
  }, [showToast, theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <main className={classNames('mlp-shell', theme === 'dark' && 'is-dark')}>
      <header className="mlp-header">
        <div className="mlp-brand">
          <FileText size={24} />
          <div>
            <h1>Markdown Live Preview</h1>
            <p>Simple Markdown editor + instant rendered preview</p>
          </div>
        </div>

        <nav className="mlp-toolbar" aria-label="Markdown actions">
          <ToolbarButton onClick={resetContent} title="Reset sample content">
            <RotateCcw size={16} />
            Reset
          </ToolbarButton>
          <ToolbarButton onClick={copyMarkdown} title="Copy Markdown">
            <Copy size={16} />
            Copy
          </ToolbarButton>
          <ToolbarButton onClick={downloadMarkdown} title="Download Markdown file">
            <Download size={16} />
            Markdown
          </ToolbarButton>
          <ToolbarButton onClick={exportPdf} title="Export preview as PDF">
            <Download size={16} />
            Export PDF
          </ToolbarButton>

          <label className="mlp-toggle">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(event) => setSyncScroll(event.target.checked)}
            />
            <span>Sync scroll</span>
          </label>

          <label className="mlp-toggle">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <span>Dark mode</span>
          </label>

          <button type="button" className="mlp-icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </nav>
      </header>

      <section className="mlp-split" aria-label="Editor and preview split screen">
        <section className="mlp-pane mlp-editor-pane" aria-label="Markdown editor">
          <div className="mlp-pane-title">Markdown</div>
          <textarea
            ref={editorRef}
            value={content}
            spellCheck={false}
            onChange={(event) => setContent(event.target.value)}
            onScroll={handleEditorScroll}
            aria-label="Markdown input"
          />
        </section>

        <section className="mlp-pane mlp-preview-pane" aria-label="Rendered preview">
          <div className="mlp-pane-title">Preview</div>
          <div className="mlp-preview-scroll" ref={previewScrollerRef} onScroll={handlePreviewScroll}>
            <article className="mlp-preview" ref={previewArticleRef}>
              {content.trim() ? (
                <Markdown
                  options={{
                    forceBlock: true,
                    overrides: {
                      a: LinkRenderer,
                      code: CodeRenderer,
                    },
                  }}
                >
                  {content}
                </Markdown>
              ) : (
                <p className="mlp-empty-preview">Start writing Markdown to see the preview.</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <footer className="mlp-footer">
        <span>{words} words</span>
        <span>{chars} characters</span>
        <span>{syncScroll ? 'sync scroll on' : 'sync scroll off'}</span>
        <span>saved locally in this browser</span>
        <a href="https://github.com/Aaroophan/MarkdownLab" target="_blank" rel="noreferrer">
          <Github size={14} /> GitHub
        </a>
      </footer>

      {toast && <div className={`mlp-toast is-${toast.tone}`}>{toast.message}</div>}
    </main>
  )
}
