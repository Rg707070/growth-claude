'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Plus, X, Trash2, Check, MapPin, Bell,
  Users, Cake, Plane, Utensils, Phone, PartyPopper, Calendar,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createFriendEvent, updateFriendEvent, deleteFriendEvent } from '@/app/(dashboard)/domain/[slug]/friends-actions'
import type { FriendContact, FriendEvent, EventCategory } from '@/types/friends'

const todayStr = () => new Date().toISOString().split('T')[0]

const CATEGORIES: { value: EventCategory; icon: React.ReactNode; labelHe: string; labelEn: string }[] = [
  { value: 'hangout', icon: <Users size={16} />, labelHe: 'בילוי', labelEn: 'Hangout' },
  { value: 'birthday', icon: <Cake size={16} />, labelHe: 'יום הולדת', labelEn: 'Birthday' },
  { value: 'trip', icon: <Plane size={16} />, labelHe: 'טיול', labelEn: 'Trip' },
  { value: 'meal', icon: <Utensils size={16} />, labelHe: 'ארוחה', labelEn: 'Meal' },
  { value: 'call', icon: <Phone size={16} />, labelHe: 'שיחה', labelEn: 'Call' },
  { value: 'celebration', icon: <PartyPopper size={16} />, labelHe: 'חגיגה', labelEn: 'Celebration' },
  { value: 'other', icon: <Calendar size={16} />, labelHe: 'אחר', labelEn: 'Other' },
]

const CATEGORY_EMOJI: Record<EventCategory, string> = {
  hangout: '🤝', birthday: '🎂', trip: '✈️', meal: '🍽️', call: '📞', celebration: '🎉', other: '📅',
}

function relativeDate(dateStr: string, isRTL: boolean): string {
  const today = new Date(todayStr() + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return isRTL ? 'היום' : 'Today'
  if (diff === 1) return isRTL ? 'מחר' : 'Tomorrow'
  if (diff === -1) return isRTL ? 'אתמול' : 'Yesterday'
  if (diff > 0 && diff < 8) return isRTL ? `בעוד ${diff} ימים` : `In ${diff} days`
  if (diff < 0 && diff > -8) return isRTL ? `לפני ${-diff} ימים` : `${-diff} days ago`
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })
}

interface Props {
  events: FriendEvent[]
  contacts: FriendContact[]
  color: string
  isRTL: boolean
  onEventAdded: (e: FriendEvent) => void
  onEventUpdated: (e: FriendEvent) => void
  onEventDeleted: (id: string) => void
}

