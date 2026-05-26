'use client'

import React, { useState, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTheme } from '@/lib/theme'

// Index 0 = Sunday. RTL grid → index 0 on the right = Sunday on right = correct Israeli layout.
const HE_DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

const TYPE_COLORS: Record<string, string> = {
  torah:  '#5eead4',
  shiur:  '#34d399',
  prayer: '#6ee7b7',
  sports: '#86efac',
  break:  'rgba(255,255,255,0.20)',
  other:  'rgba(255,255,255,0.25)',
}

function itemColor(item: CalItem): string {
  return item.color ?? TYPE_COLORS[item.type] ?? 'rgba(103,232,249,0.6)'
}

function hexBg(clr: string): string {
  return clr.startsWith('#') ? `${clr}18` : clr.replace(/[\d.]+\)$/, '0.10)')
}
function hexBorder(clr: string): string {
  return clr.startsWith('#') ? `${clr}38` : clr.replace(/[\d.]+\)$/, '0.28)')
}

export interface CalItem {
  id: string
  time: string
  label: string
  type: string
  color?: string | null
}

interface Props {
  weeklyItems?: Record<number, CalItem[]>
}

function fmtHe(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', opts).format(date)
}

function getHebrewDayNum(date: Date): number {
  return parseInt(new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric' }).format(date))
}

// ─── DaySheet ─────────────────────────────────────────────────────────────────
function DaySheet({ date, items, onClose, isDark }: {
  date: Date
  items: CalItem[]
  onClose: () => void
  isDark: boolean
}) {
  const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${Math.min(0.9, a * 2)})`
  const gregLabel = date.toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const heLabel = `${fmtHe(date, { day: 'numeric', month: 'long' })} ${fmtHe(date, { year: 'numeric' })}`
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="fixed inset-0 z-50 flex items-end" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full rounded-t-3xl flex flex-col"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', maxHeight: '72vh' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-4 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--c-border)' }}>
          <div>
            <p className="text-[13px] font-black" style={{ color: fg(0.9) }}>{gregLabel}</p>
            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: 'rgb(103,232,249)' }}>{heLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: fg(0.35) }}>
            <X size={18} />
          </button>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4 pb-10">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">🌿</span>
              <p className="text-sm" style={{ color: fg(0.3) }}>יום פנוי</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map(item => {
                const clr = itemColor(item)
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                    style={{ background: hexBg(clr), border: `1px solid ${hexBorder(clr)}` }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: clr }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: fg(0.85) }}>{item.label}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: fg(0.35) }}>{item.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── LegendItem ───────────────────────────────────────────────────────────────
function LegendItem({ bg, border, label, fg }: { bg: string; border: string; label: string; fg: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded-md" style={{ background: bg, border: `1px solid ${border}` }} />
      <span style={{ fontSize: '9px', color: fg }}>{label}</span>
    </div>
  )
}

// ─── HebrewCalendar ───────────────────────────────────────────────────────────
export function HebrewCalendar({ weeklyItems = {} }: Props) {
  const { isDark } = useTheme()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [viewYear, setViewYear]       = useState(today.getFullYear())
  const [viewMonth, setViewMonth]     = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y: number) => y - 1); setViewMonth(11) }
    else setViewMonth((m: number) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y: number) => y + 1); setViewMonth(0) }
    else setViewMonth((m: number) => m + 1)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) * 1.4 && Math.abs(dx) > 50) {
      // In RTL: swipe right (dx > 0) → next month; swipe left (dx < 0) → prev month
      if (dx > 0) nextMonth(); else prevMonth()
    }
  }

  const firstDay     = new Date(viewYear, viewMonth, 1)
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  // Build grid
  const cells: (Date | null)[] = []
  const pad = firstDay.getDay()
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)

  // Hebrew month(s) for header
  const heMonths: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const name = fmtHe(new Date(viewYear, viewMonth, d), { month: 'long' })
    if (!heMonths.includes(name)) heMonths.push(name)
  }
  const heYear    = fmtHe(new Date(viewYear, viewMonth, 15), { year: 'numeric' })
  const gregLabel = firstDay.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  const heLabel   = `${heMonths.join(' – ')} ${heYear}`

  const fg = (a: number) => isDark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${Math.min(0.9, a * 2)})`

  return (
    <>
      <div
        dir="rtl"
        className="px-3 py-3 overflow-y-auto select-none"
        style={{ maxHeight: 'calc(100dvh - 200px)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        {/* ── Month header ── */}
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

        {/* ── Today button ── */}
        {!isCurrentMonth && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
              className="px-4 py-1.5 rounded-full text-[11px] font-bold active:scale-95 transition-transform"
              style={{ background: 'rgba(34,211,238,0.10)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.25)' }}
            >
              חזור להיום
            </button>
          </div>
        )}

        {/* ── Weekday headers ── */}
        <div className="grid grid-cols-7 mb-1">
          {HE_DAYS.map((label, i) => (
            <div key={i} className="flex justify-center py-1">
              <span className="text-[10px] font-bold" style={{ color: i === 6 ? 'rgba(248,113,113,0.65)' : fg(0.28) }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Day grid ── */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} style={{ minHeight: '62px' }} />

            const isToday       = date.getTime() === today.getTime()
            const isSat         = date.getDay() === 6
            const isSelected    = selectedDate?.getTime() === date.getTime()
            const hDayStr       = fmtHe(date, { day: 'numeric' })
            const hDayNum       = getHebrewDayNum(date)
            const isRoshChodesh = hDayNum === 1
            const dayItems      = weeklyItems[date.getDay()] ?? []
            const dots          = dayItems.slice(0, 3).map(item => itemColor(item))

            const cellBg = isSelected
              ? 'rgba(34,211,238,0.20)'
              : isToday
              ? 'rgba(34,211,238,0.14)'
              : isRoshChodesh
              ? 'rgba(167,139,250,0.08)'
              : 'transparent'

            const cellBorder = isSelected
              ? '1px solid rgba(34,211,238,0.55)'
              : isToday
              ? '1px solid rgba(34,211,238,0.40)'
              : isRoshChodesh
              ? '1px solid rgba(167,139,250,0.22)'
              : '1px solid transparent'

            const gregColor = isToday || isSelected
              ? 'rgb(103,232,249)'
              : isSat
              ? 'rgba(248,113,113,0.82)'
              : fg(0.82)

            const heColor = isToday || isSelected
              ? 'rgba(103,232,249,0.65)'
              : isRoshChodesh
              ? 'rgba(167,139,250,0.88)'
              : isSat
              ? 'rgba(248,113,113,0.45)'
              : fg(0.28)

            return (
              <div
                key={date.toDateString()}
                className="flex flex-col items-center justify-center rounded-2xl cursor-pointer active:scale-95 transition-transform"
                style={{
                  background: cellBg,
                  border: cellBorder,
                  boxShadow: isToday ? '0 0 14px rgba(34,211,238,0.10)' : 'none',
                  minHeight: '62px',
                  padding: '3px 2px',
                }}
                onClick={() => setSelectedDate(isSelected ? null : new Date(date))}
              >
                {/* Rosh Chodesh month name */}
                {isRoshChodesh && (
                  <span
                    className="leading-none font-bold"
                    style={{ fontSize: '7px', color: isToday ? 'rgba(103,232,249,0.7)' : 'rgba(167,139,250,0.75)', marginBottom: 2 }}
                  >
                    {fmtHe(date, { month: 'long' })}
                  </span>
                )}

                {/* Gregorian number */}
                <span className="font-black leading-tight" style={{ fontSize: '15px', color: gregColor }}>
                  {date.getDate()}
                </span>

                {/* Hebrew day (gematria) */}
                <span className="font-semibold leading-none" style={{ fontSize: '9px', color: heColor, marginTop: 1 }}>
                  {hDayStr}
                </span>

                {/* Event dots */}
                {dots.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dots.map((clr, di) => (
                      <div
                        key={di}
                        className="rounded-full"
                        style={{ width: 4, height: 4, background: clr, opacity: isSelected || isToday ? 1 : 0.75 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center justify-end gap-3 mt-4 px-1">
          <LegendItem bg="rgba(34,211,238,0.14)" border="rgba(34,211,238,0.40)" label="היום" fg={fg(0.28)} />
          <LegendItem bg="rgba(167,139,250,0.08)" border="rgba(167,139,250,0.22)" label="ראש חודש" fg={fg(0.28)} />
          <div className="flex items-center gap-1">
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(248,113,113,0.72)' }}>ש׳</span>
            <span style={{ fontSize: '9px', color: fg(0.28) }}>שבת</span>
          </div>
        </div>
      </div>

      {/* Day detail sheet */}
      {selectedDate && (
        <DaySheet
          date={selectedDate}
          items={weeklyItems[selectedDate.getDay()] ?? []}
          onClose={() => setSelectedDate(null)}
          isDark={isDark}
        />
      )}
    </>
  )
}
