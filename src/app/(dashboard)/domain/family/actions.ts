'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FamilyTask,
  FamilyTaskCategory,
  FamilyTaskStatus,
  FamilyTaskUrgency,
  FamilyTaskFolder,
  FamilyHabit,
  FamilyHabitFrequency,
  FamilyHabitAccountability,
  RoutineBreaker,
  RoutineBreakerType,
  RoutineBreakerCostTier,
  RoutineBreakerStatus,
  MediaLink,
  FamilyEvent,
  FamilyEventCategory,
  FamilyEventStatus,
  FamilyEventRecurrence,
} from '@/types/family'

// ─── Helpers ────────────────────────────────────────────────

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

function familyPath() {
  return '/domain/family'
}

// ─── Family Tasks ────────────────────────────────────────────

export async function getFamilyTasks(): Promise<FamilyTask[]> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('family_tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as FamilyTask[]
}

export async function createFamilyTask(input: {
  title: string
  category?: FamilyTaskCategory
  urgency?: FamilyTaskUrgency
  due_date?: string | null
  folder_id?: string | null
  assigned_to?: string | null
  is_recurring?: boolean
}): Promise<FamilyTask> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('family_tasks')
    .insert({
      user_id: user.id,
      family_id: user.id,
      title: input.title,
      category: input.category ?? 'other',
      urgency: input.urgency ?? 'normal',
      due_date: input.due_date ?? null,
      folder_id: input.folder_id ?? null,
      assigned_to: input.assigned_to ?? null,
      is_recurring: input.is_recurring ?? false,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(familyPath())
  return data as FamilyTask
}

// ─── Family Task Folders ─────────────────────────────────────

export async function createTaskFolder(name: string, color: string): Promise<FamilyTaskFolder> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data: existing } = await supabase
    .from('family_task_folders')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const nextOrder = existing ? (existing.sort_order as number) + 1 : 0
  const { data, error } = await supabase
    .from('family_task_folders')
    .insert({ user_id: user.id, name: name.trim(), color, sort_order: nextOrder })
    .select()
    .single()
  if (error) throw error
  revalidatePath(familyPath())
  return data as FamilyTaskFolder
}

export async function renameTaskFolder(id: string, name: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_task_folders')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

export async function deleteTaskFolder(id: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_task_folders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

export async function updateFolderOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from('family_task_folders')
        .update({ sort_order })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )
  revalidatePath(familyPath())
}

export async function updateFamilyTask(
  taskId: string,
  updates: {
    title?: string
    urgency?: FamilyTaskUrgency
    due_date?: string | null
    folder_id?: string | null
  }
): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

export async function updateTaskOrder(updates: { id: string; sort_order: number }[]): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from('family_tasks')
        .update({ sort_order })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )
  revalidatePath(familyPath())
}

export async function updateFamilyTaskStatus(
  taskId: string,
  status: FamilyTaskStatus
): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

export async function deleteFamilyTask(taskId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

/**
 * Marks a recurring task done and advances the rotation to the next assignee.
 */
export async function completeAndRotateTask(
  taskId: string,
  maxMembers: number = 2
): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  await supabase
    .from('family_tasks')
    .update({ status: 'done' })
    .eq('id', taskId)
    .eq('user_id', user.id)
  await supabase.rpc('advance_task_rotation', {
    task_id: taskId,
    uid: user.id,
    max_members: maxMembers,
  })
  revalidatePath(familyPath())
}

// ─── Family Habits ───────────────────────────────────────────

export async function getFamilyHabits(): Promise<FamilyHabit[]> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('family_habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as FamilyHabit[]
}

export async function createFamilyHabit(input: {
  name: string
  frequency?: FamilyHabitFrequency
  accountability_type?: FamilyHabitAccountability
  context_anchor?: string | null
}): Promise<FamilyHabit> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('family_habits')
    .insert({
      user_id: user.id,
      family_id: user.id,
      name: input.name,
      frequency: input.frequency ?? 'daily',
      accountability_type: input.accountability_type ?? 'shared_streak',
      context_anchor: input.context_anchor ?? null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(familyPath())
  return data as FamilyHabit
}

/**
 * Marks a family habit complete. Delegates streak math to the DB RPC
 * so concurrent completions from multiple family members are safe.
 */
export async function completeFamilyHabit(habitId: string): Promise<number> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase.rpc('advance_family_habit_streak', {
    habit_id: habitId,
    uid: user.id,
  })
  if (error) throw error
  revalidatePath(familyPath())
  return data as number
}

export async function deleteFamilyHabit(habitId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_habits')
    .update({ is_active: false })
    .eq('id', habitId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

// ─── Routine Breakers ────────────────────────────────────────

export async function getRoutineBreakers(): Promise<RoutineBreaker[]> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('routine_breakers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as RoutineBreaker[]
}

export async function createRoutineBreaker(input: {
  title: string
  type?: RoutineBreakerType
  cost_tier?: RoutineBreakerCostTier
  target_date?: string | null
  media_links?: MediaLink[]
  notes?: string | null
}): Promise<RoutineBreaker> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('routine_breakers')
    .insert({
      user_id: user.id,
      family_id: user.id,
      title: input.title,
      type: input.type ?? 'day_trip',
      cost_tier: input.cost_tier ?? 'moderate',
      status: 'backlog',
      media_links: input.media_links ?? [],
      target_date: input.target_date ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(familyPath())
  return data as RoutineBreaker
}

export async function updateRoutineBreakerStatus(
  breakerId: string,
  status: RoutineBreakerStatus
): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('routine_breakers')
    .update({ status })
    .eq('id', breakerId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

export async function deleteRoutineBreaker(breakerId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('routine_breakers')
    .delete()
    .eq('id', breakerId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

// ─── Family Events ────────────────────────────────────────────

export async function getFamilyEvents(): Promise<FamilyEvent[]> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('family_events')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })
  if (error) throw error
  return data as FamilyEvent[]
}

export async function createFamilyEvent(input: {
  title: string
  category?: FamilyEventCategory
  event_date: string
  is_recurring?: boolean
  recurrence?: FamilyEventRecurrence | null
  notes?: string | null
}): Promise<FamilyEvent> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('family_events')
    .insert({
      user_id: user.id,
      family_id: user.id,
      title: input.title,
      category: input.category ?? 'other',
      event_date: input.event_date,
      is_recurring: input.is_recurring ?? false,
      recurrence: input.recurrence ?? null,
      notes: input.notes ?? null,
      status: 'upcoming',
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(familyPath())
  return data as FamilyEvent
}

export async function updateFamilyEventStatus(
  eventId: string,
  status: FamilyEventStatus
): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_events')
    .update({ status })
    .eq('id', eventId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

export async function deleteFamilyEvent(eventId: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('family_events')
    .delete()
    .eq('id', eventId)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(familyPath())
}

