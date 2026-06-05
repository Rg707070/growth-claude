import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES_HE } from '@/lib/schedule'
import { DOMAINS } from '@/lib/domains'
import { Trash2, X, Plus, ChevronRight, ChevronLeft, Check, CalendarDays } from 'lucide-react'
import { CalendarClient } from '@/app/(dashboard)/calendar/calendar-client'
import { useTheme } from '@/lib/theme'
import { useLang } from '@/lib/lang'
import { useToast } from '@/hooks/use-toast'
import type { Habit, HabitLog } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CalendarView = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface ScheduleItem {
  id: string
  label: string
  time: string
  day_of_week: number | null
  specific_date: string | null
  color: string | null
  icon: string | null
  notes: string | null
}

interface ActivityCheck {
  time: string
  date: string
}

interface WeekDayData {
  dow: number
  date: string
  label: string
  isFuture: boolean
  habitDone: number
  habitTotal: number
  activityDone: number
  activityTotal: number
}

interface SchedulePageClientProps {
  userId: string
  userItems: Record<number, ScheduleItem[]>
  allItems: ScheduleItem[]
  todayChecks: ActivityCheck[]
  scheduledHabits: Habit[]
  todayCompletedHabitIds: string[]
  allHabits: Habit[]
  weekHabitLogs: HabitLog[]
  weekActivityChecks: ActivityCheck[]
  calendarLogs: HabitLog[]
  domainTasks: DomainTask[]
  domainGoals: DomainGoal[]
}

interface DomainTask {
  id: string
  domain_slug: string
  title: string
  done: boolean
  due_date: string | null
  priority: 'low' | 'normal' | 'high'
}

interface DomainGoal {
  id: string
  domain_slug: string
  title: string
  progress: number
  target: number
  unit: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [0, 1, 2, 3, 4, 5]
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

function getWeekDate(dow: number): string {
  const today = new Date()
  const todayDow = today.getDay()
  const diff = dow - todayDow
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  return d.toISOString().split('T')[0]
}

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── HabitMiniCard ─────────────────────────────────────────────────────────
function HabitMiniCard({
  habit,
  completed,
  onToggle,
}: {
  habit: Habit
  completed: boolean
  onToggle: (id: string) => void
}) {
  const { isRTL } = useLang()
  const domain = DOMAINS.find(d => d.slug === habit.domain_slug)
  const color = domain?.color ?? '#888'

  return (
    <button
      onClick={() => onToggle(habit.id)}
      className="flex items-center gap-2 w-full text-start px-3 py-2 rounded-xl transition-all active:scale-[0.97]"
      style={{
        background: completed ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${completed ? color + '44' : 'rgba(255,255,255,0.08)'}`,
        opacity: completed ? 0.7 : 1,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: completed ? color : 'transparent',
          border: `2px solid ${completed ? color : 'rgba(255,255,255,0.3)'}`,
        }}
      >
        {completed && <Check size={10} color="#fff" strokeWidth={3} />}
      </div>
      <span
        className="text-[12px] font-medium flex-1 leading-tight"
        style={{
          color: completed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {isRTL ? habit.name : (habit.name_en || habit.name)}
      </span>
      {domain && (
        <span className="text-base opacity-60">{domain.icon}</span>
      )}
    </button>
  )
}