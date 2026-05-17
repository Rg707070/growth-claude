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

  const allDone = totalHabits > 0 && completedToday === totalHabits

  return (
    <button
      onClick={() => router.push(`/domain/${domain.slug}`)}
      className="w-full text-start active:scale-95 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'var(--c-surface)',
        border: `1px solid ${domain.color}35`,
        borderRadius: '1.25rem',
        boxShadow: `0 0 16px ${domain.glowColor}, 0 2px 10px var(--c-shadow)`,
        padding: '1rem',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
            style={{ background: `${domain.color}18`, border: `1px solid ${domain.color}35` }}
          >
            {domain.icon}
          </div>
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
            {isRTL ? domain.nameHe : domain.nameEn}
          </p>
        </div>
        <ProgressRing percentage={pct} color={domain.color} size={48} strokeWidth={3.5}>
          <span className="text-[10px] font-black" style={{ color: domain.color }}>
            {pct}%
          </span>
        </ProgressRing>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full mb-2.5 overflow-hidden" style={{ background: `${domain.color}18` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: domain.color }}
        />
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
          {streak > 0 && <span>🔥 {streak}</span>}
          {xpToday > 0 && <span style={{ color: `${domain.color}cc` }}>+{xpToday} XP</span>}
        </div>
        {allDone ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${domain.color}20`, color: domain.color }}>
            ✓ {isRTL ? 'הושלם' : 'Done'}
          </span>
        ) : (
          <span style={{ color: 'var(--muted-foreground)' }}>{completedToday}/{totalHabits}</span>
        )}
      </div>
    </button>
  )
}
