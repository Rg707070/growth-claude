'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/theme'

// Index 0 = Sunday. In RTL grid, index 0 renders on the RIGHT → Sunday on right = correct for Israeli calendar.
const HE_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function fmtHe(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', opts).format(date)
}

function getHebrewDayNum(date: Date): number {
  return parseInt(new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric' }).format(date))
}

function LegendItem({ bg, border, label, fg }: { bg: string; border: string; label: string; fg: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded-md" style={{ background: bg, border: `1px solid ${border}` }} />
      <span className="text-[9px]" style={{ color: fg }}>{label}</span>
    </div>
  )
}

export function HebrewCalendar() {
  const { isDark } = useTheme()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y: number) => y - 1); setViewMonth(11) }
    else setViewMonth((m: number) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y: number) => y + 1); setViewMonth(0) }
    else setViewMonth((m: number) => m + 1)
  }
  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const firstDay = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  // Build grid cells: null = empty padding slot
  const cells: (Date | null)[] = []
  const pad = firstDay.getDay()
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)

  // Collect distinct Hebrew months in this Gregorian month for the header
  const heMonths: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const name = fmtHe(new Date(viewYear, viewMonth, d), { month: 'long' })
    if (!heMonths.includes(name)) heMonths.push(name)
  }
  const heYear = fmtHe(new Date(viewYear, viewMonth, 15), { year: 'numeric' })
  const gregLabel = firstDay.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  const heLabel = `${heMonths.join(' – ')} ${heYear}`

  const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${Math.min(0.9, a * 2)})`

  return (
    <div dir="rtl" className="px-3 py-3 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 200px)' }}>

      {/* Month header */}
      <div className="flex items-center mb-3">
        <button onClick={nextMonth} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ color: fg(0.4) }}>
          <ChevronRight size={20} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-black" style={{ color: fg(0.88) }}>{gregLabel}</p>
          <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'rgb(103,232,249)' }}>{heLabel}</p>
        </div>
        <button onClick={prevMonth} className="p-2 rounded-xl active:scale-90 transition-transform" style={{ color: fg(0.4) }}>
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Return-to-today button */}
      {!isCurrentMonth && (
        <div className="flex justify-center mb-3">
          <button
            onClick={goToday}
            className="px-4 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
            style={{ background: 'rgba(34,211,238,0.10)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.25)' }}
          >
            חזור להיום
          </button>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {HE_DAYS.map((label, i) => (
          <div key={i} className="flex justify-center py-1">
            <span className="text-[10px] font-bold" style={{ color: i === 6 ? 'rgba(248,113,113,0.65)' : fg(0.28) }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} style={{ minHeight: '52px' }} />

          const isToday = date.getTime() === today.getTime()
          const isSat = date.getDay() === 6
          const hDayStr = fmtHe(date, { day: 'numeric' })
          const hDayNum = getHebrewDayNum(date)
          const isRoshChodesh = hDayNum === 1

          const cellBg = isToday
            ? 'rgba(34,211,238,0.15)'
            : isRoshChodesh
            ? 'rgba(167,139,250,0.09)'
            : 'transparent'

          const cellBorder = isToday
            ? '1px solid rgba(34,211,238,0.42)'
            : isRoshChodesh
            ? '1px solid rgba(167,139,250,0.24)'
            : '1px solid transparent'

          const gregColor = isToday
            ? 'rgb(103,232,249)'
            : isSat
            ? 'rgba(248,113,113,0.82)'
            : fg(0.82)

          const heColor = isToday
            ? 'rgba(103,232,249,0.65)'
            : isRoshChodesh
            ? 'rgba(167,139,250,0.90)'
            : isSat
            ? 'rgba(248,113,113,0.45)'
            : fg(0.28)

          return (
            <div
              key={date.toDateString()}
              className="flex flex-col items-center justify-center rounded-2xl"
              style={{
                background: cellBg,
                border: cellBorder,
                boxShadow: isToday ? '0 0 14px rgba(34,211,238,0.12)' : 'none',
                minHeight: '52px',
                padding: '4px 2px',
              }}
            >
              {/* Hebrew month name on Rosh Chodesh */}
              {isRoshChodesh && (
                <span
                  className="leading-none font-bold"
                  style={{ fontSize: '7px', color: isToday ? 'rgba(103,232,249,0.7)' : 'rgba(167,139,250,0.78)', marginBottom: 2 }}
                >
                  {fmtHe(date, { month: 'long' })}
                </span>
              )}

              {/* Gregorian day */}
              <span className="font-black leading-tight" style={{ fontSize: '15px', color: gregColor }}>
                {date.getDate()}
              </span>

              {/* Hebrew day (gematria) */}
              <span className="font-semibold leading-none" style={{ fontSize: '9px', color: heColor, marginTop: 2 }}>
                {hDayStr}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-4 px-1">
        <LegendItem bg="rgba(34,211,238,0.15)" border="rgba(34,211,238,0.42)" label="היום" fg={fg(0.28)} />
        <LegendItem bg="rgba(167,139,250,0.09)" border="rgba(167,139,250,0.24)" label="ראש חודש" fg={fg(0.28)} />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold" style={{ color: 'rgba(248,113,113,0.75)' }}>ש׳</span>
          <span style={{ fontSize: '9px', color: fg(0.28) }}>שבת</span>
        </div>
      </div>
    </div>
  )
}
