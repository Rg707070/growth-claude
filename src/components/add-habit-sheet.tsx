'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DOMAINS } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'

interface AddHabitSheetProps {
  open: boolean
  onClose: () => void
  defaultDomain?: string
}

export function AddHabitSheet({ open, onClose, defaultDomain }: AddHabitSheetProps) {
  const router = useRouter()
  const { t, lang, isRTL } = useLang()
  const { toast } = useToast()
  const [domainSlug, setDomainSlug] = useState(defaultDomain ?? DOMAINS[0].slug)
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const reset = () => {
    setName('')
    setTime('')
    setSaving(false)
  }

  const submit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('no user')
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        domain_slug: domainSlug,
        name: name.trim(),
        frequency: 'daily',
        schedule_time: time || null,
      })
      if (error) throw error
      reset()
      onClose()
      router.refresh()
    } catch {
      setSaving(false)
      toast(t('saveFailed'), 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(11,36,71,0.55)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 animate-fade-up"
        style={{
          background: 'var(--c-fab-sheet)',
          border: '1px solid var(--c-border)',
          boxShadow: '0 20px 60px var(--c-shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {t('quickAddHabit')}
          </span>
          <button
            onClick={onClose}
            aria-label={t('close')}
            className="p-1 rounded-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>

        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--muted-foreground)' }}>
          {t('chooseDomain')}
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {DOMAINS.map((d) => {
            const active = d.slug === domainSlug
            return (
              <button
                key={d.slug}
                onClick={() => setDomainSlug(d.slug)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                style={{
                  background: active ? `${d.color}22` : 'var(--c-surface-2)',
                  border: `1px solid ${active ? d.color : 'var(--c-border)'}`,
                  color: active ? d.color : 'var(--muted-foreground)',
                }}
              >
                {d.icon} {lang === 'he' ? d.nameHe : d.nameEn}
              </button>
            )
          })}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={t('habitName')}
          dir={isRTL ? 'rtl' : 'ltr'}
          autoFocus
          className="w-full h-11 rounded-xl px-4 text-sm outline-none mb-3 transition-colors"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label={t('habitTimeOptional')}
          className="w-full h-11 rounded-xl px-4 text-sm outline-none mb-4 transition-colors"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />

        <button
          onClick={submit}
          disabled={saving || !name.trim()}
          className="w-full h-12 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98] hover:shadow-lg disabled:opacity-50"
          style={{ background: 'var(--brand-gradient)', boxShadow: '0 6px 18px var(--c-hero-shadow)' }}
        >
          {saving ? t('adding') : t('addHabit')}
        </button>
      </div>
    </div>
  )
}
