import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  const torahUrl = new URL('/domain/torah', req.url)

  if (!code || !userId) {
    torahUrl.searchParams.set('google_error', '1')
    return NextResponse.redirect(torahUrl)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    torahUrl.searchParams.set('google_error', '1')
    return NextResponse.redirect(torahUrl)
  }

  const supabase = await createClient()
  await supabase.from('user_google_tokens').upsert(
    { user_id: userId, refresh_token: tokens.refresh_token, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  torahUrl.searchParams.set('google_connected', '1')
  return NextResponse.redirect(torahUrl)
}
