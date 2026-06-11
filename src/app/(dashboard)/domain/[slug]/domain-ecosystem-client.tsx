'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Trash2,
  ListChecks, Target, Flame, Calendar, Tag, LayoutDashboard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { DomainHabitsTab } from '@/components/domain-habits-tab'
import { ProgressRing } from '@/components/progress-ring'
import { DomainJournal } from '@/components/domain-journal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createDomainTask, updateDomainTaskStatus, deleteDomainTask, scheduleDomainTask,
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
  DomainTaskUrgency, DomainTaskFrequency, DomainGoalStatus,
} from '@/types/ecosystem'

type Tab = 'habits' | 'tasks' | 'goals' | 'board'

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
  const completedCount = habits.filter((h: Habit) => completedSet.has(h.id)).length
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
            value={`${completedCount}/${habits.length}`}
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
          <TabButton active={tab === 'board'} onClick={() => setTab('board')} color={domain.color}>
            {isRTL ? 'לוח' : 'Board'}
          </TabButton>
        </div>

        {tab === 'habits' && (
          <DomainHabitsTab
            habits={habits}
            completedSet={completedSet}
            domain={domain}
            userId={userId}
            onAdded={(h: Habit) => setHabits((prev: Habit[]) => [...prev, h])}
            isRTL={isRTL}
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
        {tab === 'board' && (
          <BoardTab
            habits={habits}
            completedSet={completedSet}
            tasks={tasks}
            goals={goals}
            domain={domain}
            isRTL={isRTL}
            config={config}
          />
        )}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <DomainJournal domainSlug={domain.slug} userId={userId} />
        </div>

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
}: { color: string; icon: React.ReactNode; label: string; value: number | string }) {
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

// ── Tasks Tab ──────────────────────────────────────────────────

const FREQ_LABELS = {
  weekly:  { he: 'שבועי',  en: 'Weekly'  },
  monthly: { he: 'חודשי',  en: 'Monthly' },
  yearly:  { he: 'שנתי',   en: 'Yearly'  },
} as const

interface TasksTabProps {
  tasks: DomainTask[]
  slug: string
  categories: EcosystemCategory[]
  accentColor: string
  isRTL: boolean
}

function TasksTab({ tasks, slug, categories, accentColor, isRTL }: TasksTabProps) {
  const [freqFilter, setFreqFilter] = useState<DomainTaskFrequency>('weekly')
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0]?.value ?? 'other')
  const [urgency, setUrgency] = useState<DomainTaskUrgency>('normal')
  const [frequency, setFrequency] = useState<DomainTaskFrequency>('weekly')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createDomainTask(slug, { title: title.trim(), category, urgency, frequency })
      setTitle('')
      setCategory(categories[0]?.value ?? 'other')
      setUrgency('normal')
      setAdding(false)
    })
  }

  const filtered = tasks.filter((tk) => (tk.frequency ?? 'weekly') === freqFilter)
  const open = filtered.filter((tk) => tk.status !== 'done')
  const done = filtered.filter((tk) => tk.status === 'done')

  const counts: Record<DomainTaskFrequency, number> = {
    weekly:  tasks.filter((t) => (t.frequency ?? 'weekly') === 'weekly'  && t.status !== 'done').length,
    monthly: tasks.filter((t) => (t.frequency ?? 'weekly') === 'monthly' && t.status !== 'done').length,
    yearly:  tasks.filter((t) => (t.frequency ?? 'weekly') === 'yearly'  && t.status !== 'done').length,
  }

  return (
    <div className="space-y-3">
      {/* Frequency sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
        {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFreqFilter(f)}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
            style={{
              background: freqFilter === f ? accentColor : 'transparent',
              color: freqFilter === f ? 'white' : 'var(--muted-foreground)',
            }}
          >
            {isRTL ? FREQ_LABELS[f].he : FREQ_LABELS[f].en}
            {counts[f] > 0 && (
              <span
                className="rounded-full px-1.5 py-0 text-[9px] font-bold"
                style={{ background: freqFilter === f ? 'rgba(255,255,255,0.25)' : `${accentColor}33`, color: freqFilter === f ? 'white' : accentColor }}
              >
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

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
          {/* Frequency selector */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
            {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: frequency === f ? accentColor : 'transparent',
                  color: frequency === f ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {isRTL ? FREQ_LABELS[f].he : FREQ_LABELS[f].en}
              </button>
            ))}
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
          onClick={() => { setFrequency(freqFilter); setAdding(true) }}
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
  const [scheduling, setScheduling] = useState(false)
  const [dateInput, setDateInput] = useState(task.due_date ?? '')
  const done = task.status === 'done'
  const urgencyColor = URGENCY_COLORS[task.urgency] ?? '#6b7280'
  const cat = categories.find((c) => c.value === task.category)

  const saveDate = (val: string) => {
    startTransition(async () => {
      await scheduleDomainTask(task.id, slug, val || null)
      setScheduling(false)
    })
  }

  return (
    <Card className="p-3 space-y-2" style={{ opacity: done ? 0.55 : 1 }}>
      <div className="flex items-center gap-3">
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
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
              style={{ background: `${urgencyColor}22`, color: urgencyColor }}
            >
              {isRTL
                ? { low: 'נמוכה', normal: 'רגילה', high: 'גבוהה', critical: 'קריטי' }[task.urgency]
                : task.urgency}
            </span>
            {task.due_date && (
              <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--foreground)' }}>
                <Calendar size={10} />
                {task.due_date}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { setDateInput(task.due_date ?? ''); setScheduling((s) => !s) }}
            className="p-1.5 rounded-lg transition-colors"
            style={{
              color: task.due_date ? '#22d3ee' : 'var(--muted-foreground)',
              background: task.due_date ? 'rgba(34,211,238,0.12)' : 'transparent',
            }}
            title={isRTL ? 'שבץ בלוח שנה' : 'Schedule in calendar'}
          >
            <Calendar size={14} />
          </button>
          <button
            onClick={() => startTransition(async () => { await deleteDomainTask(task.id, slug) })}
            disabled={pending}
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {scheduling && (
        <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <Calendar size={14} style={{ color: '#22d3ee', flexShrink: 0 }} />
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="flex-1 rounded-lg px-2 py-1 text-xs"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <button
            onClick={() => saveDate(dateInput)}
            disabled={pending}
            className="px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ background: '#22d3ee22', color: '#22d3ee', border: '1px solid #22d3ee44' }}
          >
            {isRTL ? 'שמור' : 'Save'}
          </button>
          {task.due_date && (
            <button
              onClick={() => saveDate('')}
              disabled={pending}
              className="px-2 py-1 rounded-lg text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}
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

// ── Board Tab (לוח מעכב) ───────────────────────────────────────

function boardLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function boardComputeStreak(dates: Set<string>): number {
  let s = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (dates.has(d.toISOString().split('T')[0])) s++
    else break
  }
  return s
}

function BoardTab({
  habits, completedSet, tasks, goals, domain, isRTL, config,
}: {
  habits: Habit[]
  completedSet: Set<string>
  tasks: DomainTask[]
  goals: DomainGoal[]
  domain: Domain
  isRTL: boolean
  config: ReturnType<typeof getDomainEcosystemConfig>
}) {
  const days7 = useMemo(boardLast7Days, [])
  const [historyMap, setHistoryMap] = useState<Record<string, Set<string>>>({})
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    if (habits.length === 0) { setHistoryLoaded(true); return }
    const ids = habits.map((h) => h.id)
    createClient()
      .from('habit_logs')
      .select('habit_id, completed_at')
      .in('habit_id', ids)
      .gte('completed_at', days7[0])
      .then(({ data }: { data: Array<{ habit_id: string; completed_at: string }> | null }) => {
        const map: Record<string, Set<string>> = {}
        for (const id of ids) map[id] = new Set()
        for (const row of data ?? []) map[row.habit_id]?.add(row.completed_at)
        setHistoryMap(map)
        setHistoryLoaded(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.length])

  const completedCount = habits.filter((h) => completedSet.has(h.id)).length
  const openTasks = tasks.filter((t) => t.status !== 'done')
  const urgentTasks = openTasks.filter((t) => t.urgency === 'high' || t.urgency === 'critical')
  const normalTasks = openTasks.filter((t) => t.urgency !== 'high' && t.urgency !== 'critical')
  const activeGoals = goals.filter((g) => g.status === 'active')

  // Day name abbreviations
  const HE_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
  const EN_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const dayLabel = (iso: string) => {
    const dow = new Date(iso + 'T12:00:00').getDay()
    return isRTL ? HE_DAYS[dow] : EN_DAYS[dow]
  }
  const today = new Date().toISOString().split('T')[0]
  const isToday = (iso: string) => iso === today

  return (
    <div className="space-y-5">

      {/* ── Today snapshot ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <Flame size={14} />,
            label: isRTL ? 'הרגלים' : 'Habits',
            value: `${completedCount}/${habits.length}`,
            pct: habits.length > 0 ? completedCount / habits.length : 0,
          },
          {
            icon: <ListChecks size={14} />,
            label: isRTL ? 'פתוחות' : 'Open tasks',
            value: openTasks.length,
            pct: tasks.length > 0 ? 1 - openTasks.length / tasks.length : 0,
          },
          {
            icon: <Target size={14} />,
            label: isRTL ? 'מטרות' : 'Goals',
            value: activeGoals.length,
            pct: activeGoals.length > 0 ? 0.7 : 0,
          },
        ].map(({ icon, label, value, pct }) => (
          <div
            key={label}
            className="rounded-xl p-3 flex flex-col gap-2"
            style={{ background: `${domain.color}12`, border: `1px solid ${domain.color}28` }}
          >
            <div className="flex items-center gap-1.5" style={{ color: domain.color }}>
              {icon}
              <span className="text-[10px] font-semibold uppercase tracking-wider truncate">{label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</div>
            <div className="h-1 rounded-full" style={{ background: `${domain.color}22` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pct * 100, 100)}%`, background: domain.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Weekly habit grid ── */}
      {habits.length > 0 && (
        <div
          className="rounded-2xl p-3 space-y-2"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-xs font-semibold" style={{ color: domain.color }}>
            {isRTL ? '📅 מעקב שבועי' : '📅 Weekly tracking'}
          </p>

          {/* Day headers */}
          <div className="flex items-center gap-1 ps-2">
            <div className="flex-1" />
            {days7.map((d: string) => (
              <div
                key={d}
                className="w-7 text-center text-[10px] font-bold flex-shrink-0"
                style={{ color: isToday(d) ? domain.color : 'var(--muted-foreground)' }}
              >
                {dayLabel(d)}
              </div>
            ))}
          </div>

          {/* Habit rows */}
          {habits.map((h) => {
            const dates = historyMap[h.id] ?? new Set()
            const streak = historyLoaded ? boardComputeStreak(dates) : 0
            return (
              <div key={h.id} className="flex items-center gap-1">
                <p
                  className="flex-1 text-xs truncate font-medium"
                  style={{
                    color: completedSet.has(h.id) ? domain.color : 'var(--foreground)',
                    textDecoration: completedSet.has(h.id) ? 'none' : 'none',
                  }}
                >
                  {h.name}
                </p>
                {days7.map((d: string) => (
                  <div
                    key={d}
                    className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      background: dates.has(d)
                        ? isToday(d) ? domain.color : `${domain.color}55`
                        : isToday(d) ? `${domain.color}18` : 'var(--c-surface-2)',
                      border: isToday(d) ? `1px solid ${domain.color}60` : '1px solid transparent',
                    }}
                  >
                    {dates.has(d) && (
                      <Check size={11} strokeWidth={2.5} color={isToday(d) ? '#fff' : domain.color} />
                    )}
                  </div>
                ))}
                {streak > 0 && (
                  <div
                    className="flex items-center gap-0.5 flex-shrink-0 ps-1 text-[10px] font-bold w-8"
                    style={{ color: domain.color }}
                  >
                    🔥{streak}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Urgent tasks ── */}
      {urgentTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: URGENCY_COLORS.critical }}>
            ⚡ {isRTL ? 'דחוף — טיפול מיידי' : 'Urgent — action needed'}
          </p>
          {urgentTasks.map((t) => (
            <TaskCard key={t.id} task={t} slug={domain.slug} categories={config.taskCategories} isRTL={isRTL} />
          ))}
        </div>
      )}

      {/* ── Normal open tasks (compact) ── */}
      {normalTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? `📋 ${normalTasks.length} משימות פתוחות` : `📋 ${normalTasks.length} open tasks`}
          </p>
          {normalTasks.slice(0, 5).map((t) => (
            <TaskCard key={t.id} task={t} slug={domain.slug} categories={config.taskCategories} isRTL={isRTL} />
          ))}
          {normalTasks.length > 5 && (
            <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? `+${normalTasks.length - 5} נוספות בטאב משימות` : `+${normalTasks.length - 5} more in Tasks tab`}
            </p>
          )}
        </div>
      )}

      {/* ── Active goals ── */}
      {activeGoals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: domain.color }}>
            🎯 {isRTL ? 'מטרות פעילות' : 'Active goals'}
          </p>
          {activeGoals.map((g) => (
            <GoalCard key={g.id} goal={g} slug={domain.slug} config={config.goals} accentColor={domain.color} isRTL={isRTL} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && openTasks.length === 0 && activeGoals.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12">
          <LayoutDashboard size={36} style={{ color: domain.color, opacity: 0.5 }} />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'הלוח ריק — התחל להוסיף' : 'Board is empty — start adding'}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הוסף הרגלים ומשימות כדי לראות סיכום כאן' : 'Add habits and tasks to see a summary here'}
          </p>
        </div>
      )}
    </div>
  )
}
