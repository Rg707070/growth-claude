'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'

export default function LoginPage() {
  const { t } = useLang()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, oklch(0.18 0.08 230) 0%, oklch(0.08 0.035 240) 60%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.75 0.17 205)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: 'oklch(0.70 0.15 250)' }} />

      <div className="absolute top-5 start-5 z-10"><LangToggle /></div>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, oklch(0.75 0.17 205), oklch(0.65 0.18 250))', boxShadow: '0 0 32px oklch(0.75 0.17 205 / 40%)' }}>
            <span className="text-3xl">🌊</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white" style={{ textShadow: '0 0 40px oklch(0.75 0.17 205 / 50%)' }}>
            GROWTH
          </h1>
          <p className="text-white/50 text-sm">{t('tagline')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl p-6 space-y-4"
          style={{ background: 'oklch(0.12 0.04 238 / 80%)', border: '1px solid oklch(0.75 0.12 210 / 15%)', backdropFilter: 'blur(16px)' }}>
          <h2 className="text-white font-bold text-lg text-center mb-1">{t('loginTitle')}</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-medium block">{t('email')}</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-xl px-4 text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                style={{ background: 'oklch(0.15 0.04 235)', border: '1px solid oklch(0.75 0.12 210 / 18%)' }}
                onFocus={(e) => e.target.style.borderColor = 'oklch(0.75 0.17 205 / 50%)'}
                onBlur={(e) => e.target.style.borderColor = 'oklch(0.75 0.12 210 / 18%)'}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-white/60 text-xs font-medium block">{t('password')}</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-xl px-4 text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                style={{ background: 'oklch(0.15 0.04 235)', border: '1px solid oklch(0.75 0.12 210 / 18%)' }}
                onFocus={(e) => e.target.style.borderColor = 'oklch(0.75 0.17 205 / 50%)'}
                onBlur={(e) => e.target.style.borderColor = 'oklch(0.75 0.12 210 / 18%)'}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-300 text-center" style={{ background: 'oklch(0.65 0.22 25 / 15%)', border: '1px solid oklch(0.65 0.22 25 / 25%)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, oklch(0.75 0.17 205), oklch(0.60 0.18 240))', color: 'oklch(0.08 0.035 240)', boxShadow: '0 4px 20px oklch(0.75 0.17 205 / 35%)' }}
            >
              {loading ? '...' : t('login')}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
            {t('signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
