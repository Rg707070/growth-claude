'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FinanceTransaction, TransactionType,
  FinanceWishlistItem, WishlistStatus,
} from '@/types/finance'

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

const PATH = '/domain/finance'

// ── Transactions ───────────────────────────────────────────────

export async function createTransaction(input: {
  amount: number
  type: TransactionType
  category: string
  note?: string
  date?: string
}): Promise<FinanceTransaction> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: user.id,
      amount: input.amount,
      type: input.type,
      category: input.category,
      note: input.note ?? null,
      date: input.date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FinanceTransaction
}

export async function deleteTransaction(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

// ── Wishlist ───────────────────────────────────────────────────

export async function createWishlistItem(input: {
  title: string
  estimated_price?: number | null
}): Promise<FinanceWishlistItem> {
  const { supabase, user } = await getUser()
  const { data, error } = await supabase
    .from('finance_wishlist')
    .insert({
      user_id: user.id,
      title: input.title,
      estimated_price: input.estimated_price ?? null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data as FinanceWishlistItem
}

export async function updateWishlistStatus(
  id: string,
  status: WishlistStatus
): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('finance_wishlist')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const { supabase, user } = await getUser()
  const { error } = await supabase
    .from('finance_wishlist')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
  revalidatePath(PATH)
}
