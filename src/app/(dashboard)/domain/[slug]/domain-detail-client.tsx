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

  const widgetsPanel = (
    <div className="space-y-6">
      {integration?.links && integration.links.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>כלים</h2>
          <QuickLinks links={integration.links} />
        </div>
      )}

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

      <PomodoroTimer />

      <DomainJournal domainSlug={domain.slug} userId={userId} />
    </div>
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6 animate-fade-up">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 md:max-w-none md:px-0 md:py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl transition-all duration-150 hover:brightness-105 active:scale-[0.96]"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
            >
              <ArrowRight
                size={20}
                style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }}
              />
            </button>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: `${domain.color}22`, color: domain.color }}
            >
              {domain.icon}
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                {isRTL ? domain.nameHe : domain.nameEn}
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {completedCount}/{habits.length} {t('habits')}
              </p>
            </div>
          </div>
          <ProgressRing percentage={pct} color={domain.color} size={48} strokeWidth={4}>
            <span className="text-[10px] font-bold" style={{ color: domain.color }}>{pct}%</span>
          </ProgressRing>
        </div>

        {/* Two-column on lg+, single-column on mobile/tablet */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] lg:gap-8 xl:gap-10 lg:items-start">

          {/* Primary column: habits */}
          <div className="space-y-4">
            {/* Widgets inline on mobile/tablet */}
            <div className="space-y-6 lg:hidden mb-2">
              {widgetsPanel}
              <div style={{ borderTop: '1px solid var(--border)' }} />
            </div>

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
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all duration-150 hover:brightness-105 active:scale-[0.98]"
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

          {/* Secondary column: widgets (desktop only) */}
          <div className="hidden lg:block sticky top-8">
            {widgetsPanel}
          </div>

        </div>
      </div>
    </div>
  )
}
