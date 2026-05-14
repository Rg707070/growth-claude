'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'

export default function DomainsPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()

  return (
    <div className="px-4 pt-12 space-y-6">
      <h1 className="text-xl font-bold text-white">{t('allDomains')}</h1>
      <div className="space-y-2">
        {DOMAINS.map((domain) => (
          <button
            key={domain.slug}
            onClick={() => router.push(`/domain/${domain.slug}`)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${domain.gradient} border border-white/10 active:scale-98 transition-transform text-start`}
          >
            <span className="text-3xl">{domain.icon}</span>
            <span className="text-white font-semibold">
              {isRTL ? domain.nameHe : domain.nameEn}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
