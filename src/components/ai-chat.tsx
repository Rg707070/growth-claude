'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send } from 'lucide-react'
import { useLang } from '@/lib/lang'
import type { Profile } from '@/types'

interface Message {
  role: 'user' | 'model'
  content: string
}

export function AiChat({ profile }: { profile: Profile }) {
  const { isRTL } = useLang()
  const [open, setOpen] = useState(false)
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
      setMessages([...newMessages, { role: 'model', content: data.reply ?? (isRTL ? 'שגיאה — נסה שוב' : 'Error — try again') }])
    } catch {
      setMessages([...newMessages, { role: 'model', content: isRTL ? 'שגיאה — נסה שוב' : 'Error — try again' }])
    }
    setLoading(false)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden animate-fade-up">
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
              <div className="flex items-center gap-2">
                <Bot size={18} style={{ color: 'var(--brand-primary)' }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                  {isRTL ? 'מאמן AI' : 'AI Coach'}
                </span>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm pt-4" style={{ color: 'var(--muted-foreground)' }}>
                  {isRTL ? `שלום ${profile.full_name ?? 'רותם'} 👋 מה בדעתך לשאול?` : `Hi ${profile.full_name ?? 'Rotem'} 👋 What's on your mind?`}
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
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
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 z-50 w-14 h-14 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all md:hidden"
        style={{
          insetInlineStart: '1.25rem',
          background: 'linear-gradient(135deg, oklch(0.55 0.22 270), oklch(0.65 0.18 290))',
          boxShadow: '0 6px 20px oklch(0.55 0.22 270 / 40%)',
        }}
        aria-label={isRTL ? 'מאמן AI' : 'AI Coach'}
      >
        <Bot size={24} />
      </button>
    </>
  )
}
