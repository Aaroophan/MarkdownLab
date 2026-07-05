export type MarkdownDocument = {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
}

export type MarkdownLabSettings = {
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

export type MarkdownLabStorage = {
  version: number
  activeDocumentId: string | null
  documents: MarkdownDocument[]
  settings: MarkdownLabSettings
}
