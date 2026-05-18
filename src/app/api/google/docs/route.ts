import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token ?? null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, content } = await req.json()

    const { data: tokenRow } = await supabase
      .from('user_google_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single()

    if (!tokenRow?.refresh_token) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 })
    }

    const accessToken = await refreshAccessToken(tokenRow.refresh_token)
    if (!accessToken) return NextResponse.json({ error: 'token_failed' }, { status: 500 })

    // Create empty document with title
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const doc = await createRes.json()
    const docId: string = doc.documentId

    // Insert content at position 1 (after title)
    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ insertText: { location: { index: 1 }, text: content } }],
      }),
    })

    return NextResponse.json({ docUrl: `https://docs.google.com/document/d/${docId}/edit` })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// Check if user has Google connected
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ connected: false })

  const { data } = await supabase
    .from('user_google_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ connected: !!data })
}
