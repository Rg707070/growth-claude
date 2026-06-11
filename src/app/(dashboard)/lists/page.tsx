import { createClient } from '@/lib/supabase/server'
import { ListsClient } from './lists-client'

export interface QuickNote {
  id: string
  content: string
  is_done: boolean
  created_at: string
}

export default async function ListsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('quick_notes')
    .select('id, content, is_done, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ListsClient initialNotes={(data ?? []) as QuickNote[]} />
}
