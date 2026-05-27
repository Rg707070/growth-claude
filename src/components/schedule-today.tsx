'use client'

import { useLang } from '@/lib/lang'
import { DAY_NAMES_HE, DAY_NAMES_EN } from '@/lib/schedule'
import type { ScheduleRow } from '@/lib/schedule-realtime'

const TYPE_COLORS: Record<string, string> = {
  torah:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  shiur:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  prayer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  break:  'text-white/40 bg-white/5 border-white/10',
  other:  'text-white/60 bg-white/5 border-white/10',
  sports: 'text-red-400 bg-red-500/10 border-red-500/20',
}

function getCurrentAndNext(items: ScheduleRow[]): { current: ScheduleRow | null; upcoming: ScheduleRow[] } {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  let curIdx = -1
  for (let i = items.length - 1; i >= 0; i--) {
    if (toMin(items[i].time) <= nowMin) { curIdx = i; break }
  }

  return {
    current: curIdx >= 0 ? items[curIdx] : null,
    upcoming: items.slice(curIdx + 1, curIdx + 4),
  }
}

interface ScheduleTodayProps {
  items: ScheduleRow[]
  loading?: boolean
}

export function ScheduleToday({ items, loading = false }: ScheduleTodayProps) {
  const { isRTL } = useLang()
  const day = new Date().getDay()
  const dayName = isRTL ? DAY_NAMES_HE[day] : DAY_NAMES_EN[day]
  const { current, upcoming } = getCurrentAndNext(items)
  const isEmpty = !loading && items.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          {isRTL ? `לוח יום ${dayName}` : `${dayName}'s Schedule`}
        </h2>
        {items.length > 0 && (
          <span className="text-white/30 text-xs">{items.length} פריטים</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-xl animate-pulse bg-white/5" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5">
          <p className="text-white/30 text-sm">
            {isRTL ? 'אין לוז כרגע' : 'No schedule right now'}
          </p>
        </div>
      ) : (
        <>
          {current && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${TYPE_COLORS[current.type] ?? TYPE_COLORS.other}`}>
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

          {upcoming.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5"
              style={{ opacity: 1 - i * 0.2 }}
            >
              <span className="text-white/30 text-xs font-mono flex-shrink-0 w-10">{item.time}</span>
              <p className="text-sm text-white/70 truncate">{item.label}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
