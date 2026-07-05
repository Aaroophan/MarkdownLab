/**
 * Helper to get rendered HTML from the preview panel
 */
export function getPreviewHtml(): string | null {
  const previewContainer = document.querySelector('[class*="prose"]')
  if (!previewContainer) {
    return null
  }

  return previewContainer.innerHTML
}

/**
 * Helper to render Mermaid diagrams before export
 */
export async function ensureMermaidRendered(): Promise<void> {
  if (typeof window !== 'undefined' && typeof (window as any).mermaid !== 'undefined') {
    try {
      const mermaid = (window as any).mermaid
      if (mermaid.contentLoaded) {
        await mermaid.contentLoaded()
      }
      if (mermaid.run) {
        await mermaid.run()
      }
    } catch (error) {
      console.warn('[v0] Mermaid rendering issue:', error)
    }
  }
}
