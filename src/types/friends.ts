export interface FriendContact {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface FriendInteraction {
  id: string
  user_id: string
  contact_id: string
  date: string
  created_at: string
}
