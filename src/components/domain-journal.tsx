'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'

interface JournalEntry {
  id: string
  date: string
  text: string
}

interface DomainJournalProps {
  domainSlug: string
  userId: string
}

export function DomainJournal({ domainSlug, userId }: DomainJournalProps) {
  const { isRTL } = useLang()
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('journal_entries')
        .select('id, date, text')
        .eq('user_id', userId)
        .eq('domain_slug', domainSlug)
        .order('date', { ascending: false })
        .limit(5)
      if (data) {
        setEntries(data as JournalEntry[])
        const todayEntry = (data as JournalEntry[]).find((e) => e.date === today)
        if (todayEntry) setText(todayEntry.text)
      }
    }
    load()
  }, [domainSlug, userId, today])

  const save = async () => {
    if (!text.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('journal_entries').upsert(
      { user_id: userId, domain_slug: domainSlug, date: today, text: text.trim() },
      { onConflict: 'user_id,domain_slug,date' }
    )
    setSaving(false)
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== today)
      return [{ id: today, date: today, text: text.trim() }, ...filtered].slice(0, 5)
    })
  }

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✍️</span>
        <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? 'יומן יומי' : 'Daily Journal'}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder={isRTL ? 'מחשבה אחת להיום...' : 'One thought for today...'}
          className="flex-1 bg-white/8 border border-white/12 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500/40"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30 disabled:opacity-40 transition-colors"
        >
          {saving ? '...' : '✓'}
        </button>
      </div>

      {entries.filter((e) => e.date !== today).length > 0 && (
        <div className="mt-3 space-y-1.5">
          {entries
            .filter((e) => e.date !== today)
            .slice(0, 4)
            .map((e) => (
              <div key={e.id} className="flex gap-2 items-start">
                <span className="text-white/20 text-[10px] flex-shrink-0 mt-0.5 font-mono">
                  {e.date.slice(5)}
                </span>
                <p className="text-white/45 text-xs leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
                  {e.text}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
