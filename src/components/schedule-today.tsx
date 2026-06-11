'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { DOMAINS } from '@/lib/domains'
import { Check, ChevronLeft } from 'lucide-react'
import { DAY_NAMES_HE, DAY_NAMES_EN } from '@/lib/schedule'

interface ScheduleItem {
  id: string
  time: string
  label: string
  type: string
  color?: string | null
}

interface TodayHabit {
  id: string
  name: string
  domain_slug: string
}

const TYPE_COLORS: Record<string, string> = {
  torah:  '#5eead4',
  shiur:  '#34d399',
  prayer: '#6ee7b7',
  sports: '#86efac',
  break:  'rgba(255,255,255,0.22)',
  other:  'rgba(255,255,255,0.28)',
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getItemColor(item: ScheduleItem): string {
  if (item.color) return item.color
  return TYPE_COLORS[item.type] ?? 'rgba(255,255,255,0.28)'
}

function hexBg(c: string): string {
  return c.startsWith('#') ? `${c}18` : c.replace(/[\d.]+\)$/, '0.10)')
}
function hexBorder(c: string): string {
  return c.startsWith('#') ? `${c}40` : c.replace(/[\d.]+\)$/, '0.30)')
}

export function ScheduleToday({ userId }: { userId: string }) {
  const { isRTL } = useLang()
  const { isDark } = useTheme()
  const router = useRouter()

  const [schedItems,   setSchedItems]   = useState<ScheduleItem[]>([])
  const [actChecks,    setActChecks]    = useState<Set<string>>(new Set())
  const [habits,       setHabits]       = useState<TodayHabit[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading,      setLoading]      = useState(true)
  const [now,          setNow]          = useState<Date>(() => new Date())

  function alpha(a: number): string {
    return isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${Math.min(0.8, a * 2)})`
  }

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const sb = createClient()
    const dow      = new Date().getDay()
    const todayStr = new Date().toISOString().split('T')[0]

    Promise.all([
      sb.from('user_schedule')
        .select('id, time, label, type, color, specific_date')
        .eq('user_id', userId)
        .or(`day_of_week.eq.${dow},specific_date.eq.${todayStr}`)
        .order('time'),
      sb.from('activity_checks')
        .select('time')
        .eq('user_id', userId)
        .eq('date', todayStr),
      sb.from('habits')
        .select('id, name, domain_slug')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('frequency', 'daily'),
      sb.from('habit_logs')
        .select('habit_id')
        .eq('user_id', userId)
        .eq('completed_at', todayStr),
    ]).then(([sched, checks, habs, logs]) => {
      setSchedItems((sched.data ?? []) as ScheduleItem[])
      setActChecks(new Set((checks.data ?? []).map((c: { time: string }) => c.time)))
      setHabits((habs.data ?? []) as TodayHabit[])
      setCompletedIds(new Set((logs.data ?? []).map((l: { habit_id: string }) => l.habit_id)))
      setLoading(false)
    })
  }, [userId])

  const nowMin   = now.getHours() * 60 + now.getMinutes()
  const todayStr = now.toISOString().split('T')[0]
  const dayName  = isRTL ? DAY_NAMES_HE[now.getDay()] : DAY_NAMES_EN[now.getDay()]

  const sorted      = useMemo(() => [...schedItems].sort((a, b) => toMin(a.time) - toMin(b.time)), [schedItems])
  const currentItem = useMemo(() => sorted.filter(i => toMin(i.time) <= nowMin).at(-1) ?? null, [sorted, nowMin])
  const upcoming    = useMemo(() => sorted.filter(i => toMin(i.time) > nowMin).slice(0, 3), [sorted, nowMin])

  const habitsDone = habits.filter(h => completedIds.has(h.id)).length
  const pct        = habits.length > 0 ? Math.round((habitsDone / habits.length) * 100) : 0

  async function toggleCheck(e: React.MouseEvent, time: string) {
    e.stopPropagation()
    const sb         = createClient()
    const wasChecked = actChecks.has(time)
    setActChecks(p => {
      const n = new Set(p)
      wasChecked ? n.delete(time) : n.add(time)
      return n
    })
    if (wasChecked) {
      await sb.from('activity_checks').delete().eq('user_id', userId).eq('date', todayStr).eq('time', time)
    } else {
      await sb.from('activity_checks').upsert({ user_id: userId, date: todayStr, time })
    }
  }

  async function toggleHabit(e: React.MouseEvent, habitId: string) {
    e.stopPropagation()
    const sb     = createClient()
    const wasDone = completedIds.has(habitId)
    setCompletedIds(p => {
      const n = new Set(p)
      wasDone ? n.delete(habitId) : n.add(habitId)
      return n
    })
    if (wasDone) {
      await sb.from('habit_logs').delete().eq('user_id', userId).eq('habit_id', habitId).eq('completed_at', todayStr)
    } else {
      await sb.from('habit_logs').upsert({ user_id: userId, habit_id: habitId, completed_at: todayStr })
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-4 space-y-3 animate-pulse"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}>
        <div className="flex items-center justify-between">
          <div className="h-3 rounded-full w-20" style={{ background: alpha(0.08) }} />
          <div className="h-3 rounded-full w-10" style={{ background: alpha(0.06) }} />
        </div>
        <div className="h-1.5 rounded-full w-full" style={{ background: alpha(0.06) }} />
        <div className="h-12 rounded-xl" style={{ background: alpha(0.05) }} />
        <div className="space-y-2">
          <div className="h-7 rounded-lg" style={{ background: alpha(0.04) }} />
          <div className="h-7 rounded-lg" style={{ background: alpha(0.03) }} />
        </div>
      </div>
    )
  }

  const hasContent = schedItems.length > 0 || habits.length > 0

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}>

      {/* ── Header (tappable → opens /schedule) ── */}
      <button onClick={() => router.push('/schedule')} className="w-full flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: alpha(0.38) }}>
            {isRTL ? `יום ${dayName}` : `Today`}
          </span>
          {habits.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: pct >= 100 ? 'rgba(52,211,153,0.15)' : 'rgba(34,211,238,0.10)',
                color:      pct >= 100 ? 'rgb(52,211,153)'       : 'rgb(103,232,249)',
              }}>
              {habitsDone}/{habits.length} {isRTL ? 'הרגלים' : 'habits'}
            </span>
          )}
        </div>
        <ChevronLeft size={14} style={{ color: alpha(0.22) }} />
      </button>

      {/* ── Habits progress bar ── */}
      {habits.length > 0 && (
        <div className="px-4 pb-2.5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: alpha(0.06) }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct >= 100 ? 'rgb(52,211,153)' : 'rgb(103,232,249)' }} />
          </div>
        </div>
      )}

      <div className="px-3 pb-3 space-y-2">

        {/* ── NOW block ── */}
        {currentItem && (() => {
          const clr    = getItemColor(currentItem)
          const isDone = actChecks.has(currentItem.time)
          return (
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl"
              style={{
                background: hexBg(clr),
                border: `1px solid ${hexBorder(clr)}`,
                borderRightWidth: 3,
                borderRightColor: clr,
              }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: clr }} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5"
                  style={{ color: clr }}>
                  {isRTL ? 'עכשיו' : 'NOW'} · {currentItem.time.slice(0, 5)}
                </p>
                <p className="text-sm font-bold truncate"
                  style={{ color: isDone ? alpha(0.35) : alpha(0.88), textDecoration: isDone ? 'line-through' : 'none' }}>
                  {currentItem.label}
                </p>
              </div>
              <button onClick={e => toggleCheck(e, currentItem.time)}
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background:  isDone ? 'rgba(52,211,153,0.18)' : alpha(0.05),
                  border:      `1px solid ${isDone ? 'rgba(52,211,153,0.38)' : alpha(0.09)}`,
                }}>
                {isDone && <Check size={10} className="text-emerald-400" />}
              </button>
            </div>
          )
        })()}

        {/* ── Upcoming items ── */}
        {upcoming.map((item, i) => {
          const clr    = getItemColor(item)
          const isDone = actChecks.has(item.time)
          return (
            <div key={item.id} className="flex items-center gap-2.5" style={{ opacity: 1 - i * 0.15 }}>
              <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: clr, opacity: 0.6 }} />
              <span className="text-[10px] font-mono w-9 flex-shrink-0 text-center" style={{ color: alpha(0.30) }}>
                {item.time.slice(0, 5)}
              </span>
              <span className="flex-1 text-xs truncate"
                style={{ color: isDone ? alpha(0.28) : alpha(0.65), textDecoration: isDone ? 'line-through' : 'none' }}>
                {item.label}
              </span>
              <button onClick={e => toggleCheck(e, item.time)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: isDone ? 'rgba(52,211,153,0.12)' : alpha(0.04),
                  border:     `1px solid ${isDone ? 'rgba(52,211,153,0.28)' : alpha(0.08)}`,
                }}>
                {isDone && <Check size={8} className="text-emerald-400" />}
              </button>
            </div>
          )
        })}

        {/* ── Habit chips ── */}
        {habits.length > 0 && (
          <div className="pt-1 border-t" style={{ borderColor: alpha(0.06) }}>
            <div className="flex flex-wrap gap-1.5">
              {habits.slice(0, 8).map(habit => {
                const domain = DOMAINS.find(d => d.slug === habit.domain_slug)
                const clr    = domain?.color ?? '#6366f1'
                const done   = completedIds.has(habit.id)
                return (
                  <button key={habit.id} onClick={e => toggleHabit(e, habit.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                    style={{
                      background:      done ? `${clr}22` : alpha(0.04),
                      color:           done ? clr : alpha(0.42),
                      border:          `1px solid ${done ? `${clr}40` : alpha(0.07)}`,
                      textDecoration:  done ? 'line-through' : 'none',
                    }}>
                    <span style={{ fontSize: 9 }}>{done ? '✓' : '○'}</span>
                    {habit.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!hasContent && (
          <div className="text-center py-3">
            <p className="text-xs" style={{ color: alpha(0.28) }}>
              {isRTL ? 'אין פעילויות מתוכננות' : 'No schedule yet'}
            </p>
            <button onClick={() => router.push('/schedule')}
              className="mt-1.5 text-[10px] font-semibold" style={{ color: 'rgb(103,232,249)' }}>
              {isRTL ? 'פתח לוח שנה' : 'Open schedule'} →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
