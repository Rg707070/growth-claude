'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Flame, Trash2, Sparkles, MapPin,
  Utensils, Plane, Home, Calendar, Tag, ListChecks,
} from 'lucide-react'
import { useLang } from '@/lib/lang'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createFamilyTask, updateFamilyTaskStatus, deleteFamilyTask,
  createFamilyHabit, completeFamilyHabit, deleteFamilyHabit,
  createRoutineBreaker, updateRoutineBreakerStatus, deleteRoutineBreaker,
} from './actions'
import { proposeRoutineBreaker } from '@/lib/family/routine-breaker'
import { isStreakAlive } from '@/lib/family/streak-engine'
import { subscribeFamilyRealtime } from '@/lib/family/realtime'
import type {
  Domain,
} from '@/types'
import type {
  FamilyTask, FamilyHabit, RoutineBreaker,
  FamilyTaskCategory, FamilyTaskUrgency,
  FamilyHabitFrequency, FamilyHabitAccountability,
  RoutineBreakerType, RoutineBreakerCostTier,
} from '@/types/family'

type Tab = 'tasks' | 'habits' | 'adventures'

interface Props {
  domain: Domain
  userId: string
  tasks: FamilyTask[]
  habits: FamilyHabit[]
  breakers: RoutineBreaker[]
  schemaReady: boolean
}

export function FamilyClient({ domain, tasks, habits, breakers, schemaReady }: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('tasks')

  useEffect(() => {
    if (!schemaReady) return
    return subscribeFamilyRealtime(
      ['family_tasks', 'family_habits', 'routine_breakers'],
      () => router.refresh()
    )
  }, [router, schemaReady])

  return (
    <div className="px-4 pt-12 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
        >
          <ArrowRight
            size={20}
            style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }}
          />
        </button>
        <div className="flex-1">
          <h1
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--foreground)' }}
          >
            <span>{domain.icon}</span>
            <span>{isRTL ? 'אקוסיסטם משפחה' : 'Family Ecosystem'}</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL
              ? 'משימות משותפות · טקסים יומיים · רעיונות להרפתקאות'
              : 'Shared tasks · Daily rituals · Adventure ledger'}
          </p>
        </div>
      </div>

      {!schemaReady && <SchemaNotReadyBanner isRTL={isRTL} />}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          color={domain.color}
          icon={<ListChecks size={16} />}
          label={isRTL ? 'משימות' : 'Tasks'}
          value={tasks.filter((t) => t.status !== 'done').length}
        />
        <StatTile
          color={domain.color}
          icon={<Flame size={16} />}
          label={isRTL ? 'רצף הטוב ביותר' : 'Best Streak'}
          value={habits.reduce((m, h) => Math.max(m, h.current_streak), 0)}
        />
        <StatTile
          color={domain.color}
          icon={<Sparkles size={16} />}
          label={isRTL ? 'בbacklog' : 'Backlog'}
          value={breakers.filter((b) => b.status === 'backlog').length}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
        <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} color={domain.color}>
          {isRTL ? 'משימות' : 'Tasks'}
        </TabButton>
        <TabButton active={tab === 'habits'} onClick={() => setTab('habits')} color={domain.color}>
          {isRTL ? 'טקסים' : 'Rituals'}
        </TabButton>
        <TabButton
          active={tab === 'adventures'}
          onClick={() => setTab('adventures')}
          color={domain.color}
        >
          {isRTL ? 'הרפתקאות' : 'Adventures'}
        </TabButton>
      </div>

      {tab === 'tasks' && (
        <TasksTab tasks={tasks} accentColor={domain.color} isRTL={isRTL} />
      )}
      {tab === 'habits' && (
        <HabitsTab habits={habits} accentColor={domain.color} isRTL={isRTL} />
      )}
      {tab === 'adventures' && (
        <AdventuresTab breakers={breakers} accentColor={domain.color} isRTL={isRTL} />
      )}
    </div>
  )
}

// ─── Shared bits ─────────────────────────────────────────────

function SchemaNotReadyBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'הרץ את supabase-family-schema.sql ב-Supabase כדי להפעיל את התכונה.'
          : 'Run supabase-family-schema.sql in your Supabase SQL editor to enable this feature.'}
      </p>
    </Card>
  )
}

