'use client'

import { useLang } from '@/lib/lang'

interface ErrorViewProps {
  reset?: () => void
  title?: string
  body?: string
}

export function ErrorView({ reset, title, body }: ErrorViewProps) {
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
        <p className="text-5xl mb-4">🌊</p>
        <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {title ?? t('somethingWrong')}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          {body ?? t('errorBody')}
        </p>
        {reset && (
          <button
            onClick={reset}
            className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:shadow-lg"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
          >
            {t('tryAgain')}
          </button>
        )}
      </div>
    </div>
  )
}
