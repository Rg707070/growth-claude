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
      style={{ background: 'radial-gradient(ellipse at 60% 0%, var(--c-page-top) 0%, var(--c-page-bg) 60%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--primary)' }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{ background: 'var(--primary)' }} />

      <div className="absolute top-5 start-5 z-10"><LangToggle /></div>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
            style={{ background: 'linear-gradient(135deg, var(--c-hero-start), var(--c-hero-end))', boxShadow: '0 0 32px var(--c-primary-glow)' }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight" style={{ color: 'var(--foreground)', textShadow: 'none' }}>
            GROWTH
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{t('tagline')}</p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl p-6 space-y-4"
          style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)', backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px var(--c-shadow-lg)' }}>
          <h2 className="font-bold text-lg text-center mb-1" style={{ color: 'var(--foreground)' }}>{t('loginTitle')}</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>{t('email')}</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
                onFocus={(e) => (e.target.style.borderColor = 'oklch(0.55 0.20 145)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>{t('password')}</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
                onFocus={(e) => (e.target.style.borderColor = 'oklch(0.55 0.20 145)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-600 text-center dark:text-red-300" style={{ background: 'oklch(0.65 0.22 25 / 12%)', border: '1px solid oklch(0.65 0.22 25 / 25%)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--c-hero-start), var(--c-hero-end))', boxShadow: '0 4px 20px var(--c-primary-glow)' }}
            >
              {loading ? '...' : t('login')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-emerald-600 font-semibold hover:text-emerald-500 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300">
            {t('signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
