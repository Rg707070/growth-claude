import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const redirectBack = (status: string) =>
    NextResponse.redirect(new URL(`/schedule?gcal=${status}`, req.url))

  if (!user || !code || state !== user.id) return redirectBack('error')

  try {
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens.refresh_token) return redirectBack('error')

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await supabase.from('google_calendar_tokens').upsert({
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      calendar_id: 'primary',
      updated_at: new Date().toISOString(),
    })
    return redirectBack('connected')
  } catch {
    return redirectBack('error')
  }
}
