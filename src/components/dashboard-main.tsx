'use client'

import { usePathname } from 'next/navigation'

const WIDE_ROUTES = ['/domain/trading']

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWide = WIDE_ROUTES.some((r) => pathname?.startsWith(r))

  return (
    <main className={isWide ? 'pb-24' : 'max-w-md mx-auto pb-24'}>
      {children}
    </main>
  )
}
