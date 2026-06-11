'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { DAY_NAMES_HE, DAY_NAMES_EN } from '@/lib/schedule'
import { Check } from 'lucide-react'

interface WidgetItem {
  id: string
  time: string
  label: string
  type: string
  color: string | null
}

const TYPE_ICONS: Record<string, string> = {
  torah: '📚', shiur: '🎓', prayer: '🙏', sports: '🏃', break: '☕', other: '✦',
}

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function ScheduleToday() {
  const { isRTL } = useLang()
  const router = useRouter()
  const [items, setItems] = useState<WidgetItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dow = new Date().getDay()
    const sb = createClient()

    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      Promise.all([
        sb.from('user_schedule')
          .select('id, time, label, type, color')
          .eq('user_id', user.id)
          .or(`and(day_of_week.eq.${dow},specific_date.is.null),specific_date.eq.${todayStr}`)
          .order('time'),
        sb.from('activity_checks')
          .select('time')
          .eq('user_id', user.id)
          .eq('date', todayStr),
      ]).then(([{ data: rows }, { data: checks }]) => {
        setItems((rows ?? []).map((r: { id: string; time: string; label: string; type: string; color: string | null }) => ({
          id: r.id, time: r.time, label: r.label, type: r.type, color: r.color ?? null,
        })))
        setChecked(new Set((checks ?? []).map((c: { time: string }) => c.time)))
        setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [])

  const nowMin  = now ? now.getHours() * 60 + now.getMinutes() : -1
  const dow     = now?.getDay() ?? new Date().getDay()
  const dayName = isRTL ? DAY_NAMES_HE[dow] : DAY_NAMES_EN[dow]

  let currentIdx = -1
  for (let i = items.length - 1; i >= 0; i--) {
    if (toMin(items[i].time) <= nowMin) { currentIdx = i; break }
  }

  const current   = currentIdx >= 0 ? items[currentIdx] : null
  const upcoming  = items.slice(currentIdx + 1, currentIdx + 3)
  const doneCount = items.filter(i => checked.has(i.time)).length

  async function handleToggle(time: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) return
    const todayStr = new Date().toISOString().split('T')[0]
    const wasChecked = checked.has(time)
    setChecked(prev => { const n = new Set(prev); wasChecked ? n.delete(time) : n.add(time); return n })
    const sb = createClient()
    if (wasChecked) {
      await sb.from('activity_checks').delete().eq('user_id', userId).eq('date', todayStr).eq('time', time)
    } else {
      await sb.from('activity_checks').upsert({ user_id: userId, date: todayStr, time })
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)', minHeight: 100 }}>
        <div className="animate-pulse space-y-2">
          <div className="h-3 rounded-full bg-white/10 w-28" />
          <div className="h-1 rounded-full bg-white/5 w-full" />
          <div className="h-12 rounded-xl bg-white/5 w-full" />
          <div className="h-7 rounded-lg bg-white/4 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:brightness-105 active:scale-[0.99]"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
      onClick={() => router.push('/schedule')}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && router.push('/schedule')}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? `לוז · ${dayName}` : `Schedule · ${dayName}`}
          </span>
          {items.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(103,232,249,0.1)', color: 'rgb(103,232,249)' }}
            >
              {doneCount}/{items.length}
            </span>
          )}
        </div>
        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? '←' : '→'}
        </span>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-4 pb-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(doneCount / items.length) * 100}%`,
                background: doneCount === items.length ? 'rgb(52,211,153)' : 'rgb(103,232,249)',
              }}
            />
          </div>
        </div>
      )}

      <div className="px-4 pb-3 space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
        {items.length === 0 ? (
          <p className="text-sm py-2 text-center" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'לחץ להגדרת לוז שבועי' : 'Tap to set up your schedule'}
          </p>
        ) : (
          <>
            {/* Current activity — prominent with check button */}
            {current && (
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: checked.has(current.time)
                    ? 'rgba(52,211,153,0.08)'
                    : 'rgba(103,232,249,0.08)',
                  border: `1px solid ${checked.has(current.time) ? 'rgba(52,211,153,0.2)' : 'rgba(103,232,249,0.2)'}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                  style={{ background: checked.has(current.time) ? 'rgb(52,211,153)' : 'rgb(103,232,249)' }}
                />
                <span className="text-base flex-shrink-0">{TYPE_ICONS[current.type] ?? '✦'}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{
                      color: checked.has(current.time) ? 'rgba(255,255,255,0.4)' : 'rgb(103,232,249)',
                      textDecoration: checked.has(current.time) ? 'line-through' : 'none',
                    }}
                  >
                    {current.label}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {current.time.slice(0, 5)}
                  </p>
                </div>
                <button
                  onClick={e => handleToggle(current.time, e)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
                  style={{
                    background: checked.has(current.time)
                      ? 'rgba(52,211,153,0.2)'
                      : 'rgba(103,232,249,0.1)',
                    border: `1.5px solid ${checked.has(current.time) ? 'rgba(52,211,153,0.4)' : 'rgba(103,232,249,0.25)'}`,
                  }}
                  aria-label={checked.has(current.time) ? 'בטל סימון' : 'סמן כבוצע'}
                >
                  {checked.has(current.time)
                    ? <Check size={14} className="text-emerald-400" />
                    : <div className="w-3 h-3 rounded-full border-2 border-cyan-400/40" />
                  }
                </button>
              </div>
            )}

            {/* Upcoming items (next 2) */}
            {upcoming.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-1.5"
                style={{ opacity: 0.85 - i * 0.18 }}
              >
                <span className="text-xs font-mono w-10 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {item.time.slice(0, 5)}
                </span>
                <span className="text-sm flex-shrink-0">{TYPE_ICONS[item.type] ?? '✦'}</span>
                <span className="text-sm flex-1 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {item.label}
                </span>
              </div>
            ))}

            {/* Schedule over */}
            {!current && upcoming.length === 0 && (
              <p className="text-xs text-center py-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {isRTL ? 'הלוז היומי הסתיים' : "Today's schedule complete"}
              </p>
            )}

            {/* All done today */}
            {doneCount === items.length && items.length > 0 && current && (
              <p className="text-xs text-center font-semibold" style={{ color: 'rgb(52,211,153)' }}>
                {isRTL ? '✓ הכל הושלם היום!' : '✓ All done for today!'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
