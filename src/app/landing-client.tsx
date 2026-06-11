'use client'

import Link from 'next/link'
import { useLang } from '@/lib/lang'
import { GrowthLogo } from '@/components/growth-logo'
import { LangToggle } from '@/components/lang-toggle'

export function LandingClient() {
  const { isRTL } = useLang()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-5 py-8 relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)' }}
      />

      <header className="relative z-10 w-full flex justify-end">
        <LangToggle />
      </header>

      <main className="relative z-10 flex flex-col items-center text-center gap-8 flex-1 justify-center">
        <GrowthLogo variant="icon" size={72} />

        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tight brand-gradient-text">GROWTH</h1>
          <p className="text-base max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL
              ? 'עקוב אחרי הצמיחה האישית שלך בכל תחומי החיים'
              : 'Track your personal growth across every life domain'}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Link
            href="/signup"
            className="block w-full h-14 rounded-2xl font-bold text-base text-white text-center leading-[3.5rem] transition-all hover:shadow-lg active:scale-[0.98]"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 8px 24px var(--c-hero-shadow)',
            }}
          >
            {isRTL ? 'התחל עכשיו' : 'Get started'}
          </Link>
          <Link
            href="/login"
            className="block w-full h-12 rounded-2xl font-semibold text-sm text-center leading-[3rem] transition-all"
            style={{
              color: 'var(--muted-foreground)',
              border: '1px solid var(--c-border)',
            }}
          >
            {isRTL ? 'כבר יש לי חשבון' : 'I already have an account'}
          </Link>
        </div>
      </main>

      <footer className="relative z-10 h-8" />
    </div>
  )
}
