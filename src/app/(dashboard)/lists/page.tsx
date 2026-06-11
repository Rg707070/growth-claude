import { createClient } from '@/lib/supabase/server'
import { ListsClient } from './lists-client'

export interface NoteList {
  id: string
  name: string
  created_at: string
}

export interface QuickNote {
  id: string
  content: string
  is_done: boolean
  created_at: string
  list_id: string | null
}

export default async function ListsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [listsRes, notesRes] = await Promise.all([
    supabase
      .from('note_lists')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('quick_notes')
      .select('id, content, is_done, created_at, list_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ListsClient
      initialLists={(listsRes.data ?? []) as NoteList[]}
      initialNotes={(notesRes.data ?? []) as QuickNote[]}
    />
  )
}
