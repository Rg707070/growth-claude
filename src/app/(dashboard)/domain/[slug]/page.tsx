import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDomainBySlug } from '@/lib/domains'
import { DomainDetailClient } from './domain-detail-client'
import type { Habit, HabitLog } from '@/types'

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
