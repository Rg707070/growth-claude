'use client'

import { useState, useTransition, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Trash2, Calendar, ListChecks,
  Plane, Utensils, Activity, Star, Tag, Cake, Flame,
  ChevronLeft, ChevronRight, RotateCcw, GripVertical, Pencil,
} from 'lucide-react'
import { useLang } from '@/lib/lang'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createFamilyTask, updateFamilyTaskStatus, updateFamilyTask, deleteFamilyTask, updateTaskOrder,
  createFamilyHabit, completeFamilyHabit, deleteFamilyHabit,
  createFamilyEvent, updateFamilyEventStatus, deleteFamilyEvent,
  createTaskFolder, renameTaskFolder, deleteTaskFolder, updateFolderOrder,
} from './actions'
import { subscribeFamilyRealtime } from '@/lib/family/realtime'
import { isStreakAlive } from '@/lib/family/streak-engine'
import {
  buildMonthGrid, getHebrewMonthYearForMonth, getGregorianMonthLabel,
  getHebrewDateStr, getGregorianDateStr, todayDateString, HEBREW_DAY_HEADERS,
} from '@/lib/family/hebrew-calendar'
import type { Domain } from '@/types'
import type {
  FamilyTask, FamilyTaskUrgency, FamilyTaskFolder,
  FamilyHabit, FamilyHabitFrequency, FamilyHabitAccountability,
  FamilyEvent, FamilyEventCategory, FamilyEventRecurrence,
} from '@/types/family'

// ─── Constants ────────────────────────────────────────────────

type Tab = 'tasks' | 'habits' | 'events'

const FOLDER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#ef4444']

const URGENCY_COLORS: Record<FamilyTaskUrgency, string> = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
}

interface EventCategoryMeta {
  value: FamilyEventCategory
  he: string
  en: string
  color: string
  icon: React.ReactNode
}

const EVENT_CATEGORIES: EventCategoryMeta[] = [
  { value: 'birthday',    he: 'יום הולדת',    en: 'Birthday',    color: '#ec4899', icon: <Cake size={14} /> },
  { value: 'holiday',     he: 'חג ומועד',     en: 'Holiday',     color: '#3b82f6', icon: <Star size={14} /> },
  { value: 'trip',        he: 'טיול וחופשה',  en: 'Trip',        color: '#10b981', icon: <Plane size={14} /> },
  { value: 'gathering',   he: 'ארוחה ומפגש',  en: 'Gathering',   color: '#f59e0b', icon: <Utensils size={14} /> },
  { value: 'appointment', he: 'פגישה',         en: 'Appointment', color: '#8b5cf6', icon: <Calendar size={14} /> },
  { value: 'activity',    he: 'פעילות',        en: 'Activity',    color: '#06b6d4', icon: <Activity size={14} /> },
  { value: 'other',       he: 'אחר',           en: 'Other',       color: '#6b7280', icon: <Tag size={14} /> },
]

function getCategoryMeta(cat: FamilyEventCategory): EventCategoryMeta {
  return EVENT_CATEGORIES.find((c) => c.value === cat) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1]
}

// ─── Props & Main Component ───────────────────────────────────

interface Props {
  domain: Domain
  userId: string
  tasks: FamilyTask[]
  habits: FamilyHabit[]
  events: FamilyEvent[]
  folders: FamilyTaskFolder[]
  schemaReady: boolean
}

export function FamilyClient({ domain, tasks, habits, events, folders, schemaReady }: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('tasks')
  const [calDate, setCalDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = useMemo(() => todayDateString(), [])

  useEffect(() => {
    if (!schemaReady) return
    return subscribeFamilyRealtime(['family_tasks', 'family_habits', 'family_events', 'family_task_folders'], () => router.refresh())
  }, [router, schemaReady])

  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.current_streak), 0)
  const upcomingEvents = events.filter((e) => e.status === 'upcoming' && e.event_date >= today).length

  const prevMonth = () =>
    setCalDate((p) => p.month === 1 ? { year: p.year - 1, month: 12 } : { ...p, month: p.month - 1 })
  const nextMonth = () =>
    setCalDate((p) => p.month === 12 ? { year: p.year + 1, month: 1 } : { ...p, month: p.month + 1 })

  return (
    <div className="px-4 pt-12 pb-12 space-y-6">
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
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <span>{domain.icon}</span>
            <span>{isRTL ? 'אזור המשפחה' : 'Family Hub'}</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'משימות · ארועים · לוח שנה עברי-לועזי' : 'Tasks · Events · Hebrew–Gregorian calendar'}
          </p>
        </div>
      </div>

      {!schemaReady && <SchemaNotReadyBanner isRTL={isRTL} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile color={domain.color} icon={<ListChecks size={16} />}
          label={isRTL ? 'משימות' : 'Tasks'} value={openTasks} />
        <StatTile color={domain.color} icon={<Flame size={16} />}
          label={isRTL ? 'רצף הטוב' : 'Best Streak'} value={bestStreak} />
        <StatTile color={domain.color} icon={<Calendar size={16} />}
          label={isRTL ? 'ארועים' : 'Events'} value={upcomingEvents} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
        <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} color={domain.color}>
          {isRTL ? 'משימות' : 'Tasks'}
        </TabButton>
        <TabButton active={tab === 'habits'} onClick={() => setTab('habits')} color={domain.color}>
          {isRTL ? 'הרגלים' : 'Habits'}
        </TabButton>
        <TabButton active={tab === 'events'} onClick={() => setTab('events')} color={domain.color}>
          {isRTL ? 'ארועים' : 'Events'}
        </TabButton>
      </div>

      {tab === 'tasks' && (
        <TasksTab folders={folders} tasks={tasks} accentColor={domain.color} isRTL={isRTL} today={today} />
      )}
      {tab === 'habits' && (
        <HabitsTab habits={habits} accentColor={domain.color} isRTL={isRTL} />
      )}
      {tab === 'events' && (
        <EventsTab events={events} accentColor={domain.color} isRTL={isRTL} today={today} />
      )}

      {/* Calendar — always visible */}
      <FamilyCalendar
        year={calDate.year}
        month={calDate.month}
        tasks={tasks}
        events={events}
        today={today}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(selectedDate === d ? null : d)}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        accentColor={domain.color}
        isRTL={isRTL}
      />

      {/* Day detail panel */}
      {selectedDate && (
        <DayDetail
          dateStr={selectedDate}
          tasks={tasks.filter((t) => t.due_date === selectedDate)}
          events={events.filter((e) => e.event_date === selectedDate)}
          accentColor={domain.color}
          isRTL={isRTL}
        />
      )}
    </div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────

function SchemaNotReadyBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'הרץ את supabase-schema.sql בסופרבייס כדי להפעיל את התכונה.'
          : 'Run supabase-schema.sql in your Supabase SQL editor to enable this feature.'}
      </p>
    </Card>
  )
}

function StatTile({ color, icon, label, value }: { color: string; icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: `${color}15`, border: `1px solid ${color}33` }}>
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</div>
    </div>
  )
}

function TabButton({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
      style={{ background: active ? color : 'transparent', color: active ? 'white' : 'var(--muted-foreground)' }}
    >
      {children}
    </button>
  )
}

// ─── Tasks Tab ────────────────────────────────────────────────

function TasksTab({ folders, tasks, accentColor, isRTL, today }: {
  folders: FamilyTaskFolder[]; tasks: FamilyTask[]; accentColor: string; isRTL: boolean; today: string
}) {
  const [localFolders, setLocalFolders] = useState(folders)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activeTaskFolder, setActiveTaskFolder] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => { setLocalFolders(folders) }, [folders])

  const nextColor = FOLDER_COLORS[localFolders.length % FOLDER_COLORS.length]

  const submitFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    startTransition(async () => {
      await createTaskFolder(name, nextColor)
      setNewFolderName('')
      setAddingFolder(false)
    })
  }

  const handleReorder = useCallback((newOrder: FamilyTaskFolder[]) => {
    setLocalFolders(newOrder)
    startTransition(async () => {
      await updateFolderOrder(newOrder.map((f, i) => ({ id: f.id, sort_order: i })))
    })
  }, [])

  const unfiledOpen = tasks.filter((t) => !t.folder_id && t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')
  const hasContent = localFolders.length > 0 || unfiledOpen.length > 0

  return (
    <div className="space-y-2">
      {!hasContent && !addingFolder && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'צור תיקייה ראשונה' : 'Create your first folder'}
        </p>
      )}

      <SortableFolderList
        folders={localFolders}
        tasks={tasks}
        isRTL={isRTL}
        today={today}
        activeTaskFolder={activeTaskFolder}
        onSetActiveTaskFolder={setActiveTaskFolder}
        onReorder={handleReorder}
      />

      {unfiledOpen.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-3 py-2 flex items-center gap-2" style={{ background: 'var(--secondary)' }}>
            <Tag size={11} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span className="flex-1 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'ללא תיקייה' : 'Unfiled'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{unfiledOpen.length}</span>
          </div>
          {unfiledOpen.map((t, i) => (
            <TaskRow key={t.id} task={t} allFolders={localFolders} isRTL={isRTL} today={today}
              divider={i > 0} isDragging={false} isDropTarget={false} onDragStart={() => {}} />
          ))}
        </div>
      )}

      {done.length > 0 && <CompletedFolder tasks={done} allFolders={localFolders} isRTL={isRTL} today={today} />}

      {addingFolder ? (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: nextColor }} />
          <Input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitFolder()
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName('') }
            }}
            placeholder={isRTL ? 'שם התיקייה' : 'Folder name'}
            className="flex-1 h-8 text-[13px]"
          />
          <button onClick={submitFolder} disabled={!newFolderName.trim()} className="p-1.5 rounded-lg flex-shrink-0"
            style={{ background: accentColor, color: 'white' }}>
            <Check size={13} />
          </button>
          <button onClick={() => { setAddingFolder(false); setNewFolderName('') }} className="p-1.5 rounded-lg flex-shrink-0"
            style={{ color: 'var(--muted-foreground)' }}>
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingFolder(true)}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={13} />
          <span className="text-[13px]">{isRTL ? 'תיקייה חדשה' : 'New folder'}</span>
        </button>
      )}
    </div>
  )
}

