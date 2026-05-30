'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Trash2,
  ChevronLeft, ChevronRight, Dumbbell, Ban,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { DomainHabitRow } from '@/components/domain-habit-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  upsertWorkoutLog, deleteWorkoutLog,
  createFoodRestriction, deleteFoodRestriction,
  createChallenge, updateChallengeStatus, deleteChallenge,
} from './sports-actions'
import type { Domain, Habit } from '@/types'
import type { SportWorkoutLog, SportFoodRestriction, SportChallenge } from '@/types/sports'

type Tab = 'habits' | 'challenges' | 'journal' | 'nutrition'

const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]
const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const EN_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
  workoutLogs: SportWorkoutLog[]
  foodRestrictions: SportFoodRestriction[]
  challenges: SportChallenge[]
  schemaReady: boolean
}

export function SportsClient({
  domain, habits: initialHabits, completedIds, userId,
  workoutLogs: initialLogs, foodRestrictions: initialFood,
  challenges: initialChallenges, schemaReady,
}: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('habits')
  const [habits, setHabits] = useState(initialHabits)
  const [logs, setLogs] = useState(initialLogs)
  const [food, setFood] = useState(initialFood)
  const [challenges, setChallenges] = useState(initialChallenges)

  useHabitReminders(habits)

  const completedSet = useMemo(() => new Set(completedIds), [completedIds])
  const color = domain.color

  const activeChallenges = challenges.filter((c) => c.status === 'active').length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 md:max-w-none md:px-0 md:pt-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <ArrowRight size={20} style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${color}22` }}
          >
            {domain.icon}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {isRTL ? domain.nameHe : domain.nameEn}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {activeChallenges > 0
                ? (isRTL ? `${activeChallenges} אתגרים פעילים` : `${activeChallenges} active challenges`)
                : (isRTL ? 'ספורט ובריאות' : 'Sports & health')}
            </p>
          </div>
        </div>

        {!schemaReady && <SchemaBanner isRTL={isRTL} />}

        {/* Tab bar */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
          {([
            ['habits', isRTL ? 'הרגלים' : 'Habits'],
            ['challenges', isRTL ? 'אתגרים' : 'Challenges'],
            ['journal', isRTL ? 'יומן' : 'Journal'],
            ['nutrition', isRTL ? 'תזונה' : 'Nutrition'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="py-2 px-1 rounded-lg text-xs font-medium transition-all truncate"
              style={{ background: tab === key ? color : 'transparent', color: tab === key ? 'white' : 'var(--muted-foreground)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'habits' && (
          <HabitsTab
            habits={habits}
            completedSet={completedSet}
            domain={domain}
            userId={userId}
            onAdded={(h) => setHabits((prev) => [...prev, h])}
            isRTL={isRTL}
          />
        )}

        {tab === 'challenges' && (
          <ChallengesTab
            challenges={challenges}
            color={color}
            isRTL={isRTL}
            onAdded={(c) => setChallenges((prev) => [c, ...prev])}
            onStatusChange={(id, status) =>
              setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, status } : c))
            }
            onDeleted={(id) => setChallenges((prev) => prev.filter((c) => c.id !== id))}
          />
        )}

        {tab === 'journal' && (
          <JournalTab
            logs={logs}
            color={color}
            isRTL={isRTL}
            onLogUpserted={(log) =>
              setLogs((prev) => {
                const idx = prev.findIndex((l) => l.date === log.date)
                if (idx >= 0) {
                  const next = [...prev]; next[idx] = log; return next
                }
                return [log, ...prev]
              })
            }
            onLogDeleted={(id) => setLogs((prev) => prev.filter((l) => l.id !== id))}
          />
        )}

        {tab === 'nutrition' && (
          <NutritionTab
            food={food}
            color={color}
            isRTL={isRTL}
            onAdded={(f) => setFood((prev) => [f, ...prev])}
            onDeleted={(id) => setFood((prev) => prev.filter((f) => f.id !== id))}
          />
        )}

      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────

function SchemaBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'הרץ את supabase-sports-schema.sql ב-Supabase'
          : 'Run supabase-sports-schema.sql in Supabase SQL editor'}
      </p>
    </Card>
  )
}

// ── Habits Tab ─────────────────────────────────────────────────

function HabitsTab({ habits, completedSet, domain, userId, onAdded, isRTL }: {
  habits: Habit[]
  completedSet: Set<string>
  domain: Domain
  userId: string
  onAdded: (h: Habit) => void
  isRTL: boolean
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: userId, domain_slug: domain.slug, name: name.trim(), frequency: 'daily', schedule_time: time || null })
        .select().single()
      if (!error && data) {
        onAdded(data as Habit)
        setName(''); setTime(''); setAdding(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {habits.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין הרגלים — הוסף ראשון' : 'No habits yet'}
        </p>
      )}
      {habits.map((h) => (
        <DomainHabitRow key={h.id} habit={h} isCompleted={completedSet.has(h.id)} />
      ))}
      {adding ? (
        <div className="flex gap-2">
          <Input
            autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={isRTL ? 'שם ההרגל' : 'Habit name'}
            className="rounded-xl"
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
          />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="rounded-xl px-2 text-sm w-28 flex-shrink-0"
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
          />
          <Button onClick={add} disabled={saving || !name.trim()} className="rounded-xl flex-shrink-0"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            {isRTL ? 'שמור' : 'Save'}
          </Button>
          <button onClick={() => { setAdding(false); setName(''); setTime('') }}
            className="p-2 rounded-xl"
            style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
            <X size={18} />
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף הרגל' : 'Add Habit'}</span>
        </button>
      )}
    </div>
  )
}

// ── Challenges Tab ─────────────────────────────────────────────

function ChallengesTab({ challenges, color, isRTL, onAdded, onStatusChange, onDeleted }: {
  challenges: SportChallenge[]
  color: string
  isRTL: boolean
  onAdded: (c: SportChallenge) => void
  onStatusChange: (id: string, status: 'active' | 'done') => void
  onDeleted: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      const c = await createChallenge(title.trim())
      onAdded(c); setTitle(''); setAdding(false)
    })
  }

  const active = challenges.filter((c) => c.status === 'active')
  const done = challenges.filter((c) => c.status === 'done')

  return (
    <div className="space-y-2">
      {challenges.length === 0 && !adding && (
        <div className="text-center py-10">
          <Dumbbell size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הוסף אתגר ספורטיבי' : 'Add a sports challenge'}
          </p>
        </div>
      )}

      {active.map((c) => (
        <ChallengeRow key={c.id} challenge={c} color={color} isRTL={isRTL}
          onToggle={() => startTransition(async () => {
            await updateChallengeStatus(c.id, 'done')
            onStatusChange(c.id, 'done')
          })}
          onDelete={() => startTransition(async () => {
            await deleteChallenge(c.id); onDeleted(c.id)
          })}
          pending={pending}
        />
      ))}

      {done.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wider pt-3" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הושלמו' : 'Completed'}
          </p>
          {done.map((c) => (
            <ChallengeRow key={c.id} challenge={c} color={color} isRTL={isRTL}
              onToggle={() => startTransition(async () => {
                await updateChallengeStatus(c.id, 'active')
                onStatusChange(c.id, 'active')
              })}
              onDelete={() => startTransition(async () => {
                await deleteChallenge(c.id); onDeleted(c.id)
              })}
              pending={pending}
            />
          ))}
        </>
      )}

      {adding ? (
        <Card className="p-4 mt-3">
          <div className="flex gap-2">
            <Input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={isRTL ? 'מהו האתגר?' : 'What\'s the challenge?'}
              className="flex-1 rounded-xl"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
            />
            <Button onClick={submit} disabled={pending || !title.trim()} className="rounded-xl"
              style={{ background: color, color: 'white' }}>
              {isRTL ? 'הוסף' : 'Add'}
            </Button>
            <button onClick={() => { setAdding(false); setTitle('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed mt-2"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף אתגר' : 'Add Challenge'}</span>
        </button>
      )}
    </div>
  )
}

function ChallengeRow({ challenge, color, isRTL, onToggle, onDelete, pending }: {
  challenge: SportChallenge; color: string; isRTL: boolean
  onToggle: () => void; onDelete: () => void; pending: boolean
}) {
  const done = challenge.status === 'done'
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)', opacity: done ? 0.6 : 1 }}>
      <button onClick={onToggle} disabled={pending}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: done ? color : 'transparent', border: `2px solid ${color}` }}>
        {done && <Check size={13} color="white" />}
      </button>
      <p className="flex-1 text-sm font-medium"
        style={{ color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}>
        {challenge.title}
      </p>
      <button onClick={onDelete} disabled={pending}
        className="p-1.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Journal Tab (Calendar) ─────────────────────────────────────

function JournalTab({ logs, color, isRTL, onLogUpserted, onLogDeleted }: {
  logs: SportWorkoutLog[]
  color: string
  isRTL: boolean
  onLogUpserted: (log: SportWorkoutLog) => void
  onLogDeleted: (id: string) => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toISOString().split('T')[0])
  const [editText, setEditText] = useState('')
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  const logsByDate = useMemo(() => {
    const m = new Map<string, SportWorkoutLog>()
    for (const l of logs) m.set(l.date, l)
    return m
  }, [logs])

  const selectedLog = selectedDate ? logsByDate.get(selectedDate) : undefined

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = today.toISOString().split('T')[0]

  function dateStr(day: number) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function openEdit(date: string) {
    setSelectedDate(date)
    const log = logsByDate.get(date)
    setEditText(log?.notes ?? '')
    setEditing(true)
  }

  function saveEdit() {
    if (!selectedDate) return
    if (!editText.trim()) {
      const log = logsByDate.get(selectedDate)
      if (log) {
        startTransition(async () => {
          await deleteWorkoutLog(log.id)
          onLogDeleted(log.id)
          setEditing(false)
        })
      } else {
        setEditing(false)
      }
      return
    }
    startTransition(async () => {
      const saved = await upsertWorkoutLog(selectedDate, editText.trim())
      onLogUpserted(saved)
      setEditing(false)
    })
  }

  const dayLabels = isRTL ? HE_DAYS : EN_DAYS

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <Card className="p-4" style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? `${HE_MONTHS[viewMonth]} ${viewYear}` : `${new Date(viewYear, viewMonth).toLocaleString('en', { month: 'long' })} ${viewYear}`}
          </h3>
          <button onClick={nextMonth} className="p-1.5 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayLabels.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--muted-foreground)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const ds = dateStr(day)
            const hasLog = logsByDate.has(ds)
            const isToday = ds === todayStr
            const isSelected = ds === selectedDate

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : ds)}
                className="flex items-center justify-center h-8 w-8 mx-auto rounded-full text-xs font-medium transition-all"
                style={{
                  background: isSelected
                    ? color
                    : hasLog
                    ? `${color}30`
                    : isToday
                    ? 'var(--secondary)'
                    : 'transparent',
                  color: isSelected
                    ? 'white'
                    : isToday
                    ? color
                    : 'var(--foreground)',
                  fontWeight: isToday ? 700 : 500,
                  border: isToday && !isSelected ? `1px solid ${color}` : 'none',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Selected day detail */}
      {selectedDate && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--card)', border: `1px solid ${color}33` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
            {selectedLog && !editing && (
              <button onClick={() => { setEditText(selectedLog.notes); setEditing(true) }}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: `${color}22`, color }}>
                {isRTL ? 'ערוך' : 'Edit'}
              </button>
            )}
          </div>

          {editing ? (
            <>
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={isRTL ? 'מה אימנת היום?' : 'What did you train today?'}
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={pending} className="flex-1 rounded-xl"
                  style={{ background: color, color: 'white' }}>
                  {isRTL ? 'שמור' : 'Save'}
                </Button>
                <button onClick={() => setEditing(false)}
                  className="p-2 rounded-xl"
                  style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                  <X size={18} />
                </button>
              </div>
            </>
          ) : selectedLog ? (
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
              {selectedLog.notes}
            </p>
          ) : (
            <button onClick={() => openEdit(selectedDate)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              <Plus size={16} />
              <span className="text-sm">{isRTL ? 'הוסף רשומה לתאריך זה' : 'Log workout for this day'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Nutrition Tab ──────────────────────────────────────────────

function NutritionTab({ food, color, isRTL, onAdded, onDeleted }: {
  food: SportFoodRestriction[]
  color: string
  isRTL: boolean
  onAdded: (f: SportFoodRestriction) => void
  onDeleted: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [item, setItem] = useState('')
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!item.trim()) return
    startTransition(async () => {
      const f = await createFoodRestriction({ food_item: item.trim(), reason: reason.trim() || undefined })
      onAdded(f); setItem(''); setReason(''); setAdding(false)
    })
  }

  return (
    <div className="space-y-3">
      {/* intro */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
        <Ban size={16} style={{ color, flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL
            ? 'רשימת המאכלים שהחלטת להימנע מהם'
            : 'Foods you\'ve decided to avoid'}
        </p>
      </div>

      {food.length === 0 && !adding && (
        <p className="text-center py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'הרשימה ריקה' : 'List is empty'}
        </p>
      )}

      {food.map((f) => (
        <div key={f.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}>
          <Ban size={14} style={{ color, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{f.food_item}</p>
            {f.reason && (
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{f.reason}</p>
            )}
          </div>
          <button
            onClick={() => startTransition(async () => { await deleteFoodRestriction(f.id); onDeleted(f.id) })}
            disabled={pending} className="p-1.5 flex-shrink-0"
            style={{ color: 'var(--muted-foreground)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus value={item} onChange={(e) => setItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'מה להימנע מלאכול?' : 'What to avoid eating?'}
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
          />
          <Input
            value={reason} onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'סיבה (אופציונלי)' : 'Reason (optional)'}
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
          />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={pending || !item.trim()} className="flex-1"
              style={{ background: color, color: 'white' }}>
              {isRTL ? 'הוסף' : 'Add'}
            </Button>
            <button onClick={() => { setAdding(false); setItem(''); setReason('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף לרשימה' : 'Add to list'}</span>
        </button>
      )}
    </div>
  )
}
