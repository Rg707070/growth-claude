'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { useToast } from '@/components/ui/toast'
import type { DomainTask, DomainGoal } from '@/types/ecosystem'
import type { FamilyTask, FamilyEvent } from '@/types/family'

type Period = 'day' | 'week' | 'month'
type NormTask = { id: string; title: string; urgency: string; due_date: string | null }

const URGENCY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  normal:   '#6b7280',
  low:      '#4b5563',
}

const URGENCY_LABELS: Record<string, { he: string; en: string }> = {
  critical: { he: 'קריטי', en: 'Crit' },
  high:     { he: 'גבוה',  en: 'High' },
  normal:   { he: 'רגיל',  en: 'Norm' },
  low:      { he: 'נמוך',  en: 'Low'  },
}

function urgOrder(u: string): number {
  return u === 'critical' ? 0 : u === 'high' ? 1 : u === 'normal' ? 2 : 3
}

function w(a: number, dk: boolean): string {
  return dk ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${Math.min(0.8, a * 2)})`
}

interface TasksTabProps {
  userId: string
  domainTasks: DomainTask[]
  domainGoals: DomainGoal[]
  familyTasks: FamilyTask[]
  familyEvents: FamilyEvent[]
}

export function TasksTab({ userId, domainTasks, domainGoals, familyTasks, familyEvents }: TasksTabProps) {
  const { isRTL, t } = useLang()
  const { isDark } = useTheme()
  const { toast } = useToast()
  const [period, setPeriod] = useState<Period>('week')
  const [doneTaskIds, setDoneTaskIds] = useState<Set<string>>(new Set())
  const [doneGoalIds, setDoneGoalIds] = useState<Set<string>>(new Set())

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const weekStartDate = new Date(today)
  weekStartDate.setDate(today.getDate() - today.getDay())
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  const weekStartStr = weekStartDate.toISOString().split('T')[0]
  const weekEndStr   = weekEndDate.toISOString().split('T')[0]

  const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const monthEndStr   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  function isTaskInPeriod(dateStr: string | null): boolean {
    if (!dateStr) return true
    if (period === 'day')  return dateStr <= todayStr
    if (period === 'week') return dateStr >= weekStartStr && dateStr <= weekEndStr
    return dateStr >= monthStartStr && dateStr <= monthEndStr
  }

  function isEventInPeriod(eventDate: string): boolean {
    if (period === 'day')  return eventDate === todayStr
    if (period === 'week') return eventDate >= weekStartStr && eventDate <= weekEndStr
    return eventDate >= monthStartStr && eventDate <= monthEndStr
  }

  function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00')
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  async function toggleTask(taskId: string, domainSlug: string) {
    setDoneTaskIds((prev: Set<string>) => new Set([...prev, taskId]))
    const table = domainSlug === 'family' ? 'family_tasks' : 'domain_tasks'
    const { error } = await createClient().from(table).update({ status: 'done' }).eq('id', taskId).eq('user_id', userId)
    if (error) {
      setDoneTaskIds((prev: Set<string>) => { const n = new Set(prev); n.delete(taskId); return n })
      toast(t('saveFailed'), 'error')
    }
  }

  async function toggleGoal(goalId: string) {
    setDoneGoalIds((prev: Set<string>) => new Set([...prev, goalId]))
    const { error } = await createClient().from('domain_goals').update({ status: 'done' }).eq('id', goalId).eq('user_id', userId)
    if (error) {
      setDoneGoalIds((prev: Set<string>) => { const n = new Set(prev); n.delete(goalId); return n })
      toast(t('saveFailed'), 'error')
    }
  }

  const cards = DOMAINS.map(domain => {
    let tasks: NormTask[]
    if (domain.slug === 'family') {
      tasks = familyTasks
        .filter(ft => !doneTaskIds.has(ft.id) && isTaskInPeriod(ft.due_date))
        .map(ft => ({ id: ft.id, title: ft.title, urgency: ft.urgency, due_date: ft.due_date }))
    } else {
      tasks = domainTasks
        .filter(dt => !doneTaskIds.has(dt.id) && dt.domain_slug === domain.slug && isTaskInPeriod(dt.due_date))
        .map(dt => ({ id: dt.id, title: dt.title, urgency: dt.urgency, due_date: dt.due_date }))
    }
    tasks.sort((a, b) => {
      const diff = urgOrder(a.urgency) - urgOrder(b.urgency)
      if (diff !== 0) return diff
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      return a.due_date ? -1 : b.due_date ? 1 : 0
    })

    const goals = domain.slug !== 'family'
      ? domainGoals.filter(g => !doneGoalIds.has(g.id) && g.domain_slug === domain.slug)
      : []
    const events = domain.slug === 'family'
      ? familyEvents.filter(e => isEventInPeriod(e.event_date))
      : []

    return { domain, tasks, goals, events }
  }).filter(c => c.tasks.length > 0 || c.goals.length > 0 || c.events.length > 0)

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div
        className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background: 'var(--c-card)' }}
      >
        {([
          { id: 'day'   as const, labelHe: 'היום',  labelEn: 'Today' },
          { id: 'week'  as const, labelHe: 'שבוע',  labelEn: 'Week'  },
          { id: 'month' as const, labelHe: 'חודש',  labelEn: 'Month' },
        ]).map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              period === p.id
                ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                : { color: 'var(--muted-foreground)' }
            }
          >
            {isRTL ? p.labelHe : p.labelEn}
          </button>
        ))}
      </div>

      {/* Domain cards */}
      {cards.length === 0 ? (
        <div
          className="flex items-center justify-center h-40 rounded-2xl"
          style={{ background: 'var(--c-card)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'אין משימות לתקופה זו' : 'No tasks for this period'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(({ domain, tasks, goals, events }) => {
            const total = tasks.length + goals.length + events.length
            return (
              <div
                key={domain.slug}
                className="rounded-2xl p-4"
                style={{ background: `${domain.color}10`, border: `1px solid ${domain.color}30` }}
              >
                {/* Domain header */}
                <div className="flex items-center justify-between mb-3" dir={isRTL ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{domain.icon}</span>
                    <span className="text-sm font-bold" style={{ color: domain.color }}>
                      {isRTL ? domain.nameHe : domain.nameEn}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{total}</span>
                </div>

                <div className="space-y-1.5" dir={isRTL ? 'rtl' : 'ltr'}>
                  {/* Tasks */}
                  {tasks.map(task => {
                    const overdue = task.due_date !== null && task.due_date < todayStr
                    const urg = URGENCY_LABELS[task.urgency] ?? { he: 'רגיל', en: 'Norm' }
                    return (
                      <div key={task.id} className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => toggleTask(task.id, domain.slug)}
                          className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: w(0.07, isDark), border: `1px solid ${w(0.15, isDark)}` }}
                          aria-label={isRTL ? 'סמן כבוצע' : 'Mark done'}
                        >
                          <span className="text-[8px]" style={{ color: w(0.3, isDark) }}>○</span>
                        </button>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0"
                          style={{
                            background: `${URGENCY_COLORS[task.urgency] ?? '#6b7280'}22`,
                            color: URGENCY_COLORS[task.urgency] ?? '#6b7280',
                          }}
                        >
                          {isRTL ? urg.he : urg.en}
                        </span>
                        <span className="flex-1 min-w-0 truncate" style={{ color: w(0.75, isDark) }}>{task.title}</span>
                        {task.due_date && (
                          <span className="text-[10px] flex-shrink-0" style={{ color: overdue ? '#ef4444' : w(0.35, isDark) }}>
                            {fmtDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {/* Goals */}
                  {goals.map(g => (
                    <div key={g.id} className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => toggleGoal(g.id)}
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ background: w(0.07, isDark), border: `1px solid ${w(0.15, isDark)}` }}
                        aria-label={isRTL ? 'סמן כבוצע' : 'Mark done'}
                      >
                        <span className="text-[8px]" style={{ color: w(0.3, isDark) }}>○</span>
                      </button>
                      <span className="text-[11px] flex-shrink-0">🎯</span>
                      <span className="flex-1 min-w-0 truncate" style={{ color: w(0.65, isDark) }}>{g.title}</span>
                    </div>
                  ))}

                  {/* Family events */}
                  {events.map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] flex-shrink-0">📅</span>
                      <span className="flex-1 min-w-0 truncate" style={{ color: w(0.75, isDark) }}>{e.title}</span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: w(0.35, isDark) }}>
                        {fmtDate(e.event_date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
