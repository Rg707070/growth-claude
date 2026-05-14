'use client'

import { useRouter } from 'next/navigation'
import { ProgressRing } from './progress-ring'
import { useLang } from '@/lib/lang'
import type { DomainProgress } from '@/types'

interface DomainCardProps {
  data: DomainProgress
}

export function DomainCard({ data }: DomainCardProps) {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const { domain, totalHabits, completedToday, streak, xpToday } = data
  const pct =
    totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  return (
    <button
      onClick={() => router.push(`/domain/${domain.slug}`)}
      className={`w-full p-4 rounded-2xl bg-gradient-to-br ${domain.gradient} border border-white/10 text-start active:scale-95 transition-all duration-200 hover:scale-[1.02]`}
      style={{ boxShadow: `0 0 22px ${domain.glowColor}, 0 4px 16px rgba(0,0,0,0.4)` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-2xl leading-none">{domain.icon}</span>
          <p className="text-white font-semibold mt-1.5 text-sm leading-tight">
            {isRTL ? domain.nameHe : domain.nameEn}
          </p>
        </div>
        <ProgressRing percentage={pct} color={domain.color} size={52} strokeWidth={4}>
          <span className="text-[10px] font-bold text-white">{pct}%</span>
        </ProgressRing>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
        {streak > 0 && (
          <span>
            🔥 {streak} {t('days')}
          </span>
        )}
        {xpToday > 0 && (
          <span>
            +{xpToday} {t('xp')}
          </span>
        )}
        <span>
          {completedToday}/{totalHabits}
        </span>
      </div>
    </button>
  )
}
