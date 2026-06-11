'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { LangToggle } from '@/components/lang-toggle'
import { GrowthLogo } from '@/components/growth-logo'

export default function ResetPasswordPage() {
  const { t } = useLang()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError(t('passwordsNoMatch'))
      return
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'))
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

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
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      <div
        aria-hidden
        className="absolute -top-32 -end-32 w-96 h-96 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0E9F6E55 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -start-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0B244766 0%, transparent 70%)' }}
      />

      <div className="absolute top-5 start-5 z-10"><LangToggle /></div>

      <div className="relative z-10 w-full max-w-sm space-y-7 animate-fade-up">
        <div className="flex flex-col items-center text-center gap-3">
          <GrowthLogo variant="icon" size={72} />
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight brand-gradient-text">GROWTH</h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('resetPasswordTitle')}
            </p>
          </div>
        </div>

        <div
          className="rounded-3xl p-6 space-y-4"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--c-border)',
            boxShadow: '0 1px 3px var(--c-shadow), 0 10px 30px var(--c-shadow)',
          }}
        >
          {!ready ? (
            <div className="text-center space-y-3 py-2">
              <div className="text-4xl">⏳</div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('resetPasswordLoading')}
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-base text-center mb-1" style={{ color: 'var(--foreground)' }}>
                {t('resetPasswordTitle')}
              </h2>

              <form onSubmit={handleUpdate} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>{t('newPassword')}</label>
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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium block" style={{ color: 'var(--muted-foreground)' }}>{t('confirmPassword')}</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                    className="rounded-xl px-4 py-3 text-sm text-center animate-fade-in"
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
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 active:scale-[0.98] hover:shadow-lg"
                  style={{
                    background: 'var(--brand-gradient)',
                    boxShadow: '0 6px 18px var(--c-hero-shadow)',
                  }}
                >
                  {loading ? '...' : t('updatePassword')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
