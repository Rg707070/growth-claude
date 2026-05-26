import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReadingClient } from './reading-client'

export default async function ReadingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: books } = await supabase
    .from('reading_books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return <ReadingClient userId={user.id} initialBooks={books ?? []} />
}
