'use client'

import Link from 'next/link'
import { useLang } from '@/lib/lang'
import { DOMAINS } from '@/lib/domains'
import { GrowthLogo } from '@/components/growth-logo'
import { LangToggle } from '@/components/lang-toggle'

export function LandingClient() {
  const { isRTL } = useLang()

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'var(--background)' }}
    >
      {/* Background blobs */}
      <div
        aria-hidden
        className="absolute -top-40 -end-40 w-[480px] h-[480px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #0EA5E955 0%, transparent 70%)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -start-40 w-[480px] h-[480px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7C3AED44 0%, transparent 70%)' }}
      />

      {/* Topbar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5">
        <LangToggle />
        <Link
          href="/login"
          className="text-sm font-semibold transition-colors"
          style={{ color: 'var(--primary)' }}
        >
          {isRTL ? 'כניסה' : 'Log in'}
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-5 pt-12 pb-8 gap-6 flex-1">
        <GrowthLogo variant="icon" size={80} />

        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight brand-gradient-text">GROWTH</h1>
          <p className="text-base" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'עקוב אחרי הצמיחה האישית שלך בכל תחומי החיים' : 'Track your personal growth across every life domain'}
          </p>
        </div>

        {/* Domain chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {DOMAINS.map((d) => (
            <span
              key={d.slug}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: `${d.color}18`,
                border: `1px solid ${d.color}33`,
                color: d.color,
              }}
            >
              {d.icon} {isRTL ? d.nameHe : d.nameEn}
            </span>
          ))}
        </div>

        {/* Features */}
        <div className="w-full max-w-sm space-y-3 text-start">
          {[
            { icon: '📊', he: 'עקוב אחרי הרגלים יומיים', en: 'Track daily habits' },
            { icon: '🗓️', he: 'לוח שנה עם היסטוריית התקדמות', en: 'Calendar with progress history' },
            { icon: '🎯', he: 'הגדר דומיינים מותאמים אישית', en: 'Create custom life domains' },
            { icon: '📝', he: 'יומן עשיר עם תמונות', en: 'Rich journal with photos' },
          ].map((f) => (
            <div
              key={f.en}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {isRTL ? f.he : f.en}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm space-y-3 pt-2">
          <Link
            href="/signup"
            className="block w-full h-14 rounded-2xl font-bold text-base text-white text-center leading-[3.5rem] transition-all hover:shadow-lg active:scale-[0.98]"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 8px 24px var(--c-hero-shadow)',
            }}
          >
            {isRTL ? 'התחל עכשיו — בחינם' : 'Get started — free'}
          </Link>
          <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'אין צורך בכרטיס אשראי' : 'No credit card required'}
          </p>
        </div>
      </main>
    </div>
  )
}
