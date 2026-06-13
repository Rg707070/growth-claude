'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { GrowthLogo } from '@/components/growth-logo'

export default function LoginPage() {
  const { t, isRTL } = useLang()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(isRTL ? 'אימייל או סיסמה שגויים' : 'Incorrect email or password')
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
      <div className="absolute top-5 start-5 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowRight size={15} className={isRTL ? '' : 'rotate-180'} />
          {isRTL ? 'חזרה' : 'Back'}
        </Link>
      </div>
      <div className="absolute top-5 end-5 z-10"><LangToggle /></div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <GrowthLogo variant="icon" size={52} />
          <h1 className="text-3xl font-black brand-hero-text">GROWTH</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'כניסה לחשבון' : 'Sign in to your account'}
          </p>
        </div>

        <div
          className="rounded-3xl p-6 space-y-5"
          style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
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
              <label className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl px-4 text-sm focus:outline-none transition-all"
                  style={{
                    background: 'var(--c-input)',
                    border: '1px solid var(--c-input-border)',
                    color: 'var(--foreground)',
                    paddingInlineEnd: '2.75rem',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--ring)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--c-input-border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 end-3 flex items-center transition-opacity hover:opacity-70"
                  style={{ color: 'var(--muted-foreground)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-center"
                style={{
                  background: 'oklch(0.65 0.22 25 / 12%)',
                  border: '1px solid oklch(0.65 0.22 25 / 25%)',
                  color: 'oklch(0.55 0.22 25)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-70 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t('login')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-semibold brand-gradient-text">
            {t('signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
