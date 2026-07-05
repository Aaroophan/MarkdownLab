'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareLink?: string
  isLoading?: boolean
  error?: string
}

export default function ShareModal({ isOpen, onClose, shareLink, isLoading, error }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  if (!isOpen) return null

  const handleCopy = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">Share Document</h2>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded flex gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          </div>
        )}

        {!isLoading && shareLink && !error && (
          <>
            <p className="text-sm text-foreground/70 mb-4">
              Compressed encrypted URL sharing. Anyone with this link can open the document.
            </p>

            <div className="bg-muted p-3 rounded mb-4 break-all text-xs font-mono max-h-24 overflow-auto">
              {shareLink}
            </div>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Share Link
                </>
              )}
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 px-4 py-2 border border-border rounded hover:bg-muted transition-colors"
        >
          {isLoading ? 'Wait...' : 'Close'}
        </button>
      </div>
    </div>
  )
}
