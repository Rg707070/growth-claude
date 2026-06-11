import { createClient } from '@/lib/supabase/server'
import { JournalClient } from './journal-client'

export interface DocMeta {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface DomainEntry {
  id: string
  domain_slug: string
  date: string
  text: string
}

export interface PhotoEntry {
  id: string
  storage_path: string
  caption: string
  week_start: string
  taken_at: string
}

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

export default async function JournalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [docsRes, journalRes, photosRes, listsRes, notesRes] = await Promise.all([
    supabase
      .from('journal_documents')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('journal_entries')
      .select('id, domain_slug, date, text')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100),
    supabase
      .from('photo_entries')
      .select('id, storage_path, caption, week_start, taken_at')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false }),
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
    <JournalClient
      userId={user.id}
      documents={(docsRes.data ?? []) as DocMeta[]}
      domainEntries={(journalRes.data ?? []) as DomainEntry[]}
      photos={(photosRes.data ?? []) as PhotoEntry[]}
      initialLists={(listsRes.data ?? []) as NoteList[]}
      initialNotes={(notesRes.data ?? []) as QuickNote[]}
    />
  )
}
