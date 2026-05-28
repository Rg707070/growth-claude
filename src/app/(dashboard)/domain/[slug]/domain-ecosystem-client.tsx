'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Trash2,
  ListChecks, Target, Flame, Calendar, Tag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { HabitRow } from '@/components/habit-row'
import { ProgressRing } from '@/components/progress-ring'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createDomainTask, updateDomainTaskStatus, deleteDomainTask,
  createDomainGoal, updateDomainGoalStatus, deleteDomainGoal,
} from './ecosystem-actions'
import {
  getDomainEcosystemConfig,
  URGENCY_COLORS,
} from '@/lib/domain-ecosystem-config'
import type { EcosystemCategory } from '@/lib/domain-ecosystem-config'
import type { Domain, Habit } from '@/types'
import type {
  DomainTask, DomainGoal,
  DomainTaskUrgency, DomainGoalStatus,
} from '@/types/ecosystem'

type Tab = 'tasks' | 'habits' | 'goals'

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
  tasks: DomainTask[]
  goals: DomainGoal[]
  schemaReady: boolean
}

export function DomainEcosystemClient({
  domain,
  habits: initialHabits,
  completedIds,
  userId,
  tasks,
  goals,
  schemaReady,
}: Props) {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('habits')
  const [habits, setHabits] = useState(initialHabits)
  const config = getDomainEcosystemConfig(domain.slug)

  useHabitReminders(habits)

  const completedSet = useMemo(() => new Set(completedIds), [completedIds])
  const completedCount = habits.filter((h) => completedSet.has(h.id)).length
  const pct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0
  const openTasksCount = tasks.filter((tk) => tk.status !== 'done').length
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 md:max-w-none md:px-0 md:pt-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl transition-colors flex-shrink-0"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <ArrowRight
              size={20}
              style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }}
            />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${domain.color}22`, color: domain.color }}
          >
            {domain.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight" style={{ color: 'var(--foreground)' }}>
              {isRTL ? domain.nameHe : domain.nameEn}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {completedCount}/{habits.length} {t('habits')}
            </p>
          </div>
          <ProgressRing percentage={pct} color={domain.color} size={48} strokeWidth={4}>
            <span className="text-[10px] font-bold" style={{ color: domain.color }}>
              {pct}%
            </span>
          </ProgressRing>
        </div>

        {!schemaReady && <MigrationBanner isRTL={isRTL} />}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            color={domain.color}
            icon={<ListChecks size={15} />}
            label={isRTL ? 'משימות' : 'Tasks'}
            value={openTasksCount}
          />
          <StatTile
            color={domain.color}
            icon={<Flame size={15} />}
            label={isRTL ? 'הרגלים' : 'Habits'}
            value={completedCount}
          />
          <StatTile
            color={domain.color}
            icon={<Target size={15} />}
            label={isRTL ? config.goals.tabHe : config.goals.tabEn}
            value={activeGoalsCount}
          />
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: 'var(--secondary)' }}
        >
          <TabButton active={tab === 'habits'} onClick={() => setTab('habits')} color={domain.color}>
            {isRTL ? 'הרגלים' : 'Habits'}
          </TabButton>
          <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} color={domain.color}>
            {isRTL ? 'משימות' : 'Tasks'}
          </TabButton>
          <TabButton active={tab === 'goals'} onClick={() => setTab('goals')} color={domain.color}>
            {isRTL ? config.goals.tabHe : config.goals.tabEn}
          </TabButton>
        </div>

        {tab === 'habits' && (
          <HabitsTab
            habits={habits}
            completedSet={completedSet}
            domain={domain}
            userId={userId}
            onHabitAdded={(h) => setHabits((prev) => [...prev, h])}
            isRTL={isRTL}
            t={t}
          />
        )}
        {tab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            slug={domain.slug}
            categories={config.taskCategories}
            accentColor={domain.color}
            isRTL={isRTL}
          />
        )}
        {tab === 'goals' && (
          <GoalsTab
            goals={goals}
            slug={domain.slug}
            config={config.goals}
            accentColor={domain.color}
            isRTL={isRTL}
          />
        )}

      </div>
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────

function MigrationBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'הרץ את supabase-domain-ecosystem.sql ב-Supabase כדי להפעיל את התכונות.'
          : 'Run supabase-domain-ecosystem.sql in your Supabase SQL editor to enable these features.'}
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
      style={{ background: `${color}15`, border: `1px solid ${color}33` }}
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold truncate">{label}</span>
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
      className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all truncate"
      style={{
        background: active ? color : 'transparent',
        color: active ? 'white' : 'var(--muted-foreground)',
      }}
    >
      {children}
    </button>
  )
}

// ── Habits Tab ─────────────────────────────────────────────────

interface HabitsTabProps {
  habits: Habit[]
  completedSet: Set<string>
  domain: Domain
  userId: string
  onHabitAdded: (h: Habit) => void
  isRTL: boolean
  t: (k: string) => string
}

function HabitsTab({
  habits, completedSet, domain, userId, onHabitAdded, isRTL, t,
}: HabitsTabProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const addHabit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          domain_slug: domain.slug,
          name: name.trim(),
          frequency: 'daily',
          schedule_time: time || null,
        })
        .select()
        .single()
      if (error || !data) {
        setSaveError(isRTL ? 'שגיאה בשמירה — נסה שוב' : 'Save failed — try again')
        return
      }
      onHabitAdded(data as Habit)
      setName('')
      setTime('')
      setAdding(false)
      router.refresh()
    } catch {
      setSaveError(isRTL ? 'שגיאה — נסה שוב' : 'Error — try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {habits.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('noHabitsYet')}
        </p>
      )}
      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} isCompleted={completedSet.has(habit.id)} />
      ))}

      {adding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              placeholder={t('habitName')}
              className="rounded-xl"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl px-2 text-sm w-28 flex-shrink-0"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <Button
              onClick={addHabit}
              disabled={saving || !name.trim()}
              className="rounded-xl flex-shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {t('save')}
            </Button>
            <button
              onClick={() => { setAdding(false); setName(''); setTime(''); setSaveError(null) }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
          {saveError && <p className="text-red-400 text-xs text-center">{saveError}</p>}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{t('addHabit')}</span>
        </button>
      )}
    </div>
  )
}

// ── Tasks Tab ──────────────────────────────────────────────────

interface TasksTabProps {
  tasks: DomainTask[]
  slug: string
  categories: EcosystemCategory[]
  accentColor: string
  isRTL: boolean
}

function TasksTab({ tasks, slug, categories, accentColor, isRTL }: TasksTabProps) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0]?.value ?? 'other')
  const [urgency, setUrgency] = useState<DomainTaskUrgency>('normal')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createDomainTask(slug, { title: title.trim(), category, urgency })
      setTitle('')
      setCategory(categories[0]?.value ?? 'other')
      setUrgency('normal')
      setAdding(false)
    })
  }

  const open = tasks.filter((tk) => tk.status !== 'done')
  const done = tasks.filter((tk) => tk.status === 'done')

  return (
    <div className="space-y-3">
      {open.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין משימות פתוחות' : 'No open tasks'}
        </p>
      )}

      {open.map((task) => (
        <TaskCard key={task.id} task={task} slug={slug} categories={categories} isRTL={isRTL} />
      ))}

      {done.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wider pt-2" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הושלמו' : 'Completed'}
          </p>
          {done.map((task) => (
            <TaskCard key={task.id} task={task} slug={slug} categories={categories} isRTL={isRTL} />
          ))}
        </>
      )}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'מה המשימה?' : 'Task title…'}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {isRTL ? c.he : c.en}
                </option>
              ))}
            </select>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as DomainTaskUrgency)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="low">{isRTL ? 'נמוכה' : 'Low'}</option>
              <option value="normal">{isRTL ? 'רגילה' : 'Normal'}</option>
              <option value="high">{isRTL ? 'גבוהה' : 'High'}</option>
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
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
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

function TaskCard({
  task, slug, categories, isRTL,
}: { task: DomainTask; slug: string; categories: EcosystemCategory[]; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const done = task.status === 'done'
  const urgencyColor = URGENCY_COLORS[task.urgency] ?? '#6b7280'
  const cat = categories.find((c) => c.value === task.category)

  return (
    <Card className="p-3 flex items-center gap-3" style={{ opacity: done ? 0.55 : 1 }}>
      <button
        onClick={() => startTransition(async () => {
          await updateDomainTaskStatus(task.id, slug, done ? 'pending' : 'done')
        })}
        disabled={pending}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: done ? urgencyColor : 'transparent', border: `2px solid ${urgencyColor}` }}
      >
        {done && <Check size={13} color="white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          {cat && (
            <span className="flex items-center gap-1">
              <Tag size={10} />
              {cat.icon} {isRTL ? cat.he : cat.en}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {task.due_date}
            </span>
          )}
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
            style={{ background: `${urgencyColor}22`, color: urgencyColor }}
          >
            {isRTL
              ? { low: 'נמוכה', normal: 'רגילה', high: 'גבוהה', critical: 'קריטי' }[task.urgency]
              : task.urgency}
          </span>
        </div>
      </div>

      <button
        onClick={() => startTransition(async () => { await deleteDomainTask(task.id, slug) })}
        disabled={pending}
        className="p-1.5 rounded-lg flex-shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={14} />
      </button>
    </Card>
  )
}

// ── Goals Tab ──────────────────────────────────────────────────

import type { EcosystemGoalConfig } from '@/lib/domain-ecosystem-config'

interface GoalsTabProps {
  goals: DomainGoal[]
  slug: string
  config: EcosystemGoalConfig
  accentColor: string
  isRTL: boolean
}

function GoalsTab({ goals, slug, config, accentColor, isRTL }: GoalsTabProps) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState(config.types[0]?.value ?? 'other')
  const [startAs, setStartAs] = useState<DomainGoalStatus>('active')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createDomainGoal(slug, { title: title.trim(), type, status: startAs })
      setTitle('')
      setType(config.types[0]?.value ?? 'other')
      setStartAs('active')
      setAdding(false)
    })
  }

  const active = goals.filter((g) => g.status === 'active')
  const backlog = goals.filter((g) => g.status === 'backlog')
  const done = goals.filter((g) => g.status === 'done')

  return (
    <div className="space-y-3">
      {goals.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? config.emptyHe : config.emptyEn}
        </p>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((g) => (
            <GoalCard key={g.id} goal={g} slug={slug} config={config} accentColor={accentColor} isRTL={isRTL} />
          ))}
        </div>
      )}

      {backlog.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wider pt-2" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'רשימת חלומות' : 'Backlog'}
          </p>
          {backlog.map((g) => (
            <GoalCard key={g.id} goal={g} slug={slug} config={config} accentColor={accentColor} isRTL={isRTL} />
          ))}
        </>
      )}

      {done.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wider pt-2" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הושלמו' : 'Completed'}
          </p>
          {done.map((g) => (
            <GoalCard key={g.id} goal={g} slug={slug} config={config} accentColor={accentColor} isRTL={isRTL} />
          ))}
        </>
      )}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? config.addHe : config.addEn}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              {config.types.map((tp) => (
                <option key={tp.value} value={tp.value}>
                  {tp.icon} {isRTL ? tp.he : tp.en}
                </option>
              ))}
            </select>
            <select
              value={startAs}
              onChange={(e) => setStartAs(e.target.value as DomainGoalStatus)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="active">{isRTL ? 'פעיל' : 'Active'}</option>
              <option value="backlog">{isRTL ? 'בתוכנית' : 'Backlog'}</option>
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
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
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
          <span className="text-sm">{isRTL ? config.addHe : config.addEn}</span>
        </button>
      )}
    </div>
  )
}

function GoalCard({
  goal, slug, config, accentColor, isRTL,
}: { goal: DomainGoal; slug: string; config: EcosystemGoalConfig; accentColor: string; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const isDone = goal.status === 'done'
  const isBacklog = goal.status === 'backlog'
  const typeInfo = config.types.find((tp) => tp.value === goal.type)

  return (
    <Card className="p-3 flex items-center gap-3" style={{ opacity: isDone ? 0.55 : 1 }}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: `${accentColor}22`, color: accentColor }}
      >
        {typeInfo?.icon ?? '🎯'}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{
            color: 'var(--foreground)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {goal.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {typeInfo ? (isRTL ? typeInfo.he : typeInfo.en) : goal.type}
          {isBacklog && ` · ${isRTL ? 'בתוכנית' : 'backlog'}`}
          {isDone && ` · ✓`}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {!isDone && (
          <button
            onClick={() => startTransition(async () => {
              await updateDomainGoalStatus(goal.id, slug, 'done')
            })}
            disabled={pending}
            className="px-2 py-1 rounded-md text-[10px] font-semibold"
            style={{ background: accentColor, color: 'white' }}
          >
            <Check size={12} />
          </button>
        )}
        {isBacklog && (
          <button
            onClick={() => startTransition(async () => {
              await updateDomainGoalStatus(goal.id, slug, 'active')
            })}
            disabled={pending}
            className="px-2 py-1 rounded-md text-[10px] font-semibold"
            style={{ background: `${accentColor}33`, color: accentColor }}
          >
            {isRTL ? 'הפעל' : 'Start'}
          </button>
        )}
        <button
          onClick={() => startTransition(async () => { await deleteDomainGoal(goal.id, slug) })}
          disabled={pending}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  )
}
