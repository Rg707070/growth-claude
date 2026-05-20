import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SlideShowClient } from './slideshow-client'

interface PageProps {
  params: Promise<{ token: string }>
}

interface PhotoEntry {
  id: string
  storage_path: string
  caption: string
  taken_at: string
}

export default async function ShareAlbumPage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  const { data: share } = await supabase
    .from('album_shares')
    .select('user_id, week_start')
    .eq('share_token', token)
    .single()

  if (!share) notFound()

  const { data: photos } = await supabase
    .from('photo_entries')
    .select('id, storage_path, caption, taken_at')
    .eq('user_id', share.user_id)
    .eq('week_start', share.week_start)
    .order('taken_at', { ascending: true })

  if (!photos || photos.length === 0) notFound()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const photoUrls = (photos as PhotoEntry[]).map((p) => ({
    id: p.id,
    url: `${supabaseUrl}/storage/v1/object/public/journal-photos/${p.storage_path}`,
    caption: p.caption,
    taken_at: p.taken_at,
  }))

  const weekStart = share.week_start as string
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const weekLabel = `${start.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return <SlideShowClient photos={photoUrls} weekLabel={weekLabel} />
}
