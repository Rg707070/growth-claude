import { createClient } from '@/lib/supabase/server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

export interface GoogleCalendarEvent {
  id: string
  title: string
  start: string | null
  end: string | null
  allDay: boolean
  color: string | null
}

interface TokenRow {
  access_token: string
  refresh_token: string
  expires_at: string
  calendar_id: string
}

export function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) return null
  return { clientId, clientSecret, redirectUri }
}

export function buildConsentUrl(state: string): string | null {
  const cfg = getOAuthConfig()
  if (!cfg) return null
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: CALENDAR_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const cfg = getOAuthConfig()
  if (!cfg) throw new Error('Google OAuth not configured')
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }>
}

async function refreshAccessToken(refreshToken: string) {
  const cfg = getOAuthConfig()
  if (!cfg) throw new Error('Google OAuth not configured')
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

async function getValidAccessToken(userId: string): Promise<{ token: string; calendarId: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, expires_at, calendar_id')
    .eq('user_id', userId)
    .maybeSingle()

  const row = data as TokenRow | null
  if (!row) return null

  const expiresAt = new Date(row.expires_at).getTime()
  if (expiresAt - Date.now() > 60_000) {
    return { token: row.access_token, calendarId: row.calendar_id }
  }

  const refreshed = await refreshAccessToken(row.refresh_token)
  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  await supabase
    .from('google_calendar_tokens')
    .update({ access_token: refreshed.access_token, expires_at: newExpiry, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  return { token: refreshed.access_token, calendarId: row.calendar_id }
}

export async function isConnected(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('google_calendar_tokens')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

interface GoogleApiEvent {
  id: string
  summary?: string
  colorId?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

const COLOR_MAP: Record<string, string> = {
  '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
  '5': '#f6c026', '6': '#f5511d', '7': '#039be5', '8': '#616161',
  '9': '#3f51b5', '10': '#0b8043', '11': '#d60000',
}

export async function fetchEvents(userId: string, timeMin: string, timeMax: string): Promise<GoogleCalendarEvent[]> {
  const auth = await getValidAccessToken(userId)
  if (!auth) return []

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(auth.calendarId)}/events?${params.toString()}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } })
  if (!res.ok) return []

  const json = (await res.json()) as { items?: GoogleApiEvent[] }
  return (json.items ?? []).map((ev) => ({
    id: ev.id,
    title: ev.summary ?? '(ללא כותרת)',
    start: ev.start?.dateTime ?? ev.start?.date ?? null,
    end: ev.end?.dateTime ?? ev.end?.date ?? null,
    allDay: !ev.start?.dateTime,
    color: ev.colorId ? (COLOR_MAP[ev.colorId] ?? null) : null,
  }))
}
