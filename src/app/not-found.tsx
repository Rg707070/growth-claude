'use client'

import Link from 'next/link'
import { useLang } from '@/lib/lang'

export default function NotFound() {
  const { t } = useLang()
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 animate-fade-up"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--c-border)',
          boxShadow: '0 10px 30px var(--c-shadow)',
        }}
      >
        <p className="text-6xl mb-4 font-black brand-gradient-text">404</p>
        <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {t('notFoundTitle')}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          {t('notFoundBody')}
        </p>
        <Link
          href="/dashboard"
          className="inline-block w-full h-12 leading-[3rem] rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:shadow-lg"
          style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  )
}