// ─── Sortable folder list ─────────────────────────────────────

function SortableFolderList({
  folders, tasks, isRTL, today, activeTaskFolder, onSetActiveTaskFolder, onReorder,
}: {
  folders: FamilyTaskFolder[]; tasks: FamilyTask[]; isRTL: boolean; today: string
  activeTaskFolder: string | null; onSetActiveTaskFolder: (id: string | null) => void
  onReorder: (newOrder: FamilyTaskFolder[]) => void
}) {
  // allFolders = folders (passed down so tasks can be reassigned between them)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const foldersRef = useRef(folders)
  foldersRef.current = folders

  useEffect(() => {
    if (!dragId) return
    const onMove = (e: PointerEvent) => {
      if (!listRef.current) return
      const els = Array.from(listRef.current.children) as HTMLElement[]
      let idx = els.length - 1
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect()
        if (e.clientY < r.top + r.height / 2) { idx = i; break }
      }
      setOverIdx(idx)
    }
    const onUp = () => {
      if (overIdx !== null) {
        const from = foldersRef.current.findIndex((f) => f.id === dragId)
        if (from !== -1 && from !== overIdx) {
          const next = [...foldersRef.current]
          const [moved] = next.splice(from, 1)
          next.splice(overIdx, 0, moved)
          onReorder(next)
        }
      }
      setDragId(null)
      setOverIdx(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragId, overIdx, onReorder])

  return (
    <div ref={listRef} className="space-y-2">
      {folders.map((folder, i) => (
        <FolderGroup
          key={folder.id}
          folder={folder}
          allFolders={folders}
          tasks={tasks.filter((t) => t.folder_id === folder.id)}
          isRTL={isRTL}
          today={today}
          isDragging={dragId === folder.id}
          isDropTarget={overIdx === i && dragId !== null && dragId !== folder.id}
          addingTask={activeTaskFolder === folder.id}
          onToggleAddTask={() => onSetActiveTaskFolder(activeTaskFolder === folder.id ? null : folder.id)}
          onDragStart={() => setDragId(folder.id)}
        />
      ))}
    </div>
  )
}

// ─── Folder group ─────────────────────────────────────────────

function FolderGroup({
  folder, allFolders, tasks, isRTL, today,
  isDragging, isDropTarget, addingTask, onToggleAddTask, onDragStart,
}: {
  folder: FamilyTaskFolder; allFolders: FamilyTaskFolder[]; tasks: FamilyTask[]
  isRTL: boolean; today: string
  isDragging: boolean; isDropTarget: boolean; addingTask: boolean
  onToggleAddTask: () => void; onDragStart: () => void
}) {
  const [open, setOpen] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const [confirmDel, setConfirmDel] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskUrgency, setTaskUrgency] = useState<FamilyTaskUrgency>('normal')
  const [taskDue, setTaskDue] = useState('')

  // Task drag state
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [overTaskIdx, setOverTaskIdx] = useState<number | null>(null)
  const taskListRef = useRef<HTMLDivElement>(null)

  const [, startTransition] = useTransition()
  const { color } = folder

  // Local sorted task list (open only)
  const [localOpen, setLocalOpen] = useState<FamilyTask[]>([])
  const localOpenRef = useRef<FamilyTask[]>([])

  useEffect(() => {
    const sorted = tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    setLocalOpen(sorted)
  }, [tasks])

  localOpenRef.current = localOpen

  // Task drag effect
  useEffect(() => {
    if (!dragTaskId) return
    const onMove = (e: PointerEvent) => {
      if (!taskListRef.current) return
      const els = Array.from(taskListRef.current.children) as HTMLElement[]
      let idx = els.length - 1
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect()
        if (e.clientY < r.top + r.height / 2) { idx = i; break }
      }
      setOverTaskIdx(idx)
    }
    const onUp = () => {
      if (overTaskIdx !== null) {
        const from = localOpenRef.current.findIndex((t) => t.id === dragTaskId)
        if (from !== -1 && from !== overTaskIdx) {
          const next = [...localOpenRef.current]
          const [moved] = next.splice(from, 1)
          next.splice(overTaskIdx, 0, moved)
          setLocalOpen(next)
          startTransition(async () => {
            await updateTaskOrder(next.map((t, i) => ({ id: t.id, sort_order: i })))
          })
        }
      }
      setDragTaskId(null)
      setOverTaskIdx(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragTaskId, overTaskIdx, startTransition])

  const submitRename = () => {
    if (!editName.trim()) return
    startTransition(async () => { await renameTaskFolder(folder.id, editName) })
    setEditingName(false)
  }

  const submitTask = () => {
    if (!taskTitle.trim()) return
    startTransition(async () => {
      await createFamilyTask({ title: taskTitle.trim(), urgency: taskUrgency, due_date: taskDue || null, folder_id: folder.id })
      setTaskTitle(''); setTaskUrgency('normal'); setTaskDue('')
      onToggleAddTask()
    })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${isDropTarget ? color : `${color}30`}`,
        opacity: isDragging ? 0.45 : 1,
        boxShadow: isDropTarget ? `0 0 0 2px ${color}55` : 'none',
        transition: 'box-shadow 0.1s, border-color 0.1s',
      }}
    >
      {/* Header */}
      <div className="flex items-stretch" style={{ background: `${color}12` }}>
        <button
          onPointerDown={(e) => { e.preventDefault(); onDragStart() }}
          className="px-2 flex items-center touch-none cursor-grab active:cursor-grabbing"
          style={{ color: `${color}55` }}
        >
          <GripVertical size={14} />
        </button>

        {editingName ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') { setEditingName(false); setEditName(folder.name) }
            }}
            onBlur={submitRename}
            className="flex-1 py-2 text-[13px] font-semibold bg-transparent outline-none"
            style={{ color: 'var(--foreground)' }}
          />
        ) : (
          <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 py-2">
            <span className="flex-1 text-[13px] font-semibold text-start" style={{ color: 'var(--foreground)' }}>
              {folder.name}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${color}22`, color }}>
              {localOpen.length}
            </span>
            <ChevronRight size={13} style={{ color, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
          </button>
        )}

        <button onClick={() => { setEditingName(true); setEditName(folder.name) }}
          className="px-2 flex items-center" style={{ color: `${color}55` }}>
          <Pencil size={11} />
        </button>

        <button
          onClick={() => {
            if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 2000) }
            else { startTransition(async () => { await deleteTaskFolder(folder.id) }) }
          }}
          className="px-2 flex items-center transition-colors"
          style={{ color: confirmDel ? '#ef4444' : `${color}44` }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {open && (
        <>
          <div ref={taskListRef}>
            {localOpen.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                allFolders={allFolders}
                isRTL={isRTL}
                today={today}
                divider={i > 0}
                isDragging={dragTaskId === task.id}
                isDropTarget={overTaskIdx === i && dragTaskId !== null && dragTaskId !== task.id}
                onDragStart={() => setDragTaskId(task.id)}
              />
            ))}
          </div>

          {addingTask ? (
            <div className="px-3 py-2 space-y-2" style={{
              background: 'var(--card)',
              borderTop: localOpen.length > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <Input autoFocus value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitTask(); if (e.key === 'Escape') onToggleAddTask() }}
                placeholder={isRTL ? 'שם המשימה' : 'Task name'} className="h-8 text-[13px]" />
              <div className="flex gap-2">
                <select value={taskUrgency} onChange={(e) => setTaskUrgency(e.target.value as FamilyTaskUrgency)}
                  className="rounded-lg px-2 py-1 text-[12px] flex-1"
                  style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <option value="low">{isRTL ? 'נמוך' : 'Low'}</option>
                  <option value="normal">{isRTL ? 'רגיל' : 'Normal'}</option>
                  <option value="high">{isRTL ? 'גבוה' : 'High'}</option>
                  <option value="critical">{isRTL ? 'קריטי' : 'Critical'}</option>
                </select>
                <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)}
                  className="rounded-lg px-2 py-1 text-[12px] flex-1"
                  style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'dark' }} />
                <button onClick={submitTask} disabled={!taskTitle.trim()} className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ background: color, color: 'white' }}>
                  <Check size={13} />
                </button>
                <button onClick={onToggleAddTask} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onToggleAddTask} className="w-full flex items-center gap-1.5 px-3 py-1.5"
              style={{ background: 'var(--card)', borderTop: localOpen.length > 0 ? '1px solid var(--border)' : 'none', color: `${color}66` }}>
              <Plus size={11} />
              <span className="text-[11px]">{isRTL ? 'הוסף משימה' : 'Add task'}</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

