'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { HABIT_TEMPLATES } from '@/lib/habit-templates'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'
import { AddHabitSheet } from '@/components/add-habit-sheet'

interface Suggestion {
  slug: string
  color: string
  he: string
  en: string
  key: string
}

const SUGGESTIONS: Suggestion[] = DOMAINS.flatMap((d) => {
  const first = HABIT_TEMPLATES[d.slug]?.[0]
  return first ? [{ slug: d.slug, color: d.color, he: first.he, en: first.en, key: d.slug }] : []
}).slice(0, 5)

export function EmptyHabits() {
  const router = useRouter()
  const { t, lang } = useLang()
  const { toast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const addSuggestion = async (s: Suggestion) => {
    if (added.has(s.key) || busy) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('no user')
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        domain_slug: s.slug,
        name: lang === 'he' ? s.he : s.en,
        frequency: 'daily',
      })
      if (error) throw error
      setAdded((p) => new Set([...p, s.key]))
      router.refresh()
    } catch {
      toast(t('saveFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
    >
      <p className="text-4xl mb-3">🌱</p>
      <h3 className="font-bold text-base mb-1" style={{ color: 'var(--foreground)' }}>
        {t('emptyHabitsTitle')}
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {t('emptyHabitsBody')}
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {SUGGESTIONS.map((s) => {
          const isAdded = added.has(s.key)
          return (
            <button
              key={s.key}
              onClick={() => addSuggestion(s)}
              disabled={isAdded || busy}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all active:scale-95"
              style={{
                background: isAdded ? `${s.color}22` : 'var(--c-surface-2)',
                border: `1px solid ${isAdded ? s.color : 'var(--c-border)'}`,
                color: isAdded ? s.color : 'var(--foreground)',
              }}
            >
              {isAdded ? <Check size={13} /> : <Plus size={13} />}
              {lang === 'he' ? s.he : s.en}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => setSheetOpen(true)}
        className="inline-flex items-center gap-2 px-5 h-11 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:shadow-lg"
        style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
      >
        <Plus size={18} />
        {t('addHabit')}
      </button>

      <AddHabitSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