function StatTile({
  color, icon, label, value,
}: { color: string; icon: React.ReactNode; label: string; value: number }) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}33`,
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
        {value}
      </div>
    </div>
  )
}

function TabButton({
  active, onClick, color, children,
}: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? color : 'transparent',
        color: active ? 'white' : 'var(--muted-foreground)',
      }}
    >
      {children}
    </button>
  )
}

// ─── Tasks Tab ───────────────────────────────────────────────

const TASK_CATEGORIES: { value: FamilyTaskCategory; he: string; en: string }[] = [
  { value: 'household', he: 'בית', en: 'Household' },
  { value: 'financial', he: 'כספים', en: 'Financial' },
  { value: 'shopping', he: 'קניות', en: 'Shopping' },
  { value: 'childcare', he: 'ילדים', en: 'Childcare' },
  { value: 'social', he: 'חברתי', en: 'Social' },
  { value: 'other', he: 'אחר', en: 'Other' },
]

const URGENCY_COLORS: Record<FamilyTaskUrgency, string> = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
}

function TasksTab({
  tasks, accentColor, isRTL,
}: { tasks: FamilyTask[]; accentColor: string; isRTL: boolean }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<FamilyTaskCategory>('household')
  const [urgency, setUrgency] = useState<FamilyTaskUrgency>('normal')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createFamilyTask({ title: title.trim(), category, urgency })
      setTitle('')
      setCategory('household')
      setUrgency('normal')
      setAdding(false)
    })
  }

  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')

  return (
    <div className="space-y-4">
      {open.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין משימות פתוחות' : 'No open tasks'}
        </p>
      )}

      {open.map((task) => (
        <TaskCard key={task.id} task={task} isRTL={isRTL} />
      ))}

      {done.length > 0 && (
        <>
          <p
            className="text-xs uppercase tracking-wider pt-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {isRTL ? 'הושלמו' : 'Completed'}
          </p>
          {done.map((task) => (
            <TaskCard key={task.id} task={task} isRTL={isRTL} />
          ))}
        </>
      )}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isRTL ? 'מה המשימה?' : 'Task title…'}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FamilyTaskCategory)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{isRTL ? c.he : c.en}</option>
              ))}
            </select>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as FamilyTaskUrgency)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="low">{isRTL ? 'נמוך' : 'Low'}</option>
              <option value="normal">{isRTL ? 'רגיל' : 'Normal'}</option>
              <option value="high">{isRTL ? 'גבוה' : 'High'}</option>
              <option value="critical">{isRTL ? 'קריטי' : 'Critical'}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="flex-1"
              style={{ background: accentColor, color: 'white' }}
            >
              {isRTL ? 'שמור' : 'Save'}
            </Button>
            <button
              onClick={() => { setAdding(false); setTitle('') }}
              className="p-2 rounded-lg"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף משימה' : 'Add Task'}</span>
        </button>
      )}
    </div>
  )
}

function TaskCard({ task, isRTL }: { task: FamilyTask; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const done = task.status === 'done'
  const urgencyColor = URGENCY_COLORS[task.urgency]
  const category = TASK_CATEGORIES.find((c) => c.value === task.category)

  return (
    <Card
      className="p-3 flex items-center gap-3"
      style={{ opacity: done ? 0.5 : 1 }}
    >
      <button
        onClick={() => startTransition(async () => {
          await updateFamilyTaskStatus(task.id, done ? 'pending' : 'done')
        })}
        disabled={pending}
        className="w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0"
        style={{
          background: done ? urgencyColor : 'transparent',
          border: `2px solid ${urgencyColor}`,
        }}
      >
        {done && <Check size={14} color="white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{
            color: 'var(--foreground)',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {category && (
            <span className="flex items-center gap-1">
              <Tag size={10} />
              {isRTL ? category.he : category.en}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {task.due_date}
            </span>
          )}
          {task.is_recurring && (
            <span style={{ color: urgencyColor }}>
              {isRTL ? 'מתחלף' : 'rotation'}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => startTransition(async () => { await deleteFamilyTask(task.id) })}
        disabled={pending}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={14} />
      </button>
    </Card>
  )
}

// ─── Habits Tab ──────────────────────────────────────────────

function HabitsTab({
  habits, accentColor, isRTL,
}: { habits: FamilyHabit[]; accentColor: string; isRTL: boolean }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<FamilyHabitFrequency>('daily')
  const [accountability, setAccountability] = useState<FamilyHabitAccountability>('shared_streak')
  const [anchor, setAnchor] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      await createFamilyHabit({
        name: name.trim(),
        frequency,
        accountability_type: accountability,
        context_anchor: anchor.trim() || null,
      })
      setName(''); setAnchor(''); setFrequency('daily'); setAccountability('shared_streak')
      setAdding(false)
    })
  }

  return (
    <div className="space-y-3">
      {habits.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין טקסים — הוסף ראשון' : 'No rituals yet — add one'}
        </p>
      )}

      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} accentColor={accentColor} isRTL={isRTL} />
      ))}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isRTL ? 'שם הטקס (למשל: ארוחה משפחתית)' : 'Ritual name'}
          />
          <Input
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            placeholder={isRTL ? 'עוגן הקשר (למשל: אחרי ארוחת ערב)' : 'Context anchor (e.g., after dinner)'}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FamilyHabitFrequency)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="daily">{isRTL ? 'יומי' : 'Daily'}</option>
              <option value="weekly">{isRTL ? 'שבועי' : 'Weekly'}</option>
              <option value="monthly">{isRTL ? 'חודשי' : 'Monthly'}</option>
            </select>
            <select
              value={accountability}
              onChange={(e) => setAccountability(e.target.value as FamilyHabitAccountability)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="shared_streak">{isRTL ? 'רצף משותף' : 'Shared streak'}</option>
              <option value="individual">{isRTL ? 'אישי' : 'Individual'}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={submit}
              disabled={pending || !name.trim()}
              className="flex-1"
              style={{ background: accentColor, color: 'white' }}
            >
              {isRTL ? 'שמור' : 'Save'}
            </Button>
            <button
              onClick={() => { setAdding(false); setName(''); setAnchor('') }}
              className="p-2 rounded-lg"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף טקס' : 'Add Ritual'}</span>
        </button>
      )}
    </div>
  )
}

function HabitCard({
  habit, accentColor, isRTL,
}: { habit: FamilyHabit; accentColor: string; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const alive = isStreakAlive(habit)
  const freqLabel = habit.frequency === 'daily'
    ? (isRTL ? 'יומי' : 'daily')
    : habit.frequency === 'weekly' ? (isRTL ? 'שבועי' : 'weekly') : (isRTL ? 'חודשי' : 'monthly')

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={() => startTransition(async () => { await completeFamilyHabit(habit.id) })}
          disabled={pending}
          className="flex-shrink-0 px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
          style={{
            background: alive ? accentColor : `${accentColor}22`,
            color: alive ? 'white' : accentColor,
          }}
        >
          <Flame size={14} />
          {habit.current_streak}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {habit.name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            <span>{freqLabel}</span>
            <span>·</span>
            <span>
              {habit.accountability_type === 'shared_streak'
                ? (isRTL ? 'רצף משותף' : 'shared')
                : (isRTL ? 'אישי' : 'individual')}
            </span>
            {!alive && habit.current_streak > 0 && (
              <>
                <span>·</span>
                <span style={{ color: '#ef4444' }}>{isRTL ? 'פג תוקף' : 'lapsed'}</span>
              </>
            )}
          </div>
          {habit.context_anchor && (
            <p className="text-[11px] mt-1 italic" style={{ color: 'var(--muted-foreground)' }}>
              {habit.context_anchor}
            </p>
          )}
        </div>

        <button
          onClick={() => startTransition(async () => { await deleteFamilyHabit(habit.id) })}
          disabled={pending}
          className="p-1.5"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  )
}

// ─── Adventures Tab ──────────────────────────────────────────

const ADVENTURE_TYPES: { value: RoutineBreakerType; he: string; en: string; icon: React.ReactNode }[] = [
  { value: 'day_trip', he: 'טיול יום', en: 'Day Trip', icon: <MapPin size={14} /> },
  { value: 'restaurant', he: 'מסעדה', en: 'Restaurant', icon: <Utensils size={14} /> },
  { value: 'long_term_travel', he: 'נסיעה', en: 'Travel', icon: <Plane size={14} /> },
  { value: 'relocation', he: 'מעבר דירה', en: 'Relocation', icon: <Home size={14} /> },
  { value: 'activity', he: 'פעילות', en: 'Activity', icon: <Sparkles size={14} /> },
  { value: 'other', he: 'אחר', en: 'Other', icon: <Tag size={14} /> },
]

function AdventuresTab({
  breakers, accentColor, isRTL,
}: { breakers: RoutineBreaker[]; accentColor: string; isRTL: boolean }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<RoutineBreakerType>('day_trip')
  const [costTier, setCostTier] = useState<RoutineBreakerCostTier>('moderate')
  const [proposal, setProposal] = useState<RoutineBreaker | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createRoutineBreaker({ title: title.trim(), type, cost_tier: costTier })
      setTitle(''); setType('day_trip'); setCostTier('moderate')
      setAdding(false)
    })
  }

  const proposeNew = () => {
    const picked = proposeRoutineBreaker(breakers, {})
    setProposal(picked)
  }

  const backlog = breakers.filter((b) => b.status === 'backlog')
  const planned = breakers.filter((b) => b.status === 'planned')

  return (
    <div className="space-y-4">
      {/* Propose button */}
      <button
        onClick={proposeNew}
        disabled={backlog.length === 0}
        className="w-full p-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: 'white',
        }}
      >
        <Sparkles size={18} />
        {isRTL ? 'הצע הרפתקה אקראית' : 'Propose Random Adventure'}
      </button>

      {proposal && (
        <Card className="p-4" style={{ borderColor: accentColor, background: `${accentColor}11` }}>
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: accentColor }}>
            {isRTL ? 'הצעה לשבירת שגרה' : 'Spontaneous Suggestion'}
          </p>
          <p className="text-lg font-bold mt-1" style={{ color: 'var(--foreground)' }}>
            {proposal.title}
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => startTransition(async () => {
                await updateRoutineBreakerStatus(proposal.id, 'planned')
                setProposal(null)
              })}
              style={{ background: accentColor, color: 'white' }}
              className="flex-1"
            >
              {isRTL ? 'תכנן עכשיו' : 'Plan it'}
            </Button>
            <Button
              onClick={() => setProposal(null)}
              style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}
              className="flex-1"
            >
              {isRTL ? 'דלג' : 'Skip'}
            </Button>
          </div>
        </Card>
      )}

      {planned.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {isRTL ? 'בתכנון' : 'Planned'}
          </p>
          {planned.map((b) => (
            <BreakerCard key={b.id} breaker={b} accentColor={accentColor} isRTL={isRTL} />
          ))}
        </div>
      )}

      {backlog.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {isRTL ? 'רשימת חלומות' : 'Bucket List'}
          </p>
          {backlog.map((b) => (
            <BreakerCard key={b.id} breaker={b} accentColor={accentColor} isRTL={isRTL} />
          ))}
        </div>
      )}

      {breakers.length === 0 && !adding && (
        <p className="text-center py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'הוסף רעיון ראשון' : 'Add your first idea'}
        </p>
      )}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isRTL ? 'מה תרצה לעשות?' : 'What would you like to do?'}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RoutineBreakerType)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {ADVENTURE_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{isRTL ? a.he : a.en}</option>
              ))}
            </select>
            <select
              value={costTier}
              onChange={(e) => setCostTier(e.target.value as RoutineBreakerCostTier)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="budget">{isRTL ? 'חסכוני' : 'Budget'}</option>
              <option value="moderate">{isRTL ? 'בינוני' : 'Moderate'}</option>
              <option value="luxury">{isRTL ? 'יוקרתי' : 'Luxury'}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="flex-1"
              style={{ background: accentColor, color: 'white' }}
            >
              {isRTL ? 'שמור' : 'Save'}
            </Button>
            <button
              onClick={() => { setAdding(false); setTitle('') }}
              className="p-2 rounded-lg"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף רעיון' : 'Add Idea'}</span>
        </button>
      )}
    </div>
  )
}

function BreakerCard({
  breaker, accentColor, isRTL,
}: { breaker: RoutineBreaker; accentColor: string; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const typeInfo = ADVENTURE_TYPES.find((a) => a.value === breaker.type)
  const costLabel = breaker.cost_tier === 'budget'
    ? (isRTL ? 'חסכוני' : 'budget')
    : breaker.cost_tier === 'moderate' ? (isRTL ? 'בינוני' : 'moderate') : (isRTL ? 'יוקרתי' : 'luxury')

  return (
    <Card className="p-3 flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accentColor}22`, color: accentColor }}
      >
        {typeInfo?.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {breaker.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {typeInfo ? (isRTL ? typeInfo.he : typeInfo.en) : breaker.type} · {costLabel}
        </p>
      </div>
      {breaker.status === 'backlog' && (
        <button
          onClick={() => startTransition(async () => {
            await updateRoutineBreakerStatus(breaker.id, 'planned')
          })}
          disabled={pending}
          className="px-2 py-1 rounded-md text-[10px] font-semibold"
          style={{ background: accentColor, color: 'white' }}
        >
          {isRTL ? 'תכנן' : 'Plan'}
        </button>
      )}
      <button
        onClick={() => startTransition(async () => { await deleteRoutineBreaker(breaker.id) })}
        disabled={pending}
        className="p-1.5"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={14} />
      </button>
    </Card>
  )
}
