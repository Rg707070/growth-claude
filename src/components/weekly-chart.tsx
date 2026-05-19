'use client'

import { useLang } from '@/lib/lang'

interface DayActivity {
  date: string
  count: number
}

interface WeeklyChartProps {
  days: DayActivity[]
}

const DAY_NAMES_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAY_NAMES_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function WeeklyChart({ days }: WeeklyChartProps) {
  const { isRTL } = useLang()
  const maxCount = Math.max(...days.map((d) => d.count), 1)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--c-border)',
        boxShadow: '0 1px 3px var(--c-shadow)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg leading-none">📊</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'פעילות שבועית' : 'Weekly Activity'}
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {days.map((d) => {
          const pct = Math.round((d.count / maxCount) * 100)
          const isToday = d.date === today
          const dayOfWeek = new Date(d.date + 'T12:00:00').getDay()
          const label = isRTL ? DAY_NAMES_HE[dayOfWeek] : DAY_NAMES_EN[dayOfWeek]
          const hasActivity = d.count > 0
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span
                className="text-[9px] font-mono tabular-nums"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {d.count > 0 ? d.count : ''}
              </span>
              <div className="w-full flex items-end" style={{ height: '52px' }}>
                <div
                  className="w-full rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${Math.max(pct, hasActivity ? 8 : 3)}%`,
                    background: isToday
                      ? 'var(--brand-gradient)'
                      : hasActivity
                        ? 'linear-gradient(180deg, var(--primary-light) 0%, var(--primary) 100%)'
                        : 'var(--c-surface-2)',
                    boxShadow: isToday ? '0 4px 12px var(--c-shadow-md)' : 'none',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isToday ? 'var(--primary)' : 'var(--muted-foreground)',
                  fontWeight: isToday ? 700 : 500,
                }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
