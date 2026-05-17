'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { HabitRow } from '@/components/habit-row'
import { ProgressRing } from '@/components/progress-ring'
import { QuickLinks } from '@/components/integrations/quick-links'
import { SefariaWidget } from '@/components/integrations/sefaria-widget'
import { TradingViewWidget } from '@/components/integrations/tradingview-widget'
import { ConnectPlaceholder } from '@/components/integrations/connect-placeholder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PomodoroTimer } from '@/components/pomodoro-timer'
import { DomainJournal } from '@/components/domain-journal'
import { PortfolioTracker } from '@/components/portfolio-tracker'
import { DOMAIN_INTEGRATIONS } from '@/lib/domain-integrations'
import type { Domain, Habit } from '@/types'

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
}

function DomainWidget({ slug }: { slug: string }) {
  if (slug === 'torah') return <SefariaWidget />
  if (slug === 'trading') return <TradingViewWidget />
  if (slug === 'sports') {
    return (
      <ConnectPlaceholder
        service="Garmin Connect"
        icon="⌚"
        description="חבר את הגארמין כדי לראות פעילות, צעדים וישנה"
        url="https://connect.garmin.com"
        color="#007CC3"
      />
    )
  }
  if (slug === 'music') {
    return (
      <ConnectPlaceholder
        service="Spotify"
        icon="🎵"
        description="חבר את Spotify כדי לראות מה שאתה מאזין ולנהל פלייליסטים"
        url="https://open.spotify.com"
        color="#1DB954"
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
  const [adding, setAdding] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [saving, setSaving] = useState(false)
  const completedSet = new Set(completedIds)

  const completedCount = habits.filter((h) => completedSet.has(h.id)).length
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
  const integration = DOMAIN_INTEGRATIONS[domain.slug]

  const addHabit = async () => {
    if (!newHabitName.trim() || saving) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        domain_slug: domain.slug,
        name: newHabitName.trim(),
        xp_reward: 10,
        frequency: 'daily',
      })
      .select()
      .single()

    if (!error && data) {
      setHabits((prev) => [...prev, data as Habit])
      setNewHabitName('')
      setAdding(false)
    }
    setSaving(false)
  }

  return (
    <div className="px-4 pt-12 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowRight size={20} className={`text-white ${isRTL ? '' : 'rotate-180'}`} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{domain.icon}</span>
            <span>{isRTL ? domain.nameHe : domain.nameEn}</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5">
            {completedCount}/{habits.length} {t('habits')}
          </p>
        </div>
        <ProgressRing percentage={pct} color={domain.color} size={48} strokeWidth={4}>
          <span className="text-[10px] font-bold text-white">{pct}%</span>
        </ProgressRing>
      </div>

      {/* Quick links */}
      {integration?.links && integration.links.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">כלים</h2>
          <QuickLinks links={integration.links} />
        </div>
      )}

      {/* Domain widget */}
      {integration?.widgetType && (
        <div className="space-y-2">
          <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">
            {integration.widgetType === 'sefaria' && 'לימוד יומי'}
            {integration.widgetType === 'tradingview' && 'שוק ההון'}
            {integration.widgetType === 'spotify' && 'מוזיקה'}
            {integration.widgetType === 'garmin' && 'פעילות גופנית'}
          </h2>
          <DomainWidget slug={domain.slug} />
        </div>
      )}

      {/* Portfolio tracker — trading domain only */}
      {domain.slug === 'trading' && <PortfolioTracker />}

      {/* Pomodoro timer */}
      <PomodoroTimer />

      {/* Daily Journal */}
      <DomainJournal domainSlug={domain.slug} userId={userId} />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Habits */}
      <div className="space-y-2">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-wider">
          {t('habits')}
        </h2>
        {habits.length === 0 && !adding && (
          <div className="text-center py-8 text-white/30 text-sm">{t('noHabitsYet')}</div>
        )}
        {habits.map((habit) => (
          <HabitRow key={habit.id} habit={habit} isCompleted={completedSet.has(habit.id)} />
        ))}
      </div>

      {/* Add habit */}
      {adding ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
            placeholder={t('habitName')}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
          />
          <Button
            onClick={addHabit}
            disabled={saving || !newHabitName.trim()}
            className="rounded-xl bg-white text-black px-4 flex-shrink-0"
          >
            {t('save')}
          </Button>
          <button
            onClick={() => {
              setAdding(false)
              setNewHabitName('')
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 transition-all"
        >
          <Plus size={18} />
          <span className="text-sm">{t('addHabit')}</span>
        </button>
      )}
    </div>
  )
}
