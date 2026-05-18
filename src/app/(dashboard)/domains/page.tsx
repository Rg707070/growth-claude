'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'
import { ChevronRight } from 'lucide-react'

export default function DomainsPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()

  return (
    <div className="px-4 pt-12 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{t('allDomains')}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'בחר תחום כדי לנהל הרגלים' : 'Select a domain to manage habits'}
        </p>
      </div>

      <div className="space-y-2">
        {DOMAINS.map((domain) => (
          <button
            key={domain.slug}
            onClick={() => router.push(`/domain/${domain.slug}`)}
            className="w-full flex items-center gap-4 text-start active:scale-[0.98] transition-all duration-150"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '0.875rem 1rem',
              boxShadow: '0 1px 3px var(--c-shadow)',
            }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${domain.color}15` }}
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

            {/* Color dot + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ background: domain.color }} />
              <ChevronRight
                size={16}
                strokeWidth={2}
                style={{
                  color: 'var(--muted-foreground)',
                  transform: isRTL ? 'scaleX(-1)' : 'none',
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
