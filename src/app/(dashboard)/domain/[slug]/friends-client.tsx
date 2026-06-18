'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Trash2, MessageCircle, Users,
  Bell, BellRing, Phone, MessageSquare, History, Search,
  ChevronDown, ChevronUp, Pin, Archive, Pencil, Check, Tag,
} from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { DomainHabitsTab } from '@/components/domain-habits-tab'
import { FriendsCalendarTab } from '@/components/friends/friends-calendar-tab'
import { FriendsEventsTab } from '@/components/friends/friends-events-tab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createContact, deleteContact, updateContact,
  logInteraction, deleteLastInteraction,
  logInteractionOn, deleteInteraction,
  createReminder, deleteReminder, completeReminder,
} from './friends-actions'
import type { Domain, Habit, HabitLog } from '@/types'
import type {
  FriendContact, FriendInteraction, FriendReminder, FriendEvent,
  InteractionKind, RelationshipType,
} from '@/types/friends'

type Tab = 'people' | 'events' | 'habits'
type HabitsView = 'list' | 'calendar'

const todayStr = () => new Date().toISOString().split('T')[0]

function formatDate(dateStr: string, isRTL: boolean): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function relativeDays(dateStr: string, isRTL: boolean): string {
  const today = new Date(todayStr() + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return isRTL ? 'היום' : 'Today'
  if (diff === 1) return isRTL ? 'אתמול' : 'Yesterday'
  if (diff < 7) return isRTL ? `לפני ${diff} ימים` : `${diff} days ago`
  if (diff < 30) return isRTL ? `לפני ${Math.floor(diff / 7)} שבועות` : `${Math.floor(diff / 7)}w ago`
  return isRTL ? `לפני ${Math.floor(diff / 30)} חודשים` : `${Math.floor(diff / 30)}mo ago`
}

const RELATIONSHIP_LABELS_HE: Record<RelationshipType, string> = {
  close_friend: 'קרוב',
  friend: 'חבר',
  acquaintance: 'מכר',
  family: 'משפחה',
  mentor: 'מנטור',
  colleague: 'עמית',
}
const RELATIONSHIP_LABELS_EN: Record<RelationshipType, string> = {
  close_friend: 'Close',
  friend: 'Friend',
  acquaintance: 'Acquaint.',
  family: 'Family',
  mentor: 'Mentor',
  colleague: 'Colleague',
}

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  allLogs: HabitLog[]
  userId: string
  contacts: FriendContact[]
  interactions: FriendInteraction[]
  reminders: FriendReminder[]
  events: FriendEvent[]
}

