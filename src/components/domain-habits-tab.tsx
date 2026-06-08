'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HabitRow } from '@/components/habit-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Domain, Habit } from '@/types'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function computeStreak(completedDates: Set<string>): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (completedDates.has(d.toISOString().split('T')[0])) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function HabitHistoryBar({
  habitId, days7, historyMap, streaks, color, historyLoaded,
}: {
  habitId: string
  days7: string[]
  historyMap: Record<string, Set<string>>
  streaks: Record<string, number>
  color: string
  historyLoaded: boolean
}) {
  if (!historyLoaded) return null
  const dates = historyMap[habitId] ?? new Set()
  const streak = streaks[habitId] ?? 0
  return (
    <div className="flex items-center gap-1 px-3.5 pb-2.5 pt-0.5">
      <div className="flex gap-[3px] flex-1">
        {days7.map((day) => (
          <div
            key={day}
            className="h-[5px] rounded-full flex-1 transition-all"
            style={{ background: dates.has(day) ? color : `${color}22` }}
          />
        ))}
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-0.5 flex-shrink-0 ms-2">
          <Flame size={10} style={{ color }} />
          <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
            {streak}
          </span>
        </div>
      )}
    </div>
  )
}

interface Props {
  habits: Habit[]
  completedSet: Set<string>
  domain: Domain
  userId: string
  onAdded: (h: Habit) => void
  isRTL: boolean
}

export function DomainHabitsTab({ habits, completedSet, domain, userId, onAdded, isRTL }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [saving, setSaving] = useState(false)
  const [historyMap, setHistoryMap] = useState<Record<string, Set<string>>>({})
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const days7 = useMemo(getLast7Days, [])
  const completedCount = habits.filter((h) => completedSet.has(h.id)).length
  const progress = habits.length > 0 ? completedCount / habits.length : 0

  useEffect(() => {
    if (habits.length === 0) { setHistoryLoaded(true); return }
    const ids = habits.map((h) => h.id)
    createClient()
      .from('habit_logs')
      .select('habit_id, completed_at')
      .in('habit_id', ids)
      .gte('completed_at', days7[0])
      .then(({ data }) => {
        const map: Record<string, Set<string>> = {}
        for (const id of ids) map[id] = new Set()
        for (const row of data ?? []) map[row.habit_id]?.add(row.completed_at)
        setHistoryMap(map)
        setHistoryLoaded(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.length])

  const streaks = useMemo(() => {
    const result: Record<string, number> = {}
    for (const [id, dates] of Object.entries(historyMap)) result[id] = computeStreak(dates)
    return result
  }, [historyMap])

  const add = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: userId, domain_slug: domain.slug, name: name.trim(), frequency, schedule_time: time || null })
        .select()
        .single()
      if (!error && data) {
        onAdded(data as Habit)
        setName(''); setTime(''); setFrequency('daily'); setAdding(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const cancelAdd = () => { setAdding(false); setName(''); setTime(''); setFrequency('daily') }

  return (
    <div className="space-y-2">

      {/* Progress header */}
      {habits.length > 0 && (
        <div
          className="rounded-xl p-3 mb-3"
          style={{ background: `${domain.color}0d`, border: `1px solid ${domain.color}28` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: domain.color }}>
              {isRTL ? 'הרגלים היום' : "Today's habits"}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: domain.color }}>
              {completedCount}/{habits.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${domain.color}22` }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress * 100}%`, background: domain.color }}
            />
          </div>
          {completedCount === habits.length && habits.length > 0 && (
            <p className="text-[11px] mt-1.5 text-center font-semibold" style={{ color: domain.color }}>
              🔥 {isRTL ? 'כל ההרגלים הושלמו!' : 'All habits done!'}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2.5 py-10">
          <span className="text-4xl">{domain.icon}</span>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {isRTL ? `עדיין אין הרגלים ב${domain.nameHe}` : `No habits in ${domain.nameEn} yet`}
          </p>
          <p className="text-xs text-center max-w-[210px]" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL
              ? 'הוסף הרגל ראשון — כל שינוי גדול מתחיל בצעד קטן'
              : 'Every big change starts with a small habit'}
          </p>
        </div>
      )}

      {/* Habit rows with 7-day history bar */}
      {habits.map((h) => (
        <div key={h.id}>
          <HabitRow habit={h} isCompleted={completedSet.has(h.id)} />
          <HabitHistoryBar
            habitId={h.id}
            days7={days7}
            historyMap={historyMap}
            streaks={streaks}
            color={domain.color}
            historyLoaded={historyLoaded}
          />
        </div>
      ))}

      {/* Add form */}
      {adding ? (
        <div
          className="rounded-xl p-3 space-y-2.5 mt-1"
          style={{ background: `${domain.color}09`, border: `1px solid ${domain.color}30` }}
        >
          {/* Frequency toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${domain.color}30` }}>
            {(['daily', 'weekly'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className="flex-1 text-xs py-1.5 font-medium transition-all"
                style={{
                  background: frequency === f ? domain.color : 'transparent',
                  color: frequency === f ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {f === 'daily' ? (isRTL ? 'יומי' : 'Daily') : (isRTL ? 'שבועי' : 'Weekly')}
              </button>
            ))}
          </div>

          {/* Name + time row */}
          <div className="flex gap-2">
            <Input
              autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder={isRTL ? 'שם ההרגל' : 'Habit name'}
              className="rounded-xl flex-1"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
            />
            <input
              type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="rounded-xl px-2 text-sm w-24 flex-shrink-0"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelAdd}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={16} />
            </button>
            <Button
              onClick={add} disabled={saving || !name.trim()}
              className="rounded-xl px-4"
              style={{ background: domain.color, color: '#fff', border: 'none', opacity: saving || !name.trim() ? 0.5 : 1 }}
            >
              {isRTL ? 'הוסף' : 'Add'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all active:scale-[0.98]"
          style={{ borderColor: `${domain.color}40`, color: 'var(--muted-foreground)' }}
        >
          <Plus size={16} style={{ color: domain.color }} />
          <span className="text-sm">{isRTL ? 'הוסף הרגל' : 'Add Habit'}</span>
        </button>
      )}
    </div>
  )
}
