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
  const { domain, totalHabits, completedToday, streak } = data
  const pct =
    totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  const allDone = totalHabits > 0 && completedToday === totalHabits

  return (
    <button
      onClick={() => router.push(`/domain/${domain.slug}`)}
      className="w-full text-start active:scale-95 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'var(--card)',
        border: `1px solid ${domain.color}22`,
        borderRadius: '1rem',
        boxShadow: '0 1px 3px var(--c-shadow)',
        padding: '1rem',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-2"
            style={{ background: `${domain.color}15` }}
          >
            {domain.icon}
          </div>
          <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
            {isRTL ? domain.nameHe : domain.nameEn}
          </p>
        </div>
        <ProgressRing percentage={pct} color={domain.color} size={44} strokeWidth={3}>
          <span className="text-[10px] font-bold" style={{ color: domain.color }}>
            {pct}%
          </span>
        </ProgressRing>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 rounded-full mb-2.5 overflow-hidden" style={{ background: `${domain.color}15` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: domain.color }}
        />
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          {streak > 0 && <span>🔥 {streak}</span>}
        </div>
        {allDone ? (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${domain.color}18`, color: domain.color }}
          >
            ✓ {isRTL ? 'הושלם' : 'Done'}
          </span>
        ) : (
          <span style={{ color: 'var(--muted-foreground)' }}>{completedToday}/{totalHabits}</span>
        )}
      </div>
    </button>
  )
}
