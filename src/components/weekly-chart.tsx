'use client'

import { useLang } from '@/lib/lang'

interface DayXP {
  date: string // ISO yyyy-mm-dd
  xp: number
}

interface WeeklyChartProps {
  days: DayXP[]
}

const DAY_NAMES_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAY_NAMES_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function WeeklyChart({ days }: WeeklyChartProps) {
  const { isRTL } = useLang()
  const maxXP = Math.max(...days.map((d) => d.xp), 1)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-500/5 border border-blue-500/20 shadow-[0_0_16px_rgba(59,130,246,0.1)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📊</span>
        <span className="text-blue-300 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? 'XP שבועי' : 'Weekly XP'}
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {days.map((d) => {
          const pct = Math.round((d.xp / maxXP) * 100)
          const isToday = d.date === today
          const dayOfWeek = new Date(d.date + 'T12:00:00').getDay()
          const label = isRTL ? DAY_NAMES_HE[dayOfWeek] : DAY_NAMES_EN[dayOfWeek]
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-white/40 font-mono">{d.xp > 0 ? d.xp : ''}</span>
              <div className="w-full flex items-end" style={{ height: '52px' }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-700 ${
                    isToday
                      ? 'bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                      : d.xp > 0
                      ? 'bg-gradient-to-t from-blue-600 to-blue-400'
                      : 'bg-white/8'
                  }`}
                  style={{ height: `${Math.max(pct, d.xp > 0 ? 8 : 3)}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-cyan-300' : 'text-white/40'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
