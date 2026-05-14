'use client'

import { WEEKLY_SCHEDULE, DAY_NAMES_HE } from '@/lib/schedule'

const TYPE_STYLE: Record<string, string> = {
  torah:  'bg-amber-400/20 text-amber-200 border-amber-400/30',
  shiur:  'bg-sky-400/20 text-sky-200 border-sky-400/30',
  prayer: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
  sports: 'bg-red-400/20 text-red-200 border-red-400/30',
  break:  'bg-white/5 text-white/40 border-white/10',
  other:  'bg-white/5 text-white/50 border-white/10',
}

const DAYS = [0, 1, 2, 3, 4, 5] // ראשון–שישי

// Collect all unique time slots across all days, sorted
const ALL_TIMES = [...new Set(
  DAYS.flatMap((d) => (WEEKLY_SCHEDULE[d] ?? []).map((i) => i.time))
)].sort((a, b) => {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return ah * 60 + am - (bh * 60 + bm)
})

// Lookup: cell(time, day)
function getItem(time: string, day: number) {
  return (WEEKLY_SCHEDULE[day] ?? []).find((i) => i.time === time)
}

interface Props {
  byDay?: Record<number, unknown>
  userId?: string
  dayNames?: string[]
}

export function SchedulePageClient(_props: Props) {
  const todayDay = new Date().getDay()

  return (
    <div className="pt-12 pb-32">
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold text-white">לוח זמנים</h1>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: '480px', width: '100%' }}>
          {/* Header */}
          <thead>
            <tr className="border-b border-white/10">
              {/* Time header */}
              <th className="sticky right-0 z-10 bg-[oklch(0.08_0.035_240)] w-12 py-2.5 text-right pr-3">
                <span className="text-white/25 text-[9px] font-semibold">שעה</span>
              </th>
              {/* Day headers — RTL order */}
              {DAYS.map((d) => {
                const isToday = d === todayDay
                return (
                  <th key={d} className="py-2.5 px-1 text-center min-w-[70px]">
                    <span className={`text-xs font-bold ${isToday ? 'text-cyan-400' : 'text-white/40'}`}>
                      {DAY_NAMES_HE[d]}
                    </span>
                    {isToday && (
                      <div className="w-1 h-1 rounded-full bg-cyan-400 mx-auto mt-0.5" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {ALL_TIMES.map((time, ti) => (
              <tr
                key={time}
                className={`border-b border-white/5 ${ti % 2 === 0 ? 'bg-white/[0.015]' : ''}`}
              >
                {/* Time cell — sticky right */}
                <td className="sticky right-0 z-10 bg-inherit py-1.5 pr-3 text-right align-middle">
                  <span className="text-white/30 text-[10px] font-mono tabular-nums">{time}</span>
                </td>

                {/* Day cells */}
                {DAYS.map((d) => {
                  const item = getItem(time, d)
                  return (
                    <td key={d} className="py-1 px-1 align-middle">
                      {item ? (
                        <div
                          className={`rounded-md px-1.5 py-1.5 text-center border text-[10px] font-medium leading-snug ${TYPE_STYLE[item.type] ?? TYPE_STYLE.other}`}
                          dir="rtl"
                        >
                          {item.label}
                        </div>
                      ) : (
                        <div className="h-6" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-4 mt-4" dir="rtl">
        {[
          { type: 'torah',  label: 'תורה'  },
          { type: 'shiur',  label: 'שיעור' },
          { type: 'prayer', label: 'תפילה' },
          { type: 'sports', label: 'ספורט' },
          { type: 'break',  label: 'הפסקה' },
          { type: 'other',  label: 'אחר'   },
        ].map(({ type, label }) => (
          <div key={type} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] ${TYPE_STYLE[type]}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
