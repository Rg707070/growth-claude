'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FriendContact, FriendInteraction } from '@/types/friends'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

const PATH = '/domain/friends'

export async function createContact(name: string): Promise<FriendContact> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_contacts')
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendContact
}

export async function deleteContact(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('friend_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function logInteraction(contactId: string): Promise<FriendInteraction> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_interactions')
    .insert({
      user_id: user.id,
      contact_id: contactId,
      date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendInteraction
}

export async function deleteLastInteraction(contactId: string): Promise<void> {
  const { supabase, user } = await getUser()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('friend_interactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('contact_id', contactId)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (!data) return
  await supabase.from('friend_interactions').delete().eq('id', data.id)
  revalidatePath(PATH)
}