function CompletedFolder({ tasks, allFolders, isRTL, today }: {
  tasks: FamilyTask[]; allFolders: FamilyTaskFolder[]; isRTL: boolean; today: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-[11px] py-1.5 px-1"
        style={{ color: 'var(--muted-foreground)' }}>
        <ChevronRight size={11} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        {isRTL ? `הושלמו (${tasks.length})` : `Completed (${tasks.length})`}
      </button>
      {open && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', opacity: 0.5 }}>
          {tasks.map((task, i) => (
            <TaskRow key={task.id} task={task} allFolders={allFolders} isRTL={isRTL} today={today}
              divider={i > 0} isDragging={false} isDropTarget={false} onDragStart={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Task Row (with edit + drag) ──────────────────────────────

function TaskRow({ task, allFolders, isRTL, today, divider, isDragging, isDropTarget, onDragStart }: {
  task: FamilyTask; allFolders: FamilyTaskFolder[]; isRTL: boolean; today: string
  divider: boolean; isDragging: boolean; isDropTarget: boolean; onDragStart: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const done = task.status === 'done'
  const urgencyColor = URGENCY_COLORS[task.urgency]
  const isOverdue = !done && task.due_date && task.due_date < today

  if (editing) {
    return (
      <TaskEditRow
        task={task}
        allFolders={allFolders}
        isRTL={isRTL}
        divider={divider}
        onDone={() => setEditing(false)}
      />
    )
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-2 relative"
      style={{
        background: 'var(--card)',
        borderTop: divider ? '1px solid var(--border)' : 'none',
        opacity: isDragging ? 0.35 : done ? 0.45 : 1,
        boxShadow: isDropTarget ? `inset 0 2px 0 0 ${urgencyColor}` : 'none',
      }}
    >
      {/* Drag handle */}
      <button
        onPointerDown={(e) => { e.preventDefault(); onDragStart() }}
        className="flex items-center touch-none cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ color: 'var(--muted-foreground)', opacity: 0.25, padding: '0 2px' }}
      >
        <GripVertical size={11} />
      </button>

      {/* Urgency bar */}
      <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: urgencyColor, minHeight: '14px' }} />

      {/* Checkbox */}
      <button
        onClick={() => startTransition(async () => { await updateFamilyTaskStatus(task.id, done ? 'pending' : 'done') })}
        disabled={pending}
        className="w-[17px] h-[17px] rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: done ? urgencyColor : 'transparent', border: `1.5px solid ${urgencyColor}` }}
      >
        {done && <Check size={9} color="white" />}
      </button>

      {/* Title — tap to edit */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !done && setEditing(true)}>
        <p className="text-[13px] leading-tight truncate"
          style={{ color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-[10px] mt-0.5 flex items-center gap-1"
            style={{ color: isOverdue ? '#ef4444' : 'var(--muted-foreground)' }}>
            <Calendar size={9} />
            {getGregorianDateStr(task.due_date)}
            <span className="opacity-50">· {getHebrewDateStr(task.due_date)}</span>
          </p>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => startTransition(async () => { await deleteFamilyTask(task.id) })}
        disabled={pending}
        className="p-1 rounded opacity-25 hover:opacity-60 transition-opacity flex-shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ─── Task Edit Row ────────────────────────────────────────────

function TaskEditRow({ task, allFolders, isRTL, divider, onDone }: {
  task: FamilyTask; allFolders: FamilyTaskFolder[]; isRTL: boolean; divider: boolean; onDone: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [urgency, setUrgency] = useState<FamilyTaskUrgency>(task.urgency)
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [folderId, setFolderId] = useState(task.folder_id ?? '')
  const [pending, startTransition] = useTransition()

  const save = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await updateFamilyTask(task.id, {
        title: title.trim(),
        urgency,
        due_date: dueDate || null,
        folder_id: folderId || null,
      })
      onDone()
    })
  }

  const accent = URGENCY_COLORS[urgency]

  return (
    <div
      className="px-3 py-2.5 space-y-2"
      style={{ background: 'var(--card)', borderTop: divider ? '1px solid var(--border)' : 'none' }}
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone() }}
        className="h-8 text-[13px]"
      />
      <div className="grid grid-cols-2 gap-2">
        {/* Folder selector */}
        <select value={folderId} onChange={(e) => setFolderId(e.target.value)}
          className="rounded-lg px-2 py-1.5 text-[12px]"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
          <option value="">{isRTL ? 'ללא תיקייה' : 'No folder'}</option>
          {allFolders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        {/* Urgency */}
        <select value={urgency} onChange={(e) => setUrgency(e.target.value as FamilyTaskUrgency)}
          className="rounded-lg px-2 py-1.5 text-[12px]"
          style={{ background: 'var(--secondary)', border: `1px solid ${accent}55`, color: accent }}>
          <option value="low">{isRTL ? 'נמוך' : 'Low'}</option>
          <option value="normal">{isRTL ? 'רגיל' : 'Normal'}</option>
          <option value="high">{isRTL ? 'גבוה' : 'High'}</option>
          <option value="critical">{isRTL ? 'קריטי' : 'Critical'}</option>
        </select>
      </div>
      {/* Due date */}
      <div className="flex items-center gap-2">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg px-2 py-1.5 text-[12px] flex-1"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'dark' }} />
        {dueDate && (
          <p className="text-[10px] flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            {getHebrewDateStr(dueDate)}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={pending || !title.trim()} className="flex-1 h-8 text-[13px]"
          style={{ background: accent, color: 'white' }}>
          {isRTL ? 'שמור' : 'Save'}
        </Button>
        <button onClick={onDone} className="p-2 rounded-lg flex-shrink-0"
          style={{ color: 'var(--muted-foreground)', background: 'var(--secondary)' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Habits Tab ───────────────────────────────────────────────

function HabitsTab({ habits, accentColor, isRTL }: {
  habits: FamilyHabit[]; accentColor: string; isRTL: boolean
}) {
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
          {isRTL ? 'אין הרגלים — הוסף ראשון' : 'No habits yet — add one'}
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
            placeholder={isRTL ? 'שם ההרגל (למשל: ארוחה משפחתית)' : 'Habit name'}
          />
          <Input
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
            placeholder={isRTL ? 'עוגן הקשר (למשל: אחרי ארוחת ערב)' : 'Context anchor (optional)'}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FamilyHabitFrequency)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="daily">{isRTL ? 'יומי' : 'Daily'}</option>
              <option value="weekly">{isRTL ? 'שבועי' : 'Weekly'}</option>
              <option value="monthly">{isRTL ? 'חודשי' : 'Monthly'}</option>
            </select>
            <select
              value={accountability}
              onChange={(e) => setAccountability(e.target.value as FamilyHabitAccountability)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <option value="shared_streak">{isRTL ? 'רצף משותף' : 'Shared streak'}</option>
              <option value="individual">{isRTL ? 'אישי' : 'Individual'}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={submit} disabled={pending || !name.trim()} className="flex-1"
              style={{ background: accentColor, color: 'white' }}>
              {isRTL ? 'שמור' : 'Save'}
            </Button>
            <button
              onClick={() => { setAdding(false); setName(''); setAnchor('') }}
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
          <span className="text-sm">{isRTL ? 'הוסף הרגל' : 'Add Habit'}</span>
        </button>
      )}
    </div>
  )
}

function HabitCard({ habit, accentColor, isRTL }: {
  habit: FamilyHabit; accentColor: string; isRTL: boolean
}) {
  const [pending, startTransition] = useTransition()
  const alive = isStreakAlive(habit)
  const freqLabel = habit.frequency === 'daily'
    ? (isRTL ? 'יומי' : 'daily')
    : habit.frequency === 'weekly'
      ? (isRTL ? 'שבועי' : 'weekly')
      : (isRTL ? 'חודשי' : 'monthly')

  return (
    <Card className="px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => startTransition(async () => { await completeFamilyHabit(habit.id) })}
          disabled={pending}
          className="flex-shrink-0 px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all"
          style={{
            background: alive ? accentColor : `${accentColor}22`,
            color: alive ? 'white' : accentColor,
          }}
        >
          <Flame size={12} />
          {habit.current_streak}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium leading-tight" style={{ color: 'var(--foreground)' }}>
            {habit.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            <span>{freqLabel}</span>
            <span className="opacity-40">·</span>
            <span>
              {habit.accountability_type === 'shared_streak'
                ? (isRTL ? 'רצף משותף' : 'shared')
                : (isRTL ? 'אישי' : 'individual')}
            </span>
            {!alive && habit.current_streak > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span style={{ color: '#ef4444' }}>{isRTL ? 'פג תוקף' : 'lapsed'}</span>
              </>
            )}
            {habit.context_anchor && (
              <>
                <span className="opacity-40">·</span>
                <span className="italic truncate">{habit.context_anchor}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => startTransition(async () => { await deleteFamilyHabit(habit.id) })}
          disabled={pending}
          className="p-1 opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  )
}

// ─── Events Tab ───────────────────────────────────────────────

function EventsTab({ events, accentColor, isRTL, today }: {
  events: FamilyEvent[]; accentColor: string; isRTL: boolean; today: string
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<FamilyEventCategory>('gathering')
  const [eventDate, setEventDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState<FamilyEventRecurrence>('yearly')
  const [notes, setNotes] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim() || !eventDate) return
    startTransition(async () => {
      await createFamilyEvent({
        title: title.trim(),
        category,
        event_date: eventDate,
        is_recurring: isRecurring,
        recurrence: isRecurring ? recurrence : null,
        notes: notes.trim() || null,
      })
      setTitle(''); setCategory('gathering'); setEventDate('')
      setIsRecurring(false); setRecurrence('yearly'); setNotes('')
      setAdding(false)
    })
  }

  const upcoming = events
    .filter((e) => e.status !== 'cancelled' && e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  const past = events
    .filter((e) => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date))

  const todayEvents = upcoming.filter((e) => e.event_date === today)
  const futureEvents = upcoming.filter((e) => e.event_date > today)

  return (
    <div className="space-y-4">
      {todayEvents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: accentColor }}>
            {isRTL ? '⭐ היום' : '⭐ Today'}
          </p>
          {todayEvents.map((e) => <EventCard key={e.id} event={e} isRTL={isRTL} />)}
        </div>
      )}

      {futureEvents.length > 0 && (
        <div className="space-y-2">
          {todayEvents.length > 0 && (
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'קרוב' : 'Upcoming'}
            </p>
          )}
          {futureEvents.map((e) => <EventCard key={e.id} event={e} isRTL={isRTL} />)}
        </div>
      )}

      {upcoming.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין ארועים קרובים' : 'No upcoming events'}
        </p>
      )}

      {adding ? (
        <Card className="p-4 space-y-3">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isRTL ? 'שם הארוע' : 'Event name'}
          />

          {/* Date picker */}
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'תאריך *' : 'Date *'}
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--secondary)',
                border: `1px solid ${eventDate ? 'var(--border)' : '#ef4444'}`,
                color: 'var(--foreground)',
                colorScheme: 'dark',
              }}
            />
            {eventDate && (
              <p className="text-[11px] font-medium" style={{ color: accentColor }}>
                {getHebrewDateStr(eventDate)} · {getGregorianDateStr(eventDate)}
              </p>
            )}
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FamilyEventCategory)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            {EVENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{isRTL ? c.he : c.en}</option>
            ))}
          </select>

          {/* Recurring toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRecurring(!isRecurring)}
              className="flex items-center gap-2 text-sm"
              style={{ color: isRecurring ? accentColor : 'var(--muted-foreground)' }}
            >
              <RotateCcw size={14} />
              {isRTL ? 'ארוע חוזר' : 'Recurring'}
            </button>
            {isRecurring && (
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as FamilyEventRecurrence)}
                className="rounded-lg px-2 py-1 text-xs flex-1"
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <option value="yearly">{isRTL ? 'כל שנה' : 'Yearly'}</option>
                <option value="monthly">{isRTL ? 'כל חודש' : 'Monthly'}</option>
                <option value="weekly">{isRTL ? 'כל שבוע' : 'Weekly'}</option>
              </select>
            )}
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isRTL ? 'הערות (אופציונלי)' : 'Notes (optional)'}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />

          <div className="flex gap-2">
            <Button
              onClick={submit}
              disabled={pending || !title.trim() || !eventDate}
              className="flex-1"
              style={{ background: accentColor, color: 'white' }}
            >
              {isRTL ? 'שמור' : 'Save'}
            </Button>
            <button
              onClick={() => { setAdding(false); setTitle(''); setEventDate(''); setNotes('') }}
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
          <span className="text-sm">{isRTL ? 'הוסף ארוע' : 'Add Event'}</span>
        </button>
      )}

      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-xs py-2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ChevronRight size={14} style={{ transform: showPast ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            {isRTL ? `ארועים שעברו (${past.length})` : `Past events (${past.length})`}
          </button>
          {showPast && (
            <div className="space-y-2 opacity-60">
              {past.map((e) => <EventCard key={e.id} event={e} isRTL={isRTL} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, isRTL }: { event: FamilyEvent; isRTL: boolean }) {
  const [pending, startTransition] = useTransition()
  const meta = getCategoryMeta(event.category)
  const completed = event.status === 'completed'

  return (
    <Card
      className="px-2.5 py-2 flex items-center gap-2"
      style={{ opacity: completed ? 0.45 : 1, borderColor: `${meta.color}33` }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.color}20`, color: meta.color }}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight truncate"
          style={{ color: 'var(--foreground)', textDecoration: completed ? 'line-through' : 'none' }}>
          {event.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          <span style={{ color: meta.color }}>{getHebrewDateStr(event.event_date)}</span>
          <span className="opacity-40">·</span>
          <span>{getGregorianDateStr(event.event_date)}</span>
          {event.is_recurring && (
            <>
              <span className="opacity-40">·</span>
              <RotateCcw size={8} />
              <span>
                {event.recurrence === 'yearly' ? (isRTL ? 'שנתי' : 'yr') :
                  event.recurrence === 'monthly' ? (isRTL ? 'חודשי' : 'mo') :
                    (isRTL ? 'שבועי' : 'wk')}
              </span>
            </>
          )}
          {event.notes && (
            <>
              <span className="opacity-40">·</span>
              <span className="italic truncate">{event.notes}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => startTransition(async () => {
            await updateFamilyEventStatus(event.id, completed ? 'upcoming' : 'completed')
          })}
          disabled={pending}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
          style={{
            background: completed ? meta.color : `${meta.color}20`,
            color: completed ? 'white' : meta.color,
          }}
        >
          <Check size={12} />
        </button>
        <button
          onClick={() => startTransition(async () => { await deleteFamilyEvent(event.id) })}
          disabled={pending}
          className="w-6 h-6 rounded-md flex items-center justify-center opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </Card>
  )
}

// ─── Hebrew–Gregorian Calendar ────────────────────────────────

interface CalendarProps {
  year: number
  month: number
  tasks: FamilyTask[]
  events: FamilyEvent[]
  today: string
  selectedDate: string | null
  onSelectDate: (d: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  accentColor: string
  isRTL: boolean
}

function FamilyCalendar({
  year, month, tasks, events, today, selectedDate,
  onSelectDate, onPrevMonth, onNextMonth, accentColor, isRTL,
}: CalendarProps) {
  const days = useMemo(() => buildMonthGrid(year, month), [year, month])
  const hebrewHeader = useMemo(() => getHebrewMonthYearForMonth(year, month), [year, month])
  const gregorianHeader = useMemo(() => getGregorianMonthLabel(year, month), [year, month])

  // Build date → items map
  const dateItems = useMemo(() => {
    const map = new Map<string, { events: FamilyEvent[]; tasks: FamilyTask[] }>()
    for (const ev of events) {
      const ex = map.get(ev.event_date) ?? { events: [], tasks: [] }
      ex.events.push(ev)
      map.set(ev.event_date, ex)
    }
    for (const t of tasks) {
      if (t.due_date) {
        const ex = map.get(t.due_date) ?? { events: [], tasks: [] }
        ex.tasks.push(t)
        map.set(t.due_date, ex)
      }
    }
    return map
  }, [events, tasks])

  // Group days into weeks
  const weeks: (typeof days[number])[][] = []
  let week: (typeof days[number])[] = []
  for (const day of days) {
    week.push(day)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  return (
    <div className="space-y-3">
      {/* Calendar header */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: `${accentColor}18` }}
        >
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: accentColor, background: `${accentColor}22` }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {gregorianHeader}
            </p>
            <p className="text-xs mt-0.5" style={{ color: accentColor }}>
              {hebrewHeader}
            </p>
          </div>

          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: accentColor, background: `${accentColor}22` }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers (Sun–Sat) */}
        <div className="grid grid-cols-7 px-2 pt-2"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          {HEBREW_DAY_HEADERS.map((h) => (
            <div key={h} className="text-center pb-2 text-[11px] font-semibold"
              style={{ color: 'var(--muted-foreground)' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="p-2 space-y-1" style={{ background: 'var(--card)' }}>
          {weeks.map((wk, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5">
              {wk.map((day, di) => {
                if (!day) return <div key={di} />

                const items = dateItems.get(day.dateString)
                const isToday = day.dateString === today
                const isSelected = day.dateString === selectedDate
                const hasItems = items && (items.events.length + items.tasks.length) > 0
                const eventColors = items?.events.slice(0, 3).map((e) => getCategoryMeta(e.category).color) ?? []
                const taskDots = items?.tasks.slice(0, 2) ?? []

                return (
                  <button
                    key={di}
                    onClick={() => onSelectDate(day.dateString)}
                    className="flex flex-col items-center py-1 px-0.5 rounded-lg transition-all relative"
                    style={{
                      background: isSelected
                        ? accentColor
                        : isToday
                          ? `${accentColor}22`
                          : 'transparent',
                      border: isToday && !isSelected
                        ? `1.5px solid ${accentColor}`
                        : '1.5px solid transparent',
                    }}
                  >
                    {/* Hebrew month start indicator */}
                    {day.isHebrewMonthStart && (
                      <div
                        className="absolute top-0 left-0 right-0 h-[1.5px] rounded-full"
                        style={{ background: `${accentColor}55` }}
                      />
                    )}

                    {/* Gregorian day */}
                    <span
                      className="text-[13px] font-semibold leading-none"
                      style={{ color: isSelected ? 'white' : isToday ? accentColor : 'var(--foreground)' }}
                    >
                      {day.gregorianDay}
                    </span>

                    {/* Hebrew day */}
                    <span
                      className="text-[8px] leading-none mt-0.5"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--muted-foreground)' }}
                    >
                      {day.hebrewDay}
                    </span>

                    {/* Event dots */}
                    {hasItems && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {eventColors.map((c, i) => (
                          <div key={i} className="w-1 h-1 rounded-full" style={{ background: isSelected ? 'white' : c }} />
                        ))}
                        {taskDots.map((t, i) => (
                          <div key={`t${i}`} className="w-1 h-1 rounded-full"
                            style={{ background: isSelected ? 'white' : URGENCY_COLORS[t.urgency] }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1"
          style={{ background: `${accentColor}08`, borderTop: '1px solid var(--border)' }}>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
            {isRTL ? 'ארוע' : 'Event'}
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
            {isRTL ? 'משימה' : 'Task'}
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            <div className="w-2 h-2 rounded border" style={{ borderColor: accentColor }} />
            {isRTL ? 'היום' : 'Today'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────

function DayDetail({ dateStr, tasks, events, accentColor, isRTL }: {
  dateStr: string
  tasks: FamilyTask[]
  events: FamilyEvent[]
  accentColor: string
  isRTL: boolean
}) {
  const [pending, startTransition] = useTransition()
  const hebrewDate = getHebrewDateStr(dateStr)
  const gregorianDate = getGregorianDateStr(dateStr)
  const totalItems = tasks.length + events.length

  if (totalItems === 0) {
    return (
      <Card className="p-4" style={{ borderColor: `${accentColor}44`, background: `${accentColor}08` }}>
        <p className="text-xs font-semibold" style={{ color: accentColor }}>{hebrewDate}</p>
        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{gregorianDate}</p>
        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין ארועים או משימות ביום זה' : 'Nothing scheduled for this day'}
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 space-y-3" style={{ borderColor: `${accentColor}44`, background: `${accentColor}08` }}>
      <div>
        <p className="text-xs font-semibold" style={{ color: accentColor }}>{hebrewDate}</p>
        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{gregorianDate}</p>
      </div>

      {events.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'ארועים' : 'Events'}
          </p>
          {events.map((ev) => {
            const meta = getCategoryMeta(ev.category)
            return (
              <div key={ev.id} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${meta.color}22`, color: meta.color }}>
                  {meta.icon}
                </div>
                <span style={{ color: 'var(--foreground)', textDecoration: ev.status === 'completed' ? 'line-through' : 'none' }}>
                  {ev.title}
                </span>
                {ev.is_recurring && (
                  <RotateCcw size={10} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'משימות' : 'Tasks'}
          </p>
          {tasks.map((t) => {
            const done = t.status === 'done'
            const urgencyColor = URGENCY_COLORS[t.urgency]
            return (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => startTransition(async () => {
                    await updateFamilyTaskStatus(t.id, done ? 'pending' : 'done')
                  })}
                  disabled={pending}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? urgencyColor : 'transparent', border: `2px solid ${urgencyColor}` }}
                >
                  {done && <Check size={11} color="white" />}
                </button>
                <span style={{ color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}>
                  {t.title}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
