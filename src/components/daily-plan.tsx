'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { getDomainBySlug } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import type { Habit } from '@/types'

interface PlanItem {
  time: string
  habit: string
  domain: string
  duration: number
  tip: string
}

interface DailyPlanResponse {
  plan: PlanItem[]
  message: string | null
}

interface DailyPlanProps {
  habits: Habit[]
  completedIds: string[]
  streak: number
}

export function DailyPlan({ habits, completedIds, streak }: DailyPlanProps) {
  const { isRTL } = useLang()
  const [data, setData] = useState<DailyPlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [fetched, setFetched] = useState(false)

  const dayIndex = new Date().getDay()
  const dailyHabits = habits.filter((h) => h.frequency === 'daily' && h.is_active)

  function load() {
    if (fetched) {
      setExpanded((e) => !e)
      return
    }
    setExpanded(true)
    setLoading(true)
    setFetched(true)

    fetch('/api/daily-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habits: dailyHabits.map((h) => ({
          name: h.name,
          domain_slug: h.domain_slug,
          xp_reward: h.xp_reward,
        })),
        completedIds,
        streak,
        dayIndex,
      }),
    })
      .then((r) => r.json())
      .then((d: DailyPlanResponse) => setData(d))
      .catch(() => setData({ plan: [], message: null }))
      .finally(() => setLoading(false))
  }

  const completedCount = dailyHabits.filter((h) => completedIds.includes(h.id)).length
  const allDone = dailyHabits.length > 0 && completedCount === dailyHabits.length

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={load}
        className="w-full flex items-center gap-3 p-4"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{ background: 'oklch(0.75 0.17 205 / 15%)' }}
        >
          <Sparkles size={16} style={{ color: 'oklch(0.75 0.17 205)' }} />
        </div>
        <div className="flex-1 text-start">
          <p className="text-sm font-semibold text-white/90">
            {isRTL ? 'תוכנית היום שלך' : 'Your Daily Plan'}
          </p>
          <p className="text-xs text-white/40">
            {allDone
              ? isRTL ? 'סיימת הכל היום 🎉' : 'All done today 🎉'
              : isRTL
              ? `${dailyHabits.length - completedCount} הרגלים נותרו — לחץ לתזמן`
              : `${dailyHabits.length - completedCount} habits left — tap to schedule`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-white/30 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl animate-pulse"
                  style={{ background: 'oklch(0.18 0.05 238)' }}
                />
              ))}
            </div>
          )}

          {!loading && data?.message && (
            <p className="text-sm text-white/60 text-center py-2">{data.message}</p>
          )}

          {!loading && data?.plan && data.plan.length > 0 && (
            <div className="space-y-2">
              {data.plan.map((item, i) => {
                const domain = getDomainBySlug(item.domain)
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex items-start gap-3"
                    style={{
                      background: domain ? `${domain.color}12` : 'oklch(0.18 0.05 238)',
                      border: `1px solid ${domain ? `${domain.color}25` : 'transparent'}`,
                      direction: isRTL ? 'rtl' : 'ltr',
                    }}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {domain?.icon ?? '📌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold font-mono"
                          style={{ color: domain?.color ?? 'oklch(0.75 0.17 205)' }}
                        >
                          {item.time}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock size={10} />
                          {item.duration} {isRTL ? 'דק׳' : 'min'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white/90 mt-0.5 truncate">
                        {item.habit}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">{item.tip}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && data?.plan && data.plan.length === 0 && !data.message && (
            <p className="text-sm text-white/40 text-center py-2">
              {isRTL ? 'לא ניתן לייצר תוכנית כרגע' : 'Could not generate a plan right now'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
