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
  const { isRTL } = useLang()
  const { domain, totalHabits, completedToday, streak } = data
  const pct =
    totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

  const allDone = totalHabits > 0 && completedToday === totalHabits

  return (
    <button
      onClick={() => router.push(`/domain/${domain.slug}`)}
      className="group relative w-full text-start active:scale-[0.98] transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--c-border)',
        borderRadius: '1.1rem',
        boxShadow: '0 1px 2px var(--c-shadow), 0 4px 12px var(--c-shadow)',
        padding: '1rem',
      }}
    >
      {/* Subtle accent stripe along start edge */}
      <span
        aria-hidden
        className="absolute inset-y-3 w-[3px] rounded-full opacity-90 transition-all group-hover:opacity-100 group-hover:w-1"
        style={{
          insetInlineStart: 0,
          background: `linear-gradient(180deg, ${domain.color} 0%, ${domain.color}80 100%)`,
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-3 ps-2">
        <div className="flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-2 transition-transform group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${domain.color}1f, ${domain.color}10)`,
              border: `1px solid ${domain.color}26`,
            }}
          >
            <span>{domain.icon}</span>
          </div>
          <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--foreground)' }}>
            {isRTL ? domain.nameHe : domain.nameEn}
          </p>
        </div>
        <ProgressRing percentage={pct} color={domain.color} size={46} strokeWidth={3.5}>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: domain.color }}>
            {pct}%
          </span>
        </ProgressRing>
      </div>

      {/* Progress bar */}
      <div className="ps-2">
        <div
          className="h-1 rounded-full mb-2.5 overflow-hidden"
          style={{ background: `${domain.color}14` }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${domain.color} 0%, ${domain.color}dd 100%)`,
            }}
          />
        </div>

        {/* Bottom stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 font-semibold">
                <span className="animate-flame text-[0.95em] leading-none">🔥</span>
                <span className="tabular-nums">{streak}</span>
              </span>
            )}
          </div>
          {allDone ? (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${domain.color}1f`, color: domain.color }}
            >
              ✓ {isRTL ? 'הושלם' : 'Done'}
            </span>
          ) : (
            <span className="tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {completedToday}/{totalHabits}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
