'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { HabitRow } from '@/components/habit-row'
import { ProgressRing } from '@/components/progress-ring'
import { QuickLinks } from '@/components/integrations/quick-links'
import { SefariaWidget } from '@/components/integrations/sefaria-widget'
import { ConnectPlaceholder } from '@/components/integrations/connect-placeholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PomodoroTimer } from '@/components/pomodoro-timer'
import { DomainJournal } from '@/components/domain-journal'
import { DOMAIN_INTEGRATIONS } from '@/lib/domain-integrations'
import type { Domain, Habit } from '@/types'

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
}

function DomainWidget({ slug, isRTL }: { slug: string; isRTL: boolean }) {
  if (slug === 'torah') return <SefariaWidget />
  if (slug === 'sports') {
    return (
      <ConnectPlaceholder
        service="Garmin Connect"
        icon="⌚"
        description={
          isRTL
            ? 'חבר את הגארמין כדי לראות פעילות, צעדים ושינה'
            : 'Connect Garmin to see activity, steps, and sleep'
        }
        url="https://connect.garmin.com"
      />
    )
  }
  if (slug === 'music') {
    return (
      <ConnectPlaceholder
        service="Spotify"
        icon="🎵"
        description={
          isRTL
            ? 'חבר את Spotify כדי לראות מה שאתה מאזין ולנהל פלייליסטים'
            : 'Connect Spotify to see your listening and manage playlists'
        }
        url="https://open.spotify.com"
      />
    )
  }
  return null
}

export function DomainDetailClient({
  domain,
  habits: initialHabits,
  completedIds,
  userId,
}: Props) {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [habits, setHabits] = useState(initialHabits)
  useHabitReminders(habits)
  const [adding, setAdding] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitTime, setNewHabitTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const completedSet = useMemo(() => new Set(completedIds), [completedIds])

  const completedCount = habits.filter((h) => completedSet.has(h.id)).length
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
  const integration = DOMAIN_INTEGRATIONS[domain.slug]

  const addHabit = async () => {
    if (!newHabitName.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          domain_slug: domain.slug,
          name: newHabitName.trim(),
          frequency: 'daily',
          schedule_time: newHabitTime || null,
        })
        .select()
        .single()

      if (error || !data) {
        setSaveError(isRTL ? 'שגיאה בשמירה — נסה שוב' : 'Save failed — try again')
        setSaving(false)
        return
      }
      setHabits((prev) => [...prev, data as Habit])
      setNewHabitName('')
      setNewHabitTime('')
      setAdding(false)
      setSaving(false)
      router.refresh()
    } catch {
      setSaveError(isRTL ? 'שגיאה — נסה שוב' : 'Error — try again')
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pt-12 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
        >
          <ArrowRight
            size={20}
            style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }}
          />
        </button>
        <div className="flex-1">
          <h1
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--foreground)' }}
          >
            <span>{domain.icon}</span>
            <span>{isRTL ? domain.nameHe : domain.nameEn}</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {completedCount}/{habits.length} {t('habits')}
          </p>
        </div>
        <ProgressRing percentage={pct} color={domain.color} size={48} strokeWidth={4}>
          <span className="text-[10px] font-bold" style={{ color: domain.color }}>{pct}%</span>
        </ProgressRing>
      </div>

      {/* Quick links */}
      {integration?.links && integration.links.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>כלים</h2>
          <QuickLinks links={integration.links} />
        </div>
      )}

      {/* Domain widget */}
      {integration?.widgetType && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {integration.widgetType === 'sefaria' && 'לימוד יומי'}
            {integration.widgetType === 'spotify' && 'מוזיקה'}
            {integration.widgetType === 'garmin' && 'פעילות גופנית'}
          </h2>
          <DomainWidget slug={domain.slug} isRTL={isRTL} />
        </div>
      )}

      {/* Pomodoro timer */}
      <PomodoroTimer />

      {/* Daily Journal */}
      <DomainJournal domainSlug={domain.slug} userId={userId} />

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Habits */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          {t('habits')}
        </h2>
        {habits.length === 0 && !adding && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('noHabitsYet')}
          </div>
        )}
        {habits.map((habit) => (
          <HabitRow key={habit.id} habit={habit} isCompleted={completedSet.has(habit.id)} />
        ))}
      </div>

      {/* Add habit */}
      {adding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              placeholder={t('habitName')}
              className="rounded-xl"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <input
              type="time"
              value={newHabitTime}
              onChange={(e) => setNewHabitTime(e.target.value)}
              className="rounded-xl px-2 text-sm w-28 flex-shrink-0"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <Button
              onClick={addHabit}
              disabled={saving || !newHabitName.trim()}
              className="rounded-xl flex-shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {t('save')}
            </Button>
            <button
              onClick={() => { setAdding(false); setNewHabitName(''); setNewHabitTime(''); setSaveError(null) }}
              className="p-2 rounded-xl transition-colors"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
          {saveError && (
            <p className="text-red-400 text-xs text-center">{saveError}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <Plus size={18} />
          <span className="text-sm">{t('addHabit')}</span>
        </button>
      )}
    </div>
  )
}
