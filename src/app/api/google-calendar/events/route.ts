import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchEvents } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ events: [] }, { status: 401 })

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ events: [] }, { status: 400 })

  try {
    const events = await fetchEvents(user.id, from, to)
    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ events: [] })
  }
}
