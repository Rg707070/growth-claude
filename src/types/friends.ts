export type RelationshipType =
  | 'close_friend'
  | 'friend'
  | 'acquaintance'
  | 'family'
  | 'mentor'
  | 'colleague'

export interface FriendContact {
  id: string
  user_id: string
  name: string
  nickname: string | null
  phone: string | null
  relationship_type: RelationshipType
  tags: string[]
  notes: string | null
  how_we_met: string | null
  location: string | null
  pinned: boolean
  archived: boolean
  color_override: string | null
  created_at: string
}

export type InteractionKind = 'talk' | 'message'

export interface FriendInteraction {
  id: string
  user_id: string
  contact_id: string
  date: string
  kind: InteractionKind
  note: string | null
  created_at: string
}

export interface FriendReminder {
  id: string
  user_id: string
  contact_id: string
  remind_on: string
  note: string | null
  done: boolean
  created_at: string
}

export type EventCategory =
  | 'hangout'
  | 'birthday'
  | 'trip'
  | 'meal'
  | 'call'
  | 'celebration'
  | 'other'

export type EventStatus = 'upcoming' | 'done' | 'cancelled'

export interface FriendEvent {
  id: string
  user_id: string
  title: string
  event_date: string
  event_time: string | null
  category: EventCategory
  contact_ids: string[]
  location: string | null
  notes: string | null
  status: EventStatus
  is_recurring: boolean
  recurrence: 'yearly' | null
  created_at: string
}