export function FriendsClient({
  domain, habits: initialHabits, completedIds, allLogs, userId,
  contacts: initialContacts, interactions: initialInteractions,
  reminders: initialReminders, events: initialEvents,
}: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('people')
  const [habitsView, setHabitsView] = useState<HabitsView>('list')
  const [habits, setHabits] = useState(initialHabits)
  const [contacts, setContacts] = useState(initialContacts)
  const [interactions, setInteractions] = useState(initialInteractions)
  const [reminders, setReminders] = useState(initialReminders)
  const [events, setEvents] = useState(initialEvents)
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

  const addInteraction = (i: FriendInteraction) => setInteractions((prev) => [...prev, i])
  const removeInteraction = (id: string) => setInteractions((prev) => prev.filter((i) => i.id !== id))
  const addReminder = (r: FriendReminder) => setReminders((prev) => [...prev, r])
  const removeReminder = (id: string) => setReminders((prev) => prev.filter((r) => r.id !== id))

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
                ? (isRTL ? 'פרופיל' : 'Profile')
                : (isRTL ? `${contacts.length} אנשים` : `${contacts.length} people`)}
            </p>
          </div>
        </div>

        {/* Tab bar — hidden inside contact detail */}
        {!selectedContact && (
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
            {([
              ['people', isRTL ? 'אנשים' : 'People'],
              ['events', isRTL ? 'מפגשים' : 'Events'],
              ['habits', isRTL ? 'הרגלים' : 'Habits'],
            ] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? color : 'transparent',
                  color: tab === t ? 'white' : 'var(--muted-foreground)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Contact detail */}
        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            interactions={interactions.filter((i) => i.contact_id === selectedContact.id)}
            reminders={reminders.filter((r) => r.contact_id === selectedContact.id && !r.done)}
            events={events.filter((e) => e.contact_ids.includes(selectedContact.id))}
            color={color}
            isRTL={isRTL}
            onContactUpdated={(updated) =>
              setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            }
            onInteractionAdded={addInteraction}
            onInteractionDeleted={removeInteraction}
            onReminderAdded={addReminder}
            onReminderDeleted={removeReminder}
          />
        )}

        {/* People tab */}
        {tab === 'people' && !selectedContact && (
          <PeopleTab
            contacts={contacts}
            countsFor={countsFor}
            lastTalkFor={lastTalkFor}
            openReminderFor={openReminderFor}
            color={color}
            isRTL={isRTL}
            onOpen={(id) => setSelectedId(id)}
            onContactAdded={(c) => setContacts((prev) => [...prev, c])}
            onContactDeleted={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
            onContactUpdated={(updated) =>
              setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            }
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

        {/* Events tab */}
        {tab === 'events' && !selectedContact && (
          <FriendsEventsTab
            events={events}
            contacts={contacts}
            color={color}
            isRTL={isRTL}
            onEventAdded={(e) => setEvents((prev) => [...prev, e])}
            onEventUpdated={(e) => setEvents((prev) => prev.map((x) => (x.id === e.id ? e : x)))}
            onEventDeleted={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
          />
        )}

        {/* Habits tab */}
        {tab === 'habits' && !selectedContact && (
          <div className="space-y-4">
            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
              {([
                ['list', isRTL ? 'הרגלים' : 'Habits'],
                ['calendar', isRTL ? 'לוח שנה' : 'Calendar'],
              ] as [HabitsView, string][]).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setHabitsView(v)}
                  className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: habitsView === v ? color : 'transparent',
                    color: habitsView === v ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {habitsView === 'list' ? (
              <DomainHabitsTab
                habits={habits}
                completedSet={completedSet}
                domain={domain}
                userId={userId}
                onAdded={(h) => setHabits((prev) => [...prev, h])}
                isRTL={isRTL}
              />
            ) : (
              <FriendsCalendarTab
                habits={habits}
                allLogs={allLogs}
                interactions={interactions}
                events={events}
                contacts={contacts}
                color={color}
                isRTL={isRTL}
              />
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── People Tab ─────────────────────────────────────────────────

function PeopleTab({
  contacts, countsFor, lastTalkFor, openReminderFor, color, isRTL, onOpen,
  onContactAdded, onContactDeleted, onContactUpdated, onInteractionLogged, onLastInteractionDeleted,
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
  onContactUpdated: (c: FriendContact) => void
  onInteractionLogged: (i: FriendInteraction) => void
  onLastInteractionDeleted: (contactId: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all')
  const [pending, startTransition] = useTransition()

  const FILTER_CHIPS: { value: RelationshipType | 'all'; labelHe: string; labelEn: string }[] = [
    { value: 'all', labelHe: 'כולם', labelEn: 'All' },
    { value: 'close_friend', labelHe: 'קרובים', labelEn: 'Close' },
    { value: 'friend', labelHe: 'חברים', labelEn: 'Friends' },
    { value: 'acquaintance', labelHe: 'מכרים', labelEn: 'Acquaint.' },
    { value: 'mentor', labelHe: 'מנטורים', labelEn: 'Mentors' },
    { value: 'family', labelHe: 'משפחה', labelEn: 'Family' },
  ]

  const filtered = useMemo(() => {
    let result = contacts
    if (filterType !== 'all') result = result.filter((c) => c.relationship_type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [contacts, filterType, search])

  const submit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      const c = await createContact(name.trim())
      onContactAdded(c)
      setName(''); setAdding(false)
    })
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--muted-foreground)', insetInlineStart: '12px' }}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isRTL ? 'חפש לפי שם או תגית...' : 'Search by name or tag...'}
          className="rounded-xl"
          style={{
            background: 'var(--c-input)',
            border: '1px solid var(--c-input-border)',
            color: 'var(--foreground)',
            paddingInlineStart: '34px',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)', insetInlineEnd: '10px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilterType(chip.value)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterType === chip.value ? color : 'var(--secondary)',
              color: filterType === chip.value ? 'white' : 'var(--muted-foreground)',
              border: `1px solid ${filterType === chip.value ? color : 'transparent'}`,
            }}
          >
            {isRTL ? chip.labelHe : chip.labelEn}
          </button>
        ))}
      </div>

      {contacts.length === 0 && !adding && (
        <div className="text-center py-10">
          <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הוסף אנשים לרשימה' : 'Add people to your list'}
          </p>
        </div>
      )}

      {search.trim() && filtered.length === 0 && (
        <p className="text-center text-sm py-6" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'לא נמצאו תוצאות' : 'No results found'}
        </p>
      )}

      {filtered.map((contact) => (
        <PersonCard
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
          onPin={() => {
            startTransition(async () => {
              const updated = await updateContact(contact.id, { pinned: !contact.pinned })
              onContactUpdated(updated)
            })
          }}
          pendingAction={pending}
        />
      ))}

      {adding ? (
        <Card className="p-4 mt-2">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={isRTL ? 'שם' : 'Name'}
              className="rounded-xl flex-1"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
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
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed mt-1"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף אדם' : 'Add Person'}</span>
        </button>
      )}
    </div>
  )
}

// ── Person Card ───────────────────────────────────────────────

function PersonCard({
  contact, counts, lastTalk, reminder, color, isRTL,
  onOpen, onLog, onUndo, onDelete, onPin, pendingAction,
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
  onPin: () => void
  pendingAction: boolean
}) {
  const talkedToday = counts.today > 0
  const reminderDue = reminder ? reminder.remind_on <= todayStr() : false
  const cardColor = contact.color_override ?? color

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl"
      style={{
        background: 'var(--card)',
        border: `1px solid ${contact.pinned ? `${cardColor}44` : 'var(--c-border)'}`,
      }}
    >
      {/* Clickable area → opens profile */}
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-start">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative"
          style={{ background: `${cardColor}22`, color: cardColor }}
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
          {contact.pinned && (
            <span
              className="absolute -bottom-1 -end-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: cardColor }}
            >
              <Pin size={8} style={{ color: 'white' }} />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {contact.name}
            </p>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: `${cardColor}18`, color: cardColor }}
            >
              {isRTL
                ? RELATIONSHIP_LABELS_HE[contact.relationship_type]
                : RELATIONSHIP_LABELS_EN[contact.relationship_type]}
            </span>
          </div>
          {contact.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {contact.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
                >
                  {tag}
                </span>
              ))}
              {contact.tags.length > 3 && (
                <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          )}
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {lastTalk
              ? relativeDays(lastTalk, isRTL)
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
          background: talkedToday ? `${cardColor}22` : cardColor,
          color: talkedToday ? cardColor : 'white',
          border: talkedToday ? `1px solid ${cardColor}55` : 'none',
        }}
      >
        <MessageCircle size={13} />
        <span>{talkedToday
          ? (counts.today > 1 ? `×${counts.today}` : '✓')
          : (isRTL ? 'דיברנו' : 'Talked')
        }</span>
      </button>

      {/* Pin */}
      <button
        onClick={onPin}
        disabled={pendingAction}
        className="p-1.5 flex-shrink-0 rounded-lg"
        style={{
          color: contact.pinned ? cardColor : 'var(--muted-foreground)',
          background: contact.pinned ? `${cardColor}18` : 'transparent',
        }}
      >
        <Pin size={13} />
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

// ── Contact Detail (profile view) ─────────────────────────────

function ContactDetail({
  contact, interactions, reminders, events, color, isRTL,
  onContactUpdated, onInteractionAdded, onInteractionDeleted, onReminderAdded, onReminderDeleted,
}: {
  contact: FriendContact
  interactions: FriendInteraction[]
  reminders: FriendReminder[]
  events: FriendEvent[]
  color: string
  isRTL: boolean
  onContactUpdated: (c: FriendContact) => void
  onInteractionAdded: (i: FriendInteraction) => void
  onInteractionDeleted: (id: string) => void
  onReminderAdded: (r: FriendReminder) => void
  onReminderDeleted: (id: string) => void
}) {
  const [kind, setKind] = useState<InteractionKind>('talk')
  const [editingNotes, setEditingNotes] = useState(false)
  const [editingHowMet, setEditingHowMet] = useState(false)
  const [notesVal, setNotesVal] = useState(contact.notes ?? '')
  const [howMetVal, setHowMetVal] = useState(contact.how_we_met ?? '')
  const [newTag, setNewTag] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [pending, startTransition] = useTransition()
  const [showHistory, setShowHistory] = useState(false)

  const RELATIONSHIP_OPTIONS: RelationshipType[] = ['close_friend', 'friend', 'acquaintance', 'family', 'mentor', 'colleague']

  const saveNotes = () => {
    startTransition(async () => {
      const updated = await updateContact(contact.id, { notes: notesVal.trim() || null })
      onContactUpdated(updated)
      setEditingNotes(false)
    })
  }

  const saveHowMet = () => {
    startTransition(async () => {
      const updated = await updateContact(contact.id, { how_we_met: howMetVal.trim() || null })
      onContactUpdated(updated)
      setEditingHowMet(false)
    })
  }

  const setRelationshipType = (rt: RelationshipType) => {
    startTransition(async () => {
      const updated = await updateContact(contact.id, { relationship_type: rt })
      onContactUpdated(updated)
    })
  }

  const addTag = () => {
    const tag = newTag.trim()
    if (!tag || contact.tags.includes(tag)) return
    startTransition(async () => {
      const updated = await updateContact(contact.id, { tags: [...contact.tags, tag] })
      onContactUpdated(updated)
      setNewTag(''); setAddingTag(false)
    })
  }

  const removeTag = (tag: string) => {
    startTransition(async () => {
      const updated = await updateContact(contact.id, { tags: contact.tags.filter((t) => t !== tag) })
      onContactUpdated(updated)
    })
  }

  const sortedInteractions = useMemo(
    () => interactions
      .filter((i) => i.kind === kind)
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
    [interactions, kind],
  )

  const cardColor = contact.color_override ?? color

  return (
    <div className="space-y-4">

      {/* Relationship type selector */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'סוג קשר' : 'Relationship'}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {RELATIONSHIP_OPTIONS.map((rt) => (
            <button
              key={rt}
              onClick={() => setRelationshipType(rt)}
              disabled={pending}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: contact.relationship_type === rt ? cardColor : 'var(--secondary)',
                color: contact.relationship_type === rt ? 'white' : 'var(--muted-foreground)',
              }}
            >
              {isRTL ? RELATIONSHIP_LABELS_HE[rt] : RELATIONSHIP_LABELS_EN[rt]}
            </button>
          ))}
        </div>
      </div>

      {/* How we met */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'איך הכרנו' : 'How we met'}
          </p>
          <button onClick={() => { setEditingHowMet(!editingHowMet); setHowMetVal(contact.how_we_met ?? '') }} style={{ color: 'var(--muted-foreground)' }}>
            <Pencil size={13} />
          </button>
        </div>
        {editingHowMet ? (
          <div className="space-y-2">
            <Input
              autoFocus
              value={howMetVal}
              onChange={(e) => setHowMetVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveHowMet()}
              placeholder={isRTL ? 'תאר איך הכרתם...' : 'Describe how you met...'}
              className="rounded-xl text-sm"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
            />
            <div className="flex gap-2">
              <Button onClick={saveHowMet} disabled={pending} className="rounded-xl text-xs h-8" style={{ background: cardColor, color: 'white' }}>
                {isRTL ? 'שמור' : 'Save'}
              </Button>
              <button onClick={() => setEditingHowMet(false)} className="text-xs px-3 rounded-xl" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                {isRTL ? 'ביטול' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: contact.how_we_met ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
            {contact.how_we_met || (isRTL ? 'לא מצוין עדיין...' : 'Not set yet...')}
          </p>
        )}
      </div>

      {/* Tags */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} style={{ color: cardColor }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'תגיות' : 'Tags'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{ background: `${cardColor}18`, color: cardColor }}
            >
              {tag}
              <button onClick={() => removeTag(tag)} disabled={pending}><X size={10} /></button>
            </span>
          ))}
          {addingTag ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setAddingTag(false) }}
                placeholder={isRTL ? 'תגית...' : 'Tag...'}
                className="rounded-full h-7 text-xs w-24"
                style={{ background: 'var(--c-input)', border: `1px solid ${cardColor}55`, color: 'var(--foreground)' }}
              />
              <button onClick={addTag} disabled={pending} style={{ color: cardColor }}><Check size={14} /></button>
              <button onClick={() => setAddingTag(false)} style={{ color: 'var(--muted-foreground)' }}><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTag(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-dashed"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              <Plus size={11} /> {isRTL ? 'תגית' : 'Tag'}
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'הערות' : 'Notes'}
          </p>
          <button onClick={() => { setEditingNotes(!editingNotes); setNotesVal(contact.notes ?? '') }} style={{ color: 'var(--muted-foreground)' }}>
            <Pencil size={13} />
          </button>
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              placeholder={isRTL ? 'הערות חופשיות...' : 'Free notes...'}
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)', outline: 'none' }}
            />
            <div className="flex gap-2">
              <Button onClick={saveNotes} disabled={pending} className="rounded-xl text-xs h-8" style={{ background: cardColor, color: 'white' }}>
                {isRTL ? 'שמור' : 'Save'}
              </Button>
              <button onClick={() => setEditingNotes(false)} className="text-xs px-3 rounded-xl" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                {isRTL ? 'ביטול' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap" style={{ color: contact.notes ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
            {contact.notes || (isRTL ? 'אין הערות עדיין...' : 'No notes yet...')}
          </p>
        )}
      </div>

      {/* Events linked to this person */}
      {events.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            {isRTL ? `מפגשים (${events.length})` : `Events (${events.length})`}
          </p>
          <div className="space-y-2">
            {events.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
              >
                <span>{ev.event_date}</span>
                <span className="flex-1 truncate font-medium" style={{ color: 'var(--foreground)' }}>{ev.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders */}
      <ReminderSection
        contactId={contact.id}
        reminders={reminders}
        color={cardColor}
        isRTL={isRTL}
        onReminderAdded={onReminderAdded}
        onReminderDeleted={onReminderDeleted}
      />

      {/* Interaction history */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
        >
          <div className="flex items-center gap-2">
            <History size={15} style={{ color: cardColor }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {isRTL ? `היסטוריה (${interactions.length})` : `History (${interactions.length})`}
            </span>
          </div>
          {showHistory ? <ChevronUp size={16} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />}
        </button>

        {showHistory && (
          <div className="mt-2 space-y-3">
            {/* Kind selector */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
              {([
                ['talk', isRTL ? 'שיחות' : 'Talks', <Phone size={14} key="ph" />],
                ['message', isRTL ? 'הודעות' : 'Messages', <MessageSquare size={14} key="ms" />],
              ] as [InteractionKind, string, React.ReactNode][]).map(([k, label, icon]) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{
                    background: kind === k ? cardColor : 'transparent',
                    color: kind === k ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            <HistoryList
              contactId={contact.id}
              kind={kind}
              items={sortedInteractions}
              color={cardColor}
              isRTL={isRTL}
              onInteractionAdded={onInteractionAdded}
              onInteractionDeleted={onInteractionDeleted}
            />
          </div>
        )}
      </div>

    </div>
  )
}

// ── Reminder Section ───────────────────────────────────────────

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
          {isRTL ? 'תזכורות' : 'Reminders'}
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
            <button onClick={() => dismiss(r.id)} disabled={pending} className="text-[11px] font-semibold px-2 py-1 rounded-md flex-shrink-0" style={{ background: `${color}22`, color }}>
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
            <button onClick={() => { setAdding(false); setNote('') }} className="p-2 rounded-xl flex-shrink-0" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
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
          <Button onClick={submit} disabled={pending || !date} className="rounded-xl w-full" style={{ background: color, color: 'white' }}>
            {isRTL ? 'הוסף תזכורת' : 'Add reminder'}
          </Button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={16} />
          <span className="text-xs">{isRTL ? 'הוסף תזכורת' : 'Add reminder'}</span>
        </button>
      )}
    </Card>
  )
}

// ── History List ───────────────────────────────────────────────

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

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL ? `${items.length} רשומות` : `${items.length} entries`}
      </p>

      {items.length === 0 && !adding && (
        <p className="text-center text-sm py-6" style={{ color: 'var(--muted-foreground)' }}>
          {kind === 'talk'
            ? (isRTL ? 'אין שיחות מתועדות' : 'No talks logged')
            : (isRTL ? 'אין הודעות מתועדות' : 'No messages logged')}
        </p>
      )}

      {items.map((i) => (
        <div
          key={i.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, color }}>
            {kind === 'talk' ? <Phone size={14} /> : <MessageSquare size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {formatDate(i.date, isRTL)}
            </p>
            {i.note && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{i.note}</p>}
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
            <button onClick={() => { setAdding(false); setNote('') }} className="p-2 rounded-xl flex-shrink-0" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
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
          <Button onClick={submit} disabled={pending || !date} className="rounded-xl w-full" style={{ background: color, color: 'white' }}>
            {isRTL ? 'הוסף' : 'Add'}
          </Button>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={18} />
          <span className="text-sm">
            {kind === 'talk'
              ? (isRTL ? 'הוסף תאריך שיחה' : 'Add talk date')
              : (isRTL ? 'הוסף תאריך הודעות' : 'Add message date')}
          </span>
        </button>
      )}
    </div>
  )
}
