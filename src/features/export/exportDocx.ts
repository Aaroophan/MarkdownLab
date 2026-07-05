import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableCell,
  TableRow,
} from 'docx'
import { saveAs } from 'file-saver'
import { getFilename } from './fileName'
import type { ExportOptions, ExportResult } from './exportTypes'

interface ParsedElement {
  type: string
  content?: string
  html?: string
  children?: ParsedElement[]
  level?: number
  tag?: string
  className?: string
}

export async function exportDocx(options: ExportOptions): Promise<ExportResult> {
  try {
    const { title, htmlContent } = options

    if (!htmlContent) {
      throw new Error('HTML content is required for DOCX export')
    }

    const filename = getFilename(title, 'docx')

    // Parse HTML into elements
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const elements = parseHtmlToDocxElements(doc.body)

    // Create document
    const docxDocument = new Document({
      sections: [
        {
          children: [
            // Add title
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 },
            }),
            // Add content
            ...elements,
          ],
        },
      ],
    })

    // Generate and save
    const blob = await Packer.toBlob(docxDocument)
    saveAs(blob, filename)

    return {
      success: true,
      format: 'docx',
      filename,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] DOCX export failed:', error)
    return {
      success: false,
      format: 'docx',
      filename: '',
      error: errorMessage,
    }
  }
}

function parseHtmlToDocxElements(element: Element): Array<Paragraph | Table> {
  const elements: Array<Paragraph | Table> = []
  const children = Array.from(element.children)

  for (const child of children) {
    const tag = child.tagName.toLowerCase()

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      const level = parseInt(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6
      const headingLevels: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      }

      elements.push(
        new Paragraph({
          text: child.textContent || '',
          heading: headingLevels[level],
          spacing: { before: 200, after: 200 },
        })
      )
    } else if (tag === 'p') {
      elements.push(
        new Paragraph({
          children: parseInlineContent(child),
          spacing: { after: 200 },
        })
      )
    } else if (tag === 'blockquote') {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: child.textContent || '', italics: true })],
          spacing: { before: 200, after: 200 },
        })
      )
    } else if (tag === 'ul' || tag === 'ol') {
      // Convert list items to paragraphs with indentation
      const items = Array.from(child.querySelectorAll(':scope > li'))
      items.forEach((li) => {
        elements.push(
          new Paragraph({
            text: (tag === 'ol' ? '• ' : '• ') + (li.textContent || ''),
            spacing: { after: 100 },
          })
        )
      })
    } else if (tag === 'pre' || tag === 'code') {
      elements.push(
        new Paragraph({
          text: child.textContent || '',
          spacing: { before: 200, after: 200 },
          shading: {
            type: 'clear',
            color: 'f9fafb',
          },
        })
      )
    } else if (tag === 'table') {
      const rows = Array.from(child.querySelectorAll('tr')).map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td, th')).map(
          (td) =>
            new TableCell({
              children: [new Paragraph({ text: td.textContent || '' })],
            })
        )
        return new TableRow({ children: cells })
      })
      elements.push(new Table({ rows, width: { size: 100, type: 'pct' } }))
    } else if (child.children.length > 0) {
      // Recursively process nested elements
      elements.push(...parseHtmlToDocxElements(child))
    }
  }

  return elements
}

function parseInlineContent(element: Element): (TextRun | Paragraph)[] {
  const children: (TextRun | Paragraph)[] = []

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        children.push(new TextRun(node.textContent))
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      const tag = el.tagName.toLowerCase()

      if (tag === 'strong' || tag === 'b') {
        children.push(new TextRun({ text: el.textContent || '', bold: true }))
      } else if (tag === 'em' || tag === 'i') {
        children.push(new TextRun({ text: el.textContent || '', italics: true }))
      } else if (tag === 'a') {
        children.push(new TextRun({ text: el.textContent || '', underline: {} }))
      } else if (tag === 'code') {
        children.push(
          new TextRun({
            text: el.textContent || '',
            font: 'Courier New',
            color: '1f2937',
          })
        )
      } else {
        children.push(...parseInlineContent(el))
      }
    }
  }

  return children
}
