export type MarkdownDocument = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
}

export type MarkdownHereSettings = {
  theme: 'dark' | 'light'
  layoutMode: 'split' | 'editor' | 'preview'
  splitDirection: 'horizontal'
  panelRatio: number
  syncScroll: boolean
  previewOnly: boolean
  codeTheme: 'github-dark'
  exportTheme: 'light'
  rememberScroll: boolean
}

export type MarkdownHereStorage = {
  version: number
  activeDocumentId: string | null
  documents: MarkdownDocument[]
  settings: MarkdownHereSettings
}
