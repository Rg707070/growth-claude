'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { Moon, Sun } from 'lucide-react'
import { ReminderSettingsSection } from '@/components/reminder-settings-section'

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
    <div className="px-4 pt-12 pb-8 md:px-0 md:pt-8">
      <div className="space-y-6 md:max-w-md">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t('settings')}
        </h1>

        {/* Theme */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'מצב תצוגה' : 'Display mode'}
          </p>
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
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('language')}
          </p>
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

        {/* Reminders */}
        <ReminderSettingsSection />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'oklch(0.65 0.22 25 / 10%)', color: 'oklch(0.60 0.22 25)', border: '1px solid oklch(0.65 0.22 25 / 25%)' }}
        >
          {t('logout')}
        </button>
      </div>
    </div>
  )
}
