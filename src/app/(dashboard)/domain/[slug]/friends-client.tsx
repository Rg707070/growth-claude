'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Trash2, MessageCircle, Users,
  Bell, BellRing, Calendar, MessageSquare, Phone, History,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { HabitRow } from '@/components/habit-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createContact, deleteContact,
  logInteraction, deleteLastInteraction,
  logInteractionOn, deleteInteraction,
  createReminder, deleteReminder, completeReminder,
} from './friends-actions'
import type { Domain, Habit } from '@/types'
import type {
  FriendContact, FriendInteraction, FriendReminder, InteractionKind,
} from '@/types/friends'

type Tab = 'contacts' | 'habits'

const todayStr = () => new Date().toISOString().split('T')[0]

function formatDate(dateStr: string, isRTL: boolean): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
  contacts: FriendContact[]
  interactions: FriendInteraction[]
  reminders: FriendReminder[]
  schemaReady: boolean
}

export function FriendsClient({
  domain, habits: initialHabits, completedIds, userId,
  contacts: initialContacts, interactions: initialInteractions,
  reminders: initialReminders, schemaReady,
}: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('contacts')
  const [habits, setHabits] = useState(initialHabits)
  const [contacts, setContacts] = useState(initialContacts)
  const [interactions, setInteractions] = useState(initialInteractions)
  const [reminders, setReminders] = useState(initialReminders)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useHabitReminders(habits)

  const completedSet = useMemo(() => new Set(completedIds), [completedIds])
  const color = domain.color

  const today = todayStr()
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)
  const weekStr = weekAgo.toISOString().split('T')[0]
  const monthStr = monthAgo.toISOString().split('T')[0]

  function countsFor(contactId: string) {
    const mine = interactions.filter((i) => i.contact_id === contactId)
    return {
      today: mine.filter((i) => i.date === today && i.kind === 'talk').length,
      week: mine.filter((i) => i.date >= weekStr).length,
      month: mine.filter((i) => i.date >= monthStr).length,
    }
  }

  function lastTalkFor(contactId: string): string | null {
    const talks = interactions
      .filter((i) => i.contact_id === contactId && i.kind === 'talk')
      .map((i) => i.date)
      .sort()
    return talks.length ? talks[talks.length - 1] : null
  }

  function openReminderFor(contactId: string): FriendReminder | null {
    const open = reminders
      .filter((r) => r.contact_id === contactId && !r.done)
      .sort((a, b) => a.remind_on.localeCompare(b.remind_on))
    return open.length ? open[0] : null
  }

  const addInteraction = (i: FriendInteraction) =>
    setInteractions((prev) => [...prev, i])
  const removeInteraction = (id: string) =>
    setInteractions((prev) => prev.filter((i) => i.id !== id))
  const addReminder = (r: FriendReminder) =>
    setReminders((prev) => [...prev, r])
  const removeReminder = (id: string) =>
    setReminders((prev) => prev.filter((r) => r.id !== id))

  const selectedContact = contacts.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 md:max-w-none md:px-0 md:pt-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (selectedContact ? setSelectedId(null) : router.back())}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <ArrowRight size={20} style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${color}22` }}
          >
            {selectedContact ? selectedContact.name.charAt(0).toUpperCase() : domain.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate" style={{ color: 'var(--foreground)' }}>
              {selectedContact
                ? selectedContact.name
                : (isRTL ? domain.nameHe : domain.nameEn)}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {selectedContact
                ? (isRTL ? 'היסטוריה ותזכורות' : 'History & reminders')
                : (isRTL ? `${contacts.length} אנשי קשר` : `${contacts.length} contacts`)}
            </p>
          </div>
        </div>

        {!schemaReady && <SchemaBanner isRTL={isRTL} />}

        {/* Tab bar — hidden inside contact detail */}
        {!selectedContact && (
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
            <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')} color={color}>
              {isRTL ? 'אנשי קשר' : 'Contacts'}
            </TabButton>
            <TabButton active={tab === 'habits'} onClick={() => setTab('habits')} color={color}>
              {isRTL ? 'הרגלים' : 'Habits'}
            </TabButton>
          </div>
        )}

        {tab === 'contacts' && selectedContact && (
          <ContactDetail
            contact={selectedContact}
            interactions={interactions.filter((i) => i.contact_id === selectedContact.id)}
            reminders={reminders.filter((r) => r.contact_id === selectedContact.id && !r.done)}
            color={color}
            isRTL={isRTL}
            onInteractionAdded={addInteraction}
            onInteractionDeleted={removeInteraction}
            onReminderAdded={addReminder}
            onReminderDeleted={removeReminder}
          />
        )}

        {tab === 'contacts' && !selectedContact && (
          <ContactsTab
            contacts={contacts}
            countsFor={countsFor}
            lastTalkFor={lastTalkFor}
            openReminderFor={openReminderFor}
            color={color}
            isRTL={isRTL}
            onOpen={(id) => setSelectedId(id)}
            onContactAdded={(c) => setContacts((prev) => [...prev, c])}
            onContactDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
            onInteractionLogged={addInteraction}
            onLastInteractionDeleted={(contactId) =>
              setInteractions((prev) => {
                const ts = todayStr()
                const lastIdx = [...prev].reverse().findIndex(
                  (i) => i.contact_id === contactId && i.date === ts && i.kind === 'talk'
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
  contacts, countsFor, lastTalkFor, openReminderFor, color, isRTL, onOpen,
  onContactAdded, onContactDeleted, onInteractionLogged, onLastInteractionDeleted,
}: {
  contacts: FriendContact[]
  countsFor: (id: string) => { today: number; week: number; month: number }
  lastTalkFor: (id: string) => string | null
  openReminderFor: (id: string) => FriendReminder | null
  color: string
  isRTL: boolean
  onOpen: (id: string) => void
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

      {contacts.map((contact) => (
        <ContactRow
          key={contact.id}
          contact={contact}
          counts={countsFor(contact.id)}
          lastTalk={lastTalkFor(contact.id)}
          reminder={openReminderFor(contact.id)}
          color={color}
          isRTL={isRTL}
          onOpen={() => onOpen(contact.id)}
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
      ))}

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
  contact, counts, lastTalk, reminder, color, isRTL,
  onOpen, onLog, onUndo, onDelete, pendingAction,
}: {
  contact: FriendContact
  counts: { today: number; week: number; month: number }
  lastTalk: string | null
  reminder: FriendReminder | null
  color: string
  isRTL: boolean
  onOpen: () => void
  onLog: () => void
  onUndo: () => void
  onDelete: () => void
  pendingAction: boolean
}) {
  const talkedToday = counts.today > 0
  const reminderDue = reminder ? reminder.remind_on <= todayStr() : false

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
    >
      {/* Clickable area → opens history detail */}
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-start">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative"
          style={{ background: `${color}22`, color }}
        >
          {contact.name.charAt(0).toUpperCase()}
          {reminder && (
            <span
              className="absolute -top-1 -end-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: reminderDue ? '#f59e0b' : 'var(--secondary)' }}
            >
              {reminderDue
                ? <BellRing size={9} style={{ color: 'white' }} />
                : <Bell size={9} style={{ color: 'var(--muted-foreground)' }} />}
            </span>
          )}
        </div>

        {/* Name + counts */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
            {contact.name}
          </p>
          <div className="flex gap-2 mt-0.5 items-center">
            <CountBadge label={isRTL ? 'היום' : 'Today'} value={counts.today} color={color} active={talkedToday} />
            <CountBadge label={isRTL ? 'שבוע' : 'Week'} value={counts.week} color={color} active={false} />
            <CountBadge label={isRTL ? 'חודש' : 'Month'} value={counts.month} color={color} active={false} />
          </div>
          <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
            <History size={10} />
            {lastTalk
              ? (isRTL ? `לאחרונה: ${formatDate(lastTalk, true)}` : `Last: ${formatDate(lastTalk, false)}`)
              : (isRTL ? 'עדיין לא דיברתם' : 'Not talked yet')}
          </p>
        </div>
      </button>

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
          ? (counts.today > 1 ? `×${counts.today}` : '✓')
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

// ── Contact Detail (history, past dates, reminders, messages) ──

function ContactDetail({
  contact, interactions, reminders, color, isRTL,
  onInteractionAdded, onInteractionDeleted, onReminderAdded, onReminderDeleted,
}: {
  contact: FriendContact
  interactions: FriendInteraction[]
  reminders: FriendReminder[]
  color: string
  isRTL: boolean
  onInteractionAdded: (i: FriendInteraction) => void
  onInteractionDeleted: (id: string) => void
  onReminderAdded: (r: FriendReminder) => void
  onReminderDeleted: (id: string) => void
}) {
  const [kind, setKind] = useState<InteractionKind>('talk')

  const items = useMemo(
    () => interactions
      .filter((i) => i.kind === kind)
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    [interactions, kind],
  )

  return (
    <div className="space-y-5">
      <ReminderSection
        contactId={contact.id}
        reminders={reminders}
        color={color}
        isRTL={isRTL}
        onReminderAdded={onReminderAdded}
        onReminderDeleted={onReminderDeleted}
      />

      {/* Kind selector: talks vs messages */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
        <KindButton active={kind === 'talk'} onClick={() => setKind('talk')} color={color}>
          <Phone size={14} />
          {isRTL ? 'שיחות' : 'Talks'}
        </KindButton>
        <KindButton active={kind === 'message'} onClick={() => setKind('message')} color={color}>
          <MessageSquare size={14} />
          {isRTL ? 'הודעות' : 'Messages'}
        </KindButton>
      </div>

      <HistoryList
        contactId={contact.id}
        kind={kind}
        items={items}
        color={color}
        isRTL={isRTL}
        onInteractionAdded={onInteractionAdded}
        onInteractionDeleted={onInteractionDeleted}
      />
    </div>
  )
}

function KindButton({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
      style={{ background: active ? color : 'transparent', color: active ? 'white' : 'var(--muted-foreground)' }}
    >
      {children}
    </button>
  )
}

function ReminderSection({
  contactId, reminders, color, isRTL, onReminderAdded, onReminderDeleted,
}: {
  contactId: string
  reminders: FriendReminder[]
  color: string
  isRTL: boolean
  onReminderAdded: (r: FriendReminder) => void
  onReminderDeleted: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const sorted = [...reminders].sort((a, b) => a.remind_on.localeCompare(b.remind_on))

  const submit = () => {
    if (!date) return
    startTransition(async () => {
      const r = await createReminder({ contactId, remindOn: date, note: note || null })
      onReminderAdded(r)
      setNote(''); setDate(todayStr()); setAdding(false)
    })
  }

  const dismiss = (id: string) => {
    startTransition(async () => {
      await completeReminder(id)
      onReminderDeleted(id)
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteReminder(id)
      onReminderDeleted(id)
    })
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Bell size={15} style={{ color }} />
        <p className="text-sm font-semibold flex-1" style={{ color: 'var(--foreground)' }}>
          {isRTL ? 'תזכורות לדבר' : 'Reminders to reach out'}
        </p>
      </div>

      {sorted.length === 0 && !adding && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'אין תזכורות פעילות' : 'No active reminders'}
        </p>
      )}

      {sorted.map((r) => {
        const due = r.remind_on <= todayStr()
        return (
          <div
            key={r.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: due ? 'rgba(245,158,11,0.10)' : 'var(--secondary)',
              border: `1px solid ${due ? '#f59e0b55' : 'var(--border)'}`,
            }}
          >
            {due
              ? <BellRing size={14} style={{ color: '#f59e0b' }} />
              : <Bell size={14} style={{ color: 'var(--muted-foreground)' }} />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: due ? '#f59e0b' : 'var(--foreground)' }}>
                {formatDate(r.remind_on, isRTL)}
              </p>
              {r.note && (
                <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>{r.note}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(r.id)}
              disabled={pending}
              className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0"
              style={{ background: `${color}22`, color }}
            >
              {isRTL ? 'בוצע' : 'Done'}
            </button>
            <button onClick={() => remove(r.id)} disabled={pending} className="p-1 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )
      })}

      {adding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl px-3 text-sm flex-1 h-9"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
            />
            <button
              onClick={() => { setAdding(false); setNote('') }}
              className="p-2 rounded-xl flex-shrink-0"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'הערה (אופציונלי)' : 'Note (optional)'}
            className="rounded-xl"
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
          />
          <Button
            onClick={submit}
            disabled={pending || !date}
            className="rounded-xl w-full"
            style={{ background: color, color: 'white' }}
          >
            {isRTL ? 'הוסף תזכורת' : 'Add reminder'}
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={16} />
          <span className="text-xs">{isRTL ? 'הוסף תזכורת' : 'Add reminder'}</span>
        </button>
      )}
    </Card>
  )
}

function HistoryList({
  contactId, kind, items, color, isRTL, onInteractionAdded, onInteractionDeleted,
}: {
  contactId: string
  kind: InteractionKind
  items: FriendInteraction[]
  color: string
  isRTL: boolean
  onInteractionAdded: (i: FriendInteraction) => void
  onInteractionDeleted: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!date) return
    startTransition(async () => {
      const i = await logInteractionOn({ contactId, date, kind, note: note || null })
      onInteractionAdded(i)
      setNote(''); setDate(todayStr()); setAdding(false)
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteInteraction(id)
      onInteractionDeleted(id)
    })
  }

  const addLabel = kind === 'talk'
    ? (isRTL ? 'הוסף תאריך שיחה' : 'Add talk date')
    : (isRTL ? 'הוסף תאריך הודעות' : 'Add message date')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? `היסטוריה לפי תאריך · ${items.length}` : `History by date · ${items.length}`}
        </p>
      </div>

      {items.length === 0 && !adding && (
        <div className="text-center py-8">
          <Calendar size={28} className="mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {kind === 'talk'
              ? (isRTL ? 'אין שיחות מתועדות' : 'No talks logged')
              : (isRTL ? 'אין הודעות מתועדות' : 'No messages logged')}
          </p>
        </div>
      )}

      {items.map((i) => (
        <div
          key={i.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}22`, color }}
          >
            {kind === 'talk' ? <Phone size={14} /> : <MessageSquare size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {formatDate(i.date, isRTL)}
            </p>
            {i.note && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{i.note}</p>
            )}
          </div>
          <button onClick={() => remove(i.id)} disabled={pending} className="p-1 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {adding ? (
        <Card className="p-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl px-3 text-sm flex-1 h-9"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
            />
            <button
              onClick={() => { setAdding(false); setNote('') }}
              className="p-2 rounded-xl flex-shrink-0"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              <X size={18} />
            </button>
          </div>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'על מה דיברתם? (אופציונלי)' : 'What about? (optional)'}
            className="rounded-xl"
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
          />
          <Button
            onClick={submit}
            disabled={pending || !date}
            className="rounded-xl w-full"
            style={{ background: color, color: 'white' }}
          >
            {isRTL ? 'הוסף' : 'Add'}
          </Button>
        </Card>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{addLabel}</span>
        </button>
      )}
    </div>
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
        <HabitRow key={h.id} habit={h} isCompleted={completedSet.has(h.id)} />
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
