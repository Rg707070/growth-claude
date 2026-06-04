'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'

interface Crumb {
  label: string
  href?: string
}

function useCrumbs(): { title: string; crumbs: Crumb[] } {
  const pathname = usePathname()
  const { isRTL } = useLang()

  const t = (he: string, en: string) => (isRTL ? he : en)

  if (pathname === '/dashboard') {
    return { title: t('בית', 'Home'), crumbs: [{ label: t('בית', 'Home') }] }
  }
  if (pathname === '/domains') {
    return { title: t('תחומים', 'Domains'), crumbs: [{ label: t('תחומים', 'Domains') }] }
  }
  if (pathname === '/journal' || pathname.startsWith('/journal')) {
    return { title: t('יומן', 'Journal'), crumbs: [{ label: t('יומן', 'Journal') }] }
  }
  if (pathname === '/schedule' || pathname.startsWith('/schedule')) {
    return { title: t('לו"ז', 'Schedule'), crumbs: [{ label: t('לו"ז', 'Schedule') }] }
  }
  if (pathname === '/reading' || pathname.startsWith('/reading')) {
    return { title: t('ספרים', 'Books'), crumbs: [{ label: t('ספרים', 'Books') }] }
  }
  if (pathname === '/settings') {
    return { title: t('הגדרות', 'Settings'), crumbs: [{ label: t('הגדרות', 'Settings') }] }
  }
  if (pathname.startsWith('/domain/')) {
    const slug = pathname.split('/')[2]
    const domain = DOMAINS.find((d) => d.slug === slug)
    if (domain) {
      return {
        title: isRTL ? domain.nameHe : domain.nameEn,
        crumbs: [
          { label: t('תחומים', 'Domains'), href: '/domains' },
          { label: isRTL ? domain.nameHe : domain.nameEn },
        ],
      }
    }
  }
  return { title: '', crumbs: [] }
}

export function DesktopTopBar() {
  const { isRTL } = useLang()
  const router = useRouter()
  const { title, crumbs } = useCrumbs()

  if (!title) return null

  const now = new Date()
  const dateStr = now.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <header
      className="hidden md:flex sticky top-0 z-30 items-center justify-between gap-6 px-8 xl:px-12 h-16"
      style={{
        background: 'var(--c-nav)',
        borderBottom: '1px solid var(--c-nav-border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex flex-col min-w-0">
        {crumbs.length > 1 && (
          <div className="flex items-center gap-1 text-[11px] mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {c.href ? (
                  <button
                    onClick={() => router.push(c.href!)}
                    className="hover:underline transition-colors"
                  >
                    {c.label}
                  </button>
                ) : (
                  <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>{c.label}</span>
                )}
                {i < crumbs.length - 1 && (
                  <ChevronRight
                    size={12}
                    style={{ transform: isRTL ? 'scaleX(-1)' : 'none', opacity: 0.5 }}
                  />
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-base font-bold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>
      </div>

      <div className="text-xs font-medium tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
        {dateStr}
      </div>
    </header>
  )
}
