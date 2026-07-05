/**
 * Sync scroll between editor and preview
 * Attaches line number metadata to preview blocks during rendering
 */

export interface SyncScrollConfig {
  editorElement: HTMLElement | null
  previewElement: HTMLElement | null
  enabled: boolean
}

export class SyncScrollManager {
  private editorElement: HTMLElement | null = null
  private previewElement: HTMLElement | null = null
  private enabled = false
  private activeScrollSource: 'editor' | 'preview' | null = null
  private scrollLockTimeout: NodeJS.Timeout | null = null
  private readonly LOCK_DURATION = 100 // ms

  constructor(config: SyncScrollConfig) {
    this.editorElement = config.editorElement
    this.previewElement = config.previewElement
    this.enabled = config.enabled
  }

  /**
   * Enable sync scroll with listeners
   */
  enableSync() {
    if (!this.enabled || !this.editorElement || !this.previewElement) return

    this.editorElement.addEventListener('scroll', this.handleEditorScroll.bind(this))
    this.previewElement.addEventListener('scroll', this.handlePreviewScroll.bind(this))
  }

  /**
   * Disable sync scroll and remove listeners
   */
  disableSync() {
    if (!this.editorElement || !this.previewElement) return

    this.editorElement.removeEventListener('scroll', this.handleEditorScroll.bind(this))
    this.previewElement.removeEventListener('scroll', this.handlePreviewScroll.bind(this))
  }

  /**
   * Handle editor scroll - sync to preview
   */
  private handleEditorScroll() {
    if (this.activeScrollSource === 'preview' || !this.enabled) return

    this.setScrollSource('editor')
    this.syncEditorToPreview()
  }

  /**
   * Handle preview scroll - sync to editor
   */
  private handlePreviewScroll() {
    if (this.activeScrollSource === 'editor' || !this.enabled) return

    this.setScrollSource('preview')
    this.syncPreviewToEditor()
  }

  /**
   * Sync editor scroll position to preview
   */
  private syncEditorToPreview() {
    if (!this.editorElement || !this.previewElement) return

    const editorScrollRatio = this.editorElement.scrollTop / this.editorElement.scrollHeight
    const previewScrollTop = editorScrollRatio * this.previewElement.scrollHeight

    this.previewElement.scrollTop = previewScrollTop
  }

  /**
   * Sync preview scroll position to editor
   */
  private syncPreviewToEditor() {
    if (!this.editorElement || !this.previewElement) return

    const previewScrollRatio = this.previewElement.scrollTop / this.previewElement.scrollHeight
    const editorScrollTop = previewScrollRatio * this.editorElement.scrollHeight

    this.editorElement.scrollTop = editorScrollTop
  }

  /**
   * Set active scroll source and lock it briefly
   */
  private setScrollSource(source: 'editor' | 'preview' | null) {
    this.activeScrollSource = source

    if (this.scrollLockTimeout) {
      clearTimeout(this.scrollLockTimeout)
    }

    this.scrollLockTimeout = setTimeout(() => {
      this.activeScrollSource = null
      this.scrollLockTimeout = null
    }, this.LOCK_DURATION)
  }

  /**
   * Update sync enabled state
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (enabled) {
      this.enableSync()
    } else {
      this.disableSync()
    }
  }

  /**
   * Update elements
   */
  setElements(editorElement: HTMLElement | null, previewElement: HTMLElement | null) {
    this.editorElement = editorElement
    this.previewElement = previewElement
  }

  /**
   * Cleanup
   */
  destroy() {
    this.disableSync()
    if (this.scrollLockTimeout) {
      clearTimeout(this.scrollLockTimeout)
    }
  }
}

/**
 * Create data attributes for matching editor lines to preview elements
 * This should be called during markdown rendering
 */
export function attachLineNumbers(element: HTMLElement) {
  let lineNumber = 1

  const walk = (node: Node) => {
    if (node.nodeType === 1) {
      // Element node
      const el = node as HTMLElement
      const block = el.querySelector('[data-source-line]')

      if (!block) {
        el.setAttribute('data-source-line', String(lineNumber))
      }

      node.childNodes.forEach(walk)

      if (el.tagName.match(/^H[1-6]$|P|LI|BLOCKQUOTE|PRE|TABLE/i)) {
        lineNumber++
      }
    } else if (node.nodeType === 3) {
      // Text node - count newlines
      const text = node.textContent || ''
      lineNumber += (text.match(/\n/g) || []).length
    }
  }

  walk(element)
}
