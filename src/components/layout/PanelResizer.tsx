'use client'

import { useRef, useEffect, useState } from 'react'
import { useDocumentStore } from '@/features/documents/documentStore'

interface PanelResizerProps {
  minRatio?: number
  maxRatio?: number
}

export default function PanelResizer({ minRatio = 0.2, maxRatio = 0.8 }: PanelResizerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const resizerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const setPanelRatio = useDocumentStore((state) => state.setPanelRatio)
  const panelRatio = useDocumentStore((state) => state.settings.panelRatio)
  const saveToStorage = useDocumentStore((state) => state.saveToStorage)

  useEffect(() => {
    const handleMouseDown = () => {
      setIsDragging(true)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      saveToStorage()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const newRatio = (e.clientX - rect.left) / rect.width

      if (newRatio >= minRatio && newRatio <= maxRatio) {
        setPanelRatio(newRatio)
      }
    }

    const resizer = resizerRef.current
    if (resizer) {
      resizer.addEventListener('mousedown', handleMouseDown)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = 'auto'
        document.body.style.cursor = 'auto'
      }
    }

    return () => {
      if (resizer) {
        resizer.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [isDragging, minRatio, maxRatio, setPanelRatio, saveToStorage])

  return (
    <div
      ref={resizerRef}
      className={`w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize ${
        isDragging ? 'bg-primary/80' : ''
      }`}
      style={{
        userSelect: 'none',
      }}
    />
  )
}
