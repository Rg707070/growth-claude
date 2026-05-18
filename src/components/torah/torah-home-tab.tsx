'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Flame, ChevronLeft, CheckCircle2, Circle, Plus } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { createClient } from '@/lib/supabase/client'
import type { Habit, LearningSession, LearningSummary } from '@/types'

const TORAH_COLOR = '#0f766e'
const GOLD = '#c4963a'

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

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m} דק'`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}ש' ${rem}ד'` : `${h} שעות`
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
      await supabase.rpc('update_profile_xp', { uid: userId, xp_delta: habit.xp_reward })
      setCompleted((prev) => new Set([...prev, habit.id]))
    }
    router.refresh()
  }

  const lastSession = recentSessions[0]
  const doneCount = habits.filter((h) => completed.has(h.id)).length
  const todayMinutes = formatMinutes(todaySeconds)

  return (
    <div className="p-4 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Clock size={16} />}
          label={t('minutesToday')}
          value={String(todayMinutes)}
          color={TORAH_COLOR}
        />
        <StatCard
          icon={<BookOpen size={16} />}
          label={t('sessionsToday')}
          value={String(todaySessionCount)}
          color={TORAH_COLOR}
        />
      </div>

      {/* Continue / Start learning */}
      {lastSession ? (
        <button
          onClick={() => onNavigate('learn')}
          className="w-full rounded-2xl p-4 text-right transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${TORAH_COLOR}22, ${TORAH_COLOR}08)`, border: `1px solid ${TORAH_COLOR}33` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${TORAH_COLOR}22` }}>
              <BookOpen size={20} style={{ color: TORAH_COLOR }} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-white/50 mb-0.5">{t('continuelearning')}</p>
              <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
                {lastSession.text_title}
              </p>
              <p className="text-xs text-white/40 mt-0.5">{timeAgo(lastSession.created_at)}</p>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => onNavigate('learn')}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: `${TORAH_COLOR}22`, border: `1px dashed ${TORAH_COLOR}55` }}
        >
          <Plus size={16} style={{ color: TORAH_COLOR }} />
          <span className="text-sm font-medium" style={{ color: TORAH_COLOR }}>
            {t('startLearning')}
          </span>
        </button>
      )}

      {/* Today's habits */}
      {habits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/40">{t('todayHabits')}</p>
            <span className="text-xs text-white/40">{doneCount}/{habits.length}</span>
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
                    background: isDone ? `${TORAH_COLOR}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isDone ? TORAH_COLOR + '40' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="shrink-0" style={{ color: TORAH_COLOR }} />
                  ) : (
                    <Circle size={18} className="text-white/20 shrink-0" />
                  )}
                  <span
                    className="text-sm flex-1 text-right"
                    style={{ color: isDone ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)', textDecoration: isDone ? 'line-through' : 'none' }}
                  >
                    {habit.name}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent summaries */}
      {recentSummaries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => onNavigate('summaries')} className="text-xs flex items-center gap-1" style={{ color: TORAH_COLOR }}>
              הכל <ChevronLeft size={12} />
            </button>
            <p className="text-xs text-white/40">{t('torahSummaries')}</p>
          </div>
          <div className="space-y-2">
            {recentSummaries.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm font-medium text-white/90 mb-1">{s.title}</p>
                <p className="text-xs text-white/40 line-clamp-2">{s.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Streak hint */}
      {habits.length > 0 && doneCount === habits.length && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}33` }}
        >
          <Flame size={20} style={{ color: GOLD }} />
          <p className="text-sm font-medium" style={{ color: GOLD }}>
            כל ההרגלים הושלמו היום
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: `${color}cc` }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
