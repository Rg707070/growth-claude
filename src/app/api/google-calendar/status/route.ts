import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isConnected, getOAuthConfig } from '@/lib/google-calendar'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ connected: false, configured: false })

  const configured = !!getOAuthConfig()
  const connected = configured ? await isConnected(user.id) : false
  return NextResponse.json({ connected, configured })
}
