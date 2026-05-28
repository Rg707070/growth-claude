export interface MusicPracticeLog {
  id: string
  user_id: string
  date: string
  notes: string
  created_at: string
}

export interface MusicSong {
  id: string
  user_id: string
  title: string
  artist: string | null
  status: 'learning' | 'know'
  created_at: string
}
