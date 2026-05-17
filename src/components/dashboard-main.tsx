'use client'

import { usePathname } from 'next/navigation'

const WIDE_ROUTES = ['/domain/trading']

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWide = WIDE_ROUTES.some((r) => pathname?.startsWith(r))

  return (
    <main
      className={
        isWide
          ? 'pb-24 md:pb-8 md:ps-64'
          : 'max-w-md mx-auto pb-24 md:max-w-none md:mx-0 md:ps-64 md:pb-8'
      }
    >
      <div className={isWide ? '' : 'md:max-w-6xl md:mx-auto md:px-8'}>
        {children}
      </div>
    </main>
  )
}
