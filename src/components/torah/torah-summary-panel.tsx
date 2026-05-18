'use client'

import { useState, useEffect } from 'react'
import { Save, ExternalLink, Loader2, Check, Link } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TORAH_COLOR = '#0f766e'

interface Props {
  userId: string
  defaultTitle: string
}

type SaveState = 'idle' | 'saving' | 'done'

export function TorahSummaryPanel({ userId, defaultTitle }: Props) {
  const supabase = createClient()
  const [title, setTitle] = useState(defaultTitle)
  const [content, setContent] = useState('')
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [appSave, setAppSave] = useState<SaveState>('idle')
  const [googleSave, setGoogleSave] = useState<SaveState>('idle')
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/google/docs')
      .then((r) => r.json())
      .then((d) => setIsGoogleConnected(d.connected))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setTitle(defaultTitle)
  }, [defaultTitle])

  async function saveToApp() {
    if (!title.trim() || !content.trim()) return
    setAppSave('saving')
    await supabase.from('learning_summaries').insert({
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      source: defaultTitle,
      folder: 'שיעורים',
      category: 'other',
      tags: [],
    })
    setAppSave('done')
    setTimeout(() => setAppSave('idle'), 2500)
  }

  async function saveToGoogle() {
    if (!title.trim() || !content.trim()) return
    setGoogleSave('saving')
    try {
      const res = await fetch('/api/google/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      const data = await res.json()
      if (data.docUrl) {
        setGoogleDocUrl(data.docUrl)
        setGoogleSave('done')
        setTimeout(() => setGoogleSave('idle'), 3000)
      } else {
        setGoogleSave('idle')
      }
    } catch {
      setGoogleSave('idle')
    }
  }

  return (
    <div className="flex flex-col h-full" dir="rtl" style={{ background: 'oklch(0.10 0.035 240)' }}>
      {/* Title bar */}
      <div className="px-4 pt-3 pb-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="כותרת הסיכום..."
          className="w-full bg-transparent text-white font-semibold text-base outline-none placeholder-white/20 text-right"
        />
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="כתוב כאן את הסיכום..."
        className="flex-1 w-full bg-transparent text-white/85 text-sm leading-relaxed resize-none outline-none px-4 py-3 placeholder-white/15 text-right"
        dir="rtl"
      />

      {/* Actions */}
      <div
        className="px-4 py-3 shrink-0 flex flex-col gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex gap-2 flex-wrap">
          {/* Save to app */}
          <button
            onClick={saveToApp}
            disabled={appSave === 'saving' || !content.trim()}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-30"
            style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
          >
            {appSave === 'saving' ? (
              <Loader2 size={13} className="animate-spin" />
            ) : appSave === 'done' ? (
              <Check size={13} />
            ) : (
              <Save size={13} />
            )}
            {appSave === 'done' ? 'נשמר!' : 'שמור בסיכומים'}
          </button>

          {/* Google Docs */}
          {isGoogleConnected ? (
            <button
              onClick={saveToGoogle}
              disabled={googleSave === 'saving' || !content.trim()}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-30"
              style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4' }}
            >
              {googleSave === 'saving' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : googleSave === 'done' ? (
                <Check size={13} />
              ) : (
                <ExternalLink size={13} />
              )}
              {googleSave === 'done' ? 'נשמר בדוקס!' : 'שמור בגוגל דוקס'}
            </button>
          ) : (
            <a
              href="/api/google/auth"
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all"
              style={{ background: 'rgba(66,133,244,0.1)', color: 'rgba(66,133,244,0.65)', border: '1px solid rgba(66,133,244,0.2)' }}
            >
              <Link size={13} />
              חבר גוגל דוקס
            </a>
          )}
        </div>

        {/* Link to created doc */}
        {googleDocUrl && (
          <a
            href={googleDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1"
            style={{ color: 'rgba(66,133,244,0.7)' }}
          >
            <ExternalLink size={11} />
            פתח מסמך בגוגל דוקס
          </a>
        )}
      </div>
    </div>
  )
}
