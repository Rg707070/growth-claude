import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { DomainEcosystemClient } from './domain-ecosystem-client'
import { TorahWorkspaceClient } from '@/components/torah/torah-workspace-client'
import { FinanceClient } from './finance-client'
import { FriendsClient } from './friends-client'
import { SportsClient } from './sports-client'
import type { Habit, HabitLog, LearningSession, LearningSummary, TorahLesson, DailyTrack } from '@/types'
import type { DomainTask, DomainGoal } from '@/types/ecosystem'
import type { FinanceTransaction, FinanceWishlistItem } from '@/types/finance'
import type { FriendContact, FriendInteraction } from '@/types/friends'
import type { SportWorkoutLog, SportFoodRestriction, SportChallenge } from '@/types/sports'

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

  if (slug === 'finance') {
    const today = new Date().toISOString().split('T')[0]
    const [habitsRes, logsRes, txRes, wishlistRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'finance').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('finance_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200),
      supabase.from('finance_wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const transactions = (txRes.data as FinanceTransaction[]) ?? []
    const wishlist = (wishlistRes.data as FinanceWishlistItem[]) ?? []
    const schemaReady = !txRes.error && !wishlistRes.error
    return (
      <FinanceClient
        domain={domain!}
        habits={habits}
        completedIds={completedIds}
        userId={user.id}
        transactions={transactions}
        wishlist={wishlist}
        schemaReady={schemaReady}
      />
    )
  }

  if (slug === 'friends') {
    const today = new Date().toISOString().split('T')[0]
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 31)
    const monthAgoStr = monthAgo.toISOString().split('T')[0]
    const [habitsRes, logsRes, contactsRes, interactionsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'friends').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('friend_contacts').select('*').eq('user_id', user.id).order('name', { ascending: true }),
      supabase.from('friend_interactions').select('*').eq('user_id', user.id).gte('date', monthAgoStr).order('date', { ascending: false }),
    ])
    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const contacts = (contactsRes.data as FriendContact[]) ?? []
    const interactions = (interactionsRes.data as FriendInteraction[]) ?? []
    const schemaReady = !contactsRes.error && !interactionsRes.error
    return (
      <FriendsClient
        domain={domain!}
        habits={habits}
        completedIds={completedIds}
        userId={user.id}
        contacts={contacts}
        interactions={interactions}
        schemaReady={schemaReady}
      />
    )
  }

  if (slug === 'sports') {
    const today = new Date().toISOString().split('T')[0]
    const [habitsRes, logsRes, workoutRes, foodRes, challengesRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'sports').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('sport_workout_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(365),
      supabase.from('sport_food_restrictions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('sport_challenges').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const workoutLogs = (workoutRes.data as SportWorkoutLog[]) ?? []
    const foodRestrictions = (foodRes.data as SportFoodRestriction[]) ?? []
    const challenges = (challengesRes.data as SportChallenge[]) ?? []
    const schemaReady = !workoutRes.error && !foodRes.error && !challengesRes.error
    return (
      <SportsClient
        domain={domain!}
        habits={habits}
        completedIds={completedIds}
        userId={user.id}
        workoutLogs={workoutLogs}
        foodRestrictions={foodRestrictions}
        challenges={challenges}
        schemaReady={schemaReady}
      />
    )
  }

  const today = new Date().toISOString().split('T')[0]

  const [habitsRes, logsRes, tasksRes, goalsRes] = await Promise.all([
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
    supabase
      .from('domain_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain_slug', slug)
      .order('created_at', { ascending: false }),
    supabase
      .from('domain_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain_slug', slug)
      .order('created_at', { ascending: false }),
  ])

  const habits = (habitsRes.data as Habit[]) ?? []
  const todayLogs = (logsRes.data as HabitLog[]) ?? []
  const completedIds = todayLogs.map((l) => l.habit_id)
  const tasks = (tasksRes.data as DomainTask[]) ?? []
  const goals = (goalsRes.data as DomainGoal[]) ?? []
  const schemaReady = !tasksRes.error && !goalsRes.error

  return (
    <DomainEcosystemClient
      domain={domain!}
      habits={habits}
      completedIds={completedIds}
      userId={user.id}
      tasks={tasks}
      goals={goals}
      schemaReady={schemaReady}
    />
  )
}
