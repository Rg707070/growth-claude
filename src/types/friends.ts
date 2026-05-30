export interface FriendContact {
  id: string
  user_id: string
  name: string
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
