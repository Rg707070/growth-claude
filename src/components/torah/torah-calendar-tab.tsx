'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Flame, X, CalendarDays } from 'lucide-react'
import { useLang } from '@/lib/lang'
import type { LearningSession } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR = '#0F766E'
const MONTH_NAMES_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const DAY_SHORT_HE   = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','שב']

const CATEGORY_HE: Record<string, string> = {
  gemara:  'גמרא',
  mishnah: 'משנה',
  tanakh:  'תנ״ך',
  halacha: 'הלכה',
  article: 'מאמר',
  other:   'אחר',
}

const CATEGORY_COLOR: Record<string, string> = {
  gemara:  'rgba(15,118,110,0.85)',
  mishnah: 'rgba(16,185,129,0.85)',
  tanakh:  'rgba(245,158,11,0.85)',
  halacha: 'rgba(99,102,241,0.85)',
  article: 'rgba(139,92,246,0.85)',
  other:   'rgba(107,114,128,0.75)',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sessionDay(s: LearningSession): string {
  // started_at is ISO timestamp — extract date in local time
  return new Date(s.started_at).toISOString().split('T')[0]
}

function formatMins(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} דק'`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}ש' ${rem}ד'` : `${h} שע'`
}

function formatDate(dateStr: string, isRTL: boolean): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function getCellBg(minutes: number, isShabbat: boolean, isFuture: boolean, isToday: boolean): string {
  if (isFuture)   return 'rgba(255,255,255,0.03)'
  if (isShabbat)  return 'rgba(248,113,113,0.10)'
  if (isToday)    return 'rgba(15,118,110,0.22)'
  if (minutes === 0)   return 'rgba(15,118,110,0.07)'
  if (minutes <= 30)   return 'rgba(15,118,110,0.28)'
  if (minutes <= 60)   return 'rgba(15,118,110,0.50)'
  if (minutes <= 120)  return 'rgba(15,118,110,0.74)'
  return 'rgba(245,158,11,0.78)' // gold — exceptional day
}

function calcStreak(byDay: Record<string, { minutes: number }>, todayStr: string): number {
  let streak = 0
  // Count today if studied
  const todayDow = new Date(`${todayStr}T12:00:00`).getDay()
  if (todayDow !== 6 && (byDay[todayStr]?.minutes ?? 0) > 0) streak++
  // Count backwards from yesterday; Shabbat is skipped without breaking the streak
  const cursor = new Date(`${todayStr}T12:00:00`)
  cursor.setDate(cursor.getDate() - 1)
  for (let i = 0; i < 364; i++) {
    const d   = cursor.toISOString().split('T')[0]
    const dow = cursor.getDay()
    if (dow !== 6) {
      if ((byDay[d]?.minutes ?? 0) > 0) streak++
      else break
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  userId: string
}

interface DayData {
  minutes: number
  sessions: LearningSession[]
}

export function TorahCalendarTab({ userId }: Props) {
  const { isRTL } = useLang()
  const [monthOffset, setMonthOffset] = useState(0)
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [allSessions, setAllSessions] = useState<LearningSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [clickedCell, setClickedCell] = useState<string | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { year, month, startDate, endDate, daysInMonth, startDow } = useMemo(() => {
    const base = new Date()
    const vm = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
    const y = vm.getFullYear()
    const m = vm.getMonth()
    const first = new Date(y, m, 1)
    const last  = new Date(y, m + 1, 0)
    return {
      year: y, month: m,
      startDate:  first.toISOString().split('T')[0],
      endDate:    last.toISOString().split('T')[0],
      daysInMonth: last.getDate(),
      startDow:    first.getDay(),
    }
  }, [monthOffset])

  // Fetch current month's sessions
  useEffect(() => {
    setLoading(true)
    const sb = createClient()
    sb.from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startDate + 'T00:00:00')
      .lte('started_at', endDate   + 'T23:59:59')
      .order('started_at', { ascending: false })
      .then(({ data }: { data: LearningSession[] | null; error: unknown }) => {
        setSessions(data ?? [])
        setLoading(false)
      })
  }, [userId, startDate, endDate])

  // Fetch all sessions (for streak) — only on mount
  useEffect(() => {
    const sb = createClient()
    sb.from('learning_sessions')
      .select('id, started_at, duration_seconds')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .then(({ data }: { data: LearningSession[] | null; error: unknown }) => {
        setAllSessions(data ?? [])
      })
  }, [userId])

  // Build day map for current month
  const byDay = useMemo<Record<string, DayData>>(() => {
    const map: Record<string, DayData> = {}
    for (const s of sessions) {
      const d = sessionDay(s)
      if (!map[d]) map[d] = { minutes: 0, sessions: [] }
      map[d].minutes += Math.round(s.duration_seconds / 60)
      map[d].sessions.push(s)
    }
    return map
  }, [sessions])

  // Build day map for all sessions (streak computation)
  const allByDay = useMemo<Record<string, { minutes: number }>>(() => {
    const map: Record<string, { minutes: number }> = {}
    for (const s of allSessions) {
      const d = sessionDay(s)
      if (!map[d]) map[d] = { minutes: 0 }
      map[d].minutes += Math.round((s.duration_seconds ?? 0) / 60)
    }
    return map
  }, [allSessions])

  const stats = useMemo(() => {
    const daysStudied    = Object.keys(byDay).length
    const totalMinutes   = (Object.values(byDay) as DayData[]).reduce((acc: number, d: DayData) => acc + d.minutes, 0)
    const totalSessions  = sessions.length
    const streak         = calcStreak(allByDay, todayStr)
    return { daysStudied, totalMinutes, totalSessions, streak }
  }, [byDay, sessions, allByDay, todayStr])

  // Build grid cells: nulls for days before month start, then 1..daysInMonth
  const cells = useMemo<(number | null)[]>(() => {
    const arr: (number | null)[] = [
      ...Array<null>(startDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [startDow, daysInMonth])

  function handleCellClick(dateStr: string) {
    setClickedCell(dateStr)
    setTimeout(() => {
      setClickedCell(null)
      setSelectedDate((prev: string | null) => prev === dateStr ? null : dateStr)
    }, 180)
  }

  const selectedData = selectedDate ? byDay[selectedDate] ?? null : null

  return (
    <div className="space-y-4" dir="rtl">

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        <StatTile
          icon={<Flame size={13} />}
          label="רצף"
          value={String(stats.streak)}
          accent={COLOR}
        />
        <StatTile
          icon={<CalendarDays size={13} />}
          label="ימי לימוד"
          value={String(stats.daysStudied)}
          accent={COLOR}
        />
        <StatTile
          icon={<Clock size={13} />}
          label="דקות"
          value={String(stats.totalMinutes)}
          accent={COLOR}
        />
        <StatTile
          icon={<BookOpen size={13} />}
          label="סשנים"
          value={String(stats.totalSessions)}
          accent={COLOR}
        />
      </div>

      {/* Month navigation — RTL: ChevronRight = prev, ChevronLeft = next */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setMonthOffset((o: number) => o - 1); setSelectedDate(null) }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ChevronRight size={18} />
        </button>
        <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          {MONTH_NAMES_HE[month]} {year}
        </span>
        <button
          onClick={() => { setMonthOffset((o: number) => o + 1); setSelectedDate(null) }}
          disabled={monthOffset >= 0}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-20"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_SHORT_HE.map((name, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold py-0.5"
            style={{ color: i === 6 ? 'rgba(248,113,113,0.6)' : 'var(--muted-foreground)' }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>טוען...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day: number | null, idx: number) => {
            if (day === null) return <div key={idx} />
            const mm      = String(month + 1).padStart(2, '0')
            const dd      = String(day).padStart(2, '0')
            const dateStr = `${year}-${mm}-${dd}`
            const isToday    = dateStr === todayStr
            const isFuture   = dateStr > todayStr
            const isShabbat  = new Date(`${dateStr}T12:00:00`).getDay() === 6
            const isSelected = selectedDate === dateStr
            const isClicked  = clickedCell === dateStr
            const isHovered  = hoveredCell === dateStr
            const isClickable = !isFuture && !isShabbat
            const data       = byDay[dateStr]
            const minutes    = data?.minutes ?? 0
            const isGold     = minutes > 120

            return (
              <div
                key={idx}
                onClick={() => isClickable && handleCellClick(dateStr)}
                onMouseEnter={() => isClickable && setHoveredCell(dateStr)}
                onMouseLeave={() => setHoveredCell(null)}
                className="aspect-square flex flex-col items-center justify-center rounded-xl relative"
                style={{
                  background: getCellBg(minutes, isShabbat, isFuture, isToday),
                  border: isSelected
                    ? `2px solid ${isGold ? 'rgba(245,158,11,0.80)' : `${COLOR}cc`}`
                    : isToday
                      ? `1px solid ${COLOR}88`
                      : isHovered && isClickable
                        ? `1px solid ${COLOR}55`
                        : '1px solid transparent',
                  opacity:  isFuture ? 0.30 : 1,
                  cursor:   isClickable ? 'pointer' : 'default',
                  transform: isClicked ? 'scale(1.18)' : isHovered && isClickable ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), border-color 120ms ease, background 120ms ease',
                  zIndex: isClicked || isHovered ? 1 : 0,
                  position: 'relative',
                }}
              >
                <span
                  className="text-[11px] font-bold leading-none"
                  style={{
                    color: isToday
                      ? `${COLOR}`
                      : isShabbat
                        ? 'rgba(248,113,113,0.70)'
                        : 'var(--foreground)',
                  }}
                >
                  {day}
                </span>

                {isShabbat ? (
                  <span className="text-[7px] leading-none mt-0.5" style={{ color: 'rgba(248,113,113,0.45)' }}>
                    שב׳
                  </span>
                ) : (
                  !isFuture && minutes > 0 && (
                    <span
                      className="text-[8px] leading-none mt-0.5 font-medium"
                      style={{ color: isGold ? 'rgba(245,158,11,0.90)' : `${COLOR}dd` }}
                    >
                      {minutes < 60 ? `${minutes}ד` : `${Math.floor(minutes / 60)}ש`}
                    </span>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Color legend */}
      <div className="flex items-center justify-center gap-3 flex-wrap pt-0.5">
        {[
          { color: 'rgba(15,118,110,0.28)', label: 'עד שעה' },
          { color: 'rgba(15,118,110,0.74)', label: 'שעה–שעתיים' },
          { color: 'rgba(245,158,11,0.78)', label: '2ש׳+' },
          { color: 'rgba(248,113,113,0.35)', label: 'שבת' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--secondary)', border: `1px solid ${COLOR}33` }}
        >
          {/* Day header */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {formatDate(selectedDate, isRTL)}
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 rounded-lg"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Stats for this day */}
          {selectedData && (
            <div className="flex gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span>{selectedData.sessions.length} סשנים</span>
              <span>·</span>
              <span>{formatMins(selectedData.sessions.reduce((a: number, s: LearningSession) => a + s.duration_seconds, 0))}</span>
            </div>
          )}

          {/* Sessions list */}
          {selectedData?.sessions.length ? (
            <div className="space-y-2">
              {selectedData.sessions.map((s: LearningSession) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 gap-1">
              <BookOpen size={22} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
              <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
                לא נרשם לימוד ביום זה
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatTile({
  icon, label, value, accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div
      className="rounded-xl p-2.5 flex flex-col items-center gap-0.5"
      style={{ background: `${accent}14`, border: `1px solid ${accent}22` }}
    >
      <div style={{ color: accent }}>{icon}</div>
      <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{value}</span>
      <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    </div>
  )
}

function SessionRow({ session }: { session: LearningSession }) {
  const catColor = CATEGORY_COLOR[session.text_category] ?? CATEGORY_COLOR.other
  const catLabel = CATEGORY_HE[session.text_category] ?? session.text_category
  const time = new Date(session.started_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-xl"
      style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-1.5 self-stretch rounded-full flex-shrink-0"
        style={{ background: catColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {session.text_title || 'לימוד'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ background: catColor.replace(/[\d.]+\)$/, '0.15)'), color: catColor }}
          >
            {catLabel}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {formatMins(session.duration_seconds)}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
            · {time}
          </span>
        </div>
      </div>
    </div>
  )
}
