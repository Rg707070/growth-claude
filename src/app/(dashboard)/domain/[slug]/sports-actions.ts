'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SportWorkoutLog, SportFoodRestriction, SportChallenge } from '@/types/sports'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

const PATH = '/domain/sports'

// ── Workout Logs ───────────────────────────────────────────────

export async function upsertWorkoutLog(date: string, notes: string): Promise<SportWorkoutLog> {
  const { supabase, user } = await getUser()
  const { data: existing } = await supabase
    .from('sport_workout_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('sport_workout_logs')
      .update({ notes })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    revalidatePath(PATH)
    return data as SportWorkoutLog
  }

  const { data, error } = await supabase
    .from('sport_workout_logs')
    .insert({ user_id: user.id, date, notes })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as SportWorkoutLog
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('sport_workout_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

// ── Food Restrictions ──────────────────────────────────────────

export async function createFoodRestriction(input: {
  food_item: string
  reason?: string
}): Promise<SportFoodRestriction> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('sport_food_restrictions')
    .insert({ user_id: user.id, food_item: input.food_item, reason: input.reason ?? null })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as SportFoodRestriction
}

export async function deleteFoodRestriction(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('sport_food_restrictions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

// ── Challenges ─────────────────────────────────────────────────

export async function createChallenge(title: string): Promise<SportChallenge> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('sport_challenges')
    .insert({ user_id: user.id, title })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as SportChallenge
}

export async function updateChallengeStatus(
  id: string,
  status: 'active' | 'done'
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('sport_challenges')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteChallenge(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('sport_challenges')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}
