'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export default function SettingsPage() {
  const { t, lang, toggleLang, isRTL } = useLang()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="px-4 pt-12 space-y-6">
      <h1 className="text-xl font-bold text-white">{t('settings')}</h1>

      {/* Theme */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
        <p className="text-white/60 text-sm">{isRTL ? 'מצב תצוגה' : 'Display mode'}</p>
        <div className="flex gap-2">
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              theme === 'dark'
                ? 'bg-slate-800 text-white border border-cyan-500/40'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            <Moon size={15} />
            {isRTL ? 'כהה' : 'Dark'}
          </button>
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              theme === 'light'
                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}
          >
            <Sun size={15} />
            {isRTL ? 'בהיר' : 'Light'}
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
        <p className="text-white/60 text-sm">{t('language')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => lang !== 'he' && toggleLang()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              lang === 'he'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            עברית
          </button>
          <button
            onClick={() => lang !== 'en' && toggleLang()}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              lang === 'en'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
      >
        {t('logout')}
      </Button>
    </div>
  )
}
