import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

/**
 * Markdown rendering pipeline using unified + remark + rehype
 * Supports GitHub Flavored Markdown, tables, math, and more
 */

// Custom sanitization config that allows more HTML but prevents script injection
const customSanitizeConfig = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      'className',
    ],
    pre: [
      ...(defaultSchema.attributes?.pre || []),
      'className',
    ],
  },
}

/**
 * Process markdown content through the rendering pipeline
 * Returns HTML string safe for display
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSanitize, customSanitizeConfig)
      .use(rehypeStringify)

    const file = await processor.process(markdown)
    return String(file)
  } catch (error) {
    console.error('[v0] Markdown rendering error:', error)
    // Fallback: return escaped content on error
    return `<pre>${escapeHtml(markdown)}</pre>`
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
