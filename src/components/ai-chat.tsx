'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { useLang } from '@/lib/lang'
import type { Profile } from '@/types'

interface Message {
  role: 'user' | 'model'
  content: string
}

export function AiChatPanel({
  profile,
  open,
  onClose,
}: {
  profile: Profile
  open: boolean
  onClose: () => void
}) {
  const { isRTL } = useLang()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setInput('')
    setLoading(true)
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            name: profile.full_name,
            xp: profile.xp,
            streak: profile.current_streak,
          },
        }),
      })
      const data = await res.json()
      setMessages([
        ...newMessages,
        {
          role: 'model',
          content: data.reply ?? data.error ?? (isRTL ? 'שגיאה — נסה שוב' : 'Error — try again'),
        },
      ])
    } catch {
      setMessages([
        ...newMessages,
        { role: 'model', content: isRTL ? 'שגיאה — נסה שוב' : 'Error — try again' },
      ])
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-16 left-4 right-4 z-50 animate-fade-up">
        <div
          className="rounded-3xl flex flex-col shadow-2xl overflow-hidden"
          style={{
            background: 'var(--c-fab-sheet)',
            border: '1px solid var(--c-border)',
            height: '62vh',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--c-border)' }}
          >
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'מאמן AI' : 'AI Coach'}
            </span>
            <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" dir="ltr">
            {messages.length === 0 && (
              <p className="text-center text-sm pt-4" dir="auto" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL
                  ? `שלום ${profile.full_name ?? 'רותם'} 👋 מה בדעתך לשאול?`
                  : `Hi ${profile.full_name ?? 'Rotem'} 👋 What's on your mind?`}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  dir="auto"
                  className="max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--brand-gradient)', color: 'white' }
                      : {
                          background: 'var(--secondary)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--c-border)',
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2 rounded-2xl text-sm"
                  style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
                >
                  ···
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t shrink-0" style={{ borderColor: 'var(--c-border)' }}>
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={isRTL ? 'שאל אותי משהו...' : 'Ask me anything...'}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--ring)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
                style={{ background: 'var(--brand-gradient)' }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
