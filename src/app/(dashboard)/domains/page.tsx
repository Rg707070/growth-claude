'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'

export default function DomainsPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()

  return (
    <div className="px-4 pt-12 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">{t('allDomains')}</h1>
        <p className="text-white/40 text-sm mt-0.5">
          {isRTL ? 'בחר תחום כדי לנהל הרגלים' : 'Select a domain to manage habits'}
        </p>
      </div>

      <div className="space-y-2.5">
        {DOMAINS.map((domain, i) => (
          <button
            key={domain.slug}
            onClick={() => router.push(`/domain/${domain.slug}`)}
            className="w-full flex items-center gap-4 text-start active:scale-[0.98] transition-all duration-200"
            style={{
              background: 'var(--c-surface)',
              border: `1px solid ${domain.color}22`,
              borderRadius: '1.25rem',
              padding: '0.875rem 1rem',
              boxShadow: `0 2px 12px rgba(0,0,0,0.3), 0 0 0 0 ${domain.glowColor}`,
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${domain.color}20`, border: `1.5px solid ${domain.color}35` }}
            >
              {domain.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight">
                {isRTL ? domain.nameHe : domain.nameEn}
              </p>
              <p className="text-white/35 text-xs mt-0.5">
                {isRTL ? 'לחץ לניהול הרגלים' : 'Tap to manage habits'}
              </p>
            </div>

            {/* Color accent + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full" style={{ background: domain.color }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-white/20"
                style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
