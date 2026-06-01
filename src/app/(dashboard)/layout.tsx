import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import { FAB } from '@/components/fab'
import { NightCheckIn } from '@/components/night-checkin'
import { DashboardMain } from '@/components/dashboard-main'
import { Sidebar } from '@/components/sidebar'
import { ToastProvider } from '@/components/ui/toast'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile: Profile = (profileData as Profile) ?? {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    last_activity_date: null,
    created_at: new Date().toISOString(),
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <Sidebar profile={profile} />
        <DashboardMain>{children}</DashboardMain>
        <BottomNav />
        <FAB />
        <NightCheckIn />
      </div>
    </ToastProvider>
  )
}
