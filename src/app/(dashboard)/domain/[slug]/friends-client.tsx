'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Trash2, MessageCircle, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { DomainHabitRow } from '@/components/domain-habit-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createContact, deleteContact,
  logInteraction, deleteLastInteraction,
} from './friends-actions'
import type { Domain, Habit } from '@/types'
import type { FriendContact, FriendInteraction } from '@/types/friends'

type Tab = 'contacts' | 'habits'

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
  contacts: FriendContact[]
  interactions: FriendInteraction[]
  schemaReady: boolean
}

export function FriendsClient({
  domain, habits: initialHabits, completedIds, userId,
  contacts: initialContacts, interactions: initialInteractions, schemaReady,
}: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('contacts')
  const [habits, setHabits] = useState(initialHabits)
  const [contacts, setContacts] = useState(initialContacts)
  const [interactions, setInteractions] = useState(initialInteractions)

  useHabitReminders(habits)

  const completedSet = useMemo(() => new Set(completedIds), [completedIds])
  const color = domain.color

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)
  const weekStr = weekAgo.toISOString().split('T')[0]
  const monthStr = monthAgo.toISOString().split('T')[0]

  function countsFor(contactId: string) {
    const mine = interactions.filter((i) => i.contact_id === contactId)
    return {
      today: mine.filter((i) => i.date === today).length,
      week: mine.filter((i) => i.date >= weekStr).length,
      month: mine.filter((i) => i.date >= monthStr).length,
    }
  }

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
              {isRTL
                ? `${contacts.length} אנשי קשר`
                : `${contacts.length} contacts`}
            </p>
          </div>
        </div>

        {!schemaReady && <SchemaBanner isRTL={isRTL} />}

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
          <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')} color={color}>
            {isRTL ? 'אנשי קשר' : 'Contacts'}
          </TabButton>
          <TabButton active={tab === 'habits'} onClick={() => setTab('habits')} color={color}>
            {isRTL ? 'הרגלים' : 'Habits'}
          </TabButton>
        </div>

        {tab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            countsFor={countsFor}
            color={color}
            isRTL={isRTL}
            onContactAdded={(c) => setContacts((prev) => [...prev, c])}
            onContactDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
            onInteractionLogged={(i) => setInteractions((prev) => [...prev, i])}
            onLastInteractionDeleted={(contactId) =>
              setInteractions((prev) => {
                const todayStr = new Date().toISOString().split('T')[0]
                const lastIdx = [...prev].reverse().findIndex(
                  (i) => i.contact_id === contactId && i.date === todayStr
                )
                if (lastIdx === -1) return prev
                const actualIdx = prev.length - 1 - lastIdx
                return prev.filter((_, idx) => idx !== actualIdx)
              })
            }
          />
        )}

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

      </div>
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────

function SchemaBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'הרץ את supabase-friends-schema.sql ב-Supabase'
          : 'Run supabase-friends-schema.sql in Supabase SQL editor'}
      </p>
    </Card>
  )
}

function TabButton({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all"
      style={{ background: active ? color : 'transparent', color: active ? 'white' : 'var(--muted-foreground)' }}
    >
      {children}
    </button>
  )
}

// ── Contacts Tab ───────────────────────────────────────────────

function ContactsTab({
  contacts, countsFor, color, isRTL,
  onContactAdded, onContactDeleted, onInteractionLogged, onLastInteractionDeleted,
}: {
  contacts: FriendContact[]
  countsFor: (id: string) => { today: number; week: number; month: number }
  color: string
  isRTL: boolean
  onContactAdded: (c: FriendContact) => void
  onContactDeleted: (id: string) => void
  onInteractionLogged: (i: FriendInteraction) => void
  onLastInteractionDeleted: (contactId: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      const c = await createContact(name.trim())
      onContactAdded(c)
      setName(''); setAdding(false)
    })
  }

  return (
    <div className="space-y-2">
      {contacts.length === 0 && !adding && (
        <div className="text-center py-10">
          <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הוסף אנשי קשר כדי לעקוב אחרי השיחות' : 'Add contacts to track your conversations'}
          </p>
        </div>
      )}

      {contacts.map((contact) => {
        const counts = countsFor(contact.id)
        return (
          <ContactRow
            key={contact.id}
            contact={contact}
            counts={counts}
            color={color}
            isRTL={isRTL}
            onLog={() => {
              startTransition(async () => {
                const i = await logInteraction(contact.id)
                onInteractionLogged(i)
              })
            }}
            onUndo={() => {
              startTransition(async () => {
                await deleteLastInteraction(contact.id)
                onLastInteractionDeleted(contact.id)
              })
            }}
            onDelete={() => {
              startTransition(async () => {
                await deleteContact(contact.id)
                onContactDeleted(contact.id)
              })
            }}
            pendingAction={pending}
          />
        )
      })}

      {adding ? (
        <Card className="p-4 mt-3">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={isRTL ? 'שם' : 'Name'}
              className="rounded-xl flex-1"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <Button
              onClick={submit}
              disabled={pending || !name.trim()}
              className="rounded-xl"
              style={{ background: color, color: 'white' }}
            >
              {isRTL ? 'הוסף' : 'Add'}
            </Button>
            <button
              onClick={() => { setAdding(false); setName('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed mt-2"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף איש קשר' : 'Add Contact'}</span>
        </button>
      )}
    </div>
  )
}

function ContactRow({
  contact, counts, color, isRTL,
  onLog, onUndo, onDelete, pendingAction,
}: {
  contact: FriendContact
  counts: { today: number; week: number; month: number }
  color: string
  isRTL: boolean
  onLog: () => void
  onUndo: () => void
  onDelete: () => void
  pendingAction: boolean
}) {
  const talkedToday = counts.today > 0

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: `${color}22`, color }}
      >
        {contact.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + counts */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {contact.name}
        </p>
        <div className="flex gap-2 mt-0.5">
          <CountBadge label={isRTL ? 'היום' : 'Today'} value={counts.today} color={color} active={talkedToday} />
          <CountBadge label={isRTL ? 'שבוע' : 'Week'} value={counts.week} color={color} active={false} />
          <CountBadge label={isRTL ? 'חודש' : 'Month'} value={counts.month} color={color} active={false} />
        </div>
      </div>

      {/* Talk button */}
      <button
        onClick={talkedToday ? onUndo : onLog}
        disabled={pendingAction}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
        style={{
          background: talkedToday ? `${color}22` : color,
          color: talkedToday ? color : 'white',
          border: talkedToday ? `1px solid ${color}55` : 'none',
        }}
        title={talkedToday
          ? (isRTL ? 'בטל' : 'Undo')
          : (isRTL ? 'דיברנו היום' : 'Talked today')}
      >
        <MessageCircle size={13} />
        <span>{talkedToday
          ? (counts.today > 1 ? `×${counts.today}` : (isRTL ? '✓' : '✓'))
          : (isRTL ? 'דיברנו' : 'Talked')
        }</span>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={pendingAction}
        className="p-1.5 flex-shrink-0"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function CountBadge({ label, value, color, active }: {
  label: string; value: number; color: string; active: boolean
}) {
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
      style={{
        background: active && value > 0 ? `${color}22` : 'var(--secondary)',
        color: active && value > 0 ? color : 'var(--muted-foreground)',
      }}
    >
      {label} {value}
    </span>
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
