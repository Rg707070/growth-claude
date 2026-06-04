'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X, Check, Clock, Star, Dumbbell, Music, Wallet, Users, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import type { Habit, HabitLog } from '@/types'

type HabitRow = Pick<Habit, 'id' | 'name' | 'domain_slug' | 'is_active'>
type LogRow = Pick<HabitLog, 'habit_id' | 'completed_at'>

interface DayData {
  schedule: { id: string; time: string; label: string; type: string }[]
  checkedTimes: string[]
  events: { id: string; title: string; description: string | null }[]
  familyTasks: { id: string; title: string; status: string }[]
  domainTasks: { id: string; title: string; domain_slug: string; status: string }[]
  workouts: { id: string; workout_type: string; duration_minutes: number | null; notes: string | null }[]
  musicLogs: { id: string; song_name: string | null; duration_minutes: number | null }[]
  transactions: { id: string; description: string; amount: number; type: string }[]
  friendInteractions: { id: string; notes: string | null }[]
  hasJournal: boolean
  hasNightCheckin: boolean
}

interface CalendarClientProps {
  habits: HabitRow[]
  logs: LogRow[]
}

export function CalendarClient({ habits, logs }: CalendarClientProps) {
  const { isRTL } = useLang()
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dayData, setDayData] = useState<DayData | null>(null)
  const [loadingDay, setLoadingDay] = useState(false)

  const { year, month } = viewDate

  const logMap: Record<string, Set<string>> = {}
  for (const log of logs) {
    const d = log.completed_at.split('T')[0]
    if (!logMap[d]) logMap[d] = new Set()
    logMap[d].add(log.habit_id)
  }

  const activeHabits = habits.filter((h) => h.is_active)
  const total = activeHabits.length

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const today = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const pad = (n: number) => String(n).padStart(2, '0')
  const mkDate = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

  const prevMonth = () => {
    setViewDate((prev: { year: number; month: number }) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    )
    setSelectedDay(null)
    setDayData(null)
  }
  const nextMonth = () => {
    setViewDate((prev: { year: number; month: number }) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    )
    setSelectedDay(null)
    setDayData(null)
  }

  useEffect(() => {
    if (!selectedDay) { setDayData(null); return }

    let cancelled = false
    setLoadingDay(true)

    const fetchDayData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) { setLoadingDay(false); return }

      const dow = new Date(selectedDay + 'T12:00:00').getDay()

      const [
        schedRes, checkRes, eventsRes, famTasksRes, domTasksRes,
        workRes, musicRes, txRes, friendRes, journalRes, nightRes,
      ] = await Promise.all([
        supabase.from('user_schedule')
          .select('id, time, label, type')
          .eq('user_id', user.id)
          .or(`and(specific_date.is.null,day_of_week.eq.${dow}),specific_date.eq.${selectedDay}`)
          .order('time'),
        supabase.from('activity_checks')
          .select('time')
          .eq('user_id', user.id)
          .eq('date', selectedDay),
        supabase.from('family_events')
          .select('id, title, description')
          .eq('user_id', user.id)
          .eq('event_date', selectedDay),
        supabase.from('family_tasks')
          .select('id, title, status')
          .eq('user_id', user.id)
          .eq('due_date', selectedDay),
        supabase.from('domain_tasks')
          .select('id, title, domain_slug, status')
          .eq('user_id', user.id)
          .eq('due_date', selectedDay),
        supabase.from('sport_workout_logs')
          .select('id, workout_type, duration_minutes, notes')
          .eq('user_id', user.id)
          .eq('date', selectedDay),
        supabase.from('music_practice_logs')
          .select('id, song_name, duration_minutes')
          .eq('user_id', user.id)
          .eq('date', selectedDay),
        supabase.from('finance_transactions')
          .select('id, description, amount, type')
          .eq('user_id', user.id)
          .eq('date', selectedDay),
        supabase.from('friend_interactions')
          .select('id, notes')
          .eq('user_id', user.id)
          .eq('date', selectedDay),
        supabase.from('journal_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', selectedDay)
          .maybeSingle(),
        supabase.from('night_checkins')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', selectedDay)
          .maybeSingle(),
      ])

      if (cancelled) return

      setDayData({
        schedule: (schedRes.data ?? []) as DayData['schedule'],
        checkedTimes: ((checkRes.data ?? []) as { time: string }[]).map((r) => r.time),
        events: (eventsRes.data ?? []) as DayData['events'],
        familyTasks: (famTasksRes.data ?? []) as DayData['familyTasks'],
        domainTasks: (domTasksRes.data ?? []) as DayData['domainTasks'],
        workouts: (workRes.data ?? []) as DayData['workouts'],
        musicLogs: (musicRes.data ?? []) as DayData['musicLogs'],
        transactions: (txRes.data ?? []) as DayData['transactions'],
        friendInteractions: (friendRes.data ?? []) as DayData['friendInteractions'],
        hasJournal: !!journalRes.data,
        hasNightCheckin: !!nightRes.data,
      })
      setLoadingDay(false)
    }

    fetchDayData()
    return () => { cancelled = true }
  }, [selectedDay])

  const monthNames = isRTL
    ? ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
    : ['January','February','March','April','May','June','July','August','September','October','November','December']

  const dayLabels = isRTL
    ? ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']
    : ['Su','Mo','Tu','We','Th','Fr','Sa']

  const selectedLogs = selectedDay ? (logMap[selectedDay] ?? new Set<string>()) : new Set<string>()
  const completedHabits = activeHabits.filter((h) => selectedLogs.has(h.id))
  const missedHabits = activeHabits.filter((h) => !selectedLogs.has(h.id))
  const isFutureDay = selectedDay ? selectedDay > today : false

  const closeSheet = () => { setSelectedDay(null); setDayData(null) }

  const hasAnything = dayData && (
    dayData.schedule.length > 0 || dayData.events.length > 0 ||
    dayData.domainTasks.length > 0 || dayData.familyTasks.length > 0 ||
    dayData.workouts.length > 0 || dayData.musicLogs.length > 0 ||
    dayData.transactions.length > 0 || dayData.friendInteractions.length > 0 ||
    dayData.hasJournal || dayData.hasNightCheckin
  )

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 md:max-w-none md:px-0 md:py-8">

        {/* Standalone page header */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'לוח שנה' : 'Calendar'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'לחץ על יום לפרטים מלאים' : 'Tap a day for full details'}
            </p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="rounded-3xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)' }}>
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)' }}>
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {dayLabels.map((label) => (
              <div key={label} className="text-center text-[10px] font-semibold py-1"
                style={{ color: 'var(--muted-foreground)' }}>
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const ds = mkDate(day)
              const completed = logMap[ds]?.size ?? 0
              const isToday = ds === today
              const pct = total > 0 ? completed / total : 0
              const isSelected = selectedDay === ds
              const isFuture = ds > today

              return (
                <button key={ds}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  className="flex flex-col items-center justify-center rounded-xl py-1.5 gap-0.5 transition-all active:scale-90"
                  style={{
                    background: isSelected ? 'var(--c-primary-glow)' : isToday ? 'var(--c-surface-2)' : undefined,
                    border: isSelected ? '1.5px solid var(--primary)' : isToday ? '1px solid var(--c-border)' : '1px solid transparent',
                    opacity: isFuture ? 0.45 : 1,
                  }}>
                  <span className="text-[12px] font-semibold leading-none"
                    style={{ color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}>
                    {day}
                  </span>
                  {!isFuture && total > 0 && (
                    <div className="flex gap-px flex-wrap justify-center" style={{ maxWidth: '24px' }}>
                      {Array.from({ length: Math.min(total, 5) }).map((_, j) => (
                        <span key={j} className="w-1 h-1 rounded-full"
                          style={{ background: j < completed ? 'var(--primary)' : 'var(--c-border)' }} />
                      ))}
                    </div>
                  )}
                  {completed > 0 && (
                    <span className="text-[9px] font-bold leading-none"
                      style={{ color: pct >= 1 ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                      {completed}/{total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Monthly summary */}
        <div className="rounded-3xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'סיכום חודשי' : 'Monthly summary'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              let daysActive = 0, totalCompleted = 0, perfectDays = 0
              for (let d = 1; d <= daysInMonth; d++) {
                const ds = mkDate(d)
                if (ds > today) continue
                const count = logMap[ds]?.size ?? 0
                if (count > 0) daysActive++
                totalCompleted += count
                if (total > 0 && count >= total) perfectDays++
              }
              return [
                { label: isRTL ? 'ימים פעילים' : 'Active days', value: daysActive },
                { label: isRTL ? 'הרגלים הושלמו' : 'Habits done', value: totalCompleted },
                { label: isRTL ? 'ימים מושלמים' : 'Perfect days', value: perfectDays },
              ]
            })().map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day detail bottom sheet ─────────────────────────────── */}
      {selectedDay && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeSheet} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col animate-fade-in"
            style={{
              background: 'var(--c-fab-sheet)',
              border: '1px solid var(--c-border)',
              maxHeight: '85vh',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--c-border)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </p>
                {!isFutureDay && total > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--primary)' }}>
                    {completedHabits.length}/{total} {isRTL ? 'הרגלים' : 'habits'}
                  </p>
                )}
              </div>
              <button onClick={closeSheet}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-4 py-4 pb-10 space-y-5">
              {loadingDay ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--c-border)', borderTopColor: 'var(--primary)' }} />
                </div>
              ) : (
                <>
                  {/* Habits */}
                  {!isFutureDay && total > 0 && (
                    <DaySection title={isRTL ? 'הרגלים' : 'Habits'} color="var(--primary)">
                      {completedHabits.map((h) => (
                        <DayRow key={h.id} icon={<Check size={13} />} text={h.name} done accent="var(--primary)" />
                      ))}
                      {missedHabits.map((h) => (
                        <DayRow key={h.id} icon={<span style={{ fontSize: 13 }}>○</span>} text={h.name} muted />
                      ))}
                    </DaySection>
                  )}

                  {/* Schedule */}
                  {dayData && dayData.schedule.length > 0 && (
                    <DaySection title={isRTL ? 'לוז היום' : "Schedule"} color="#6366f1">
                      {dayData.schedule.map((item: DayData['schedule'][number]) => (
                        <DayRow key={item.id}
                          icon={<Clock size={13} />}
                          text={item.label}
                          sub={item.time}
                          done={dayData.checkedTimes.includes(item.time)}
                          accent="#6366f1"
                        />
                      ))}
                    </DaySection>
                  )}

                  {/* Events */}
                  {dayData && dayData.events.length > 0 && (
                    <DaySection title={isRTL ? 'אירועים' : 'Events'} color="#f59e0b">
                      {dayData.events.map((ev: DayData['events'][number]) => (
                        <DayRow key={ev.id} icon={<Star size={13} />} text={ev.title}
                          sub={ev.description ?? undefined} accent="#f59e0b" done />
                      ))}
                    </DaySection>
                  )}

                  {/* Domain tasks */}
                  {dayData && dayData.domainTasks.length > 0 && (
                    <DaySection title={isRTL ? 'משימות' : 'Tasks'} color="#10b981">
                      {dayData.domainTasks.map((t: DayData['domainTasks'][number]) => {
                        const domain = DOMAINS.find((d) => d.slug === t.domain_slug)
                        return (
                          <DayRow key={t.id}
                            icon={<span style={{ fontSize: 13 }}>{domain?.icon ?? '📋'}</span>}
                            text={t.title}
                            done={t.status === 'done'}
                            accent="#10b981"
                          />
                        )
                      })}
                    </DaySection>
                  )}

                  {/* Family tasks */}
                  {dayData && dayData.familyTasks.length > 0 && (
                    <DaySection title={isRTL ? 'משימות משפחה' : 'Family Tasks'} color="#ec4899">
                      {dayData.familyTasks.map((t: DayData['familyTasks'][number]) => (
                        <DayRow key={t.id}
                          icon={<span style={{ fontSize: 13 }}>👨‍👩‍👧</span>}
                          text={t.title}
                          done={t.status === 'done'}
                          accent="#ec4899"
                        />
                      ))}
                    </DaySection>
                  )}

                  {/* Workouts */}
                  {dayData && dayData.workouts.length > 0 && (
                    <DaySection title={isRTL ? 'ספורט' : 'Workouts'} color="#f59e0b">
                      {dayData.workouts.map((w: DayData['workouts'][number]) => (
                        <DayRow key={w.id}
                          icon={<Dumbbell size={13} />}
                          text={w.workout_type}
                          sub={w.duration_minutes ? `${w.duration_minutes} ${isRTL ? "דק'" : 'min'}` : undefined}
                          done accent="#f59e0b"
                        />
                      ))}
                    </DaySection>
                  )}

                  {/* Music */}
                  {dayData && dayData.musicLogs.length > 0 && (
                    <DaySection title={isRTL ? 'מוזיקה' : 'Music'} color="#8b5cf6">
                      {dayData.musicLogs.map((m: DayData['musicLogs'][number]) => (
                        <DayRow key={m.id}
                          icon={<Music size={13} />}
                          text={m.song_name ?? (isRTL ? 'תרגול' : 'Practice')}
                          sub={m.duration_minutes ? `${m.duration_minutes} ${isRTL ? "דק'" : 'min'}` : undefined}
                          done accent="#8b5cf6"
                        />
                      ))}
                    </DaySection>
                  )}

                  {/* Finance */}
                  {dayData && dayData.transactions.length > 0 && (
                    <DaySection title={isRTL ? 'כספים' : 'Finance'} color="#10b981">
                      {dayData.transactions.map((tx: DayData['transactions'][number]) => (
                        <DayRow key={tx.id}
                          icon={<Wallet size={13} />}
                          text={tx.description}
                          sub={`${tx.type === 'expense' ? '−' : '+'}₪${tx.amount}`}
                          accent={tx.type === 'expense' ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </DaySection>
                  )}

                  {/* Friends */}
                  {dayData && dayData.friendInteractions.length > 0 && (
                    <DaySection title={isRTL ? 'חברים' : 'Friends'} color="#06b6d4">
                      {dayData.friendInteractions.map((fi: DayData['friendInteractions'][number]) => (
                        <DayRow key={fi.id}
                          icon={<Users size={13} />}
                          text={fi.notes ?? (isRTL ? 'אינטראקציה' : 'Interaction')}
                          done accent="#06b6d4"
                        />
                      ))}
                    </DaySection>
                  )}

                  {/* Journal */}
                  {dayData && dayData.hasJournal && (
                    <DaySection title={isRTL ? 'יומן' : 'Journal'} color="#f59e0b">
                      <DayRow icon={<BookOpen size={13} />}
                        text={isRTL ? 'יש רשומה ביומן' : 'Journal entry written'}
                        done accent="#f59e0b"
                      />
                    </DaySection>
                  )}

                  {/* Night check-in */}
                  {dayData && dayData.hasNightCheckin && (
                    <DaySection title={isRTL ? "צ'ק-אין לילי" : 'Night Check-in'} color="#6366f1">
                      <DayRow icon={<Check size={13} />}
                        text={isRTL ? "צ'ק-אין הושלם" : 'Check-in completed'}
                        done accent="#6366f1"
                      />
                    </DaySection>
                  )}

                  {/* Empty state */}
                  {dayData && !hasAnything && !isFutureDay && completedHabits.length === 0 && (
                    <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
                      {isRTL ? 'אין פעילות רשומה ביום זה' : 'No activity recorded this day'}
                    </p>
                  )}
                  {dayData && !hasAnything && isFutureDay && (
                    <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
                      {isRTL ? 'אין פעילות מתוכננת ליום זה' : 'Nothing planned for this day'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Helper components ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DaySection({ title, color, children }: { title: string; color: string; children: any }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color }}>
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DayRow({ icon, text, sub, done, muted, accent }: {
  icon: any; text: string; sub?: string; done?: boolean; muted?: boolean; accent?: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
      style={{ background: 'var(--c-surface-2)', opacity: muted ? 0.5 : 1 }}>
      <span className="flex-shrink-0" style={{ color: done ? (accent ?? 'var(--primary)') : 'var(--muted-foreground)' }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: muted ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
          {text}
        </p>
        {sub && (
          <p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}
