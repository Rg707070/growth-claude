export interface SecularBook {
  id: string
  user_id: string
  title: string
  author: string | null
  status: 'want' | 'reading' | 'done'
  created_at: string
}

export interface SecularProject {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'active' | 'done'
  created_at: string
}
