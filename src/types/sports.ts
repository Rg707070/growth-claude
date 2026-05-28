export interface SportWorkoutLog {
  id: string
  user_id: string
  date: string
  notes: string
  created_at: string
}

export interface SportFoodRestriction {
  id: string
  user_id: string
  food_item: string
  reason: string | null
  created_at: string
}

export interface SportChallenge {
  id: string
  user_id: string
  title: string
  status: 'active' | 'done'
  created_at: string
}
