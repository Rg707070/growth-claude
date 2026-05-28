'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Flame, ChevronLeft, CheckCircle2, Circle, Plus } from 'lucide-react'
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
  onNavigate: (tab: 'home' | 'learn' | 'summaries') => void
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
      await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('completed_at', today)
      setCompleted((prev) => { const next = new Set(prev); next.delete(habit.id); return next })
    } else {
      await supabase.from('habit_logs').insert({ user_id: userId, habit_id: habit.id, completed_at: today })
      setCompleted((prev) => new Set([...prev, habit.id]))
    }
    router.refresh()
  }

  const lastSession = recentSessions[0]
  const doneCount = habits.filter((h) => completed.has(h.id)).length
  const allDone = habits.length > 0 && doneCount === habits.length

  return (
    <div className="space-y-6">

      {/* Continue / Start CTA */}
      {lastSession ? (
        <button
          onClick={() => onNavigate('learn')}
          className="w-full rounded-2xl p-5 text-right transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: GREEN, boxShadow: `0 6px 24px ${GREEN}45` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-white/70 text-xs mb-0.5">{t('continuelearning')}</p>
              <p className="text-white text-base font-semibold leading-tight line-clamp-1">{lastSession.text_title}</p>
              <p className="text-white/60 text-xs mt-1">{timeAgo(lastSession.created_at)}</p>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('learn')}
          className="w-full rounded-2xl p-5 flex items-center justify-center gap-2.5 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: GREEN, boxShadow: `0 6px 24px ${GREEN}45` }}
        >
          <Plus size={18} className="text-white" />
          <span className="text-base font-semibold text-white">{t('startLearning')}</span>
        </button>
      )}

      {/* Today's habits */}
      {habits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {doneCount}/{habits.length}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              {t('todayHabits')}
            </p>
          </div>

          <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${habits.length > 0 ? (doneCount / habits.length) * 100 : 0}%`,
                background: `linear-gradient(to left, ${GREEN}, ${GREEN_LIGHT})`,
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
                  className="w-full flex items-center gap-3 px-4 rounded-xl text-right transition-all active:scale-[0.99]"
                  style={{
                    background: isDone ? `${GREEN}12` : 'var(--card)',
                    border: `1px solid ${isDone ? GREEN + '40' : 'var(--border)'}`,
                    minHeight: '52px',
                  }}
                >
                  {isDone
                    ? <CheckCircle2 size={20} className="shrink-0" style={{ color: GREEN_LIGHT }} />
                    : <Circle size={20} className="shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                  }
                  <span
                    className="text-sm flex-1 text-right font-medium py-3.5"
                    style={{
                      color: isDone ? 'var(--muted-foreground)' : 'var(--foreground)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {habit.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* All done banner */}
      {allDone && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${GREEN}15`, border: `1px solid ${GREEN}35` }}>
          <Flame size={22} style={{ color: GREEN_LIGHT }} />
          <p className="text-sm font-semibold" style={{ color: GREEN_LIGHT }}>כל ההרגלים הושלמו היום 🎉</p>
        </div>
      )}

      {/* Recent summaries */}
      {recentSummaries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => onNavigate('summaries')}
              className="text-xs flex items-center gap-1 font-medium transition-opacity hover:opacity-70"
              style={{ color: GREEN_LIGHT }}
            >
              הכל <ChevronLeft size={12} />
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              {t('torahSummaries')}
            </p>
          </div>
          <div className="space-y-2">
            {recentSummaries.map((s) => (
              <div key={s.id} className="p-4 rounded-xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>{s.title}</p>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{s.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
