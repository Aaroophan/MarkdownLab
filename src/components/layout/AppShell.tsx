'use client'

import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import {
  Check,
  Copy,
  Download,
  FileText,
  Github,
  Moon,
  RotateCcw,
  SplitSquareHorizontal,
  Sun,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

const STORAGE_KEY = 'markdownlab:content:v3'
const SETTINGS_KEY = 'markdownlab:settings:v3'

const starterMarkdown = `# MarkdownLab

Start typing Markdown on the left. The preview updates instantly on the right.

## Features

- **Live preview** while you write
- VS Code-style Markdown editor
- Adjustable split screen
- GitHub-Flavored Markdown tables and task lists
- Mermaid diagrams
- Copy Markdown
- Export the rendered preview as PDF

## Table alignment example

| Feature | Status | Notes |
|:---|:---:|---:|
| Markdown | Working | Left aligned |
| Mermaid | Working | Center aligned |
| PDF | Working | Right aligned |

## Task list

- [x] Rename app to MarkdownLab
- [x] Use icon-only dark mode
- [x] Use icon-only sync scroll
- [ ] Write your next README

## Code example

\`\`\`ts
const project = 'MarkdownLab'
console.log(project)
\`\`\`

## Mermaid example

\`\`\`mermaid
flowchart LR
  A[Write Markdown] --> B[Live Preview]
  B --> C[Mermaid Diagram]
  C --> D[Export PDF]
\`\`\`

> MarkdownLab is a static, browser-only Markdown document studio.
`

type ThemeMode = 'dark' | 'light'

type PersistedSettings = {
  theme: ThemeMode
  syncScroll: boolean
  splitPercent: number
}

type ToastState = {
  tone: 'success' | 'error' | 'info'
  message: string
} | null

const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      ['target'],
      ['rel'],
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', /^language-[A-Za-z0-9_-]+$/],
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className'],
      ['dataLanguage'],
    ],
    th: [
      ...(defaultSchema.attributes?.th || []),
      ['align'],
    ],
    td: [
      ...(defaultSchema.attributes?.td || []),
      ['align'],
    ],
    input: [
      ...(defaultSchema.attributes?.input || []),
      ['type', 'checkbox'],
      ['checked'],
      ['disabled'],
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'input',
  ],
} as Parameters<typeof rehypeSanitize>[0]

function readSettings(): PersistedSettings {
  if (typeof window === 'undefined') {
    return { theme: 'dark', syncScroll: true, splitPercent: 50 }
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return { theme: 'dark', syncScroll: true, splitPercent: 50 }

    const parsed = JSON.parse(saved) as Partial<PersistedSettings>
    const splitPercent = typeof parsed.splitPercent === 'number' ? parsed.splitPercent : 50

    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      syncScroll: typeof parsed.syncScroll === 'boolean' ? parsed.syncScroll : true,
      splitPercent: Math.min(75, Math.max(25, splitPercent)),
    }
  } catch {
    return { theme: 'dark', syncScroll: true, splitPercent: 50 }
  }
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

