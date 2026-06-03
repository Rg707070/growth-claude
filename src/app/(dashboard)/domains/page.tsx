'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'
import { ChevronRight, LayoutGrid } from 'lucide-react'

export default function DomainsPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 md:max-w-none md:px-0 md:py-8">
        {/* Mobile-only header (desktop has topbar) */}
        <div className="flex items-center gap-3 md:hidden">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
          >
            <LayoutGrid size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{t('allDomains')}</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'בחר תחום כדי לנהל הרגלים' : 'Select a domain to manage habits'}
            </p>
          </div>
        </div>

        {/* Desktop subheading */}
        <p className="hidden md:block text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'בחר תחום כדי לנהל הרגלים ומשימות' : 'Select a domain to manage habits and tasks'}
        </p>

        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3 xl:grid-cols-4">
          {DOMAINS.map((domain) => (
            <button
              key={domain.slug}
              onClick={() => router.push(`/domain/${domain.slug}`)}
              className="group relative w-full flex items-center gap-4 text-start active:scale-[0.98] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden md:flex-col md:items-start md:gap-3"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--c-border)',
                borderRadius: '1.1rem',
                padding: '0.95rem 1.1rem',
                boxShadow: '0 1px 3px var(--c-shadow)',
              }}
            >
              {/* Accent stripe (start edge) */}
              <span
                aria-hidden
                className="absolute inset-y-3 w-1 rounded-full opacity-90 transition-all md:inset-x-3 md:inset-y-auto md:top-0 md:h-1 md:w-auto"
                style={{
                  insetInlineStart: 0,
                  background: `linear-gradient(180deg, ${domain.color}, ${domain.color}80)`,
                }}
              />

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-105 ms-1 md:ms-0 md:w-14 md:h-14 md:text-2xl md:mt-2"
                style={{
                  background: `linear-gradient(135deg, ${domain.color}1f, ${domain.color}10)`,
                  border: `1px solid ${domain.color}26`,
                }}
              >
                {domain.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 md:w-full">
                <p className="font-semibold text-base leading-tight" style={{ color: 'var(--foreground)' }}>
                  {isRTL ? domain.nameHe : domain.nameEn}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {isRTL ? 'לחץ לניהול הרגלים' : 'Tap to manage habits'}
                </p>
              </div>

              <ChevronRight
                size={18}
                strokeWidth={2}
                style={{
                  color: 'var(--muted-foreground)',
                  transform: isRTL ? 'scaleX(-1)' : 'none',
                }}
                className="flex-shrink-0 transition-transform group-hover:translate-x-0.5 md:hidden"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
