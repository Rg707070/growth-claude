'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Clock, BookOpen, Flame, X, CalendarDays } from 'lucide-react'
import { useLang } from '@/lib/lang'
import {
  buildMonthGrid, HEBREW_DAY_HEADERS,
  getHebrewDateStr, getGregorianDateStr,
  getHebrewMonthYearForMonth, getGregorianMonthLabel,
  todayDateString,
} from '@/lib/family/hebrew-calendar'
import type { LearningSession } from '@/types'

const COLOR = '#0F766E'

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

function sessionDay(s: LearningSession): string {
  return new Date(s.started_at).toISOString().split('T')[0]
}

function formatMins(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} דק'`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}ש' ${rem}ד'` : `${h} שע'`
}

function getCellBg(minutes: number, isShabbat: boolean, isFuture: boolean, isToday: boolean, isSelected: boolean): string {
  if (isSelected)         return COLOR
  if (isFuture)           return 'transparent'
  if (isShabbat)          return 'rgba(248,113,113,0.10)'
  if (isToday && minutes === 0) return `${COLOR}22`
  if (minutes === 0)      return 'transparent'
  if (minutes <= 30)      return 'rgba(15,118,110,0.28)'
  if (minutes <= 60)      return 'rgba(15,118,110,0.50)'
  if (minutes <= 120)     return 'rgba(15,118,110,0.74)'
  return 'rgba(245,158,11,0.78)'
}

function calcStreak(byDay: Record<string, { minutes: number }>, todayStr: string): number {
  let streak = 0
  const todayDow = new Date(`${todayStr}T12:00:00`).getDay()
  if (todayDow !== 6 && (byDay[todayStr]?.minutes ?? 0) > 0) streak++
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

interface Props { userId: string }
interface DayData { minutes: number; sessions: LearningSession[] }

export function TorahCalendarTab({ userId }: Props) {
  const { isRTL } = useLang()
  const [monthOffset, setMonthOffset] = useState(0)
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [allSessions, setAllSessions] = useState<LearningSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const todayStr = useMemo(() => todayDateString(), [])

  const { year, month, startDate, endDate } = useMemo(() => {
    const base = new Date()
    const vm   = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
    const y    = vm.getFullYear()
    const m    = vm.getMonth() + 1
    const pad  = (n: number) => String(n).padStart(2, '0')
    const last = new Date(y, m, 0)
    return {
      year: y, month: m,
      startDate: `${y}-${pad(m)}-01`,
      endDate:   `${y}-${pad(m)}-${pad(last.getDate())}`,
    }
  }, [monthOffset])

  const days    = useMemo(() => buildMonthGrid(year, month), [year, month])
  const hebrewHeader    = useMemo(() => getHebrewMonthYearForMonth(year, month), [year, month])
  const gregorianHeader = useMemo(() => getGregorianMonthLabel(year, month), [year, month])

  const weeks = useMemo(() => {
    const wks: (typeof days[number])[][] = []
    let wk: (typeof days[number])[] = []
    for (const day of days) {
      wk.push(day)
      if (wk.length === 7) { wks.push(wk); wk = [] }
    }
    if (wk.length > 0) {
      while (wk.length < 7) wk.push(null)
      wks.push(wk)
    }
    return wks
  }, [days])

  useEffect(() => {
    setLoading(true)
    const sb = createClient()
    sb.from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', `${startDate}T00:00:00`)
      .lte('started_at', `${endDate}T23:59:59`)
      .order('started_at', { ascending: false })
      .then(({ data }) => { setSessions((data as LearningSession[]) ?? []); setLoading(false) })
  }, [userId, startDate, endDate])

  useEffect(() => {
    const sb = createClient()
    sb.from('learning_sessions')
      .select('id, started_at, duration_seconds')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .then(({ data }) => { setAllSessions((data as LearningSession[]) ?? []) })
  }, [userId])

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
    const daysStudied   = Object.keys(byDay).length
    const totalMinutes  = Object.values(byDay).reduce((acc, d) => acc + d.minutes, 0)
    const totalSessions = sessions.length
    const streak        = calcStreak(allByDay, todayStr)
    return { daysStudied, totalMinutes, totalSessions, streak }
  }, [byDay, sessions, allByDay, todayStr])

  const selectedData = selectedDate ? byDay[selectedDate] ?? null : null

  // Suppress unused warning — isRTL is used indirectly via the dir attribute
  void isRTL

  return (
    <div className="space-y-4" dir="rtl">

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        <StatTile icon={<Flame size={13} />}        label="רצף"       value={String(stats.streak)}        accent={COLOR} />
        <StatTile icon={<CalendarDays size={13} />}  label="ימי לימוד" value={String(stats.daysStudied)}   accent={COLOR} />
        <StatTile icon={<Clock size={13} />}         label="דקות"      value={String(stats.totalMinutes)}  accent={COLOR} />
        <StatTile icon={<BookOpen size={13} />}      label="סשנים"     value={String(stats.totalSessions)} accent={COLOR} />
      </div>

      {/* Calendar card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: `${COLOR}18` }}>
          <button
            onClick={() => { setMonthOffset((o) => o - 1); setSelectedDate(null) }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: COLOR, background: `${COLOR}22` }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{gregorianHeader}</p>
            <p className="text-xs mt-0.5" style={{ color: COLOR }}>{hebrewHeader}</p>
          </div>

          <button
            onClick={() => { setMonthOffset((o) => o + 1); setSelectedDate(null) }}
            disabled={monthOffset >= 0}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-20"
            style={{ color: COLOR, background: `${COLOR}22` }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div
          className="grid grid-cols-7 px-2 pt-2"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
        >
          {HEBREW_DAY_HEADERS.map((h, i) => (
            <div
              key={h}
              className="text-center pb-2 text-[11px] font-semibold"
              style={{ color: i === 6 ? 'rgba(248,113,113,0.6)' : 'var(--muted-foreground)' }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-10" style={{ background: 'var(--card)' }}>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>טוען...</span>
          </div>
        ) : (
          <div className="p-2 space-y-1" style={{ background: 'var(--card)' }}>
            {weeks.map((wk, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {wk.map((day, di) => {
                  if (!day) return <div key={di} />

                  const isToday    = day.dateString === todayStr
                  const isFuture   = day.dateString > todayStr
                  const isShabbat  = new Date(`${day.dateString}T12:00:00`).getDay() === 6
                  const isSelected = selectedDate === day.dateString
                  const isClickable = !isFuture && !isShabbat
                  const data       = byDay[day.dateString]
                  const minutes    = data?.minutes ?? 0
                  const isGold     = minutes > 120

                  return (
                    <button
                      key={di}
                      onClick={() => isClickable && setSelectedDate((prev) => prev === day.dateString ? null : day.dateString)}
                      className="flex flex-col items-center py-1 px-0.5 rounded-lg transition-all relative"
                      style={{
                        background: getCellBg(minutes, isShabbat, isFuture, isToday, isSelected),
                        border: isToday && !isSelected
                          ? `1.5px solid ${COLOR}`
                          : '1.5px solid transparent',
                        opacity: isFuture ? 0.35 : 1,
                        cursor: isClickable ? 'pointer' : 'default',
                      }}
                    >
                      {/* Hebrew month start indicator */}
                      {day.isHebrewMonthStart && (
                        <div
                          className="absolute top-0 left-0 right-0 h-[1.5px] rounded-full"
                          style={{ background: `${COLOR}55` }}
                        />
                      )}

                      {/* Gregorian day */}
                      <span
                        className="text-[13px] font-semibold leading-none"
                        style={{
                          color: isSelected
                            ? 'white'
                            : isToday
                              ? COLOR
                              : isShabbat
                                ? 'rgba(248,113,113,0.70)'
                                : 'var(--foreground)',
                        }}
                      >
                        {day.gregorianDay}
                      </span>

                      {/* Hebrew day letter */}
                      <span
                        className="text-[8px] leading-none mt-0.5"
                        style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--muted-foreground)' }}
                      >
                        {day.hebrewDay}
                      </span>

                      {/* Minutes badge */}
                      {!isFuture && !isShabbat && minutes > 0 && (
                        <span
                          className="text-[7px] leading-none mt-0.5 font-medium"
                          style={{
                            color: isSelected
                              ? 'rgba(255,255,255,0.90)'
                              : isGold
                                ? 'rgba(245,158,11,0.90)'
                                : `${COLOR}dd`,
                          }}
                        >
                          {minutes < 60 ? `${minutes}ד` : `${Math.floor(minutes / 60)}ש`}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div
          className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1"
          style={{ background: `${COLOR}08`, borderTop: '1px solid var(--border)' }}
        >
          {[
            { color: 'rgba(15,118,110,0.28)', label: 'עד שעה' },
            { color: 'rgba(15,118,110,0.74)', label: 'שעה–שעתיים' },
            { color: 'rgba(245,158,11,0.78)', label: '2ש׳+' },
            { color: 'rgba(248,113,113,0.35)', label: 'שבת' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--secondary)', border: `1px solid ${COLOR}33` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold" style={{ color: COLOR }}>{getHebrewDateStr(selectedDate)}</p>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{getGregorianDateStr(selectedDate)}</p>
            </div>
            <button onClick={() => setSelectedDate(null)} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
              <X size={15} />
            </button>
          </div>

          {selectedData && (
            <div className="flex gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span>{selectedData.sessions.length} סשנים</span>
              <span>·</span>
              <span>{formatMins(selectedData.sessions.reduce((a, s) => a + s.duration_seconds, 0))}</span>
            </div>
          )}

          {selectedData?.sessions.length ? (
            <div className="space-y-2">
              {selectedData.sessions.map((s) => (
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

function StatTile({ icon, label, value, accent }: {
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
      <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: catColor }} />
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
