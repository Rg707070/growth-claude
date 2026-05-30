'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FriendContact, FriendInteraction, FriendReminder, InteractionKind,
} from '@/types/friends'

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

export async function logInteraction(
  contactId: string,
  kind: InteractionKind = 'talk',
): Promise<FriendInteraction> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_interactions')
    .insert({
      user_id: user.id,
      contact_id: contactId,
      date: new Date().toISOString().split('T')[0],
      kind,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendInteraction
}

export async function logInteractionOn(input: {
  contactId: string
  date: string
  kind: InteractionKind
  note?: string | null
}): Promise<FriendInteraction> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_interactions')
    .insert({
      user_id: user.id,
      contact_id: input.contactId,
      date: input.date,
      kind: input.kind,
      note: input.note?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendInteraction
}

export async function deleteInteraction(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('friend_interactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
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
    .eq('kind', 'talk')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (!data) return
  await supabase.from('friend_interactions').delete().eq('id', data.id)
  revalidatePath(PATH)
}

export async function createReminder(input: {
  contactId: string
  remindOn: string
  note?: string | null
}): Promise<FriendReminder> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_reminders')
    .insert({
      user_id: user.id,
      contact_id: input.contactId,
      remind_on: input.remindOn,
      note: input.note?.trim() || null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendReminder
}

export async function deleteReminder(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('friend_reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function completeReminder(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('friend_reminders')
    .update({ done: true })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}
