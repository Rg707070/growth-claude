'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'

export default function SignupPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: 'var(--background)' }}
    >
      <div className="absolute top-5 end-5 z-10"><LangToggle /></div>

      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black tracking-tight brand-gradient-text">GROWTH</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'יצירת חשבון חדש' : 'Create your account'}
          </p>
        </div>

        <div
          className="rounded-3xl p-6 space-y-4"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--c-border)',
          }}
        >
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>
                {t('fullName')}
              </label>
              <input
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isRTL ? 'שמך' : 'Your name'}
                className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--ring)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>
                {t('email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--ring)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>
                {t('password')}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--ring)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-center"
                style={{
                  background: 'oklch(0.65 0.22 25 / 12%)',
                  border: '1px solid oklch(0.65 0.22 25 / 25%)',
                  color: 'oklch(0.50 0.22 25)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 active:scale-[0.98]"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {loading ? '...' : t('signup')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-semibold brand-gradient-text">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
