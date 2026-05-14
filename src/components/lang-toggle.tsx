'use client'

import { useLang } from '@/lib/lang'

export function LangToggle() {
  const { lang, toggleLang } = useLang()
  return (
    <button
      onClick={toggleLang}
      className="text-xs font-semibold text-white/50 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10"
    >
      {lang === 'he' ? 'EN' : 'עב'}
    </button>
  )
}
