import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildConsentUrl } from '@/lib/google-calendar'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = buildConsentUrl(user.id)
  if (!url) return NextResponse.json({ error: 'not_configured' }, { status: 500 })

  return NextResponse.redirect(url)
}
