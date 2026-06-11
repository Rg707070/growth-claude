import { DesktopTopBar } from '@/components/desktop-topbar'

export function DashboardMain({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:ps-72 xl:ps-80">
      <DesktopTopBar />
      <main className="max-w-md mx-auto pb-safe-nav md:max-w-none md:mx-0 md:pb-12">
        <div className="md:max-w-6xl md:mx-auto md:px-8 xl:max-w-7xl xl:px-12">{children}</div>
      </main>
    </div>
  )
}
