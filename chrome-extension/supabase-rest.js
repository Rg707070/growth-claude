// ── Minimal Supabase REST/Auth helpers (no SDK bundle) ──────────────────────
window.GrowthSupabase = (() => {
  const cfg = window.GROWTH_CONFIG

  function headers(accessToken) {
    return {
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || cfg.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    }
  }

  async function signIn(email, password) {
    const res = await fetch(`${cfg.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: cfg.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('signin_failed')
    return res.json()
  }

  async function refresh(refreshToken) {
    const res = await fetch(`${cfg.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: cfg.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) throw new Error('refresh_failed')
    return res.json()
  }

  async function getSession() {
    const { growthSession } = await chrome.storage.local.get('growthSession')
    if (!growthSession) return null
    if (growthSession.expires_at && growthSession.expires_at * 1000 < Date.now() + 60_000) {
      try {
        const fresh = await refresh(growthSession.refresh_token)
        await chrome.storage.local.set({ growthSession: fresh })
        return fresh
      } catch {
        await chrome.storage.local.remove('growthSession')
        return null
      }
    }
    return growthSession
  }

  async function query(session, path) {
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
      headers: headers(session.access_token),
    })
    if (!res.ok) return []
    return res.json()
  }

  return { signIn, getSession, query, cfg }
})()
