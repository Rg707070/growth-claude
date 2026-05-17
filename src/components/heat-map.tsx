'use client'

import { useLang } from '@/lib/lang'

interface DayData {
  date: string
  pct: number // 0-100
}

interface HeatMapProps {
  days: DayData[]
}

function pctToColor(pct: number): string {
  if (pct === 0)  return 'rgba(255,255,255,0.06)'
  if (pct < 30)   return 'rgba(52,211,153,0.20)'
  if (pct < 60)   return 'rgba(52,211,153,0.45)'
  if (pct < 90)   return 'rgba(52,211,153,0.70)'
  return 'rgba(52,211,153,0.95)'
}

export function HeatMap({ days }: HeatMapProps) {
  const { isRTL } = useLang()

  // Pad to full weeks (rows of 7)
  const cells = [...days]
  while (cells.length % 7 !== 0) cells.unshift({ date: '', pct: -1 })

  const weeks: DayData[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const dayLabels = isRTL
    ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🗓</span>
        <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? '12 שבועות אחרונים' : 'Last 12 Weeks'}
        </span>
      </div>

      {/* Day labels */}
      <div className="flex gap-1 mb-1 px-[2px]">
        {dayLabels.map((d) => (
          <div key={d} className="flex-1 text-center text-[8px] text-white/25 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                title={day.date ? `${day.date}: ${day.pct}%` : ''}
                className="flex-1 aspect-square rounded-sm transition-all"
                style={{
                  backgroundColor: day.pct < 0 ? 'transparent' : pctToColor(day.pct),
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[9px] text-white/25">{isRTL ? 'פחות' : 'Less'}</span>
        {[0, 25, 50, 75, 100].map((v) => (
          <div
            key={v}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: pctToColor(v) }}
          />
        ))}
        <span className="text-[9px] text-white/25">{isRTL ? 'יותר' : 'More'}</span>
      </div>
    </div>
  )
}
