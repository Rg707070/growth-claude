'use client'

import { useLang } from '@/lib/lang'
import {
  getTodaySchedule,
  getCurrentAndNextItems,
  DAY_NAMES_HE,
  DAY_NAMES_EN,
} from '@/lib/schedule'

const TYPE_COLORS = {
  torah: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  shiur: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  prayer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  break: 'text-white/40 bg-white/5 border-white/10',
  other: 'text-white/60 bg-white/5 border-white/10',
}

export function ScheduleToday() {
  const { isRTL } = useLang()
  const day = new Date().getDay()
  const allItems = getTodaySchedule()
  const { current, upcoming } = getCurrentAndNextItems()
  const dayName = isRTL ? DAY_NAMES_HE[day] : DAY_NAMES_EN[day]

  if (allItems.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          {isRTL ? `לוח יום ${dayName}` : `${dayName}'s Schedule`}
        </h2>
        <span className="text-white/30 text-xs">{allItems.length} פריטים</span>
      </div>

      {/* Current item */}
      {current && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${TYPE_COLORS[current.type]}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] opacity-60 font-mono">{current.time}</p>
            <p className="text-sm font-semibold truncate">{current.label}</p>
          </div>
          <span className="text-[10px] opacity-60 flex-shrink-0">
            {isRTL ? 'עכשיו' : 'now'}
          </span>
        </div>
      )}

      {/* Upcoming items */}
      {upcoming.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5"
          style={{ opacity: 1 - i * 0.2 }}
        >
          <span className="text-white/30 text-xs font-mono flex-shrink-0 w-10">{item.time}</span>
          <p className="text-sm text-white/70 truncate">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
