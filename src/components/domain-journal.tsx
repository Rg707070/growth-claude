'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { LinkToBookButton } from '@/components/book-link-button'

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
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null)
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
        if (todayEntry) {
          setText(todayEntry.text)
          setSavedEntryId(todayEntry.id)
        }
      }
    }
    load()
  }, [domainSlug, userId, today])

  const save = async () => {
    if (!text.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('journal_entries')
      .upsert(
        { user_id: userId, domain_slug: domainSlug, date: today, text: text.trim() },
        { onConflict: 'user_id,domain_slug,date' }
      )
      .select('id')
      .single()
    setSaving(false)
    const newId = (data as { id: string } | null)?.id ?? savedEntryId
    if (newId) setSavedEntryId(newId)
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== today)
      return [{ id: newId ?? today, date: today, text: text.trim() }, ...filtered].slice(0, 5)
    })
  }

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✍️</span>
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--muted-foreground)' }}
        >
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
          className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--c-input)',
            border: '1px solid var(--c-input-border)',
            color: 'var(--foreground)',
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <button
          onClick={save}
          disabled={saving || !text.trim()}
          className="px-3 py-2 rounded-xl text-sm disabled:opacity-40 transition-colors"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {saving ? '...' : '✓'}
        </button>
        <div className="flex items-center rounded-xl px-1" style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)' }}>
          <LinkToBookButton userId={userId} sourceType="journal_entry" sourceId={savedEntryId} variant="icon" />
        </div>
      </div>

      {entries.filter((e) => e.date !== today).length > 0 && (
        <div className="mt-3 space-y-1.5">
          {entries
            .filter((e) => e.date !== today)
            .slice(0, 4)
            .map((e) => (
              <div key={e.id} className="flex gap-2 items-start">
                <span
                  className="text-[10px] flex-shrink-0 mt-0.5 font-mono"
                  style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
                >
                  {e.date.slice(5)}
                </span>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--muted-foreground)' }}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {e.text}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
