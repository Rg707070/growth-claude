'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Flame, ChevronLeft, CheckCircle2, Circle, Plus } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/client'
import type { Habit, LearningSession, LearningSummary } from '@/types'

const GREEN = '#16a34a'
const GREEN_LIGHT = '#22c55e'

interface Props {
  habits: Habit[]
  completedIds: string[]
  userId: string
  recentSessions: LearningSession[]
  recentSummaries: LearningSummary[]
  todaySeconds: number
  todaySessionCount: number
  onNavigate: (tab: 'home' | 'learn' | 'feed' | 'summaries' | 'profile') => void
}

function formatMinutes(seconds: number) {
  return Math.round(seconds / 60)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שעות`
  return `לפני ${Math.floor(h / 24)} ימים`
}

export function TorahHomeTab({
  habits,
  completedIds: initialCompleted,
  userId,
  recentSessions,
  recentSummaries,
  todaySeconds,
  todaySessionCount,
  onNavigate,
}: Props) {
  const { t } = useLang()
  const router = useRouter()
  const [completed, setCompleted] = useState(new Set(initialCompleted))
  const supabase = createClient()

  async function toggleHabit(habit: Habit) {
    const today = new Date().toISOString().split('T')[0]
    const isDone = completed.has(habit.id)

    if (isDone) {
      await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habit.id)
        .eq('completed_at', today)
      setCompleted((prev) => {
        const next = new Set(prev)
        next.delete(habit.id)
        return next
      })
    } else {
      await supabase
        .from('habit_logs')
        .insert({ user_id: userId, habit_id: habit.id, completed_at: today })
      setCompleted((prev) => new Set([...prev, habit.id]))
    }
    router.refresh()
  }

  const lastSession = recentSessions[0]
  const doneCount = habits.filter((h) => completed.has(h.id)).length
  const todayMinutes = formatMinutes(todaySeconds)
  const allDone = habits.length > 0 && doneCount === habits.length

  return (
    <div className="p-4 space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock size={15} />}
          label={t('minutesToday')}
          value={String(todayMinutes)}
        />
        <StatCard
          icon={<BookOpen size={15} />}
          label={t('sessionsToday')}
          value={String(todaySessionCount)}
        />
      </div>

      {/* Continue / Start learning CTA */}
      {lastSession ? (
        <button
          onClick={() => onNavigate('learn')}
          className="w-full rounded-2xl p-4 text-right transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: GREEN, boxShadow: `0 4px 18px ${GREEN}50` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-white/70 text-xs mb-0.5">{t('continuelearning')}</p>
              <p className="text-white text-sm font-semibold leading-tight line-clamp-1">
                {lastSession.text_title}
              </p>
              <p className="text-white/60 text-xs mt-0.5">{timeAgo(lastSession.created_at)}</p>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('learn')}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: GREEN, boxShadow: `0 4px 18px ${GREEN}50` }}
        >
          <Plus size={16} className="text-white" />
          <span className="text-sm font-semibold text-white">{t('startLearning')}</span>
        </button>
      )}

      {/* Today's habits */}
      {habits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 font-medium">{doneCount}/{habits.length}</span>
            <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">{t('todayHabits')}</p>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full bg-white/10 mb-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${habits.length > 0 ? (doneCount / habits.length) * 100 : 0}%`,
                background: GREEN_LIGHT,
              }}
            />
          </div>

          <div className="space-y-2">
            {habits.map((habit) => {
              const isDone = completed.has(habit.id)
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all"
                  style={{
                    background: isDone ? `${GREEN}15` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? GREEN + '45' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="shrink-0" style={{ color: GREEN_LIGHT }} />
                  ) : (
                    <Circle size={18} className="text-white/25 shrink-0" />
                  )}
                  <span
                    className="text-sm flex-1 text-right font-medium"
                    style={{
                      color: isDone ? 'var(--c-text-subtle)' : 'var(--c-text)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {habit.name}
                  </span>
                  {isDone && (
                    <span className="text-xs font-semibold shrink-0" style={{ color: GREEN_LIGHT }}>
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* All done banner */}
      {allDone && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${GREEN}18`, border: `1px solid ${GREEN}40` }}
        >
          <Flame size={20} style={{ color: GREEN_LIGHT }} />
          <p className="text-sm font-semibold" style={{ color: GREEN_LIGHT }}>
            כל ההרגלים הושלמו היום 🎉
          </p>
        </div>
      )}

      {/* Recent summaries */}
      {recentSummaries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => onNavigate('summaries')}
              className="text-xs flex items-center gap-1 font-medium"
              style={{ color: GREEN_LIGHT }}
            >
              הכל <ChevronLeft size={12} />
            </button>
            <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">
              {t('torahSummaries')}
            </p>
          </div>
          <div className="space-y-2">
            {recentSummaries.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-sm font-semibold text-white mb-1">{s.title}</p>
                <p className="text-xs text-white/45 line-clamp-2">{s.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="flex items-center gap-1.5 mb-2 text-white/50">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
