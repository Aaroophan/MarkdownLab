'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface ToastProps {
  message: string
  duration?: number
  isVisible: boolean
}

export default function Toast({ message, duration = 2000, isVisible }: ToastProps) {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    setShow(isVisible)
    if (isVisible) {
      const timer = setTimeout(() => setShow(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground shadow-lg">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  const showToast = (msg: string) => {
    setMessage(msg)
    setIsVisible(true)
  }

  return { message, isVisible, showToast }
}