export function FriendsEventsTab({
  events, contacts, color, isRTL, onEventAdded, onEventUpdated, onEventDeleted,
}: Props) {
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming')
  const [adding, setAdding] = useState(false)
  const [pending, startTransition] = useTransition()

  const today = todayStr()
  const soonThreshold = new Date()
  soonThreshold.setDate(soonThreshold.getDate() + 3)
  const soonStr = soonThreshold.toISOString().split('T')[0]

  const { upcoming, past } = useMemo(() => {
    const up = events.filter((e) => e.event_date >= today && e.status !== 'cancelled').sort((a, b) => a.event_date.localeCompare(b.event_date))
    const pa = events.filter((e) => e.event_date < today || e.status === 'done').sort((a, b) => b.event_date.localeCompare(a.event_date))
    return { upcoming: up, past: pa }
  }, [events, today])

  const shown = view === 'upcoming' ? upcoming : past

  const contactMap = useMemo(() => {
    const m: Record<string, FriendContact> = {}
    for (const c of contacts) m[c.id] = c
    return m
  }, [contacts])

  const markDone = (ev: FriendEvent) => {
    startTransition(async () => {
      const updated = await updateFriendEvent(ev.id, { status: 'done' })
      onEventUpdated(updated)
    })
  }

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteFriendEvent(id)
      onEventDeleted(id)
    })
  }

  return (
    <div className="space-y-3">
      {/* Toggle upcoming/past */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
        {(['upcoming', 'past'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: view === v ? color : 'transparent',
              color: view === v ? 'white' : 'var(--muted-foreground)',
            }}
          >
            {v === 'upcoming'
              ? (isRTL ? `קרובים (${upcoming.length})` : `Upcoming (${upcoming.length})`)
              : (isRTL ? `עבר (${past.length})` : `Past (${past.length})`)}
          </button>
        ))}
      </div>

      {shown.length === 0 && !adding && (
        <div className="text-center py-10">
          <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {view === 'upcoming'
              ? (isRTL ? 'אין מפגשים קרובים' : 'No upcoming events')
              : (isRTL ? 'אין מפגשים בעבר' : 'No past events')}
          </p>
        </div>
      )}

      {shown.map((ev) => {
        const isSoon = ev.event_date <= soonStr && ev.event_date >= today
        const linkedContacts = ev.contact_ids.map((cid) => contactMap[cid]).filter(Boolean)
        return (
          <div
            key={ev.id}
            className="flex items-start gap-3 px-3 py-3 rounded-xl"
            style={{ background: 'var(--card)', border: `1px solid ${isSoon ? '#f59e0b44' : 'var(--c-border)'}` }}
          >
            {/* Category emoji */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: `${color}15` }}
            >
              {CATEGORY_EMOJI[ev.category]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                  {ev.title}
                </p>
                {isSoon && (
                  <Bell size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color }}>
                  {relativeDate(ev.event_date, isRTL)}
                  {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                </span>
                {ev.location && (
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <MapPin size={10} /> {ev.location}
                  </span>
                )}
              </div>
              {linkedContacts.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {linkedContacts.slice(0, 4).map((c) => (
                    <span
                      key={c.id}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${color}18`, color }}
                    >
                      {c.name}
                    </span>
                  ))}
                  {linkedContacts.length > 4 && (
                    <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                      +{linkedContacts.length - 4}
                    </span>
                  )}
                </div>
              )}
              {ev.notes && (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{ev.notes}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              {view === 'upcoming' && ev.status === 'upcoming' && (
                <button
                  onClick={() => markDone(ev)}
                  disabled={pending}
                  className="p-1.5 rounded-lg"
                  style={{ background: `${color}22`, color }}
                  title={isRTL ? 'סמן כבוצע' : 'Mark done'}
                >
                  <Check size={13} />
                </button>
              )}
              <button
                onClick={() => remove(ev.id)}
                disabled={pending}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )
      })}

      {/* Add event form */}
      {adding ? (
        <AddEventForm
          contacts={contacts}
          color={color}
          isRTL={isRTL}
          onSave={(ev) => { onEventAdded(ev); setAdding(false) }}
          onCancel={() => setAdding(false)}
          categories={CATEGORIES}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed mt-1"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף מפגש' : 'Add Event'}</span>
        </button>
      )}
    </div>
  )
}

function AddEventForm({
  contacts, color, isRTL, onSave, onCancel, categories,
}: {
  contacts: FriendContact[]
  color: string
  isRTL: boolean
  onSave: (ev: FriendEvent) => void
  onCancel: () => void
  categories: typeof CATEGORIES
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState('')
  const [category, setCategory] = useState<EventCategory>('hangout')
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [pending, startTransition] = useTransition()

  const filteredContacts = contactSearch.trim()
    ? contacts.filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
    : contacts

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const submit = () => {
    if (!title.trim() || !date) return
    startTransition(async () => {
      const ev = await createFriendEvent({
        title: title.trim(),
        eventDate: date,
        eventTime: time || null,
        category,
        contactIds: selectedContactIds,
        location: location.trim() || null,
        notes: notes.trim() || null,
        isRecurring: recurring,
        recurrence: recurring ? 'yearly' : null,
      })
      onSave(ev)
    })
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--card)', border: `1px solid ${color}33` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {isRTL ? 'מפגש חדש' : 'New Event'}
        </p>
        <button onClick={onCancel} className="p-1" style={{ color: 'var(--muted-foreground)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Title */}
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isRTL ? 'כותרת...' : 'Title...'}
        className="rounded-xl"
        style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
      />

      {/* Date + time */}
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl px-3 text-sm flex-1 h-9"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-xl px-3 text-sm w-28 h-9"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Category */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: category === cat.value ? color : 'var(--secondary)',
              color: category === cat.value ? 'white' : 'var(--muted-foreground)',
              border: `1px solid ${category === cat.value ? color : 'transparent'}`,
            }}
          >
            {cat.icon}
            {isRTL ? cat.labelHe : cat.labelEn}
          </button>
        ))}
      </div>

      {/* Contact picker */}
      <div>
        <button
          onClick={() => setShowContactPicker(!showContactPicker)}
          className="flex items-center gap-2 text-xs font-medium mb-2"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Users size={13} />
          {isRTL ? `משתתפים (${selectedContactIds.length})` : `Participants (${selectedContactIds.length})`}
        </button>
        {selectedContactIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedContactIds.map((cid) => {
              const c = contacts.find((x) => x.id === cid)
              if (!c) return null
              return (
                <span
                  key={cid}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${color}22`, color }}
                >
                  {c.name}
                  <button onClick={() => toggleContact(cid)}><X size={10} /></button>
                </span>
              )
            })}
          </div>
        )}
        {showContactPicker && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)', maxHeight: '180px', overflowY: 'auto' }}
          >
            <div className="p-2 sticky top-0" style={{ background: 'var(--secondary)' }}>
              <Input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder={isRTL ? 'חפש...' : 'Search...'}
                className="rounded-lg h-7 text-xs"
                style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
              />
            </div>
            {filteredContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleContact(c.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                style={{
                  background: selectedContactIds.includes(c.id) ? `${color}15` : 'var(--card)',
                  color: 'var(--foreground)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: `${color}22`, color }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-start">{c.name}</span>
                {selectedContactIds.includes(c.id) && <Check size={12} style={{ color }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <Input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder={isRTL ? 'מיקום (אופציונלי)' : 'Location (optional)'}
        className="rounded-xl"
        style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
      />

      {/* Notes */}
      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={isRTL ? 'הערות (אופציונלי)' : 'Notes (optional)'}
        className="rounded-xl"
        style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
      />

      {/* Recurring */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="w-4 h-4 rounded"
          style={{ accentColor: color }}
        />
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'חוזר כל שנה (יום הולדת וכו\')' : 'Repeats yearly (birthday, etc.)'}
        </span>
      </label>

      <Button
        onClick={submit}
        disabled={pending || !title.trim() || !date}
        className="rounded-xl w-full"
        style={{ background: color, color: 'white' }}
      >
        {isRTL ? 'שמור' : 'Save'}
      </Button>
    </div>
  )
}
