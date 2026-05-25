'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
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
  const [appSave, setAppSave] = useState<SaveState>('idle')

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

  return (
    <div className="flex flex-col h-full" dir="rtl" style={{ background: 'var(--c-surface)' }}>
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

        </div>
      </div>
    </div>
  )
}
