'use client'

import { Flame, BookOpen, FileText, Clock } from 'lucide-react'
import { useLang } from '@/lib/lang'
import type { Habit, LearningSession, LearningSummary } from '@/types'

const TORAH_COLOR = '#0f766e'
const GOLD = '#c4963a'

interface Props {
  habits: Habit[]
  completedIds: string[]
  sessions: LearningSession[]
  summaries: LearningSummary[]
  totalSeconds: number
}

const CATEGORIES: Record<string, string> = {
  gemara: 'גמרא',
  mishnah: 'משנה',
  tanakh: 'תנ"ך',
  halacha: 'הלכה',
  article: 'מאמר',
  other: 'אחר',
}

function formatHours(seconds: number) {
  const h = seconds / 3600
  return h < 1 ? `${Math.round(h * 60)} דק'` : `${h.toFixed(1)} שע'`
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function getDayLabel(dateStr: string) {
  const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
  return days[new Date(dateStr).getDay()]
}

export function TorahProfileTab({ habits, completedIds, sessions, summaries, totalSeconds }: Props) {
  const { t } = useLang()

  const totalSessions = sessions.length
  const summaryCount = summaries.length
  const completedHabits = habits.filter((h) => completedIds.includes(h.id)).length

  // Weekly activity: seconds per day for last 7 days
  const last7 = getLast7Days()
  const weeklyMap: Record<string, number> = {}
  sessions.forEach((s) => {
    const day = s.created_at.split('T')[0]
    if (last7.includes(day)) {
      weeklyMap[day] = (weeklyMap[day] ?? 0) + s.duration_seconds
    }
  })
  const weeklyData = last7.map((d) => ({ day: d, seconds: weeklyMap[d] ?? 0 }))
  const maxSeconds = Math.max(...weeklyData.map((d) => d.seconds), 1)

  // Category breakdown
  const catMap: Record<string, number> = {}
  sessions.forEach((s) => {
    catMap[s.text_category] = (catMap[s.text_category] ?? 0) + s.duration_seconds
  })
  const catEntries = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="p-4 space-y-5">
      {/* Top stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox icon={<Clock size={15} />} label={t('totalHours')} value={formatHours(totalSeconds)} color={TORAH_COLOR} />
        <StatBox icon={<BookOpen size={15} />} label={t('totalSessions')} value={String(totalSessions)} color={TORAH_COLOR} />
        <StatBox icon={<FileText size={15} />} label={t('totalSummaries')} value={String(summaryCount)} color={GOLD} />
        <StatBox
          icon={<Flame size={15} />}
          label={t('habits')}
          value={`${completedHabits}/${habits.length}`}
          color={habits.length > 0 && completedHabits === habits.length ? GOLD : TORAH_COLOR}
        />
      </div>

      {/* Weekly chart */}
      <section>
        <p className="text-xs text-white/40 text-right mb-3">{t('weeklyLearning')}</p>
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-end justify-between gap-1 h-20">
            {weeklyData.map(({ day, seconds }) => {
              const heightPct = Math.max((seconds / maxSeconds) * 100, seconds > 0 ? 8 : 3)
              const isToday = day === new Date().toISOString().split('T')[0]
              return (
                <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
                    <div
                      className="w-full max-w-7 rounded-t-md transition-all"
                      style={{
                        height: `${heightPct}%`,
                        background: isToday ? TORAH_COLOR : seconds > 0 ? `${TORAH_COLOR}55` : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: isToday ? TORAH_COLOR : 'var(--c-text-faint)' }}
                  >
                    {getDayLabel(day)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Category breakdown */}
      {catEntries.length > 0 && (
        <section>
          <p className="text-xs text-white/40 text-right mb-3">התפלגות לפי נושא</p>
          <div className="space-y-2.5">
            {catEntries.map(([cat, secs]) => {
              const pct = Math.round((secs / totalSeconds) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white/40">{pct}%</span>
                    <span className="text-xs text-white/70">{CATEGORIES[cat] ?? cat}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: TORAH_COLOR }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Habit performance */}
      {habits.length > 0 && (
        <section>
          <p className="text-xs text-white/40 text-right mb-3">{t('habitPerformance')}</p>
          <div className="space-y-2">
            {habits.map((h) => {
              const done = completedIds.includes(h.id)
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: done ? TORAH_COLOR : 'rgba(255,255,255,0.15)' }}
                  />
                  <span className="text-sm text-right flex-1 mr-3" style={{ color: done ? 'var(--c-text)' : 'var(--c-text-subtle)' }}>
                    {h.name}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalSessions === 0 && (
        <div className="py-8 text-center">
          <p className="text-white/25 text-sm">התחל שיעורים כדי לראות את הסטטיסטיקות שלך</p>
        </div>
      )}
    </div>
  )
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: `${color}0e`, border: `1px solid ${color}22` }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: `${color}bb` }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}
