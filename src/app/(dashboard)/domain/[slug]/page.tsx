import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { DomainEcosystemClient } from './domain-ecosystem-client'
import { TorahWorkspaceClient } from '@/components/torah/torah-workspace-client'
import { FinanceClient } from './finance-client'
import { FriendsClient } from './friends-client'
import { SportsClient } from './sports-client'
import { SecularClient } from './secular-client'
import { MusicClient } from './music-client'
import type { Habit, HabitLog, LearningSession, LearningSummary, DailyTrack } from '@/types'
import type { DomainTask, DomainGoal } from '@/types/ecosystem'
import type { FinanceTransaction, FinanceWishlistItem } from '@/types/finance'
import type { FriendContact, FriendInteraction, FriendReminder } from '@/types/friends'
import type { SportWorkoutLog, SportFoodRestriction, SportChallenge } from '@/types/sports'
import type { SecularBook, SecularProject } from '@/types/secular'
import type { MusicPracticeLog, MusicSong } from '@/types/music'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DomainPage({ params }: Props) {
  const { slug } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let domain = getDomainBySlug(slug)

  if (!domain) {
    const { data: ud } = await supabase
      .from('user_domains')
      .select('*')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .single()
    if (!ud) redirect('/domains')
    domain = {
      slug: ud.slug,
      nameHe: ud.name,
      nameEn: ud.name,
      icon: ud.icon,
      color: ud.color,
      gradient: '',
      glowColor: `${ud.color}33`,
    }
  }

  if (slug === 'torah') {
    const today = new Date().toISOString().split('T')[0]
    const [habitsRes, logsRes, sessionsRes, summariesRes, tracksRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'torah').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('learning_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('learning_summaries').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(20),
      supabase.from('torah_daily_tracks').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }),
    ])

    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const sessions = (sessionsRes.data as LearningSession[]) ?? []
    const summaries = (summariesRes.data as LearningSummary[]) ?? []
    const todaySessions = sessions.filter((s) => s.created_at.startsWith(today))
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0)
    const dailyTracks = (tracksRes.data as DailyTrack[]) ?? []

    return (
      <TorahWorkspaceClient
        userId={user.id}
        habits={habits}
        completedIds={completedIds}
        sessions={sessions}
        summaries={summaries}
        todaySeconds={todaySeconds}
        todaySessionCount={todaySessions.length}
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
    const [habitsRes, logsRes, contactsRes, interactionsRes, remindersRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'friends').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('friend_contacts').select('*').eq('user_id', user.id).order('name', { ascending: true }),
      supabase.from('friend_interactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(2000),
      supabase.from('friend_reminders').select('*').eq('user_id', user.id).eq('done', false).order('remind_on', { ascending: true }),
    ])
    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const contacts = (contactsRes.data as FriendContact[]) ?? []
    const interactions = (interactionsRes.data as FriendInteraction[]) ?? []
    const reminders = (remindersRes.data as FriendReminder[]) ?? []
    const schemaReady = !contactsRes.error && !interactionsRes.error && !remindersRes.error
    return (
      <FriendsClient
        domain={domain!}
        habits={habits}
        completedIds={completedIds}
        userId={user.id}
        contacts={contacts}
        interactions={interactions}
        reminders={reminders}
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

  if (slug === 'secular') {
    const today = new Date().toISOString().split('T')[0]
    const [habitsRes, logsRes, booksRes, projectsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'secular').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('secular_books').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('secular_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const books = (booksRes.data as SecularBook[]) ?? []
    const projects = (projectsRes.data as SecularProject[]) ?? []
    const schemaReady = !booksRes.error && !projectsRes.error
    return (
      <SecularClient
        domain={domain!}
        habits={habits}
        completedIds={completedIds}
        userId={user.id}
        books={books}
        projects={projects}
        schemaReady={schemaReady}
      />
    )
  }

  if (slug === 'music') {
    const today = new Date().toISOString().split('T')[0]
    const [habitsRes, logsRes, practiceRes, songsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('domain_slug', 'music').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
      supabase.from('music_practice_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(365),
      supabase.from('music_songs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    const habits = (habitsRes.data as Habit[]) ?? []
    const completedIds = ((logsRes.data as HabitLog[]) ?? []).map((l) => l.habit_id)
    const practiceLogs = (practiceRes.data as MusicPracticeLog[]) ?? []
    const songs = (songsRes.data as MusicSong[]) ?? []
    const schemaReady = !practiceRes.error && !songsRes.error
    return (
      <MusicClient
        domain={domain!}
        habits={habits}
        completedIds={completedIds}
        userId={user.id}
        practiceLogs={practiceLogs}
        songs={songs}
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
