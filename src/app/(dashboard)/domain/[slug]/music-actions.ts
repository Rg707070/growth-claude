'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MusicPracticeLog, MusicSong } from '@/types/music'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

const PATH = '/domain/music'

// ── Practice Logs ──────────────────────────────────────────────

export async function upsertPracticeLog(date: string, notes: string): Promise<MusicPracticeLog> {
  const { supabase, user } = await getUser()
  const { data: existing } = await supabase
    .from('music_practice_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('music_practice_logs')
      .update({ notes })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    revalidatePath(PATH)
    return data as MusicPracticeLog
  }

  const { data, error } = await supabase
    .from('music_practice_logs')
    .insert({ user_id: user.id, date, notes })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as MusicPracticeLog
}

export async function deletePracticeLog(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('music_practice_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

// ── Songs ──────────────────────────────────────────────────────

export async function createSong(input: {
  title: string
  artist?: string
}): Promise<MusicSong> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('music_songs')
    .insert({ user_id: user.id, title: input.title, artist: input.artist ?? null })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as MusicSong
}

export async function updateSongStatus(
  id: string,
  status: 'learning' | 'know'
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('music_songs')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteSong(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('music_songs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}
