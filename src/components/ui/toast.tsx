'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastTone = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextType {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

const TONE_STYLE: Record<ToastTone, { bg: string; border: string; color: string }> = {
  error: {
    bg: 'oklch(0.65 0.22 25 / 14%)',
    border: 'oklch(0.65 0.22 25 / 30%)',
    color: 'oklch(0.72 0.2 25)',
  },
  success: {
    bg: 'oklch(0.55 0.14 160 / 16%)',
    border: 'oklch(0.55 0.14 160 / 32%)',
    color: 'oklch(0.78 0.15 160)',
  },
  info: {
    bg: 'oklch(0.72 0.13 200 / 14%)',
    border: 'oklch(0.72 0.13 200 / 30%)',
    color: 'oklch(0.8 0.13 200)',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++
    setItems((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-24 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
        aria-live="polite"
      >
        {items.map((t) => {
          const s = TONE_STYLE[t.tone]
          return (
            <div
              key={t.id}
              role="status"
              className="w-full max-w-sm rounded-xl px-4 py-3 text-sm text-center font-medium animate-fade-up pointer-events-auto"
              style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 8px 24px var(--c-shadow-lg)',
              }}
            >
              {t.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