function getPlainTextFromMarkdown(markdownSource: string) {
  return markdownSource
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~\-[\]|:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getWordCount(markdownSource: string) {
  const text = getPlainTextFromMarkdown(markdownSource)
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

async function renderMarkdown(markdownSource: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, markdownSchema)
    .use(rehypeStringify)
    .process(markdownSource)

  return String(file)
}

function ToolbarButton({ children, onClick, title }: { children: ReactNode; onClick: () => void; title?: string }) {
  return (
    <button type="button" className="mlp-toolbar-button" onClick={onClick} title={title}>
      {children}
    </button>
  )
}

function ToggleIconButton({
  active,
  children,
  onClick,
  title,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      className={classNames('mlp-icon-button', active && 'is-active')}
      aria-pressed={active}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

function getEditorScrollElement(editorView: any): HTMLElement | null {
  return editorView?.scrollDOM instanceof HTMLElement ? editorView.scrollDOM : null
}

export default function AppShell() {
  const initialSettings = useMemo(() => readSettings(), [])
  const [content, setContent] = useState(starterMarkdown)
  const [previewHtml, setPreviewHtml] = useState('')
  const [theme, setTheme] = useState<ThemeMode>(initialSettings.theme)
  const [syncScroll, setSyncScroll] = useState(initialSettings.syncScroll)
  const [splitPercent, setSplitPercent] = useState(initialSettings.splitPercent)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const splitRef = useRef<HTMLElement | null>(null)
  const editorViewRef = useRef<any>(null)
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
    let cancelled = false

    async function runPipeline() {
      try {
        const html = await renderMarkdown(content)
        if (!cancelled) {
          setPreviewHtml(html)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setPreviewHtml('<p>Markdown preview failed to render.</p>')
        }
      }
    }

    runPipeline()

    return () => {
      cancelled = true
    }
  }, [content])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, content)
  }, [content, mounted])

  useEffect(() => {
    if (!mounted) return
    const settings: PersistedSettings = { theme, syncScroll, splitPercent }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [theme, syncScroll, splitPercent, mounted])

  const handleEditorScroll = useCallback(() => {
    if (!syncScroll || scrollSourceRef.current === 'preview') return

    const editor = getEditorScrollElement(editorViewRef.current)
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

    const editor = getEditorScrollElement(editorViewRef.current)
    const preview = previewScrollerRef.current
    if (!editor || !preview) return

    scrollSourceRef.current = 'preview'
    const previewRange = Math.max(1, preview.scrollHeight - preview.clientHeight)
    const editorRange = Math.max(1, editor.scrollHeight - editor.clientHeight)
    editor.scrollTop = (preview.scrollTop / previewRange) * editorRange
    releaseScrollSource()
  }, [releaseScrollSource, syncScroll])

  useEffect(() => {
    if (!isDraggingSplit) return

    const handlePointerMove = (event: PointerEvent) => {
      const split = splitRef.current
      if (!split) return

      const rect = split.getBoundingClientRect()
      const nextPercent = ((event.clientX - rect.left) / rect.width) * 100
      setSplitPercent(Math.min(75, Math.max(25, nextPercent)))
    }

    const handlePointerUp = () => {
      setIsDraggingSplit(false)
      document.body.classList.remove('is-resizing-split')
    }

    document.body.classList.add('is-resizing-split')
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.body.classList.remove('is-resizing-split')
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDraggingSplit])

  useEffect(() => {
    const article = previewArticleRef.current
    if (!article || !previewHtml) return

    let cancelled = false

    async function enhancePreview() {
      if (!article) return

      article.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
        link.target = '_blank'
        link.rel = 'noreferrer'
      })

      article.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
        const code = pre.querySelector('code')
        const isMermaid = Array.from(code?.classList || []).some((className) => className === 'language-mermaid')

        if (isMermaid || pre.closest('.mlp-code-block')) return

        const rawCode = code?.textContent || pre.textContent || ''
        const languageClass = Array.from(code?.classList || []).find((className) => className.startsWith('language-'))
        const language = languageClass?.replace('language-', '') || 'text'
        const figure = document.createElement('figure')
        const caption = document.createElement('figcaption')
        const label = document.createElement('span')
        const copyButton = document.createElement('button')

        figure.className = 'mlp-code-block'
        caption.className = 'mlp-code-caption'
        label.textContent = language
        copyButton.type = 'button'
        copyButton.className = 'mlp-code-copy'
        copyButton.textContent = 'Copy'
        copyButton.addEventListener('click', async () => {
          await copyToClipboard(rawCode)
          copyButton.textContent = 'Copied'
          window.setTimeout(() => {
            copyButton.textContent = 'Copy'
          }, 1200)
        })

        caption.append(label, copyButton)
        pre.replaceWith(figure)
        figure.append(caption, pre)
      })

      const mermaidBlocks = Array.from(article.querySelectorAll<HTMLElement>('pre > code.language-mermaid'))
      if (!mermaidBlocks.length) return

      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme === 'dark' ? 'dark' : 'default',
        })

        await Promise.all(
          mermaidBlocks.map(async (code, index) => {
            const pre = code.parentElement
            if (!pre || cancelled) return

            const chart = code.textContent || ''
            const wrapper = document.createElement('div')
            wrapper.className = 'mlp-mermaid mlp-mermaid-loading'
            wrapper.textContent = 'Rendering Mermaid diagram...'
            pre.replaceWith(wrapper)

            try {
              const id = `markdownlab-mermaid-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`
              const result = await mermaid.render(id, chart)
              if (cancelled) return
              wrapper.className = 'mlp-mermaid'
              wrapper.innerHTML = result.svg
            } catch (error) {
              if (cancelled) return
              wrapper.className = 'mlp-mermaid-error'
              wrapper.textContent = ''
              const title = document.createElement('strong')
              const detail = document.createElement('span')
              title.textContent = 'Mermaid diagram error'
              detail.textContent = error instanceof Error ? error.message : 'The diagram could not be rendered.'
              wrapper.append(title, detail)
            }
          }),
        )
      } catch (error) {
        console.error(error)
      }
    }

    enhancePreview()

    return () => {
      cancelled = true
    }
  }, [previewHtml, theme])

  const resetContent = useCallback(() => {
    setContent(starterMarkdown)
    editorViewRef.current?.focus?.()
    showToast('Reset to the MarkdownLab sample.', 'info')
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
      const html2canvasModule = await import('html2canvas')
      const jspdfModule = await import('jspdf')
      const html2canvas = html2canvasModule.default
      const JsPDF = jspdfModule.jsPDF

      const canvas = await html2canvas(target, {
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        scale: Math.max(1.5, Math.min(2, window.devicePixelRatio || 1)),
        useCORS: true,
        ignoreElements: (element) => element.classList?.contains('mlp-code-copy'),
      })

      const pdf = new JsPDF('p', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 32
      const printWidth = pageWidth - margin * 2
      const printHeight = pageHeight - margin * 2
      const sliceHeight = Math.floor((printHeight * canvas.width) / printWidth)
      let sourceY = 0
      let pageIndex = 0

      while (sourceY < canvas.height) {
        const currentSliceHeight = Math.min(sliceHeight, canvas.height - sourceY)
        const pageCanvas = document.createElement('canvas')
        const pageContext = pageCanvas.getContext('2d')

        if (!pageContext) {
          throw new Error('Could not create PDF canvas context.')
        }

        pageCanvas.width = canvas.width
        pageCanvas.height = currentSliceHeight
        pageContext.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          canvas.width,
          currentSliceHeight,
        )

        if (pageIndex > 0) {
          pdf.addPage()
        }

        const pageImageHeight = (currentSliceHeight * printWidth) / canvas.width
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, printWidth, pageImageHeight)
        sourceY += currentSliceHeight
        pageIndex += 1
      }

      pdf.save('markdownlab-preview.pdf')
      showToast('PDF exported.')
    } catch (error) {
      console.error(error)
      showToast('PDF export failed. Check console for details.', 'error')
    }
  }, [showToast, theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const splitStyle = { '--editor-size': `${splitPercent}%` } as CSSProperties
  const editorTheme = theme === 'dark' ? githubDark : githubLight

  return (
    <main className={classNames('mlp-shell', theme === 'dark' && 'is-dark')}>
      <header className="mlp-header">
        <div className="mlp-brand">
          <FileText size={24} />
          <div>
            <h1>MarkdownLab</h1>
            <p>VS Code-style Markdown editor + instant rendered preview</p>
          </div>
        </div>

        <nav className="mlp-toolbar" aria-label="MarkdownLab actions">
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

          <ToggleIconButton
            active={syncScroll}
            onClick={() => setSyncScroll((current) => !current)}
            title={syncScroll ? 'Disable sync scroll' : 'Enable sync scroll'}
          >
            <SplitSquareHorizontal size={17} />
          </ToggleIconButton>

          <ToggleIconButton
            active={theme === 'dark'}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
          </ToggleIconButton>
        </nav>
      </header>

      <section ref={splitRef} className="mlp-split" style={splitStyle} aria-label="Adjustable editor and preview split screen">
        <section className="mlp-pane mlp-editor-pane" aria-label="Markdown editor">
          <div className="mlp-pane-title">Markdown</div>
          <div className="mlp-editor-host">
            <CodeMirror
              value={content}
              onChange={(value) => setContent(value)}
              onCreateEditor={(view) => {
                editorViewRef.current = view
              }}
              onUpdate={(update: any) => {
                if (update.scrollChanged) {
                  handleEditorScroll()
                }
              }}
              extensions={[markdown()]}
              theme={editorTheme}
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
            />
          </div>
        </section>

        <button
          type="button"
          className="mlp-resizer"
          aria-label="Resize editor and preview panes"
          onPointerDown={(event) => {
            event.preventDefault()
            setIsDraggingSplit(true)
          }}
        >
          <span />
        </button>

        <section className="mlp-pane mlp-preview-pane" aria-label="Rendered preview">
          <div className="mlp-pane-title">Preview</div>
          <div className="mlp-preview-scroll" ref={previewScrollerRef} onScroll={handlePreviewScroll}>
            <article className="mlp-preview" ref={previewArticleRef}>
              {content.trim() ? (
                <div
                  key={`${theme}-${previewHtml}`}
                  className="mlp-preview-content"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
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
        <span>{Math.round(splitPercent)}% editor width</span>
        <span>saved locally in this browser</span>
        <a href="https://github.com/Aaroophan/MarkdownLab" target="_blank" rel="noreferrer">
          <Github size={14} /> GitHub
        </a>
      </footer>

      {toast && <div className={`mlp-toast is-${toast.tone}`}>{toast.message}</div>}
    </main>
  )
}
