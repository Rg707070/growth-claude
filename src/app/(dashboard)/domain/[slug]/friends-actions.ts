'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FriendContact, FriendInteraction, FriendReminder, FriendEvent,
  InteractionKind, RelationshipType, EventCategory, EventStatus,
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

export async function updateContact(
  id: string,
  fields: Partial<{
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
  }>,
): Promise<FriendContact> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_contacts')
    .update(fields)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendContact
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

export async function createFriendEvent(input: {
  title: string
  eventDate: string
  eventTime?: string | null
  category: EventCategory
  contactIds?: string[]
  location?: string | null
  notes?: string | null
  isRecurring?: boolean
  recurrence?: 'yearly' | null
}): Promise<FriendEvent> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_events')
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      event_date: input.eventDate,
      event_time: input.eventTime ?? null,
      category: input.category,
      contact_ids: input.contactIds ?? [],
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      is_recurring: input.isRecurring ?? false,
      recurrence: input.recurrence ?? null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendEvent
}

export async function updateFriendEvent(
  id: string,
  fields: Partial<{
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
  }>,
): Promise<FriendEvent> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('friend_events')
    .update(fields)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FriendEvent
}

export async function deleteFriendEvent(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('friend_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}
