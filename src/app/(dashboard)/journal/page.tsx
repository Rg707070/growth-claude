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

export default async function JournalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [docsRes, journalRes, photosRes] = await Promise.all([
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
  ])

  return (
    <JournalClient
      userId={user.id}
      documents={(docsRes.data ?? []) as DocMeta[]}
      domainEntries={(journalRes.data ?? []) as DomainEntry[]}
      photos={(photosRes.data ?? []) as PhotoEntry[]}
    />
  )
}
