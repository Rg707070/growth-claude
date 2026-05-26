'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { Moon, Sun, Bell, BellOff, Download } from 'lucide-react'
import {
  isPushSupported,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-subscribe'

export default function SettingsPage() {
  const { t, lang, toggleLang, isRTL } = useLang()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const pushAvailable = isPushSupported()

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const togglePush = async () => {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        const sub = await unsubscribeFromPush()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
        }
        setPushEnabled(false)
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const sub = await subscribeToPush()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          })
          setPushEnabled(true)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPushLoading(false)
    }
  }

  const downloadCSV = async (type: 'habits' | 'journal') => {
    const res = await fetch(`/api/export?type=${type}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = type === 'habits' ? 'habit-log.csv' : 'journal.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 pt-12 pb-32 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
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

      {/* Push notifications */}
      {pushAvailable && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'התראות' : 'Notifications'}
          </p>
          <button
            onClick={togglePush}
            disabled={pushLoading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style={
              pushEnabled
                ? { background: 'rgba(34,211,238,0.12)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.30)' }
                : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }
            }
          >
            {pushEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            {pushLoading
              ? (isRTL ? 'טוען...' : 'Loading...')
              : pushEnabled
                ? (isRTL ? 'התראות פעילות' : 'Notifications on')
                : (isRTL ? 'הפעל התראות' : 'Enable notifications')}
          </button>
          <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL
              ? 'הפעל כדי לקבל תזכורות להרגלים גם כשהאפליקציה סגורה'
              : 'Enable to receive habit reminders even when the app is closed'}
          </p>
        </div>
      )}

      {/* Export */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'ייצוא נתונים' : 'Export data'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV('habits')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }}
          >
            <Download size={14} />
            {isRTL ? 'הרגלים' : 'Habits'}
          </button>
          <button
            onClick={() => downloadCSV('journal')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }}
          >
            <Download size={14} />
            {isRTL ? 'יומן' : 'Journal'}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full h-12 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'oklch(0.65 0.22 25 / 10%)', color: 'oklch(0.60 0.22 25)', border: '1px solid oklch(0.65 0.22 25 / 25%)' }}
      >
        {t('logout')}
      </button>
    </div>
  )
}
