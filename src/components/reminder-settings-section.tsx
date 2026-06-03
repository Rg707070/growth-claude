'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useLang } from '@/lib/lang'
import {
  getGlobalReminders,
  saveGlobalReminders,
  syncGlobalRemindersToSw,
  type GlobalReminders,
} from '@/lib/sw-register'
import { requestNotificationPermission } from '@/hooks/use-notifications'

type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

function getPermissionState(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as PermissionState
}

interface ReminderRowProps {
  label: string
  value: string | null
  onChange: (val: string | null) => void
  accentColor?: string
}

function ReminderRow({ label, value, onChange, accentColor = 'var(--primary)' }: ReminderRowProps) {
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')

  const commit = () => {
    onChange(draft || null)
    setEditing(false)
  }

  const clear = () => {
    setDraft('')
    onChange(null)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm" style={{ color: 'var(--foreground)' }}>
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="time"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="rounded-lg px-2 py-1 text-sm w-28"
            style={{
              background: 'var(--c-input)',
              border: `1px solid ${accentColor}44`,
              color: 'var(--foreground)',
            }}
          />
          <button
            onClick={commit}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: accentColor, color: '#fff' }}
          >
            {t('save')}
          </button>
          {value && (
            <button
              onClick={clear}
              className="text-xs px-2 py-1.5 rounded-lg"
              style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }}
            >
              {t('noReminder')}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(value ?? '')
            setEditing(true)
          }}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all"
          style={
            value
              ? { background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}40` }
              : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }
          }
        >
          {value ? <Bell size={13} /> : <BellOff size={13} />}
          <span>{value ? value.slice(0, 5) : t('noReminder')}</span>
        </button>
      )}
    </div>
  )
}

export function ReminderSettingsSection() {
  const { t, isRTL } = useLang()
  const [permission, setPermission] = useState<PermissionState>('default')
  const [reminders, setReminders] = useState<GlobalReminders>({
    nightCheckin: null,
    journal: null,
    reading: null,
  })

  useEffect(() => {
    setPermission(getPermissionState())
    setReminders(getGlobalReminders())
  }, [])

  const requestPermission = async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
  }

  const update = (key: keyof GlobalReminders) => (val: string | null) => {
    const next = { ...reminders, [key]: val }
    setReminders(next)
    saveGlobalReminders(next)
    void syncGlobalRemindersToSw(next)
  }

  const permissionColor =
    permission === 'granted'
      ? 'oklch(0.65 0.17 150)'
      : permission === 'denied'
      ? 'oklch(0.65 0.22 25)'
      : 'oklch(0.65 0.15 60)'

  const permissionLabel =
    permission === 'granted'
      ? t('permissionGranted')
      : permission === 'denied'
      ? t('permissionDenied')
      : t('permissionPending')

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
        🔔 {t('remindersSection')}
      </p>

      {/* Permission row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('notificationPermission')}
        </span>
        {permission === 'granted' ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${permissionColor}18`, color: permissionColor }}>
            {permissionLabel}
          </span>
        ) : (
          <button
            onClick={requestPermission}
            disabled={permission === 'denied' || permission === 'unsupported'}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
            style={
              permission === 'denied'
                ? { background: `${permissionColor}18`, color: permissionColor, border: `1px solid ${permissionColor}40` }
                : { background: 'var(--primary)', color: 'white' }
            }
          >
            {permission === 'denied' ? permissionLabel : t('enableNotifications')}
          </button>
        )}
      </div>

      {permission === 'denied' && (
        <p className="text-xs rounded-lg p-2" style={{ background: 'oklch(0.65 0.22 25 / 10%)', color: 'oklch(0.65 0.22 25)' }}>
          {isRTL
            ? 'כדי לאפשר התראות, יש לשנות את ההגדרות בדפדפן ← אתר ← הרשאות.'
            : 'To enable notifications, update site permissions in your browser settings.'}
        </p>
      )}

      {/* Global reminder rows */}
      {permission !== 'unsupported' && (
        <div
          className="divide-y"
          style={{ borderTop: '1px solid var(--c-border)', '--tw-divide-color': 'var(--c-border)' } as React.CSSProperties}
        >
          <ReminderRow label={t('nightCheckinReminder')} value={reminders.nightCheckin} onChange={update('nightCheckin')} />
          <ReminderRow label={t('journalReminder')} value={reminders.journal} onChange={update('journal')} />
          <ReminderRow label={t('readingReminder')} value={reminders.reading} onChange={update('reading')} />
        </div>
      )}

      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? 'לתזכורות לכל הרגל — לחץ על אייקון הפעמון בשורת ההרגל.'
          : 'To set a reminder for a specific habit — tap the bell icon on the habit row.'}
      </p>
    </div>
  )
}
