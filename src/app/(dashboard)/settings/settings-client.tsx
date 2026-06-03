'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import {
  Moon, Sun, Camera, Pencil, Check, X,
  Download, LogOut, Trash2, ChevronRight,
} from 'lucide-react'
import { ReminderSettingsSection } from '@/components/reminder-settings-section'

interface Profile {
  full_name: string | null
  current_streak: number
  longest_streak: number
  created_at: string | null
  avatar_url: string | null
}

interface Props {
  userId: string
  email: string
  profile: Profile
}

function formatMemberSince(iso: string | null, isRTL: boolean): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { year: 'numeric', month: 'long' })
}

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }
  return email[0].toUpperCase()
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
        {label}
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Row button ─────────────────────────────────────────────────────────────────
function Row({
  icon, label, sublabel, onClick, danger = false, rightEl,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick?: () => void
  danger?: boolean
  rightEl?: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors active:opacity-70 text-left"
      style={{
        borderBottom: '1px solid var(--c-border)',
        color: danger ? 'oklch(0.60 0.22 25)' : 'var(--foreground)',
      }}
    >
      <span style={{ color: danger ? 'oklch(0.60 0.22 25)' : 'var(--primary)' }}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {sublabel && (
          <span className="block text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{sublabel}</span>
        )}
      </span>
      {rightEl ?? <ChevronRight size={15} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function SettingsClient({ userId, email, profile }: Props) {
  const { t, lang, toggleLang, isRTL } = useLang()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  // Profile state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [avatarTs, setAvatarTs] = useState(0) // cache-bust
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(profile.full_name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Delete account state
  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Export state
  const [exportingHabits, setExportingHabits] = useState(false)
  const [exportingJournal, setExportingJournal] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Avatar upload ────────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
      setAvatarUrl(publicUrl)
      setAvatarTs(Date.now())
      showToast(t('photoUpdated'))
      router.refresh()
    } catch {
      showToast(t('photoError'))
    } finally {
      setUploadingPhoto(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Name save ────────────────────────────────────────────────────────────────
  async function saveName() {
    if (!nameValue.trim()) return
    setSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nameValue.trim() })
      .eq('id', userId)
    setSavingName(false)
    if (!error) {
      setEditingName(false)
      showToast(t('nameSaved'))
      router.refresh()
    }
  }

  // ── CSV export ───────────────────────────────────────────────────────────────
  async function exportHabits() {
    setExportingHabits(true)
    try {
      const { data: habits } = await supabase
        .from('habits')
        .select('name, domain_slug, frequency, current_streak, created_at')
        .eq('user_id', userId)
        .order('created_at')

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('date, completed, habits(name, domain_slug)')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      const habitRows = (habits ?? []).map(h =>
        `"${h.name}","${h.domain_slug}","${h.frequency}",${h.current_streak},"${h.created_at?.split('T')[0] ?? ''}"`
      )
      const habitCsv = ['Name,Domain,Frequency,Streak,Since', ...habitRows].join('\n')

      const logRows = (logs ?? []).map(l => {
        const habit = l.habits as unknown as { name: string; domain_slug: string } | null
        return `"${l.date}","${habit?.name ?? ''}","${habit?.domain_slug ?? ''}",${l.completed}`
      })
      const logCsv = ['\nDate,Habit,Domain,Completed', ...logRows].join('\n')

      download(`growth-habits-${today()}.csv`, habitCsv + logCsv)
      showToast(t('exportDone'))
    } finally {
      setExportingHabits(false)
    }
  }

  async function exportJournal() {
    setExportingJournal(true)
    try {
      const { data: entries } = await supabase
        .from('journal_entries')
        .select('date, domain_slug, mood, content')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      const rows = (entries ?? []).map(e =>
        `"${e.date}","${e.domain_slug ?? ''}","${e.mood ?? ''}","${String(e.content ?? '').replace(/"/g, "'").replace(/\n/g, ' ')}"`
      )
      const csv = ['Date,Domain,Mood,Content', ...rows].join('\n')
      download(`growth-journal-${today()}.csv`, csv)
      showToast(t('exportDone'))
    } finally {
      setExportingJournal(false)
    }
  }

  function download(filename: string, content: string) {
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // ── Delete account ───────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    const confirmWord = isRTL ? 'מחק' : 'delete'
    if (deleteInput.trim().toLowerCase() !== confirmWord) return
    setDeleting(true)
    // Sign out; actual row deletion is handled by Supabase cascade on auth.users
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = getInitials(nameValue || profile.full_name, email)
  const avatarSrc = avatarUrl ? `${avatarUrl}?t=${avatarTs}` : null

  return (
    <div className="px-4 pt-12 pb-24 md:px-0 md:pt-8 space-y-6 md:max-w-md">

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {toast}
        </div>
      )}

      {/* ── Profile card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-4"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
      >
        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold transition-opacity active:opacity-70"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              : initials}
            <div className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: 'oklch(0 0 0 / 30%)' }}>
              {uploadingPhoto
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={18} color="white" />}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name */}
        <div className="flex flex-col items-center gap-1 w-full">
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                autoFocus
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                placeholder={t('namePlaceholder')}
                className="flex-1 bg-transparent text-center text-lg font-semibold outline-none border-b-2 pb-0.5"
                style={{ borderColor: 'var(--primary)', color: 'var(--foreground)' }}
              />
              <button onClick={saveName} disabled={savingName}>
                <Check size={18} style={{ color: 'var(--primary)' }} />
              </button>
              <button onClick={() => { setEditingName(false); setNameValue(profile.full_name ?? '') }}>
                <X size={18} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 group"
            >
              <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {nameValue || email.split('@')[0]}
              </span>
              <Pencil size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          )}
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{email}</span>
        </div>

        {/* Stats row */}
        <div
          className="flex justify-center gap-6 w-full pt-3 mt-1"
          style={{ borderTop: '1px solid var(--c-border)' }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              🔥 {profile.current_streak}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {t('streak')}
            </span>
          </div>
          <div className="w-px" style={{ background: 'var(--c-border)' }} />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {profile.longest_streak}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {t('longestStreak')}
            </span>
          </div>
          <div className="w-px" style={{ background: 'var(--c-border)' }} />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {formatMemberSince(profile.created_at, isRTL)}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {t('memberSince')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <Section label={isRTL ? 'מראה' : 'Appearance'}>
        <div className="p-4 space-y-4">
          {/* Theme */}
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'מצב תצוגה' : 'Display mode'}
            </p>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(mode => {
                const active = theme === mode
                return (
                  <button
                    key={mode}
                    onClick={() => theme !== mode && toggleTheme()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={active
                      ? { background: mode === 'dark' ? 'var(--c-primary-glow)' : 'var(--primary)', color: mode === 'dark' ? 'var(--primary)' : 'var(--primary-foreground)', border: '1px solid var(--primary)' }
                      : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }}
                  >
                    {mode === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
                    {mode === 'dark' ? (isRTL ? 'כהה' : 'Dark') : (isRTL ? 'בהיר' : 'Light')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {t('language')}
            </p>
            <div className="flex gap-2">
              {(['he', 'en'] as const).map(l => {
                const active = lang === l
                return (
                  <button
                    key={l}
                    onClick={() => lang !== l && toggleLang()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={active
                      ? { background: 'var(--primary)', color: 'white' }
                      : { background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }}
                  >
                    {l === 'he' ? 'עברית' : 'English'}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Reminders ─────────────────────────────────────────────────────── */}
      <ReminderSettingsSection />

      {/* ── Export data ────────────────────────────────────────────────────── */}
      <Section label={t('exportData')}>
        <Row
          icon={<Download size={17} />}
          label={t('exportHabits')}
          sublabel={isRTL ? 'הרגלים + לוג היסטורי' : 'Habits + historical log'}
          onClick={exportHabits}
          rightEl={
            exportingHabits
              ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              : <ChevronRight size={15} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
          }
        />
        <Row
          icon={<Download size={17} />}
          label={t('exportJournal')}
          sublabel={isRTL ? 'רשומות יומן לפי תחום' : 'Journal entries by domain'}
          onClick={exportJournal}
          rightEl={
            exportingJournal
              ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
              : <ChevronRight size={15} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
          }
        />
      </Section>

      {/* ── Account ───────────────────────────────────────────────────────── */}
      <Section label={t('account')}>
        <Row
          icon={<LogOut size={17} />}
          label={t('logout')}
          onClick={handleLogout}
          rightEl={<span />}
        />
        <Row
          icon={<Trash2 size={17} />}
          label={t('deleteAccount')}
          sublabel={isRTL ? 'בלתי הפיכה — כל הנתונים יימחקו' : 'Irreversible — all data deleted'}
          onClick={() => setShowDelete(true)}
          danger
          rightEl={<span />}
        />
      </Section>

      {/* ── Delete confirmation sheet ──────────────────────────────────────── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'oklch(0 0 0 / 60%)' }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--c-surface)', border: '1px solid oklch(0.65 0.22 25 / 30%)' }}
          >
            <div className="flex items-center gap-3">
              <Trash2 size={20} style={{ color: 'oklch(0.60 0.22 25)' }} />
              <h2 className="font-bold text-base" style={{ color: 'oklch(0.60 0.22 25)' }}>
                {t('deleteAccount')}
              </h2>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {t('deleteAccountConfirm')}
            </p>
            <input
              autoFocus
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder={t('typeToConfirm')}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--foreground)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDelete(false); setDeleteInput('') }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)', border: '1px solid var(--c-border)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteInput.trim().toLowerCase() !== (isRTL ? 'מחק' : 'delete')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: 'oklch(0.65 0.22 25 / 15%)', color: 'oklch(0.60 0.22 25)', border: '1px solid oklch(0.65 0.22 25 / 30%)' }}
              >
                {deleting ? t('deleting') : t('deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
