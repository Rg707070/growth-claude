'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SecularBook, SecularProject } from '@/types/secular'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

const PATH = '/domain/secular'

// ── Books ──────────────────────────────────────────────────────

export async function createBook(input: {
  title: string
  author?: string
}): Promise<SecularBook> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('secular_books')
    .insert({ user_id: user.id, title: input.title, author: input.author ?? null })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as SecularBook
}

export async function updateBookStatus(
  id: string,
  status: SecularBook['status']
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('secular_books')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteBook(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('secular_books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

// ── Projects ───────────────────────────────────────────────────

export async function createProject(input: {
  title: string
  description?: string
}): Promise<SecularProject> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('secular_projects')
    .insert({ user_id: user.id, title: input.title, description: input.description ?? null })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as SecularProject
}

export async function updateProjectStatus(
  id: string,
  status: 'active' | 'done'
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('secular_projects')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteProject(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('secular_projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}
