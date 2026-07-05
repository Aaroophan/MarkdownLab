/**
 * Editor action utilities for inserting markdown elements
 */

export interface EditorState {
  content: string
  selectionStart: number
  selectionEnd: number
}

/**
 * Wraps selected text or inserts at cursor position
 */
export function wrapText(state: EditorState, before: string, after: string = before): EditorState {
  const { content, selectionStart, selectionEnd } = state

  if (selectionStart === selectionEnd) {
    // No selection - insert placeholder
    const newContent = content.slice(0, selectionStart) + before + 'text' + after + content.slice(selectionStart)
    return {
      content: newContent,
      selectionStart: selectionStart + before.length,
      selectionEnd: selectionStart + before.length + 4,
    }
  }

  // Selection exists - wrap it
  const selectedText = content.slice(selectionStart, selectionEnd)
  const newContent = content.slice(0, selectionStart) + before + selectedText + after + content.slice(selectionEnd)

  return {
    content: newContent,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + selectedText.length,
  }
}

/**
 * Insert text at cursor position
 */
export function insertText(state: EditorState, text: string): EditorState {
  const { content, selectionStart } = state
  const newContent = content.slice(0, selectionStart) + text + content.slice(selectionStart)

  return {
    content: newContent,
    selectionStart: selectionStart + text.length,
    selectionEnd: selectionStart + text.length,
  }
}

/**
 * Insert block element (heading, blockquote, code block, etc.)
 */
export function insertBlock(state: EditorState, block: string): EditorState {
  const { content, selectionStart } = state

  // Check if we need to add newlines
  const beforeEmpty = selectionStart === 0 || content[selectionStart - 1] === '\n'
  const afterEmpty = selectionStart === content.length || content[selectionStart] === '\n'

  const before = beforeEmpty ? '' : '\n'
  const after = afterEmpty ? '\n' : '\n\n'

  const newContent = content.slice(0, selectionStart) + before + block + after + content.slice(selectionStart)
  const newPosition = selectionStart + before.length + block.length + after.length

  return {
    content: newContent,
    selectionStart: newPosition,
    selectionEnd: newPosition,
  }
}

// Individual editor actions
export const editorActions = {
  bold: (state: EditorState) => wrapText(state, '**'),
  italic: (state: EditorState) => wrapText(state, '*'),
  strikethrough: (state: EditorState) => wrapText(state, '~~'),
  code: (state: EditorState) => wrapText(state, '`'),
  link: (state: EditorState) => {
    const { content, selectionStart, selectionEnd } = state
    const text = selectionStart === selectionEnd ? 'link text' : content.slice(selectionStart, selectionEnd)
    const markdown = `[${text}](url)`
    const before = selectionStart === 0 || content[selectionStart - 1] === '\n' ? '' : ' '
    const newContent = content.slice(0, selectionStart) + before + markdown + content.slice(selectionEnd)
    return {
      content: newContent,
      selectionStart: selectionStart + before.length + text.length + 2,
      selectionEnd: selectionStart + before.length + text.length + 5,
    }
  },
  image: (state: EditorState) => {
    const { content, selectionStart } = state
    const markdown = '![alt text](image-url)'
    const newContent = content.slice(0, selectionStart) + markdown + content.slice(selectionStart)
    return {
      content: newContent,
      selectionStart: selectionStart + 2,
      selectionEnd: selectionStart + 10,
    }
  },
  blockquote: (state: EditorState) =>
    insertBlock(state, '> Quote text'),
  unorderedList: (state: EditorState) =>
    insertBlock(state, '- Item 1\n- Item 2\n- Item 3'),
  orderedList: (state: EditorState) =>
    insertBlock(state, '1. Item 1\n2. Item 2\n3. Item 3'),
  taskList: (state: EditorState) =>
    insertBlock(state, '- [ ] Task 1\n- [ ] Task 2'),
  codeBlock: (state: EditorState) =>
    insertBlock(state, '```javascript\nconst code = "here";\n```'),
  mermaidBlock: (state: EditorState) =>
    insertBlock(state, '```mermaid\nflowchart TD\n    A[Start] --> B[End]\n```'),
  h1: (state: EditorState) => insertBlock(state, '# Heading 1'),
  h2: (state: EditorState) => insertBlock(state, '## Heading 2'),
  h3: (state: EditorState) => insertBlock(state, '### Heading 3'),
  table: (table: string) => (state: EditorState) =>
    insertBlock(state, table),
}

/**
 * Get current line number from cursor position
 */
export function getCursorLineNumber(content: string, position: number): number {
  return content.slice(0, position).split('\n').length
}

/**
 * Copy various formats to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Generate markdown table
 */
export function generateTable(rows: number, cols: number, hasHeader: boolean): string {
  let table = ''

  // Header row
  if (hasHeader) {
    const headerCells = Array(cols).fill('Header').map((h, i) => h + (i + 1))
    table += '| ' + headerCells.join(' | ') + ' |\n'
    table += '| ' + Array(cols).fill('---').join(' | ') + ' |\n'
  }

  // Data rows
  for (let i = 0; i < rows; i++) {
    const dataCells = Array(cols).fill('').map((_, j) => `Cell ${i + 1},${j + 1}`)
    table += '| ' + dataCells.join(' | ') + ' |\n'
  }

  return table.trim()
}
