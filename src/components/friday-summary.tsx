'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { getDomainBySlug } from '@/lib/domains'

interface FridaySummaryProps {
  habitsCompleted: number
  topDomainSlug?: string | null
  weakDomainSlug?: string | null
}

export function FridaySummary({
  habitsCompleted,
  topDomainSlug,
  weakDomainSlug,
}: FridaySummaryProps) {
  const { isRTL } = useLang()
  const [todayDay] = useState(() => new Date().getDay())
  const [reflection, setReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (todayDay !== 5) return
    const today = new Date().toISOString().split('T')[0]
    const key = `friday_summary_${today}`
    if (localStorage.getItem(key) === 'done') setSaved(true)
  }, [todayDay])

  if (todayDay !== 5) return null

  const top = topDomainSlug ? getDomainBySlug(topDomainSlug) : null
  const weak = weakDomainSlug ? getDomainBySlug(weakDomainSlug) : null

  const save = async () => {
    if (saving || !reflection.trim()) return
    setSaving(true)
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }
    const { error } = await supabase.from('journal_entries').upsert({
      user_id: user.id,
      domain_slug: 'weekly',
      date: today,
      text: reflection.trim(),
    })
    setSaving(false)
    if (!error) {
      localStorage.setItem(`friday_summary_${today}`, 'done')
      setSaved(true)
    }
  }

  return (
    <div
      className="p-5 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.10), rgba(249,115,22,0.04))',
        border: '1px solid rgba(234,179,8,0.30)',
        boxShadow: '0 0 24px rgba(234,179,8,0.10)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl leading-none">🕯️</span>
        <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          {isRTL ? 'חשבון נפש שבועי' : 'Weekly Reflection'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="p-3 rounded-xl"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-[10px] mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'החזק השבוע' : 'Strongest'}
          </p>
          {top ? (
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: top.color }}>
              <span>{top.icon}</span>
              <span>{isRTL ? top.nameHe : top.nameEn}</span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-[10px] mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'דורש חיזוק' : 'Needs care'}
          </p>
          {weak ? (
            <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: weak.color }}>
              <span>{weak.icon}</span>
              <span>{isRTL ? weak.nameHe : weak.nameEn}</span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</p>
          )}
        </div>
      </div>

      <p className="text-[11px] mb-2" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL
          ? `${habitsCompleted} השלמות השבוע · רשום משפט אחד על השבוע שעבר`
          : `${habitsCompleted} completions this week · one sentence on the week`}
      </p>

      {saved ? (
        <div
          className="p-3 rounded-xl text-center text-sm"
          style={{
            background: 'rgba(16,185,129,0.10)',
            color: '#10b981',
            border: '1px solid rgba(16,185,129,0.30)',
          }}
        >
          {isRTL ? '✓ נשמר · שבת שלום' : '✓ Saved · Shabbat Shalom'}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={isRTL ? 'משפט אחד...' : 'One sentence...'}
            className="flex-1 rounded-xl px-3 py-2 text-sm"
            style={{
              background: 'var(--c-input)',
              border: '1px solid var(--c-input-border)',
              color: 'var(--foreground)',
            }}
          />
          <button
            onClick={save}
            disabled={!reflection.trim() || saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {saving ? '...' : isRTL ? 'שמור' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
