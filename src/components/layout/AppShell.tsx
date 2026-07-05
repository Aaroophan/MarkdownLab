'use client'

import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { EditorView } from '@codemirror/view'
import {
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
import remarkMath from 'remark-math'
import remarkEmoji from 'remark-emoji'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'

const STORAGE_KEY = 'markdownlab:content:v4'
const SETTINGS_KEY = 'markdownlab:settings:v5'

const starterMarkdown = `# MarkdownLab

A VS Code-style Markdown editor with live preview, Mermaid diagrams, math, GFM extras, and safe HTML support.

## Common Markdown

### Text formatting

Plain paragraphs support **bold**, *italic*, ***bold italic***, ~~strikethrough~~, <u>underline</u>, \\*escaped characters\\*, inline code like \`const app = "MarkdownLab"\`, and hard line breaks.  
This line follows a two-space Markdown line break.

### Lists

- Apple
- Banana
  - Mango
  - Orange

1. First
2. Second
3. Third

- [x] Completed task
- [ ] Pending task

### Links, images, and references

[GitHub](https://github.com) and <https://example.com> both render as links.

[Reusable reference link][docs]

[docs]: https://www.markdownguide.org

![Markdown logo](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg)

### Blockquotes and alerts

> This is a quote.
>> This is a nested quote.

> [!NOTE]
> MarkdownLab supports GitHub-style alert blocks.

> [!TIP]
> Use the live preview while writing documentation.

> [!WARNING]
> Advanced Markdown features can vary between platforms.

### Tables

| Element | Status | Notes |
|:---|:---:|---:|
| Tables | Supported | Left aligned |
| Task lists | Supported | Center aligned |
| Numbers | 100 | Right aligned |

### Code blocks

\`\`\`python
print("Hello, World!")
\`\`\`

### Mermaid diagrams

\`\`\`mermaid
flowchart LR
  A[Write Markdown] --> B[Live Preview]
  B --> C[Mermaid Diagram]
  C --> D[Export PDF]
\`\`\`

### Footnotes

Markdown is useful for documentation.[^1]

[^1]: This is a footnote rendered through GitHub-Flavored Markdown.

### Definition lists and abbreviations

MarkdownLab
: A local-first Markdown document studio.

Preview
: The rendered output shown beside the editor.

*[HTML]: HyperText Markup Language
HTML abbreviation text gets a tooltip.

### Emoji, math, and HTML

Emoji shortcodes work: :rocket: :smile: :warning:

Inline math works: $E = mc^2$

Block math works:

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

<details>
<summary>Click to expand HTML content</summary>

<mark>Highlighted text</mark>, <kbd>Ctrl</kbd> + <kbd>K</kbd>, H<sub>2</sub>O, and x<sup>2</sup> are allowed.

</details>

---

MarkdownLab stays browser-only and static-hosting friendly.
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
    abbr: [
      ...(defaultSchema.attributes?.abbr || []),
      ['title'],
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', /^language-[A-Za-z0-9_-]+$/, 'math-inline', 'math-display'],
    ],
    details: [
      ...(defaultSchema.attributes?.details || []),
      ['open'],
    ],
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className'],
      ['dataLanguage'],
    ],
    input: [
      ...(defaultSchema.attributes?.input || []),
      ['type', 'checkbox'],
      ['checked'],
      ['disabled'],
    ],
    th: [
      ...(defaultSchema.attributes?.th || []),
      ['align'],
    ],
    td: [
      ...(defaultSchema.attributes?.td || []),
      ['align'],
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'abbr',
    'dd',
    'details',
    'dl',
    'dt',
    'input',
    'kbd',
    'mark',
    'sub',
    'summary',
    'sup',
    'u',
  ],
} as Parameters<typeof rehypeSanitize>[0]

function readSettings(): PersistedSettings {
  if (typeof window === 'undefined') {
    return { theme: 'light', syncScroll: true, splitPercent: 50 }
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return { theme: 'light', syncScroll: true, splitPercent: 50 }

    const parsed = JSON.parse(saved) as Partial<PersistedSettings>
    const splitPercent = typeof parsed.splitPercent === 'number' ? parsed.splitPercent : 50

    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      syncScroll: typeof parsed.syncScroll === 'boolean' ? parsed.syncScroll : true,
      splitPercent: Math.min(75, Math.max(25, splitPercent)),
    }
  } catch {
    return { theme: 'light', syncScroll: true, splitPercent: 50 }
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


type HastElement = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastElement[]
  value?: string
  position?: {
    start?: {
      line?: number
    }
  }
}

function visitHast(node: HastElement, visitor: (node: HastElement, parent: HastElement | null, index: number | null) => void, parent: HastElement | null = null, index: number | null = null) {
  visitor(node, parent, index)

  if (!Array.isArray(node.children)) return

  node.children.forEach((child, childIndex) => {
    visitHast(child, visitor, node, childIndex)
  })
}

function getHastText(node: HastElement): string {
  if (typeof node.value === 'string') return node.value
  if (!Array.isArray(node.children)) return ''
  return node.children.map((child) => getHastText(child)).join('')
}

function getClassNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean)
  return []
}

type AbbreviationDefinition = {
  term: string
  title: string
}

const alertLabels: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractAbbreviations(markdownSource: string) {
  const abbreviations: AbbreviationDefinition[] = []
  const source = markdownSource.replace(/^\*\[([^\]]+)\]:\s*(.+)$/gm, (_match, term: string, title: string) => {
    abbreviations.push({ term: term.trim(), title: title.trim() })
    return ''
  })

  return { source, abbreviations }
}

function convertDefinitionLists(markdownSource: string) {
  const lines = markdownSource.split('\n')
  const output: string[] = []
  let inFence = false
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence
      output.push(line)
      index += 1
      continue
    }

    if (!inFence && trimmed && lines[index + 1]?.trimStart().startsWith(': ')) {
      output.push('<dl>')

      while (index < lines.length) {
        const term = lines[index]?.trim()
        if (!term || !lines[index + 1]?.trimStart().startsWith(': ')) break

        output.push(`<dt>${escapeHtml(term)}</dt>`)
        index += 1

        while (index < lines.length && lines[index].trimStart().startsWith(': ')) {
          const definition = lines[index].trimStart().slice(2).trim()
          output.push(`<dd>${escapeHtml(definition)}</dd>`)
          index += 1
        }

        if (!lines[index]?.trim() || !lines[index + 1]?.trimStart().startsWith(': ')) break
      }

      output.push('</dl>')
      continue
    }

    output.push(line)
    index += 1
  }

  return output.join('\n')
}

function stripAlertMarker(node: HastElement, type: string) {
  const pattern = new RegExp(`^\\s*\\[!${type}\\]\\s*`, 'i')
  let stripped = false

  visitHast(node, (child, parent, index) => {
    if (stripped || child.type !== 'text' || typeof child.value !== 'string') return

    child.value = child.value.replace(pattern, '')
    stripped = true

    if (child.value === '' && parent && index !== null && Array.isArray(parent.children)) {
      parent.children.splice(index, 1)
    }
  })
}

function transformAlert(node: HastElement) {
  if (node.tagName !== 'blockquote' || !Array.isArray(node.children)) return

  const text = getHastText(node).trimStart()
  const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.exec(text)
  if (!match) return

  const type = match[1].toLowerCase()
  stripAlertMarker(node, type)

  node.tagName = 'div'
  node.properties = {
    ...node.properties,
    className: ['mlp-alert', `mlp-alert-${type}`],
  }
  node.children = [
    {
      type: 'element',
      tagName: 'div',
      properties: { className: ['mlp-alert-title'] },
      children: [{ type: 'text', value: alertLabels[type] || type }],
    },
    ...node.children,
  ]
}

function applyAbbreviations(node: HastElement, parent: HastElement | null, index: number | null, abbreviations: AbbreviationDefinition[]) {
  if (!abbreviations.length || node.type !== 'text' || typeof node.value !== 'string') return
  if (!parent || index === null || !Array.isArray(parent.children)) return
  if (parent.tagName && ['a', 'abbr', 'code', 'kbd', 'pre'].includes(parent.tagName)) return

  const sorted = [...abbreviations].sort((a, b) => b.term.length - a.term.length)
  const pattern = new RegExp(`\\b(${sorted.map((item) => escapeRegExp(item.term)).join('|')})\\b`, 'g')
  const parts: HastElement[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(node.value))) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) })
    }

    const term = match[0]
    const definition = sorted.find((item) => item.term === term)
    parts.push({
      type: 'element',
      tagName: 'abbr',
      properties: { title: definition?.title || term },
      children: [{ type: 'text', value: term }],
    })
    lastIndex = match.index + term.length
  }

  if (!parts.length) return

  if (lastIndex < node.value.length) {
    parts.push({ type: 'text', value: node.value.slice(lastIndex) })
  }

  parent.children.splice(index, 1, ...parts)
}

function enhanceHastForPreview(abbreviations: AbbreviationDefinition[] = []) {
  return (tree: HastElement) => {
    visitHast(tree, (node, parent, index) => {
      if (node.type === 'text') {
        applyAbbreviations(node, parent, index, abbreviations)
        return
      }

      if (node.type !== 'element') return

      const sourceLine = node.position?.start?.line

      if (typeof sourceLine === 'number') {
        node.properties = {
          ...node.properties,
          dataSourceLine: String(sourceLine),
        }
      }

      transformAlert(node)

      if (node.tagName !== 'pre' || !Array.isArray(node.children)) return

      const code = node.children.find((child) => child.type === 'element' && child.tagName === 'code')
      const classNames = getClassNames(code?.properties?.className)
      const isMermaid = classNames.includes('language-mermaid')

      if (!isMermaid || !parent || index === null || !Array.isArray(parent.children)) return

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['mlp-mermaid-source'],
          dataSourceLine: String(sourceLine ?? code?.position?.start?.line ?? ''),
        },
        children: [
          {
            type: 'text',
            value: getHastText(code || node),
          },
        ],
      }
    })
  }
}

async function renderMarkdown(markdownSource: string) {
  const { source, abbreviations } = extractAbbreviations(markdownSource)
  const normalizedSource = convertDefinitionLists(source)

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkEmoji)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, markdownSchema)
    .use(enhanceHastForPreview, abbreviations)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(normalizedSource)

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

function getVisibleEditorLine(editorView: any, editor: HTMLElement) {
  try {
    const block = editorView.lineBlockAtHeight(editor.scrollTop + editor.clientHeight * 0.08)
    return editorView.state.doc.lineAt(block.from).number
  } catch {
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 24
    return Math.max(1, Math.round(editor.scrollTop / lineHeight) + 1)
  }
}

function getPreviewBlocks(article: HTMLElement) {
  return Array.from(article.querySelectorAll<HTMLElement>('[data-source-line]'))
    .map((element) => ({
      element,
      line: Number(element.dataset.sourceLine),
    }))
    .filter((item) => Number.isFinite(item.line) && item.line > 0)
    .sort((a, b) => a.line - b.line)
}

function findPreviewBlockForLine(article: HTMLElement, line: number) {
  const blocks = getPreviewBlocks(article)
  if (!blocks.length) return null

  let best = blocks[0]
  for (const block of blocks) {
    if (block.line > line) break
    best = block
  }

  return best.element
}

function getTopVisiblePreviewLine(article: HTMLElement, preview: HTMLElement) {
  const blocks = getPreviewBlocks(article)
  if (!blocks.length) return null

  const previewRect = preview.getBoundingClientRect()
  const anchorTop = previewRect.top + preview.clientHeight * 0.08
  let best = blocks[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (const block of blocks) {
    const rect = block.element.getBoundingClientRect()
    const distance = Math.abs(rect.top - anchorTop)

    if (rect.bottom >= previewRect.top && distance < bestDistance) {
      best = block
      bestDistance = distance
    }
  }

  return best.line
}

function scrollPreviewElementIntoSync(preview: HTMLElement, element: HTMLElement) {
  const previewRect = preview.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  const nextTop = preview.scrollTop + elementRect.top - previewRect.top - preview.clientHeight * 0.08
  preview.scrollTop = Math.max(0, nextTop)
}

function scrollEditorToLine(editorView: any, editor: HTMLElement, line: number) {
  try {
    const docLine = editorView.state.doc.line(Math.max(1, Math.min(line, editorView.state.doc.lines)))
    const block = editorView.lineBlockAt(docLine.from)
    editor.scrollTop = Math.max(0, block.top - editor.clientHeight * 0.08)
  } catch {
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 24
    editor.scrollTop = Math.max(0, (line - 1) * lineHeight - editor.clientHeight * 0.08)
  }
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
  const syncScrollRef = useRef(syncScroll)

  const words = useMemo(() => getWordCount(content), [content])
  const chars = content.length

  const showToast = useCallback((message: string, tone: NonNullable<ToastState>['tone'] = 'success') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    syncScrollRef.current = syncScroll
  }, [syncScroll])

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
    if (!syncScrollRef.current || scrollSourceRef.current === 'preview') return

    const editor = getEditorScrollElement(editorViewRef.current)
    const preview = previewScrollerRef.current
    const article = previewArticleRef.current
    if (!editor || !preview || !article) return

    const sourceLine = getVisibleEditorLine(editorViewRef.current, editor)
    const target = findPreviewBlockForLine(article, sourceLine)
    if (!target) return

    scrollSourceRef.current = 'editor'
    scrollPreviewElementIntoSync(preview, target)
    releaseScrollSource()
  }, [releaseScrollSource])

  const handlePreviewScroll = useCallback(() => {
    if (!syncScrollRef.current || scrollSourceRef.current === 'editor') return

    const editor = getEditorScrollElement(editorViewRef.current)
    const preview = previewScrollerRef.current
    const article = previewArticleRef.current
    if (!editor || !preview || !article) return

    const sourceLine = getTopVisiblePreviewLine(article, preview)
    if (!sourceLine) return

    scrollSourceRef.current = 'preview'
    scrollEditorToLine(editorViewRef.current, editor, sourceLine)
    releaseScrollSource()
  }, [releaseScrollSource])

  const editorScrollExtension = useMemo(() => {
    return EditorView.domEventHandlers({
      scroll: () => {
        window.requestAnimationFrame(handleEditorScroll)
      },
    })
  }, [handleEditorScroll])

  const editorExtensions = useMemo(() => {
    return [markdown(), EditorView.lineWrapping, editorScrollExtension]
  }, [editorScrollExtension])

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
      if (!article || cancelled) return

      article.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
        link.target = '_blank'
        link.rel = 'noreferrer'
      })

      article.querySelectorAll<HTMLPreElement>('pre').forEach((pre) => {
        if (pre.closest('.mlp-code-block') || pre.closest('.mlp-mermaid') || pre.closest('.mlp-mermaid-error')) {
          return
        }

        const code = pre.querySelector('code')
        const isMermaid = Array.from(code?.classList || []).some((className) => className === 'language-mermaid')

        if (isMermaid) return

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

      const mermaidBlocks = Array.from(article.querySelectorAll<HTMLElement>('.mlp-mermaid-source'))
      if (!mermaidBlocks.length) return

      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          darkMode: theme === 'dark',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          themeVariables:
            theme === 'dark'
              ? {
                  background: '#111827',
                  mainBkg: '#bfdbfe',
                  primaryColor: '#bfdbfe',
                  primaryBorderColor: '#60a5fa',
                  primaryTextColor: '#0f172a',
                  secondaryColor: '#bbf7d0',
                  secondaryBorderColor: '#22c55e',
                  secondaryTextColor: '#052e16',
                  tertiaryColor: '#fecdd3',
                  tertiaryBorderColor: '#fb7185',
                  tertiaryTextColor: '#450a0a',
                  clusterBkg: '#1e293b',
                  clusterBorder: '#94a3b8',
                  lineColor: '#e0f2fe',
                  textColor: '#f8fafc',
                  titleColor: '#f8fafc',
                  nodeTextColor: '#0f172a',
                  edgeLabelBackground: '#0f172a',
                  labelTextColor: '#f8fafc',
                  labelBackground: '#0f172a',
                  actorBkg: '#bfdbfe',
                  actorBorder: '#60a5fa',
                  actorTextColor: '#0f172a',
                  noteBkgColor: '#fef3c7',
                  noteTextColor: '#111827',
                  noteBorderColor: '#f59e0b',
                }
              : {
                  background: '#ffffff',
                  mainBkg: '#eff6ff',
                  primaryColor: '#eff6ff',
                  primaryBorderColor: '#2563eb',
                  primaryTextColor: '#111827',
                  secondaryColor: '#dcfce7',
                  secondaryBorderColor: '#16a34a',
                  secondaryTextColor: '#052e16',
                  tertiaryColor: '#fef3c7',
                  tertiaryBorderColor: '#d97706',
                  tertiaryTextColor: '#451a03',
                  clusterBkg: '#f8fafc',
                  clusterBorder: '#94a3b8',
                  lineColor: '#1d4ed8',
                  textColor: '#111827',
                  titleColor: '#111827',
                  nodeTextColor: '#111827',
                  edgeLabelBackground: '#ffffff',
                  labelTextColor: '#111827',
                },
        })

        await Promise.all(
          mermaidBlocks.map(async (source, index) => {
            if (cancelled) return

            const chart = source.textContent || ''
            const sourceLine = source.dataset.sourceLine
            const wrapper = document.createElement('div')
            wrapper.className = 'mlp-mermaid mlp-mermaid-loading'
            if (sourceLine) wrapper.dataset.sourceLine = sourceLine
            wrapper.textContent = 'Rendering Mermaid diagram...'
            source.replaceWith(wrapper)

            if (!chart.trim()) {
              wrapper.className = 'mlp-mermaid-error'
              wrapper.textContent = 'Mermaid diagram is empty.'
              return
            }

            try {
              const id = `markdownlab-mermaid-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`
              const result = await mermaid.render(id, chart)
              if (cancelled) return

              wrapper.className = 'mlp-mermaid'
              if (sourceLine) wrapper.dataset.sourceLine = sourceLine
              wrapper.innerHTML = result.svg

              const svg = wrapper.querySelector('svg')
              if (svg) {
                svg.setAttribute('role', 'img')
                svg.setAttribute('aria-label', 'Rendered Mermaid diagram')
                svg.removeAttribute('height')
                svg.style.maxWidth = '100%'
                svg.style.height = 'auto'
              }
            } catch (error) {
              if (cancelled) return
              wrapper.className = 'mlp-mermaid-error'
              if (sourceLine) wrapper.dataset.sourceLine = sourceLine
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

    const frame = window.requestAnimationFrame(() => {
      void enhancePreview().then(() => {
        if (!cancelled && syncScrollRef.current) {
          window.requestAnimationFrame(handleEditorScroll)
        }
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [previewHtml, theme, handleEditorScroll])

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
                window.requestAnimationFrame(handleEditorScroll)
              }}
              extensions={editorExtensions}
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
