'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const { t } = useLang()
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      {/* Green top banner */}
      <div className="relative flex flex-col items-center justify-end pb-10 pt-16 px-6 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, var(--c-hero-start) 0%, var(--c-hero-end) 100%)', minHeight: '200px' }}>
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-20" style={{ background: 'white' }} />
        <div className="absolute bottom-[-30px] left-[-20px] w-32 h-32 rounded-full opacity-10" style={{ background: 'white' }} />

        <div className="absolute top-5 start-5 z-10"><LangToggle /></div>

        <div className="relative z-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)' }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">GROWTH</h1>
          <p className="text-sm text-white/70">{t('tagline')}</p>
        </div>
      </div>

      {/* White content area */}
      <div className="flex-1 flex flex-col items-center px-6 -mt-5 relative z-10">
        <div className="w-full max-w-sm space-y-5">
          {/* Form card */}
          <div className="rounded-3xl p-6 space-y-4"
            style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)', boxShadow: '0 4px 24px var(--c-shadow-lg)' }}>
            <h2 className="font-bold text-lg text-center mb-1" style={{ color: 'var(--foreground)' }}>{t('signup')}</h2>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>{t('fullName')}</label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="רותם"
                  className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                  style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'oklch(0.55 0.20 145)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
                />
              </div>

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
                  autoComplete="new-password"
                  required
                  minLength={6}
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
                {loading ? '...' : t('signup')}
              </button>
            </form>
          </div>

          <p className="text-center text-sm pb-8" style={{ color: 'var(--muted-foreground)' }}>
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-500 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
