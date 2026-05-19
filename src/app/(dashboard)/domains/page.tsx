'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'
import { ChevronRight } from 'lucide-react'

export default function DomainsPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()

  return (
    <div className="px-4 pt-12 pb-28 space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>{t('allDomains')}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'בחר תחום כדי לנהל הרגלים' : 'Select a domain to manage habits'}
        </p>
      </div>

      <div className="space-y-2">
        {DOMAINS.map((domain) => (
          <button
            key={domain.slug}
            onClick={() => router.push(`/domain/${domain.slug}`)}
            className="group relative w-full flex items-center gap-4 text-start active:scale-[0.98] transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
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
              className="absolute inset-y-3 w-1 rounded-full opacity-90 transition-all"
              style={{
                insetInlineStart: 0,
                background: `linear-gradient(180deg, ${domain.color}, ${domain.color}80)`,
              }}
            />

            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-105 ms-1"
              style={{
                background: `linear-gradient(135deg, ${domain.color}1f, ${domain.color}10)`,
                border: `1px solid ${domain.color}26`,
              }}
            >
              {domain.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
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
              className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
