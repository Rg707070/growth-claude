import { BottomNav } from '@/components/bottom-nav'
import { FAB } from '@/components/fab'
import { NightCheckIn } from '@/components/night-checkin'
import { DashboardMain } from '@/components/dashboard-main'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardMain>{children}</DashboardMain>
      <BottomNav />
      <FAB />
      <NightCheckIn />
    </div>
  )
}
