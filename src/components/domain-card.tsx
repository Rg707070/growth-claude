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
        background: `linear-gradient(145deg, oklch(0.14 0.05 238), oklch(0.11 0.04 238))`,
        border: `1px solid ${domain.color}28`,
        borderRadius: '1.25rem',
        boxShadow: `0 0 24px ${domain.glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
        padding: '1rem',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
            style={{ background: `${domain.color}22`, border: `1px solid ${domain.color}30` }}
          >
            {domain.icon}
          </div>
          <p className="text-white font-bold text-sm leading-tight">
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
      <div className="h-1 rounded-full mb-2.5 overflow-hidden" style={{ background: `${domain.color}20` }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: domain.color }}
        />
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-white/50">
          {streak > 0 && <span>🔥 {streak}</span>}
          {xpToday > 0 && <span style={{ color: `${domain.color}cc` }}>+{xpToday} XP</span>}
        </div>
        {allDone ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${domain.color}25`, color: domain.color }}>
            ✓ {isRTL ? 'הושלם' : 'Done'}
          </span>
        ) : (
          <span className="text-white/40">{completedToday}/{totalHabits}</span>
        )}
      </div>
    </button>
  )
}
