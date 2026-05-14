'use client'

import { useLang } from '@/lib/lang'
import { MESILLAT_QUOTES } from '@/lib/mesillat-quotes'

export function MesillatQuote() {
  const { isRTL } = useLang()
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const quote = MESILLAT_QUOTES[dayOfYear % MESILLAT_QUOTES.length]

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border border-yellow-500/20 shadow-[0_0_16px_rgba(251,211,77,0.08)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📖</span>
        <span className="text-yellow-300 text-xs font-semibold uppercase tracking-wide">
          {isRTL ? 'מסילת ישרים' : 'Mesillat Yesharim'}
        </span>
      </div>
      <p className="text-white/85 text-sm leading-relaxed text-right font-medium" dir="rtl">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  )
}
