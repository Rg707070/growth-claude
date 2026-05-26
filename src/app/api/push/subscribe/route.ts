import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PushKeys {
  p256dh: string
  auth: string
}
interface PushSubscriptionPayload {
  endpoint: string
  keys: PushKeys
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as PushSubscriptionPayload
  await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
    { onConflict: 'user_id,endpoint' }
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json() as { endpoint: string }
  await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
  return NextResponse.json({ ok: true })
}
