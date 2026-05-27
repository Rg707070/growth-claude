'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTodaySchedule } from '@/lib/schedule-realtime'
import { DAY_NAMES_HE, DAY_NAMES_EN } from '@/lib/schedule'
import { Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { ScheduleRow } from '@/lib/schedule-realtime'

const TYPE_META: Record<string, { he: string; en: string; color: string }> = {
  torah:  { he: 'תורה',   en: 'Torah',   color: '#f59e0b' },
  shiur:  { he: 'שיעור',  en: 'Shiur',   color: '#3b82f6' },
  prayer: { he: 'תפילה',  en: 'Prayer',  color: '#10b981' },
  sports: { he: 'ספורט',  en: 'Sports',  color: '#ef4444' },
  break:  { he: 'הפסקה',  en: 'Break',   color: 'rgba(255,255,255,0.35)' },
  other:  { he: 'אחר',   en: 'Other',   color: 'rgba(255,255,255,0.45)' },
}

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function itemClr(item: ScheduleRow): string {
  return item.color ?? TYPE_META[item.type]?.color ?? TYPE_META.other.color
}

function hexBg(c: string): string {
  return c.startsWith('#') ? `${c}18` : c.replace(/[\d.]+\)$/, '0.08)')
}

function hexBorder(c: string): string {
  return c.startsWith('#') ? `${c}40` : c.replace(/[\d.]+\)$/, '0.25)')
}

function getCurrentIdx(items: ScheduleRow[]): number {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  let idx = -1
  for (let i = items.length - 1; i >= 0; i--) {
    if (toMin(items[i].time) <= nowMin) { idx = i; break }
  }
  return idx
}

interface ScheduleTabProps {
  userId: string
}

export function ScheduleTab({ userId }: ScheduleTabProps) {
  const { isRTL } = useLang()
  const { items, loading } = useTodaySchedule(userId)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const todayDate = new Date().toISOString().split('T')[0]
  const day = new Date().getDay()
  const dayName = isRTL ? DAY_NAMES_HE[day] : DAY_NAMES_EN[day]
  const currentIdx = getCurrentIdx(items)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('activity_checks')
      .select('time')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .then(({ data }) => {
        if (data) setChecked(new Set(data.map((r: { time: string }) => r.time)))
      })
  }, [userId, todayDate])

  async function toggleCheck(time: string) {
    const supabase = createClient()
    if (checked.has(time)) {
      setChecked(prev => { const n = new Set(prev); n.delete(time); return n })
      await supabase.from('activity_checks').delete()
        .eq('user_id', userId).eq('date', todayDate).eq('time', time)
    } else {
      setChecked(prev => new Set([...prev, time]))
      await supabase.from('activity_checks').upsert({ user_id: userId, date: todayDate, time })
    }
  }

  const completedCount = items.filter(item => checked.has(item.time)).length
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? `לו"ז יום ${dayName}` : `${dayName}'s Schedule`}
          </h2>
          {items.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {completedCount}/{items.length} {isRTL ? 'הושלמו' : 'completed'} · {pct}%
            </p>
          )}
        </div>
        <Link
          href="/schedule"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
        >
          <ExternalLink size={11} />
          {isRTL ? 'עריכה' : 'Edit'}
        </Link>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-card-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'var(--primary)' }}
          />
        </div>
      )}

      {/* Schedule list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--c-card)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span style={{ fontSize: 44 }}>📅</span>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'אין פריטים בלוז להיום' : 'No schedule items for today'}
          </p>
          <Link
            href="/schedule"
            className="text-xs px-4 py-2 rounded-xl"
            style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
          >
            {isRTL ? 'הוסף ללוז' : 'Add to schedule'}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const isChecked = checked.has(item.time)
            const isNow = idx === currentIdx
            const clr = itemClr(item)
            const meta = TYPE_META[item.type] ?? TYPE_META.other

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl border transition-all"
                style={{
                  background: isChecked ? 'rgba(52,211,153,0.06)' : isNow ? `${clr.startsWith('#') ? clr + '22' : hexBg(clr)}` : hexBg(clr),
                  borderColor: isChecked ? 'rgba(52,211,153,0.25)' : isNow ? (clr.startsWith('#') ? `${clr}66` : hexBorder(clr)) : hexBorder(clr),
                  opacity: isChecked ? 0.6 : 1,
                }}
              >
                {/* Color dot + now pulse */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: isChecked ? 'rgba(52,211,153,0.7)' : clr }}
                  />
                  {isNow && !isChecked && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: clr, opacity: 0.4 }}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{
                      color: isChecked ? 'var(--muted-foreground)' : 'var(--foreground)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                    }}
                  >
                    {item.label}
                    {isNow && !isChecked && (
                      <span className="ms-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: `${clr}22`, color: clr }}>
                        {isRTL ? 'עכשיו' : 'now'}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
                    {item.time}
                    <span className="mx-1">·</span>
                    {isRTL ? meta.he : meta.en}
                  </p>
                </div>

                {/* Checkbox */}
                <button
                  onClick={() => void toggleCheck(item.time)}
                  className="w-7 h-7 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                  style={{
                    background: isChecked ? 'rgba(52,211,153,0.20)' : 'transparent',
                    borderColor: isChecked ? 'rgba(52,211,153,0.60)' : 'var(--c-card-border)',
                  }}
                >
                  {isChecked && <Check size={12} className="text-emerald-400" />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Realtime badge */}
      <div className="flex items-center gap-2 pt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'מסונכרן בזמן אמת עם הלוז הראשי' : 'Synced in real-time with main schedule'}
        </p>
      </div>
    </div>
  )
}
