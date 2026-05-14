import { BottomNav } from '@/components/bottom-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto pb-24">{children}</main>
      <BottomNav />
    </div>
  )
}
