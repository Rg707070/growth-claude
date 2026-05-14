'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { t, lang, toggleLang } = useLang()
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
