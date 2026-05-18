import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { DomainDetailClient } from './domain-detail-client'
import { TradingWorkspaceClient } from '@/components/trading/trading-workspace-client'
import { TorahWorkspaceClient } from '@/components/torah/torah-workspace-client'
import type { Habit, HabitLog, LearningSession, LearningSummary, TorahLesson, DailyTrack } from '@/types'
import type { Trade, TradingAccount, WatchlistItem } from '@/types/trading'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DomainPage({ params }: Props) {
  const { slug } = await params
  const domain = getDomainBySlug(slug)
  if (!domain) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (slug === 'trading') {
    const [accountRes, tradesRes, watchlistRes] = await Promise.all([
      supabase.from('trading_account').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false }),
      supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true }),
    ])

    return (
      <TradingWorkspaceClient
        userId={user.id}
        account={(accountRes.data as TradingAccount | null) ?? null}
        trades={(tradesRes.data as Trade[]) ?? []}
        watchlist={(watchlistRes.data as WatchlistItem[]) ?? []}
      />
    )
  }

  if (slug === 'torah') {
    const today = new Date().toISOString().split('T')[0]
    const [habitsRes, logsRes, sessionsRes, summariesRes, statsRes, lessonsRes, savedRes, tracksRes] =
      await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain_slug', 'torah')
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed_at', today),
        supabase
          .from('learning_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('learning_summaries')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(20),
        supabase
          .from('learning_sessions')
          .select('duration_seconds')
          .eq('user_id', user.id),
        supabase
          .from('torah_lessons')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('saved_lessons')
          .select('lesson_id')
          .eq('user_id', user.id),
        supabase
          .from('torah_daily_tracks')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true }),
      ])

    const habits = (habitsRes.data as Habit[]) ?? []
    const todayLogs = (logsRes.data as HabitLog[]) ?? []
    const completedIds = todayLogs.map((l) => l.habit_id)
    const sessions = (sessionsRes.data as LearningSession[]) ?? []
    const summaries = (summariesRes.data as LearningSummary[]) ?? []
    const allSessions = (statsRes.data as { duration_seconds: number }[]) ?? []
    const totalSeconds = allSessions.reduce((acc, s) => acc + s.duration_seconds, 0)
    const todaySessions = sessions.filter((s) => s.created_at.startsWith(today))
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0)
    const lessons = (lessonsRes.data as TorahLesson[]) ?? []
    const savedLessonIds = ((savedRes.data as { lesson_id: string }[]) ?? []).map(
      (r) => r.lesson_id
    )
    const dailyTracks = (tracksRes.data as DailyTrack[]) ?? []

    return (
      <TorahWorkspaceClient
        userId={user.id}
        habits={habits}
        completedIds={completedIds}
        sessions={sessions}
        summaries={summaries}
        totalSeconds={totalSeconds}
        todaySeconds={todaySeconds}
        todaySessionCount={todaySessions.length}
        lessons={lessons}
        savedLessonIds={savedLessonIds}
        dailyTracks={dailyTracks}
      />
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain_slug', slug)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed_at', today),
  ])

  const habits = (habitsRes.data as Habit[]) ?? []
  const todayLogs = (logsRes.data as HabitLog[]) ?? []
  const completedIds = todayLogs.map((l) => l.habit_id)

  return (
    <DomainDetailClient
      domain={domain}
      habits={habits}
      completedIds={completedIds}
      userId={user.id}
    />
  )
}
