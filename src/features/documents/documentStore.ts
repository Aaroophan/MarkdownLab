'use client'

import { create } from 'zustand'
import { MarkdownDocument, MarkdownLabSettings, MarkdownLabStorage } from './documentTypes'

const DEFAULT_SETTINGS: MarkdownLabSettings = {
  theme: 'dark',
  layoutMode: 'split',
  splitDirection: 'horizontal',
  panelRatio: 0.5,
  syncScroll: true,
  previewOnly: false,
  codeTheme: 'github-dark',
  exportTheme: 'light',
  rememberScroll: false,
}

export type DocumentStore = {
  documents: MarkdownDocument[]
  activeDocumentId: string | null
  settings: MarkdownLabSettings
  isSaved: boolean

  // Document actions
  createDocument: (title?: string) => string
  deleteDocument: (id: string) => void
  renameDocument: (id: string, newTitle: string) => void
  switchActiveDocument: (id: string) => void
  updateDocumentContent: (id: string, content: string) => void
  getActiveDocument: () => MarkdownDocument | null

  // Settings actions
  updateSettings: (settings: Partial<MarkdownLabSettings>) => void
  setTheme: (theme: 'dark' | 'light') => void
  setLayoutMode: (mode: 'split' | 'editor' | 'preview') => void
  setPanelRatio: (ratio: number) => void

  // Storage actions
  loadFromStorage: () => void
  saveToStorage: () => void
  clearAllData: () => void
  setDocumentSaved: (saved: boolean) => void

  // File actions
  importDocument: (title: string, content: string) => string
}

const generateId = () => Math.random().toString(36).substring(2, 11)

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeDocumentId: null,
  settings: DEFAULT_SETTINGS,
  isSaved: true,

  createDocument: (title = 'Untitled') => {
    const id = generateId()
    const now = new Date().toISOString()
    const newDoc: MarkdownDocument = {
      id,
      title,
      content: '',
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    }

    set((state) => ({
      documents: [...state.documents, newDoc],
      activeDocumentId: id,
      isSaved: false,
    }))

    return id
  },

  deleteDocument: (id: string) => {
    set((state) => {
      const remaining = state.documents.filter((d) => d.id !== id)
      let newActiveId = state.activeDocumentId

      if (state.activeDocumentId === id) {
        newActiveId = remaining.length > 0 ? remaining[0].id : null
      }

      return {
        documents: remaining,
        activeDocumentId: newActiveId,
        isSaved: false,
      }
    })
  },

  renameDocument: (id: string, newTitle: string) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, title: newTitle, updatedAt: new Date().toISOString() } : d
      ),
      isSaved: false,
    }))
  },

  switchActiveDocument: (id: string) => {
    set((state) => ({
      activeDocumentId: id,
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, lastOpenedAt: new Date().toISOString() } : d
      ),
    }))
  },

  updateDocumentContent: (id: string, content: string) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, content, updatedAt: new Date().toISOString() } : d
      ),
      isSaved: false,
    }))
  },

  getActiveDocument: () => {
    const state = get()
    return state.documents.find((d) => d.id === state.activeDocumentId) || null
  },

  updateSettings: (newSettings: Partial<MarkdownLabSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
      isSaved: false,
    }))
  },

  setTheme: (theme: 'dark' | 'light') => {
    set((state) => ({
      settings: { ...state.settings, theme },
      isSaved: false,
    }))
  },

  setLayoutMode: (mode: 'split' | 'editor' | 'preview') => {
    set((state) => ({
      settings: { ...state.settings, layoutMode: mode },
      isSaved: false,
    }))
  },

  setPanelRatio: (ratio: number) => {
    set((state) => ({
      settings: { ...state.settings, panelRatio: Math.max(0.2, Math.min(0.8, ratio)) },
    }))
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('markdownlab-storage')
      if (stored) {
        const data: MarkdownLabStorage = JSON.parse(stored)
        set({
          documents: data.documents || [],
          activeDocumentId: data.activeDocumentId,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          isSaved: true,
        })
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return

    try {
      const state = get()
      const storageData: MarkdownLabStorage = {
        version: 1,
        activeDocumentId: state.activeDocumentId,
        documents: state.documents,
        settings: state.settings,
      }
      localStorage.setItem('markdownlab-storage', JSON.stringify(storageData))
      set({ isSaved: true })
    } catch (error) {
      console.error('Failed to save to storage:', error)
    }
  },

  clearAllData: () => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('markdownlab-storage')
      set({
        documents: [],
        activeDocumentId: null,
        settings: DEFAULT_SETTINGS,
        isSaved: true,
      })
    } catch (error) {
      console.error('Failed to clear storage:', error)
    }
  },

  setDocumentSaved: (saved: boolean) => {
    set({ isSaved: saved })
  },

  importDocument: (title: string, content: string) => {
    const id = generateId()
    const now = new Date().toISOString()
    const newDoc: MarkdownDocument = {
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    }

    set((state) => ({
      documents: [...state.documents, newDoc],
      activeDocumentId: id,
      isSaved: false,
    }))

    return id
  },
}))
