'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { Moon, Sun, LogOut, Palette, Languages, UserCircle } from 'lucide-react'

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
    <div className="px-4 pt-12 pb-8 md:px-0 md:pt-6">
      {/* Mobile-only heading; desktop has topbar */}
      <h1 className="text-xl font-bold mb-6 md:hidden" style={{ color: 'var(--foreground)' }}>
        {t('settings')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Appearance — Theme */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
            >
              <Palette size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'מראה' : 'Appearance'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'מצב תצוגה' : 'Display mode'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={
                theme === 'dark'
                  ? { background: 'var(--c-primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)' }
                  : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }
              }
            >
              <Moon size={15} />
              {isRTL ? 'כהה' : 'Dark'}
            </button>
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={
                theme === 'light'
                  ? { background: 'var(--primary)', color: 'var(--primary-foreground)', border: '1px solid var(--primary)' }
                  : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }
              }
            >
              <Sun size={15} />
              {isRTL ? 'בהיר' : 'Light'}
            </button>
          </div>
        </div>

        {/* Language */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
            >
              <Languages size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('language')}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'עברית או אנגלית' : 'Hebrew or English'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => lang !== 'he' && toggleLang()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={
                lang === 'he'
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }
              }
            >
              עברית
            </button>
            <button
              onClick={() => lang !== 'en' && toggleLang()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={
                lang === 'en'
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }
              }
            >
              English
            </button>
          </div>
        </div>

        {/* Account */}
        <div
          className="rounded-2xl p-5 space-y-4 md:col-span-2"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
            >
              <UserCircle size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'חשבון' : 'Account'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'התנתקות מהמכשיר' : 'Sign out of this device'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full md:w-auto md:min-w-[200px] h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 md:ms-auto md:flex"
            style={{
              background: 'oklch(0.65 0.22 25 / 10%)',
              color: 'oklch(0.60 0.22 25)',
              border: '1px solid oklch(0.65 0.22 25 / 25%)',
            }}
          >
            <LogOut size={15} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
